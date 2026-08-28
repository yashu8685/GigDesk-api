import { and, count, desc, eq, ne } from 'drizzle-orm'
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
import type { ListRequestsQuery } from './schemas.js'

const worker = alias(users, 'worker')
const reviewer = alias(users, 'reviewer')

export async function listRequests(query: ListRequestsQuery) {
  const conditions = []
  if (query.status) conditions.push(eq(jobRequests.status, query.status))
  if (query.jobId) conditions.push(eq(jobRequests.jobId, query.jobId))
  if (query.workerId) conditions.push(eq(jobRequests.workerId, query.workerId))
  const where = conditions.length > 0 ? and(...conditions) : undefined

  const [items, [totals]] = await Promise.all([
    db
      .select({
        id: jobRequests.id,
        jobId: jobRequests.jobId,
        workerId: jobRequests.workerId,
        workerName: worker.fullName,
        workerPhone: worker.phone,
        workerPincode: worker.pincode,
        status: jobRequests.status,
        requestedAt: jobRequests.requestedAt,
        reviewedAt: jobRequests.reviewedAt,
        jobTitle: jobs.title,
        jobStatus: jobs.status,
        jobCity: jobs.city,
        jobArea: jobs.area,
        jobPincode: jobs.pincode,
        jobPayAmountInr: jobs.payAmountInr,
        reviewedByName: reviewer.fullName,
      })
      .from(jobRequests)
      .leftJoin(worker, eq(jobRequests.workerId, worker.id))
      .leftJoin(jobs, eq(jobRequests.jobId, jobs.id))
      .leftJoin(reviewer, eq(jobRequests.reviewedBy, reviewer.id))
      .where(where)
      .orderBy(desc(jobRequests.requestedAt))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize),
    db.select({ value: count() }).from(jobRequests).where(where),
  ])

  const total = totals!.value
  return { items, total, page: query.page, pageSize: query.pageSize, totalPages: Math.ceil(total / query.pageSize) }
}

/**
 * THE core transaction of the marketplace: approving a worker's request
 * assigns the job to that worker and auto-rejects every other pending
 * request for the same job. Row locks (FOR UPDATE) make it safe even if
 * two admins act at the same moment — one job, one worker, always.
 */
export async function approveRequest(requestId: string, adminId: string) {
  return db.transaction(async (tx) => {
    const [request] = await tx
      .select()
      .from(jobRequests)
      .where(eq(jobRequests.id, requestId))
      .for('update')
      .limit(1)

    if (!request) throw notFound('Request not found')
    if (request.status !== 'pending') {
      throw conflict(`Request already reviewed (status: ${request.status})`)
    }

    const [job] = await tx
      .select({
        id: jobs.id,
        title: jobs.title,
        status: jobs.status,
        pincode: jobs.pincode,
        area: jobs.area,
      })
      .from(jobs)
      .where(eq(jobs.id, request.jobId))
      .for('update')
      .limit(1)

    if (!job) throw notFound('Job for this request no longer exists')
    if (job.status !== 'open') {
      throw conflict(`Job is no longer open (status: ${job.status})`)
    }

    const [workerUser] = await tx
      .select({
        id: users.id,
        fullName: users.fullName,
        status: users.status,
        pincode: users.pincode,
      })
      .from(users)
      .where(eq(users.id, request.workerId))
      .for('update')
      .limit(1)

    if (!workerUser) throw notFound('Worker for this request no longer exists')
    if (workerUser.status !== 'approved') {
      throw conflict('Worker is no longer approved')
    }
    if (workerUser.pincode !== job.pincode) {
      throw conflict(
        `Worker pincode (${workerUser.pincode}) does not match job pincode (${job.pincode})`,
      )
    }

    const now = new Date()

    await tx
      .update(jobRequests)
      .set({ status: 'approved', reviewedAt: now, reviewedBy: adminId })
      .where(eq(jobRequests.id, requestId))

    // Auto-reject all rival pending requests for the same job
    await tx
      .update(jobRequests)
      .set({ status: 'rejected', reviewedAt: now, reviewedBy: adminId })
      .where(
        and(
          eq(jobRequests.jobId, request.jobId),
          eq(jobRequests.status, 'pending'),
          ne(jobRequests.id, requestId),
        ),
      )

    await tx
      .update(jobs)
      .set({
        status: 'assigned',
        assignedWorkerId: request.workerId,
        assignedAt: now,
      })
      .where(eq(jobs.id, request.jobId))

    await tx.insert(jobAssignments).values({
      jobId: request.jobId,
      workerId: request.workerId,
      status: 'active',
      source: 'request_approved',
      requestId,
      assignedAt: now,
      assignedBy: adminId,
    })

    await tx.insert(eventLog).values({
      type: 'job.assigned',
      jobId: request.jobId,
      payload: {
        workerId: request.workerId,
        requestId,
        source: 'request_approved',
        assignedBy: adminId,
      },
    })

    await tx.insert(notifications).values({
      workerId: request.workerId,
      type: 'request.approved',
      title: 'Request approved',
      body: `You are assigned to "${job.title}" in ${job.area}.`,
      jobId: request.jobId,
    })

    return {
      requestId,
      jobId: request.jobId,
      workerId: request.workerId,
      jobStatus: 'assigned',
      assignedAt: now.toISOString(),
    }
  })
}

export async function rejectRequest(requestId: string, adminId: string) {
  return db.transaction(async (tx) => {
    const [request] = await tx
      .select()
      .from(jobRequests)
      .where(eq(jobRequests.id, requestId))
      .for('update')
      .limit(1)

    if (!request) throw notFound('Request not found')
    if (request.status !== 'pending') {
      throw conflict(`Request already reviewed (status: ${request.status})`)
    }

    const [job] = await tx
      .select({ title: jobs.title })
      .from(jobs)
      .where(eq(jobs.id, request.jobId))
      .limit(1)

    const now = new Date()
    await tx
      .update(jobRequests)
      .set({ status: 'rejected', reviewedAt: now, reviewedBy: adminId })
      .where(eq(jobRequests.id, requestId))

    await tx.insert(eventLog).values({
      type: 'request.rejected',
      jobId: request.jobId,
      payload: { workerId: request.workerId, rejectedBy: adminId },
    })

    await tx.insert(notifications).values({
      workerId: request.workerId,
      type: 'request.rejected',
      title: 'Request not approved',
      body: `Your request for "${job?.title ?? 'a job'}" was not approved.`,
      jobId: request.jobId,
    })

    return { requestId, status: 'rejected', reviewedAt: now.toISOString() }
  })
}
