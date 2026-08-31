import { and, count, desc, eq, ilike, or } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { eventLog, notifications, users } from '../../db/schemas/index.js'
import { conflict, notFound } from '../../lib/http-error.js'
import type { ListWorkersQuery, ReviewInput } from './schemas.js'

const workerColumns = {
  id: users.id,
  fullName: users.fullName,
  phone: users.phone,
  email: users.email,
  city: users.city,
  district: users.district,
  area: users.area,
  pincode: users.pincode,
  address: users.address,
  idProofUrl: users.idProofUrl,
  profilePhotoUrl: users.profilePhotoUrl,
  drivingLicenseUrl: users.drivingLicenseUrl,
  isAvailable: users.isAvailable,
  lastLat: users.lastLat,
  lastLng: users.lastLng,
  status: users.status,
  registeredAt: users.registeredAt,
  reviewedAt: users.reviewedAt,
  rejectionReason: users.rejectionReason,
}

export async function listWorkers(query: ListWorkersQuery) {
  const conditions = [eq(users.userType, 'worker')]
  if (query.status) conditions.push(eq(users.status, query.status))
  if (query.city) conditions.push(ilike(users.city, `%${query.city}%`))
  if (query.district) conditions.push(ilike(users.district, `%${query.district}%`))
  if (query.pincode) conditions.push(eq(users.pincode, query.pincode))
  if (query.search) {
    conditions.push(
      or(
        ilike(users.fullName, `%${query.search}%`),
        ilike(users.phone, `%${query.search}%`),
      )!,
    )
  }
  const where = and(...conditions)

  const [items, [totals]] = await Promise.all([
    db
      .select(workerColumns)
      .from(users)
      .where(where)
      .orderBy(desc(users.registeredAt))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize),
    db.select({ value: count() }).from(users).where(where),
  ])

  const total = totals!.value
  return { items, total, page: query.page, pageSize: query.pageSize, totalPages: Math.ceil(total / query.pageSize) }
}

export async function getWorker(workerId: string) {
  const [worker] = await db
    .select(workerColumns)
    .from(users)
    .where(and(eq(users.id, workerId), eq(users.userType, 'worker')))
    .limit(1)

  if (!worker) throw notFound('Worker not found')
  return worker
}

/**
 * Admin reviews a pending worker. Only pending workers can be reviewed —
 * a decision is final (history is kept; nothing is overwritten).
 * Writes the audit event and the worker notification in the same transaction.
 */
export async function reviewWorker(
  workerId: string,
  adminId: string,
  input: ReviewInput,
) {
  return db.transaction(async (tx) => {
    const [worker] = await tx
      .select({ id: users.id, status: users.status, fullName: users.fullName, area: users.area })
      .from(users)
      .where(and(eq(users.id, workerId), eq(users.userType, 'worker')))
      .for('update')
      .limit(1)

    if (!worker) throw notFound('Worker not found')
    if (worker.status !== 'pending') {
      throw conflict(`Worker already reviewed (status: ${worker.status})`)
    }

    const now = new Date()
    const newStatus = input.decision === 'approve' ? 'approved' : 'rejected'
    const rejectionReason =
      input.decision === 'reject' ? input.reason!.trim() : null

    await tx
      .update(users)
      .set({
        status: newStatus,
        reviewedAt: now,
        reviewedBy: adminId,
        rejectionReason,
      })
      .where(eq(users.id, workerId))

    await tx.insert(eventLog).values({
      type: `worker.${newStatus}`,
      payload: {
        workerId,
        reviewedBy: adminId,
        rejectionReason,
      },
    })

    await tx.insert(notifications).values({
      workerId,
      type: `worker.${newStatus}`,
      title:
        input.decision === 'approve'
          ? 'Registration approved'
          : 'Registration not approved',
      body:
        input.decision === 'approve'
          ? `You are approved. You can now see open jobs in ${worker.area ?? 'your area'}.`
          : `Your registration was not approved. Reason: ${rejectionReason}`,
    })

    return {
      id: workerId,
      fullName: worker.fullName,
      status: newStatus,
      reviewedAt: now.toISOString(),
      rejectionReason,
    }
  })
}
