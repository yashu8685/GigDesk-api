import { sql } from 'drizzle-orm'
import {
  index,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { jobs } from './jobs.js'
import { users } from './users.js'

export const requestStatusEnum = pgEnum('request_status', [
  'pending',
  'approved',
  'rejected',
])

export const jobRequests = pgTable(
  'job_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    jobId: uuid('job_id')
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    workerId: uuid('worker_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: requestStatusEnum('status').notNull().default('pending'),
    requestedAt: timestamp('requested_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    reviewedBy: uuid('reviewed_by').references(() => users.id, {
      onDelete: 'set null',
    }),
  },
  (t) => [
    // A worker can hold at most one pending request per job
    uniqueIndex('job_requests_one_pending_per_worker')
      .on(t.jobId, t.workerId)
      .where(sql`status = 'pending'`),
    index('job_requests_worker_idx').on(t.workerId, t.status),
    index('job_requests_job_idx').on(t.jobId, t.status),
  ],
)

export type JobRequest = typeof jobRequests.$inferSelect
export type NewJobRequest = typeof jobRequests.$inferInsert
