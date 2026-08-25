import { and, desc, eq, gt, isNull } from 'drizzle-orm'
import { SignJWT } from 'jose'
import argon2 from 'argon2'
import { db } from '../../db/client.js'
import { authOtps, users } from '../../db/schemas/index.js'
import { env } from '../../config/env.js'
import { badRequest, notFound, unauthorized } from '../../lib/http-error.js'
import type { OtpRequestInput, OtpVerifyInput } from './schemas.js'

const secret = new TextEncoder().encode(env.AUTH_SECRET)
const OTP_TTL_MINUTES = 10
const MAX_ATTEMPTS = 5

export async function requestOtp(input: OtpRequestInput) {
  const code = String(Math.floor(100000 + Math.random() * 900000))
  const codeHash = await argon2.hash(code)
  const now = new Date()

  await db.insert(authOtps).values({
    phone: input.phone,
    codeHash,
    purpose: 'login',
    expiresAt: new Date(now.getTime() + OTP_TTL_MINUTES * 60_000),
  })

  // No SMS gateway in dev — the code is returned so the flow is testable.
  // In production this is where an SMS provider integration goes.
  if (env.NODE_ENV === 'production') {
    return { sent: true }
  }
  return { sent: true, devCode: code }
}

export async function verifyOtp(input: OtpVerifyInput) {
  const now = new Date()

  const [otp] = await db
    .select()
    .from(authOtps)
    .where(
      and(
        eq(authOtps.phone, input.phone),
        isNull(authOtps.consumedAt),
        gt(authOtps.expiresAt, now),
      ),
    )
    .orderBy(desc(authOtps.createdAt))
    .limit(1)

  if (!otp) throw badRequest('No active code — request a new one')
  if (otp.attempts >= MAX_ATTEMPTS) {
    throw badRequest('Too many attempts — request a new code')
  }

  const valid = await argon2.verify(otp.codeHash, input.code).catch(() => false)
  if (!valid) {
    await db
      .update(authOtps)
      .set({ attempts: otp.attempts + 1 })
      .where(eq(authOtps.id, otp.id))
    throw unauthorized('Invalid code')
  }

  await db
    .update(authOtps)
    .set({ consumedAt: now })
    .where(eq(authOtps.id, otp.id))

  const [workerUser] = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      status: users.status,
    })
    .from(users)
    .where(and(eq(users.phone, input.phone), eq(users.userType, 'worker')))
    .limit(1)

  if (!workerUser) {
    throw notFound('No worker registered with this phone')
  }

  const token = await new SignJWT({ role: 'worker' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(workerUser.id)
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(secret)

  return {
    token,
    worker: {
      id: workerUser.id,
      fullName: workerUser.fullName,
      status: workerUser.status,
    },
  }
}
