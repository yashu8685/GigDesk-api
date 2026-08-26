import { count, desc, eq, sql } from 'drizzle-orm'
import { db } from '../../db/client.js'
import {
  eventLog,
  jobRequests,
  jobs,
  payouts,
  users,
} from '../../db/schemas/index.js'

export async function getSummary() {
  const [[workerCounts], [jobCounts], [requestPending], [payoutSums]] =
    await Promise.all([
      db
        .select({
          pending: sql<number>`count(*) filter (where ${users.status} = 'pending')::int`,
          approved: sql<number>`count(*) filter (where ${users.status} = 'approved')::int`,
          rejected: sql<number>`count(*) filter (where ${users.status} = 'rejected')::int`,
        })
        .from(users)
        .where(eq(users.userType, 'worker')),
      db
        .select({
          open: sql<number>`count(*) filter (where ${jobs.status} = 'open')::int`,
          assigned: sql<number>`count(*) filter (where ${jobs.status} = 'assigned')::int`,
          completed: sql<number>`count(*) filter (where ${jobs.status} = 'completed')::int`,
          cancelled: sql<number>`count(*) filter (where ${jobs.status} = 'cancelled')::int`,
        })
        .from(jobs),
      db
        .select({ value: count() })
        .from(jobs)
        .where(eq(jobs.status, 'open')),
      db
        .select({
          pendingCount: sql<number>`count(*) filter (where ${payouts.status} = 'pending')::int`,
          pendingAmount: sql<number>`coalesce(sum(case when ${payouts.status} = 'pending' then ${payouts.amountInr} else 0 end), 0)::int`,
          paidAmount: sql<number>`coalesce(sum(case when ${payouts.status} = 'paid' then ${payouts.amountInr} else 0 end), 0)::int`,
        })
        .from(payouts),
    ])

  const [pendingRequests] = await db
    .select({ value: count() })
    .from(jobRequests)
    .where(eq(jobRequests.status, 'pending'))

  const recentActivity = await db
    .select({
      id: eventLog.id,
      type: eventLog.type,
      jobId: eventLog.jobId,
      jobTitle: jobs.title,
      createdAt: eventLog.createdAt,
    })
    .from(eventLog)
    .leftJoin(jobs, eq(eventLog.jobId, jobs.id))
    .orderBy(desc(eventLog.createdAt))
    .limit(10)

  return {
    workers: workerCounts,
    jobs: jobCounts,
    openJobsWithPendingRequests: requestPending!.value,
    pendingRequests: pendingRequests!.value,
    payouts: {
      pendingCount: payoutSums!.pendingCount,
      pendingAmountInr: payoutSums!.pendingAmount,
      paidAmountInr: payoutSums!.paidAmount,
    },
    recentActivity,
  }
}
