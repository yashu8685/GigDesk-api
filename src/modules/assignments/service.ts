import { and, eq } from 'drizzle-orm'
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
import type { AssignJobInput } from './schemas.js'

/**
 * Admin directly assigns an approved, pincode-matched worker to an open job.
 * Rival pending requests are auto-rejected. Same guarantees as approving a
 * request: one job, one worker, even under concurrency.
 */
export async function assignJobDirect(
  adminId: string,
  input: AssignJobInput,
) {
  return db.transaction(async (tx) => {
    const [job] = await tx
      .select({
        id: jobs.id,
        title: jobs.title,
        status: jobs.status,
        pincode: jobs.pincode,
        area: jobs.area,
      })
      .from(jobs)
      .where(eq(jobs.id, input.jobId))
      .for('update')
      .limit(1)

    if (!job) throw notFound('Job not found')
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
      .where(and(eq(users.id, input.workerId), eq(users.userType, 'worker')))
      .for('update')
      .limit(1)

    if (!workerUser) throw notFound('Worker not found')
    if (workerUser.status !== 'approved') {
      throw conflict('Worker is not approved')
    }
    if (workerUser.pincode !== job.pincode) {
      throw conflict(
        `Worker pincode (${workerUser.pincode}) does not match job pincode (${job.pincode})`,
      )
    }

    const now = new Date()

    await tx
      .update(jobRequests)
      .set({ status: 'rejected', reviewedAt: now, reviewedBy: adminId })
      .where(
        and(
          eq(jobRequests.jobId, job.id),
          eq(jobRequests.status, 'pending'),
        ),
      )

    

    await tx.insert(jobAssignments).values({
      jobId: job.id,
      workerId: workerUser.id,
      status: 'pending',
      source: 'admin_direct',
      assignedAt: now,
      assignedBy: adminId,
    })

    await tx.insert(eventLog).values({
      type: 'job.assigned',
      jobId: job.id,
      payload: {
        workerId: workerUser.id,
        source: 'admin_direct',
        assignedBy: adminId,
      },
    })

    await tx.insert(notifications).values({
      workerId: workerUser.id,
      type: 'request.approved',
      title: 'Job assigned',
      body: `You were assigned to "${job.title}" in ${job.area}.`,
      jobId: job.id,
    })

    return {
      jobId: job.id,
      workerId: workerUser.id,
      jobStatus: 'assigned',
      assignedAt: now.toISOString(),
    }
  })
}

/**
 * Admin cancels an active assignment — the job reopens so someone else can
 * be assigned. The cancellation stays on the assignment row forever.
 */
export async function cancelAssignment(assignmentId: string, adminId: string) {
  return db.transaction(async (tx) => {
    const [assignment] = await tx
      .select()
      .from(jobAssignments)
      .where(eq(jobAssignments.id, assignmentId))
      .for('update')
      .limit(1)

    if (!assignment) throw notFound('Assignment not found')
    if (assignment.status !== 'active') {
      throw conflict('Assignment is already cancelled')
    }

    const [job] = await tx
      .select({ id: jobs.id, title: jobs.title, status: jobs.status })
      .from(jobs)
      .where(eq(jobs.id, assignment.jobId))
      .for('update')
      .limit(1)

    if (!job) throw notFound('Job for this assignment no longer exists')
    if (job.status !== 'assigned') {
      throw conflict(`Job is ${job.status} — assignment can no longer be cancelled`)
    }

    const now = new Date()

    await tx
      .update(jobAssignments)
      .set({ status: 'cancelled', cancelledAt: now, cancelledBy: adminId })
      .where(eq(jobAssignments.id, assignmentId))

    await tx
      .update(jobs)
      .set({ status: 'open', assignedWorkerId: null, assignedAt: null })
      .where(eq(jobs.id, job.id))

    await tx.insert(eventLog).values({
      type: 'assignment.cancelled',
      jobId: job.id,
      payload: {
        assignmentId,
        workerId: assignment.workerId,
        cancelledBy: adminId,
      },
    })

    await tx.insert(notifications).values({
      workerId: assignment.workerId,
      type: 'assignment.cancelled',
      title: 'Assignment cancelled',
      body: `Your assignment for "${job.title}" was cancelled by the admin.`,
      jobId: job.id,
    })

    return { assignmentId, jobStatus: 'open', cancelledAt: now.toISOString() }
  })
}
