import { sql } from 'drizzle-orm'
import {
  check,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { jobRequests } from './job-requests.js'
import { jobs } from './jobs.js'
import { users } from './users.js'

export const assignmentStatusEnum = pgEnum('assignment_status', [
  'pending',
  'active',
  'cancelled',
])

export const jobAssignments = pgTable(
  'job_assignments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    jobId: uuid('job_id')
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    workerId: uuid('worker_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    status: assignmentStatusEnum('status').notNull().default('active'),
    // Where the assignment came from
    source: text('source').notNull().default('admin_direct'), // | 'request_approved'
    requestId: uuid('request_id').references(() => jobRequests.id, {
      onDelete: 'set null',
    }),
    assignedAt: timestamp('assigned_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    assignedBy: uuid('assigned_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    cancelledBy: uuid('cancelled_by').references(() => users.id, {
      onDelete: 'set null',
    }),
  },
  (t) => [
    // THE double-booking guard: a job can have at most one active assignment
    uniqueIndex('job_assignments_one_active_per_job')
      .on(t.jobId)
      .where(sql`status = 'active'`),
    index('job_assignments_worker_idx').on(t.workerId, t.status),
    check(
      'assignments_cancel_requires_timestamp',
      sql`status IN ('pending', 'active') OR cancelled_at IS NOT NULL`,
    ),
  ],
)

export type JobAssignment = typeof jobAssignments.$inferSelect
export type NewJobAssignment = typeof jobAssignments.$inferInsert