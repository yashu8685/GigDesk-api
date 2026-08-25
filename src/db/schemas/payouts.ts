import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { jobs } from './jobs.js'
import { users } from './users.js'

export const payoutStatusEnum = pgEnum('payout_status', ['pending', 'paid'])

export const payouts = pgTable(
  'payouts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    jobId: uuid('job_id')
      .notNull()
      .unique()
      .references(() => jobs.id, { onDelete: 'restrict' }),
    workerId: uuid('worker_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    amountInr: integer('amount_inr').notNull(),
    status: payoutStatusEnum('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    paidAt: timestamp('paid_at', { withTimezone: true }),
  },
  (t) => [
    index('payouts_worker_idx').on(t.workerId, t.status),
    check('payouts_amount_positive', sql`amount_inr > 0`),
  ],
)

export type Payout = typeof payouts.$inferSelect
export type NewPayout = typeof payouts.$inferInsert
