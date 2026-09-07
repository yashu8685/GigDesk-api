import { and, count, desc, eq, isNull, ne, sql } from 'drizzle-orm'
import { db } from '../../db/client.js'
import {
  eventLog,
  jobAssignments,
  jobRequests,
  jobs,
  notifications,
  payouts,
  users,
} from '../../db/schemas/index.js'
import { conflict, forbidden, notFound } from '../../lib/http-error.js'
import type {
  CompleteInput,
  RegisterInput,
  UpdateMeInput,
} from './schemas.js'

async function requireApprovedWorker(workerId: string) {
  const [workerUser] = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      status: users.status,
      city: users.city,
      area: users.area,
      pincode: users.pincode,
    })
    .from(users)
    .where(and(eq(users.id, workerId), eq(users.userType, 'worker')))
    .limit(1)

  if (!workerUser) throw notFound('Worker not found')

  return workerUser
}

export async function register(input: RegisterInput) {
  // ------------------------------------------------------------
  // PHONE
  // ------------------------------------------------------------

  const rawPhone =
    (input as unknown as { mobile?: string }).mobile ?? input.phone

  const phone = rawPhone as string

  // ------------------------------------------------------------
  // EMAIL
  // ------------------------------------------------------------

  const emailRaw =
    (input as unknown as { email?: string }).email
      ?.trim()
      ?.toLowerCase() ?? null

  // Workers can reuse an email that belongs to another worker.
  // Only an admin email must be unique against this registration.
  if (emailRaw) {
    const [adminWithEmail] = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.email, emailRaw),
          eq(users.userType, 'admin'),
        ),
      )
      .limit(1)

    if (adminWithEmail) {
      throw conflict('This email is already used by an admin')
    }
  }

  // ------------------------------------------------------------
  // WORKER DATA
  // ------------------------------------------------------------

  const fullName =
    input.fullName && input.fullName.trim().length >= 3
      ? input.fullName.trim()
      : [input.surname, input.name]
          .filter(Boolean)
          .join(' ')
          .trim() || 'Unnamed Worker'

  const idProofUrl =
    input.idProofUrl ??
    (input as unknown as { aadhaarUrl?: string }).aadhaarUrl ??
    (input as unknown as { idProofKey?: string }).idProofKey ??
    ''

  const emailVal = emailRaw

  const addressVal =
    input.address && input.address.trim() !== ''
      ? input.address.trim()
      : null

  const districtVal =
    input.district && input.district.trim() !== ''
      ? input.district.trim()
      : null

  const cityVal = input.city?.trim() || null

  const areaVal =
    input.area?.trim() ||
    (addressVal ? addressVal.slice(0, 80) : null) ||
    'Unknown'

  const pincodeVal = input.pincode?.trim() || null

  const profilePhotoUrl =
    (input as unknown as { profilePhotoUrl?: string }).profilePhotoUrl ||
    null

  const drivingLicenseUrl =
    (input as unknown as { drivingLicenseUrl?: string })
      .drivingLicenseUrl || null

  // ------------------------------------------------------------
  // REGISTRATION TRANSACTION
  // ------------------------------------------------------------

  return db.transaction(async (tx) => {
    // ============================================================
    // CHECK EXISTING WORKER
    // ============================================================

    const [existingWorker] = await tx
      .select({
        id: users.id,
        status: users.status,
      })
      .from(users)
      .where(
        and(
          eq(users.phone, phone),
          eq(users.userType, 'worker'),
        ),
      )
      .for('update')
      .limit(1)

    // ============================================================
    // EXISTING WORKER
    // ============================================================

    if (existingWorker) {
      // ----------------------------------------------------------
      // APPROVED WORKER
      // ----------------------------------------------------------

      // Approved workers cannot register again.
      if (existingWorker.status === 'approved') {
        throw conflict('This phone number is already registered')
      }

      // ----------------------------------------------------------
      // PENDING WORKER
      // ----------------------------------------------------------

      // Prevent duplicate applications while one is already
      // waiting for admin review.
      if (existingWorker.status === 'pending') {
        throw conflict('Your application is already under review')
      }

      // ----------------------------------------------------------
      // REJECTED WORKER
      // ----------------------------------------------------------

      // Allow the SAME worker to submit a new application.
      // We update the existing user instead of creating another row.
      if (existingWorker.status === 'rejected') {
        const now = new Date()

        const [updatedWorker] = await tx
          .update(users)
          .set({
            fullName,
            phone,
            email: emailVal,
            city: cityVal,
            district: districtVal,
            area: areaVal,
            pincode: pincodeVal,
            address: addressVal,
            idProofUrl,
            profilePhotoUrl: profilePhotoUrl || null,
            drivingLicenseUrl: drivingLicenseUrl || null,

            // Send the application back to admin for review.
            status: 'pending',

            // Reset previous admin decision.
            reviewedAt: null,
            reviewedBy: null,
            rejectionReason: null,

            // Worker must acknowledge the new approval later.
            approvalAcknowledged: false,

            // Treat this as the latest application submission.
            registeredAt: now,
          })
          .where(eq(users.id, existingWorker.id))
          .returning({
            id: users.id,
            status: users.status,
          })

        await tx.insert(eventLog).values({
          type: 'worker.re_registered',
          payload: {
            workerId: updatedWorker!.id,
            phone,
          },
        })

        return {
          id: updatedWorker!.id,
          status: updatedWorker!.status,
        }
      }

      // ----------------------------------------------------------
      // UNKNOWN STATUS
      // ----------------------------------------------------------

      throw conflict(
        `Worker cannot register with current status: ${existingWorker.status}`,
      )
    }

    // ============================================================
    // NEW WORKER
    // ============================================================

    const [workerUser] = await tx
      .insert(users)
      .values({
        userType: 'worker',
        fullName,
        phone,
        email: emailVal,
        city: cityVal,
        district: districtVal,
        area: areaVal,
        pincode: pincodeVal,
        address: addressVal,
        idProofUrl,
        profilePhotoUrl: profilePhotoUrl || undefined,
        drivingLicenseUrl: drivingLicenseUrl || undefined,
        status: 'pending',
        approvalAcknowledged: false,
      })
      .returning({
        id: users.id,
        status: users.status,
      })

    await tx.insert(eventLog).values({
      type: 'worker.registered',
      payload: {
        workerId: workerUser!.id,
        phone,
      },
    })

    return {
      id: workerUser!.id,
      status: workerUser!.status,
    }
  })
}

export async function getMe(workerId: string) {
  const [workerUser] = await db
    .select({
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
      rejectionReason: users.rejectionReason,
    })
    .from(users)
    .where(eq(users.id, workerId))
    .limit(1)

  if (!workerUser) throw notFound('Worker not found')

  return workerUser
}

export async function updateMe(
  workerId: string,
  input: UpdateMeInput,
) {
  const [updated] = await db
    .update(users)
    .set({
      ...(input.fullName !== undefined
        ? { fullName: input.fullName }
        : {}),
      ...(input.city !== undefined
        ? { city: input.city }
        : {}),
      ...(input.district !== undefined
        ? { district: input.district }
        : {}),
      ...(input.area !== undefined
        ? { area: input.area }
        : {}),
      ...(input.pincode !== undefined
        ? { pincode: input.pincode }
        : {}),
      ...(input.address !== undefined
        ? { address: input.address }
        : {}),
      ...(input.isAvailable !== undefined
        ? { isAvailable: input.isAvailable }
        : {}),
      ...(input.lastLat !== undefined
        ? { lastLat: input.lastLat }
        : {}),
      ...(input.lastLng !== undefined
        ? { lastLng: input.lastLng }
        : {}),
    })
    .where(eq(users.id, workerId))
    .returning({
      id: users.id,
      fullName: users.fullName,
      city: users.city,
      area: users.area,
      pincode: users.pincode,
      isAvailable: users.isAvailable,
    })

  if (!updated) throw notFound('Worker not found')

  return updated
}

export async function home(workerId: string) {
  const workerUser = await getMe(workerId)

  const [active] = await db
    .select({
      assignmentId: jobAssignments.id,
      jobId: jobs.id,
      jobTitle: jobs.title,
      jobArea: jobs.area,
      jobPincode: jobs.pincode,
      payAmountInr: jobs.payAmountInr,
      assignedAt: jobAssignments.assignedAt,
    })
    .from(jobAssignments)
    .innerJoin(
      jobs,
      eq(jobAssignments.jobId, jobs.id),
    )
    .where(
      and(
        eq(jobAssignments.workerId, workerId),
        eq(jobAssignments.status, 'active'),
        eq(jobs.status, 'assigned'),
      ),
    )
    .limit(1)

  const [earnings] = await db
    .select({
      paidTotal: sql<number>`
        coalesce(
          sum(
            case
              when ${payouts.status} = 'paid'
              then ${payouts.amountInr}
              else 0
            end
          ),
          0
        )::int
      `,
      pendingTotal: sql<number>`
        coalesce(
          sum(
            case
              when ${payouts.status} = 'pending'
              then ${payouts.amountInr}
              else 0
            end
          ),
          0
        )::int
      `,
    })
    .from(payouts)
    .where(eq(payouts.workerId, workerId))

  const [unread] = await db
    .select({
      value: count(),
    })
    .from(notifications)
    .where(
      and(
        eq(notifications.workerId, workerId),
        isNull(notifications.readAt),
      ),
    )

  return {
    worker: workerUser,
    activeJob: active ?? null,
    earnings: {
      paidTotal: earnings!.paidTotal,
      pendingTotal: earnings!.pendingTotal,
    },
    unreadNotifications: unread!.value,
  }
}

export async function availableJobs(workerId: string) {
  const workerUser = await requireApprovedWorker(workerId)

  if (workerUser.status !== 'approved') {
    throw forbidden(
      'Your registration is not approved yet',
    )
  }

  const assignmentFilter = sql`
    not exists (
      select 1
      from ${jobAssignments} as ja
      where
        ja.job_id = ${jobs.id}
        and ja.status in ('pending', 'active')
    )
  `

  const baseWhere = workerUser.pincode
    ? and(
        eq(jobs.status, 'open'),
        eq(jobs.pincode, workerUser.pincode!),
        assignmentFilter,
      )
    : and(
        eq(jobs.status, 'open'),
        assignmentFilter,
      )

  const items = await db
    .select({
      id: jobs.id,
      title: jobs.title,
      description: jobs.description,
      city: jobs.city,
      district: jobs.district,
      area: jobs.area,
      pincode: jobs.pincode,
      payAmountInr: jobs.payAmountInr,
      durationHours: jobs.durationHours,
      deadlineAt: jobs.deadlineAt,
      lat: jobs.lat,
      lng: jobs.lng,
      createdAt: jobs.createdAt,
      myPendingRequestId: sql<string | null>`
        (
          select jr.id
          from job_requests jr
          where
            jr.job_id = jobs.id
            and jr.worker_id = ${workerId}
            and jr.status = 'pending'
          limit 1
        )
      `,
    })
    .from(jobs)
    .where(baseWhere)
    .orderBy(desc(jobs.createdAt))

  return { items }
}

export async function jobDetailForWorker(
  workerId: string,
  jobId: string,
) {
  const [job] = await db
    .select({
      id: jobs.id,
      title: jobs.title,
      description: jobs.description,
      city: jobs.city,
      area: jobs.area,
      pincode: jobs.pincode,
      payAmountInr: jobs.payAmountInr,
      durationHours: jobs.durationHours,
      status: jobs.status,
      createdAt: jobs.createdAt,
    })
    .from(jobs)
    .where(eq(jobs.id, jobId))
    .limit(1)

  if (!job) throw notFound('Job not found')

  const [myRequest] = await db
    .select({
      id: jobRequests.id,
      status: jobRequests.status,
      requestedAt: jobRequests.requestedAt,
    })
    .from(jobRequests)
    .where(
      and(
        eq(jobRequests.jobId, jobId),
        eq(jobRequests.workerId, workerId),
        ne(jobRequests.status, 'rejected'),
      ),
    )
    .orderBy(desc(jobRequests.requestedAt))
    .limit(1)

  return {
    job,
    myRequest: myRequest ?? null,
  }
}

export async function requestJob(
  workerId: string,
  jobId: string,
) {
  return db.transaction(async (tx) => {
    const [workerUser] = await tx
      .select({
        id: users.id,
        status: users.status,
        pincode: users.pincode,
      })
      .from(users)
      .where(eq(users.id, workerId))
      .for('update')
      .limit(1)

    if (!workerUser) {
      throw notFound('Worker not found')
    }

    if (workerUser.status !== 'approved') {
      throw forbidden(
        'Your registration is not approved yet',
      )
    }

    const [job] = await tx
      .select({
        id: jobs.id,
        title: jobs.title,
        status: jobs.status,
        pincode: jobs.pincode,
        area: jobs.area,
      })
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .for('update')
      .limit(1)

    if (!job) throw notFound('Job not found')

    if (job.status !== 'open') {
      throw conflict('Job is no longer open')
    }

    if (job.pincode !== workerUser.pincode) {
      throw conflict('This job is not in your area')
    }

    const [dup] = await tx
      .select({
        id: jobRequests.id,
      })
      .from(jobRequests)
      .where(
        and(
          eq(jobRequests.jobId, jobId),
          eq(jobRequests.workerId, workerId),
          eq(jobRequests.status, 'pending'),
        ),
      )
      .limit(1)

    if (dup) {
      throw conflict(
        'You already have a pending request for this job',
      )
    }

    const [request] = await tx
      .insert(jobRequests)
      .values({
        jobId,
        workerId,
        status: 'pending',
      })
      .returning({
        id: jobRequests.id,
        requestedAt: jobRequests.requestedAt,
      })

    await tx.insert(eventLog).values({
      type: 'job_request.created',
      jobId,
      payload: {
        workerId,
        requestId: request!.id,
      },
    })

    return {
      requestId: request!.id,
      status: 'pending',
      requestedAt: request!.requestedAt,
    }
  })
}

export async function myRequests(workerId: string) {
  return db
    .select({
      id: jobRequests.id,
      status: jobRequests.status,
      requestedAt: jobRequests.requestedAt,
      reviewedAt: jobRequests.reviewedAt,
      jobTitle: jobs.title,
      jobArea: jobs.area,
      jobPayAmountInr: jobs.payAmountInr,
    })
    .from(jobRequests)
    .leftJoin(
      jobs,
      eq(jobRequests.jobId, jobs.id),
    )
    .where(eq(jobRequests.workerId, workerId))
    .orderBy(desc(jobRequests.requestedAt))
}

export async function myAssignments(workerId: string) {
  return db
    .select({
      id: jobAssignments.id,
      status: jobAssignments.status,
      source: jobAssignments.source,
      assignedAt: jobAssignments.assignedAt,
      cancelledAt: jobAssignments.cancelledAt,
      jobId: jobs.id,
      jobTitle: jobs.title,
      jobStatus: jobs.status,
      jobArea: jobs.area,
      jobPincode: jobs.pincode,
      payAmountInr: jobs.payAmountInr,
    })
    .from(jobAssignments)
    .innerJoin(
      jobs,
      eq(jobAssignments.jobId, jobs.id),
    )
    .where(eq(jobAssignments.workerId, workerId))
    .orderBy(desc(jobAssignments.assignedAt))
}

export async function activeAssignment(workerId: string) {
  const [active] = await db
    .select({
      assignmentId: jobAssignments.id,
      assignedAt: jobAssignments.assignedAt,
      jobId: jobs.id,
      jobTitle: jobs.title,
      jobDescription: jobs.description,
      jobArea: jobs.area,
      jobCity: jobs.city,
      jobPincode: jobs.pincode,
      payAmountInr: jobs.payAmountInr,
      durationHours: jobs.durationHours,
    })
    .from(jobAssignments)
    .innerJoin(
      jobs,
      eq(jobAssignments.jobId, jobs.id),
    )
    .where(
      and(
        eq(jobAssignments.workerId, workerId),
        eq(jobAssignments.status, 'active'),
        eq(jobs.status, 'assigned'),
      ),
    )
    .limit(1)

  return active ?? null
}

export async function acceptAssignment(
  workerId: string,
  assignmentId: string,
) {
  return db.transaction(async (tx) => {
    const [assignment] = await tx
      .select()
      .from(jobAssignments)
      .where(eq(jobAssignments.id, assignmentId))
      .for('update')
      .limit(1)

    if (!assignment) {
      throw notFound('Assignment not found')
    }

    if (assignment.workerId !== workerId) {
      throw forbidden(
        'This invitation belongs to another worker',
      )
    }

    if (assignment.status !== 'pending') {
      throw conflict(
        'This invitation is no longer pending',
      )
    }

    const [job] = await tx
      .select({
        id: jobs.id,
        title: jobs.title,
        status: jobs.status,
      })
      .from(jobs)
      .where(eq(jobs.id, assignment.jobId))
      .for('update')
      .limit(1)

    if (!job) {
      throw notFound(
        'Job for this invitation no longer exists',
      )
    }

    if (job.status !== 'open') {
      throw conflict(
        `Job is no longer open (status: ${job.status})`,
      )
    }

    const now = new Date()

    await tx
      .update(jobAssignments)
      .set({
        status: 'active',
      })
      .where(eq(jobAssignments.id, assignmentId))

    await tx
      .update(jobs)
      .set({
        status: 'assigned',
        assignedWorkerId: workerId,
        assignedAt: now,
      })
      .where(eq(jobs.id, job.id))

    await tx.insert(eventLog).values({
      type: 'job.assigned',
      jobId: job.id,
      payload: {
        workerId,
        assignmentId,
        source: 'admin_direct',
        acceptedByWorker: true,
      },
    })

    return {
      assignmentId,
      jobId: job.id,
      status: 'active',
      jobStatus: 'assigned',
      acceptedAt: now.toISOString(),
    }
  })
}
/**
 * Worker completes their assigned job.
 * Proof photo is mandatory — the DB check constraint enforces it too.
 * One transaction writes:
 * job completed,
 * payout row,
 * audit event,
 * worker notification.
 */
export async function completeAssignment(
  workerId: string,
  assignmentId: string,
  input: CompleteInput,
) {
  return db.transaction(async (tx) => {
    const [assignment] = await tx
      .select()
      .from(jobAssignments)
      .where(eq(jobAssignments.id, assignmentId))
      .for('update')
      .limit(1)

    if (!assignment) {
      throw notFound('Assignment not found')
    }

    if (assignment.workerId !== workerId) {
      throw forbidden(
        'This assignment belongs to another worker',
      )
    }

    if (assignment.status !== 'active') {
      throw conflict(
        'Assignment is no longer active',
      )
    }

    const [job] = await tx
      .select({
        id: jobs.id,
        title: jobs.title,
        status: jobs.status,
        payAmountInr: jobs.payAmountInr,
        area: jobs.area,
      })
      .from(jobs)
      .where(eq(jobs.id, assignment.jobId))
      .for('update')
      .limit(1)

    if (!job) {
      throw notFound(
        'Job for this assignment no longer exists',
      )
    }

    if (job.status !== 'assigned') {
      throw conflict(
        `Job cannot be completed (status: ${job.status})`,
      )
    }

    const now = new Date()

    await tx
      .update(jobs)
      .set({
        status: 'completed',
        completedAt: now,
        proofPhotoUrl: input.proofPhotoUrl,
      })
      .where(eq(jobs.id, job.id))

    await tx.insert(payouts).values({
      jobId: job.id,
      workerId,
      amountInr: job.payAmountInr,
      status: 'pending',
    })

    await tx.insert(eventLog).values({
      type: 'job.completed',
      jobId: job.id,
      payload: {
        workerId,
        proofPhotoUrl: input.proofPhotoUrl,
      },
    })

    await tx.insert(notifications).values({
      workerId,
      type: 'job.completed',
      title: 'Work submitted',
      body:
        `"${job.title}" marked complete. ` +
        `Payout of ₹${job.payAmountInr} is pending.`,
      jobId: job.id,
    })

    return {
      jobId: job.id,
      jobStatus: 'completed',
      completedAt: now.toISOString(),
      payoutAmountInr: job.payAmountInr,
    }
  })
}

export async function earnings(workerId: string) {
  const items = await db
    .select({
      id: payouts.id,
      amountInr: payouts.amountInr,
      status: payouts.status,
      createdAt: payouts.createdAt,
      paidAt: payouts.paidAt,
      jobTitle: jobs.title,
      jobArea: jobs.area,
      completedAt: jobs.completedAt,
    })
    .from(payouts)
    .innerJoin(
      jobs,
      eq(payouts.jobId, jobs.id),
    )
    .where(eq(payouts.workerId, workerId))
    .orderBy(desc(payouts.createdAt))

  const paidTotal = items
    .filter((i) => i.status === 'paid')
    .reduce((s, i) => s + i.amountInr, 0)

  const pendingTotal = items
    .filter((i) => i.status === 'pending')
    .reduce((s, i) => s + i.amountInr, 0)

  return {
    items,
    paidTotal,
    pendingTotal,
  }
}

export async function performance(workerId: string) {
  const [completedRow] = await db
    .select({
      value: count(),
    })
    .from(jobs)
    .where(
      and(
        eq(jobs.assignedWorkerId, workerId),
        eq(jobs.status, 'completed'),
      ),
    )

  const [cancelledRow] = await db
    .select({
      value: count(),
    })
    .from(jobAssignments)
    .where(
      and(
        eq(jobAssignments.workerId, workerId),
        eq(jobAssignments.status, 'cancelled'),
      ),
    )

  const [earningsRow] = await db
    .select({
      paidTotal: sql<number>`
        coalesce(
          sum(
            case
              when ${payouts.status} = 'paid'
              then ${payouts.amountInr}
              else 0
            end
          ),
          0
        )::int
      `,
      pendingTotal: sql<number>`
        coalesce(
          sum(
            case
              when ${payouts.status} = 'pending'
              then ${payouts.amountInr}
              else 0
            end
          ),
          0
        )::int
      `,
    })
    .from(payouts)
    .where(eq(payouts.workerId, workerId))

  return {
    completedJobs: completedRow!.value,
    cancelledAssignments: cancelledRow!.value,
    paidTotal: earningsRow!.paidTotal,
    pendingTotal: earningsRow!.pendingTotal,
  }
}

export async function notificationsList(
  workerId: string,
  unreadOnly: boolean,
) {
  const where = unreadOnly
    ? and(
        eq(notifications.workerId, workerId),
        isNull(notifications.readAt),
      )
    : eq(notifications.workerId, workerId)

  return db
    .select()
    .from(notifications)
    .where(where)
    .orderBy(desc(notifications.createdAt))
    .limit(100)
}

export async function markNotificationRead(
  workerId: string,
  notificationId: string,
) {
  const [updated] = await db
    .update(notifications)
    .set({
      readAt: new Date(),
    })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.workerId, workerId),
        isNull(notifications.readAt),
      ),
    )
    .returning({
      id: notifications.id,
    })

  if (!updated) {
    throw notFound(
      'Notification not found or already read',
    )
  }

  return updated
}

export async function markAllNotificationsRead(
  workerId: string,
) {
  const updated = await db
    .update(notifications)
    .set({
      readAt: new Date(),
    })
    .where(
      and(
        eq(notifications.workerId, workerId),
        isNull(notifications.readAt),
      ),
    )
    .returning({
      id: notifications.id,
    })

  return {
    marked: updated.length,
  }
}