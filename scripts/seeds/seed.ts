import 'dotenv/config'
import { eq } from 'drizzle-orm'
import argon2 from 'argon2'
import { db } from '../../src/db/client.js'
import {
  authOtps,
  eventLog,
  jobAssignments,
  jobRequests,
  jobs,
  notifications,
  payouts,
  users,
} from '../../src/db/schemas/index.js'
import { workerSeeds } from './workers.data.js'
import { jobSeeds } from './jobs.data.js'
import { requestSeeds } from './requests.data.js'
import { assignmentSeeds } from './assignments.data.js'
import { payoutSeeds } from './payouts.data.js'
import { eventSeeds } from './events.data.js'
import { notificationSeeds } from './notifications.data.js'
import { otpSeeds } from './otps.data.js'

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000)

async function main() {
  // 0) Ensure exactly one admin exists (FK target) — not seeded, just bootstrapped
  let [admin] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.userType, 'admin'))
    .limit(1)

  if (!admin) {
    const passwordHash = await argon2.hash('gigdesk-dev-2026')
    ;[admin] = await db
      .insert(users)
      .values({
        userType: 'admin',
        status: 'active',
        email: 'admin@gigdesk.local',
        passwordHash,
        fullName: 'GigDesk Admin',
      })
      .returning({ id: users.id })
    console.log('(bootstrapped admin admin@gigdesk.local for FK references)')
  }
  const adminId = admin.id

  // Idempotency guard
  const existingWorkers = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.userType, 'worker'))
    .limit(1)
  if (existingWorkers.length > 0) {
    console.error('Database already has workers — reset first (npm run db:reset).')
    process.exit(1)
  }

  // 1) Workers (25)
  const workerIds = new Map<string, string>()
  const insertedWorkers = await db
    .insert(users)
    .values(
      workerSeeds.map((w) => ({
        userType: 'worker' as const,
        fullName: w.fullName,
        phone: w.phone,
        city: w.city,
        district: (w as unknown as { district: string }).district ?? w.city,
        area: w.area,
        pincode: w.pincode,
        idProofUrl: `https://picsum.photos/seed/idproof-${w.key}/480/300`,
        status: w.status,
        registeredAt: hoursAgo(w.registeredHoursAgo),
        reviewedAt: w.reviewedHoursAgo ? hoursAgo(w.reviewedHoursAgo) : null,
        reviewedBy: w.reviewedHoursAgo ? adminId : null,
        rejectionReason: w.rejectionReason ?? null,
      })),
    )
    .returning({ id: users.id })
  workerSeeds.forEach((w, i) => workerIds.set(w.key, insertedWorkers[i]!.id))
  console.log(`users (workers): ${insertedWorkers.length}`)

  // 2) Jobs (25)
  const jobIds = new Map<string, string>()
  const insertedJobs = await db
    .insert(jobs)
    .values(
      jobSeeds.map((j) => {
        const createdAt = hoursAgo(j.createdHoursAgo)
        const deadlineAt = new Date(createdAt.getTime() + j.durationHours * 3600000)
        return {
          title: j.title,
          description: j.description,
          city: j.city,
          district: (j as unknown as { district: string }).district ?? j.city,
          area: j.area,
          pincode: j.pincode,
          payAmountInr: j.payAmountInr,
          durationHours: j.durationHours,
          deadlineAt,
          status: j.status,
          createdBy: adminId,
          createdAt,
          assignedWorkerId: j.workerKey ? workerIds.get(j.workerKey)! : null,
          assignedAt: j.assignedHoursAgo ? hoursAgo(j.assignedHoursAgo) : null,
          completedAt: j.completedHoursAgo ? hoursAgo(j.completedHoursAgo) : null,
          proofPhotoUrl:
            j.status === 'completed'
              ? `https://picsum.photos/seed/proof-${j.key}/640/420`
              : null,
          cancelledAt: j.cancelledHoursAgo ? hoursAgo(j.cancelledHoursAgo) : null,
          cancelledReason: j.cancelledReason ?? null,
          cancelledBy: j.cancelledHoursAgo ? adminId : null,
        }
      }),
    )
    .returning({ id: jobs.id })
  jobSeeds.forEach((j, i) => jobIds.set(j.key, insertedJobs[i]!.id))
  console.log(`jobs: ${insertedJobs.length}`)

  // 3) Requests (25)
  const requestIds = new Map<string, string>()
  const insertedRequests = await db
    .insert(jobRequests)
    .values(
      requestSeeds.map((r) => ({
        jobId: jobIds.get(r.jobKey)!,
        workerId: workerIds.get(r.workerKey)!,
        status: r.status,
        requestedAt: hoursAgo(r.requestedHoursAgo),
        reviewedAt: r.reviewedHoursAgo ? hoursAgo(r.reviewedHoursAgo) : null,
        reviewedBy: r.reviewedHoursAgo ? adminId : null,
      })),
    )
    .returning({ id: jobRequests.id })
  requestSeeds.forEach((r, i) => requestIds.set(r.key, insertedRequests[i]!.id))
  console.log(`job_requests: ${insertedRequests.length}`)

  // 4) Assignments (25)
  const insertedAssignments = await db
    .insert(jobAssignments)
    .values(
      assignmentSeeds.map((a) => ({
        jobId: jobIds.get(a.jobKey)!,
        workerId: workerIds.get(a.workerKey)!,
        status: a.status,
        source: a.source,
        requestId: a.requestKey ? requestIds.get(a.requestKey)! : null,
        assignedAt: hoursAgo(a.assignedHoursAgo),
        assignedBy: adminId,
        cancelledAt: a.cancelledHoursAgo ? hoursAgo(a.cancelledHoursAgo) : null,
        cancelledBy: a.cancelledHoursAgo ? adminId : null,
      })),
    )
    .returning({ id: jobAssignments.id })
  console.log(`job_assignments: ${insertedAssignments.length}`)

  // 5) Payouts (one per completed job)
  const jobByKey = new Map(jobSeeds.map((j) => [j.key, j]))
  const insertedPayouts = await db
    .insert(payouts)
    .values(
      payoutSeeds.map((p) => {
        const job = jobByKey.get(p.jobKey)!
        return {
          jobId: jobIds.get(p.jobKey)!,
          workerId: job.workerKey ? workerIds.get(job.workerKey)! : null!,
          amountInr: job.payAmountInr,
          status: p.paid ? ('paid' as const) : ('pending' as const),
          createdAt: job.completedHoursAgo
            ? hoursAgo(job.completedHoursAgo)
            : hoursAgo(1),
          paidAt: p.paid ? hoursAgo(p.paidHoursAgo ?? 1) : null,
        }
      }),
    )
    .returning({ id: payouts.id })
  console.log(`payouts: ${insertedPayouts.length}`)

  // 6) Event log (25)
  const insertedEvents = await db
    .insert(eventLog)
    .values(
      eventSeeds.map((e) => ({
        type: e.type,
        jobId: e.jobKey ? jobIds.get(e.jobKey)! : null,
        payload: {
          workerId: e.workerKey ? workerIds.get(e.workerKey) : undefined,
          seeded: true,
        },
        status: e.status,
        createdAt: hoursAgo(e.hoursAgo),
        processedAt: e.status === 'processed' ? hoursAgo(e.hoursAgo) : null,
      })),
    )
    .returning({ id: eventLog.id })
  console.log(`event_log: ${insertedEvents.length}`)

  // 7) Notifications (25)
  const insertedNotifications = await db
    .insert(notifications)
    .values(
      notificationSeeds.map((n) => ({
        workerId: workerIds.get(n.workerKey)!,
        type: n.type,
        title: n.title,
        body: n.body,
        jobId: n.jobKey ? jobIds.get(n.jobKey)! : null,
        createdAt: hoursAgo(n.hoursAgo),
      })),
    )
    .returning({ id: notifications.id })
  console.log(`notifications: ${insertedNotifications.length}`)

  // 8) Auth OTPs (5, all consumed)
  const insertedOtps = await db
    .insert(authOtps)
    .values(
      otpSeeds.map((o) => {
        const phone = workerSeeds.find((w) => w.key === o.workerKey)!.phone
        return {
          phone,
          codeHash: 'dev-only-not-a-real-code',
          purpose: o.purpose,
          attempts: 1,
          expiresAt: hoursAgo(o.createdHoursAgo - 0.25),
          consumedAt: hoursAgo(o.createdHoursAgo - 0.2),
          createdAt: hoursAgo(o.createdHoursAgo),
        }
      }),
    )
    .returning({ id: authOtps.id })
  console.log(`auth_otps: ${insertedOtps.length}`)

  console.log('\nSeed complete ✔')
  process.exit(0)
}

main().catch((error) => {
  console.error('Seed failed:', error)
  process.exit(1)
})
