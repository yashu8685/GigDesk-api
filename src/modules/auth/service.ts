import { and, eq, ne } from 'drizzle-orm'
import { SignJWT } from 'jose'
import argon2 from 'argon2'
import { db } from '../../db/client.js'
import { eventLog, users } from '../../db/schemas/index.js'
import { env } from '../../config/env.js'
import {
  HttpError,
  badRequest,
  conflict,
  notFound,
  unauthorized,
} from '../../lib/http-error.js'
import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  UpdateProfileInput,
} from './schemas.js'

const secret = new TextEncoder().encode(env.AUTH_SECRET)

export interface AdminInfo {
  id: string
  email: string
  fullName: string
  phone: string | null
  status: string
  registeredAt: string
}

function toAdminInfo(admin: {
  id: string
  email: string | null
  fullName: string
  phone: string | null
  status: string
  registeredAt: Date
}): AdminInfo {
  return {
    id: admin.id,
    email: admin.email!,
    fullName: admin.fullName,
    phone: admin.phone,
    status: admin.status,
    registeredAt: admin.registeredAt.toISOString(),
  }
}

async function signAdminToken(adminId: string): Promise<string> {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(adminId)
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(secret)
}

export async function login(input: LoginInput): Promise<{
  token: string
  admin: AdminInfo
}> {
  const [admin] = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.email, input.email.toLowerCase().trim()),
        eq(users.userType, 'admin'),
      ),
    )
    .limit(1)

  // Same generic message for unknown email and wrong password
  const invalid = new HttpError(401, 'Invalid email or password')
  if (!admin || !admin.passwordHash) throw invalid

  const valid = await argon2.verify(admin.passwordHash, input.password)
  if (!valid) throw invalid

  const token = await signAdminToken(admin.id)
  return { token, admin: toAdminInfo(admin) }
}

export async function getMe(adminId: string): Promise<AdminInfo> {
  const [admin] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, adminId), eq(users.userType, 'admin')))
    .limit(1)

  if (!admin || !admin.email) throw unauthorized('Admin no longer exists')
  return toAdminInfo(admin)
}

export async function updateProfile(
  adminId: string,
  input: UpdateProfileInput,
): Promise<AdminInfo> {
  return db.transaction(async (tx) => {
    const [admin] = await tx
      .select()
      .from(users)
      .where(and(eq(users.id, adminId), eq(users.userType, 'admin')))
      .for('update')
      .limit(1)

    if (!admin || !admin.email) throw unauthorized('Admin no longer exists')

    const phone = input.phone ? input.phone : null

    if (phone) {
      const [taken] = await tx
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.phone, phone), ne(users.id, adminId)))
        .limit(1)
      if (taken) throw conflict('Phone is already in use')
    }

    const [updated] = await tx
      .update(users)
      .set({ fullName: input.fullName, phone })
      .where(eq(users.id, adminId))
      .returning()

    await tx.insert(eventLog).values({
      type: 'admin.profile_updated',
      payload: { adminId, fullName: input.fullName, phone },
    })

    return toAdminInfo(updated!)
  })
}

export async function changePassword(
  adminId: string,
  input: ChangePasswordInput,
): Promise<void> {
  const [admin] = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(and(eq(users.id, adminId), eq(users.userType, 'admin')))
    .limit(1)

  if (!admin || !admin.passwordHash) {
    throw unauthorized('Admin no longer exists')
  }

  const valid = await argon2.verify(admin.passwordHash, input.currentPassword)
  if (!valid) throw unauthorized('Current password is incorrect')

  if (input.currentPassword === input.newPassword) {
    throw badRequest('New password must be different from the current password')
  }

  const passwordHash = await hashPassword(input.newPassword)
  await db.update(users).set({ passwordHash }).where(eq(users.id, adminId))

  await db.insert(eventLog).values({
    type: 'admin.password_changed',
    payload: { adminId },
  })
}

export async function forgotPassword(input: ForgotPasswordInput): Promise<void> {
  const email = input.email.toLowerCase().trim()
  const [admin] = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email), eq(users.userType, 'admin')))
    .limit(1)

  if (!admin) {
    throw notFound('No admin account found with this email')
  }

  const passwordHash = await hashPassword(input.newPassword)
  await db.update(users).set({ passwordHash }).where(eq(users.id, admin.id))

  await db.insert(eventLog).values({
    type: 'admin.password_reset',
    payload: { adminId: admin.id, via: 'forgot-password' },
  })
}

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password)
}
