import { and, eq } from 'drizzle-orm'
import { SignJWT } from 'jose'
import argon2 from 'argon2'
import { db } from '../../db/client.js'
import { users } from '../../db/schemas/index.js'
import { env } from '../../config/env.js'
import { HttpError, unauthorized } from '../../lib/http-error.js'
import type { LoginInput } from './schemas.js'

const secret = new TextEncoder().encode(env.AUTH_SECRET)

export interface AdminInfo {
  id: string
  email: string
  fullName: string
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
  return {
    token,
    admin: { id: admin.id, email: admin.email!, fullName: admin.fullName },
  }
}

export async function getMe(adminId: string): Promise<AdminInfo> {
  const [admin] = await db
    .select({ id: users.id, email: users.email, fullName: users.fullName })
    .from(users)
    .where(and(eq(users.id, adminId), eq(users.userType, 'admin')))
    .limit(1)

  if (!admin || !admin.email) throw unauthorized('Admin no longer exists')
  return { id: admin.id, email: admin.email, fullName: admin.fullName }
}

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password)
}
