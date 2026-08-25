import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

export const authOtps = pgTable(
  'auth_otps',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    phone: text('phone').notNull(),
    codeHash: text('code_hash').notNull(),
    purpose: text('purpose').notNull().default('login'), // 'login' | 'registration'
    attempts: integer('attempts').notNull().default(0),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index('auth_otps_phone_idx').on(t.phone, t.createdAt),
    check('auth_otps_expiry_required', sql`expires_at > created_at`),
  ],
)

export type AuthOtp = typeof authOtps.$inferSelect
export type NewAuthOtp = typeof authOtps.$inferInsert
