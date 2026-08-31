import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  doublePrecision,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core'

/**
 * One users table for both sides of the marketplace.
 *  - userType 'admin'  → signs in with email + password
 *  - userType 'worker' → registers with phone + ID proof, signs in via OTP
 * userType/status are plain varchar by design (no pg enums).
 */
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userType: varchar('user_type', { length: 10 }).notNull().default('worker'), // 'admin' | 'worker'
    fullName: text('full_name').notNull(),
    email: text('email'), // admins
    phone: text('phone'), // workers
    passwordHash: text('password_hash'), // admins (workers use OTP)
    // Worker-only fields (null for admins)
    city: text('city'),
    district: text('district'),
    area: text('area'),
    pincode: text('pincode'),
    address: text('address'),
    idProofUrl: text('id_proof_url'),
    profilePhotoUrl: text('profile_photo_url'),
    drivingLicenseUrl: text('driving_license_url'),
    isAvailable: boolean('is_available').notNull().default(false),
    lastLat: doublePrecision('last_lat'),
    lastLng: doublePrecision('last_lng'),
    // workers: 'pending' | 'approved' | 'rejected' — admins: 'active'
    status: varchar('status', { length: 10 }).notNull().default('pending'),
    // Always UTC: timestamptz stores UTC, JS new Date() is UTC when serialized to ISO Z
    registeredAt: timestamp('registered_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    reviewedBy: uuid('reviewed_by').references((): AnyPgColumn => users.id, {
      onDelete: 'set null',
    }),
    rejectionReason: text('rejection_reason'),
  },
  (t) => [
    uniqueIndex('users_email_unique').on(t.email).where(sql`email IS NOT NULL AND user_type = 'admin'`),
    uniqueIndex('users_phone_unique').on(t.phone).where(sql`phone IS NOT NULL`),
    index('users_type_status_idx').on(t.userType, t.status),
    index('users_pincode_status_idx').on(t.pincode, t.status),
    check(
      'users_rejection_reason_required',
      sql`status <> 'rejected' OR rejection_reason IS NOT NULL`,
    ),
    check(
      'users_worker_review_requires_timestamp',
      sql`user_type <> 'worker' OR status = 'pending' OR reviewed_at IS NOT NULL`,
    ),
  ],
)

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
