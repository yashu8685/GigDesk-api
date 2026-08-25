import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { users } from './users.js'
export const jobStatusEnum = pgEnum('job_status', [
  'open',
  'assigned',
  'completed',
  'cancelled',
])

export const jobs = pgTable(
  'jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    city: text('city').notNull(),
    area: text('area').notNull(),
    pincode: text('pincode').notNull(),
    payAmountInr: integer('pay_amount_inr').notNull(),
    durationHours: integer('duration_hours').notNull(),
    status: jobStatusEnum('status').notNull().default('open'),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    // Current assignment pointer (full history lives in job_assignments)
    assignedWorkerId: uuid('assigned_worker_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    assignedAt: timestamp('assigned_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    proofPhotoUrl: text('proof_photo_url'),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    cancelledReason: text('cancelled_reason'),
    cancelledBy: uuid('cancelled_by').references(() => users.id, {
      onDelete: 'set null',
    }),
  },
  (t) => [
    index('jobs_status_idx').on(t.status),
    index('jobs_pincode_status_idx').on(t.pincode, t.status),
    check('jobs_pay_positive', sql`pay_amount_inr > 0`),
    check('jobs_duration_positive', sql`duration_hours > 0`),
    check(
      'jobs_completed_requires_proof',
      sql`status <> 'completed' OR (
        proof_photo_url IS NOT NULL
        AND completed_at IS NOT NULL
        AND assigned_worker_id IS NOT NULL
      )`,
    ),
    check(
      'jobs_cancelled_requires_reason',
      sql`status <> 'cancelled' OR (cancelled_at IS NOT NULL AND cancelled_reason IS NOT NULL)`,
    ),
  ],
)

export type Job = typeof jobs.$inferSelect
export type NewJob = typeof jobs.$inferInsert
