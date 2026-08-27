import { and, count, desc, eq, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { db } from '../../db/client.js'
import {
  eventLog,
  jobs,
  notifications,
  payouts,
  users,
} from '../../db/schemas/index.js'
import { conflict, notFound } from '../../lib/http-error.js'
import type { ListPayoutsQuery } from './schemas.js'

const worker = alias(users, 'worker')

export async function listPayouts(query: ListPayoutsQuery) {
  const conditions = []
  if (query.status) conditions.push(eq(payouts.status, query.status))
  if (query.workerId) conditions.push(eq(payouts.workerId, query.workerId))
  const where = conditions.length > 0 ? and(...conditions) : undefined

  const [items, [totals], [sums]] = await Promise.all([
    db
      .select({
        id: payouts.id,
        jobId: payouts.jobId,
        jobTitle: jobs.title,
        jobArea: jobs.area,
        jobPincode: jobs.pincode,
        workerId: payouts.workerId,
        workerName: worker.fullName,
        amountInr: payouts.amountInr,
        status: payouts.status,
        createdAt: payouts.createdAt,
        paidAt: payouts.paidAt,
      })
      .from(payouts)
      .innerJoin(jobs, eq(payouts.jobId, jobs.id))
      .leftJoin(worker, eq(payouts.workerId, worker.id))
      .where(where)
      .orderBy(desc(payouts.createdAt))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize),
    db.select({ value: count() }).from(payouts).where(where),
    db
      .select({
        pendingAmount: sql<number>`coalesce(sum(case when ${payouts.status} = 'pending' then ${payouts.amountInr} else 0 end), 0)::int`,
        paidAmount: sql<number>`coalesce(sum(case when ${payouts.status} = 'paid' then ${payouts.amountInr} else 0 end), 0)::int`,
      })
      .from(payouts),
  ])

  const total = totals!.value
  return {
    items,
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.ceil(total / query.pageSize),
    pendingAmountInr: sums!.pendingAmount,
    paidAmountInr: sums!.paidAmount,
  }
}

export async function markPaid(payoutId: string, adminId: string) {
  return db.transaction(async (tx) => {
    const [payout] = await tx
      .select()
      .from(payouts)
      .where(eq(payouts.id, payoutId))
      .for('update')
      .limit(1)

    if (!payout) throw notFound('Payout not found')
    if (payout.status === 'paid') throw conflict('Payout is already marked paid')

    const [job] = await tx
      .select({ title: jobs.title })
      .from(jobs)
      .where(eq(jobs.id, payout.jobId))
      .limit(1)

    const now = new Date()
    await tx
      .update(payouts)
      .set({ status: 'paid', paidAt: now })
      .where(eq(payouts.id, payoutId))

    await tx.insert(eventLog).values({
      type: 'payout.paid',
      jobId: payout.jobId,
      payload: { payoutId, workerId: payout.workerId, amountInr: payout.amountInr, markedBy: adminId },
    })

    await tx.insert(notifications).values({
      workerId: payout.workerId,
      type: 'payout.paid',
      title: 'Payment sent',
      body: `₹${payout.amountInr} for "${job?.title ?? 'your work'}" has been paid.`,
      jobId: payout.jobId,
    })

    return { payoutId, status: 'paid', paidAt: now.toISOString() }
  })
}
