import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { jobs } from './jobs.js'

export const eventStatusEnum = pgEnum('event_status', ['pending', 'processed'])

export const eventLog = pgTable(
  'event_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    type: text('type').notNull(), // e.g. 'job.completed', 'worker.approved'
    jobId: uuid('job_id').references(() => jobs.id, { onDelete: 'set null' }),
    payload: jsonb('payload').notNull(),
    status: eventStatusEnum('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
  },
  (t) => [index('event_log_status_idx').on(t.status, t.createdAt)],
)

export type EventLogEntry = typeof eventLog.$inferSelect
export type NewEventLogEntry = typeof eventLog.$inferInsert
