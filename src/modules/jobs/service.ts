import { and, count, desc, eq, ilike, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { db } from '../../db/client.js'
import {
  eventLog,
  jobAssignments,
  jobRequests,
  jobs,
  notifications,
  users,
} from '../../db/schemas/index.js'
import { conflict, notFound } from '../../lib/http-error.js'
import type {
  CancelJobInput,
  CreateJobInput,
  ListJobsQuery,
} from './schemas.js'

const assignedWorker = alias(users, 'assigned_worker')

async function geocodeJob(input: { city: string; district?: string | null; area: string; pincode: string }): Promise<{ lat: number | null; lng: number | null }> {
  // Try pincode first (most accurate for area/locality), fallback to city/district
  const queries = [
    `${input.area}, ${input.district ?? ''}, ${input.city}, ${input.pincode}, India`,
    `${input.pincode}, India`,
    `${input.district ?? ''}, ${input.city}, India`,
    `${input.city}, India`,
  ].filter(Boolean)
  for (const q of queries) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`
      const res = await fetch(url, { headers: { 'User-Agent': 'GigDesk/1.0 (admin@gigdesk.local)' } } as never)
      if (!res.ok) continue
      const data = (await res.json()) as Array<{ lat: string; lon: string }>
      if (data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    } catch {
      continue
    }
  }
  return { lat: null, lng: null }
}

const listColumns = {
  id: jobs.id,
  title: jobs.title,
  description: jobs.description,
  city: jobs.city,
  district: jobs.district,
  area: jobs.area,
  pincode: jobs.pincode,
  payAmountInr: jobs.payAmountInr,
  durationHours: jobs.durationHours,
  deadlineAt: jobs.deadlineAt,
  status: jobs.status,
  createdAt: jobs.createdAt,
  assignedWorkerId: jobs.assignedWorkerId,
  assignedWorkerName: assignedWorker.fullName,
  assignedAt: jobs.assignedAt,
  completedAt: jobs.completedAt,
  proofPhotoUrl: jobs.proofPhotoUrl,
  cancelledAt: jobs.cancelledAt,
  cancelledReason: jobs.cancelledReason,
  pendingRequests: sql<number>`(
    select count(*) from job_requests jr
    where jr.job_id = jobs.id and jr.status = 'pending'
  )::int`,
}

export async function createJob(adminId: string, input: CreateJobInput) {
  // deadline is Date, compute durationHours for legacy column
  const deadlineAt = input.deadline instanceof Date ? input.deadline : new Date(input.deadline as unknown as string)
  const durationHours = Math.max(1, Math.ceil((deadlineAt.getTime() - Date.now()) / 3600000))
  const { lat, lng } = await geocodeJob({ city: input.city, district: input.district ?? null, area: input.area, pincode: input.pincode })
  return db.transaction(async (tx) => {
    const [job] = await tx
      .insert(jobs)
      .values({
        title: input.title,
        description: input.description,
        city: input.city,
        district: input.district ?? null,
        area: input.area,
        pincode: input.pincode,
        payAmountInr: input.payAmountInr,
        durationHours,
        deadlineAt,
        lat,
        lng,
        status: 'open',
        createdBy: adminId,
      })
      .returning()

    await tx.insert(eventLog).values({
      type: 'job.created',
      jobId: job!.id,
      payload: { createdBy: adminId, pincode: job!.pincode },
    })

    return job!
  })
}

export async function listJobs(query: ListJobsQuery) {
  const conditions = []
  if (query.status) conditions.push(eq(jobs.status, query.status))
  if (query.city) conditions.push(ilike(jobs.city, `%${query.city}%`))
  if (query.district) conditions.push(ilike(jobs.district, `%${query.district}%`))
  if (query.pincode) conditions.push(eq(jobs.pincode, query.pincode))
  if (query.search) conditions.push(ilike(jobs.title, `%${query.search}%`))
  const where = conditions.length > 0 ? and(...conditions) : undefined

  const [items, [totals]] = await Promise.all([
    db
      .select(listColumns)
      .from(jobs)
      .leftJoin(assignedWorker, eq(jobs.assignedWorkerId, assignedWorker.id))
      .where(where)
      .orderBy(desc(jobs.createdAt))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize),
    db.select({ value: count() }).from(jobs).where(where),
  ])

  const total = totals!.value
  return { items, total, page: query.page, pageSize: query.pageSize, totalPages: Math.ceil(total / query.pageSize) }
}

export async function getJob(jobId: string) {
  const [job] = await db
    .select(listColumns)
    .from(jobs)
    .leftJoin(assignedWorker, eq(jobs.assignedWorkerId, assignedWorker.id))
    .where(eq(jobs.id, jobId))
    .limit(1)

  if (!job) throw notFound('Job not found')

  const requester = alias(users, 'requester')
  const jobRequestsList = await db
    .select({
      id: jobRequests.id,
      workerId: jobRequests.workerId,
      workerName: requester.fullName,
      status: jobRequests.status,
      requestedAt: jobRequests.requestedAt,
      reviewedAt: jobRequests.reviewedAt,
    })
    .from(jobRequests)
    .leftJoin(requester, eq(jobRequests.workerId, requester.id))
    .where(eq(jobRequests.jobId, jobId))
    .orderBy(desc(jobRequests.requestedAt))

  const assigner = alias(users, 'assigner')
  const assignmentsList = await db
    .select({
      id: jobAssignments.id,
      workerId: jobAssignments.workerId,
      workerName: assigner.fullName,
      status: jobAssignments.status,
      source: jobAssignments.source,
      assignedAt: jobAssignments.assignedAt,
      cancelledAt: jobAssignments.cancelledAt,
    })
    .from(jobAssignments)
    .leftJoin(assigner, eq(jobAssignments.workerId, assigner.id))
    .where(eq(jobAssignments.jobId, jobId))
    .orderBy(desc(jobAssignments.assignedAt))

  return { job, requests: jobRequestsList, assignments: assignmentsList }
}

/**
 * Cancels an open or assigned job. Cancelling an assigned job also cancels
 * its active assignment (recorded, never deleted) and notifies the worker —
 * all in one transaction.
 */
export async function cancelJob(jobId: string, adminId: string, input: CancelJobInput) {
  return db.transaction(async (tx) => {
    const [job] = await tx
      .select({
        id: jobs.id,
        title: jobs.title,
        status: jobs.status,
        assignedWorkerId: jobs.assignedWorkerId,
      })
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .for('update')
      .limit(1)

    if (!job) throw notFound('Job not found')
    if (job.status !== 'open' && job.status !== 'assigned') {
      throw conflict(`Job cannot be cancelled (status: ${job.status})`)
    }

    const now = new Date()

    if (job.status === 'assigned' && job.assignedWorkerId) {
      await tx
        .update(jobAssignments)
        .set({ status: 'cancelled', cancelledAt: now, cancelledBy: adminId })
        .where(
          and(
            eq(jobAssignments.jobId, jobId),
            eq(jobAssignments.status, 'active'),
          ),
        )
      await tx.insert(notifications).values({
        workerId: job.assignedWorkerId,
        type: 'job.cancelled',
        title: 'Job cancelled',
        body: `"${job.title}" was cancelled by the admin. Reason: ${input.reason.trim()}`,
        jobId,
      })
    }

    await tx
      .update(jobs)
      .set({
        status: 'cancelled',
        cancelledAt: now,
        cancelledReason: input.reason.trim(),
        cancelledBy: adminId,
      })
      .where(eq(jobs.id, jobId))

    await tx.insert(eventLog).values({
      type: 'job.cancelled',
      jobId,
      payload: { cancelledBy: adminId, reason: input.reason.trim() },
    })

    return { id: jobId, status: 'cancelled', cancelledAt: now.toISOString() }
  })
}
