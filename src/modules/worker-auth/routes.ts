import { Router } from 'express'

import { asyncHandler } from '../../middleware/async-handler.js'
import { requireWorker } from '../../middleware/require-worker.js'

import { registerSchema } from '../worker/schemas.js'
import { register } from '../worker/service.js'

import { otpRequestSchema, otpVerifySchema } from './schemas.js'

import {
  acknowledgeApproval,
  requestOtp,
  verifyOtp,
} from './service.js'

export const workerAuthRouter = Router()

// ============================================================
// REGISTRATION
// ============================================================

workerAuthRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const input = registerSchema.parse(req.body)

    res.status(201).json({
      ok: true,
      ...(await register(input)),
    })
  }),
)

// ============================================================
// REQUEST OTP
// ============================================================

workerAuthRouter.post(
  '/otp/request',
  asyncHandler(async (req, res) => {
    const input = otpRequestSchema.parse(req.body)

    res.json({
      ok: true,
      ...(await requestOtp(input)),
    })
  }),
)

// ============================================================
// VERIFY OTP
// ============================================================

workerAuthRouter.post(
  '/otp/verify',
  asyncHandler(async (req, res) => {
    const input = otpVerifySchema.parse(req.body)

    res.json({
      ok: true,
      ...(await verifyOtp(input)),
    })
  }),
)

// ============================================================
// ACKNOWLEDGE APPROVAL
// ============================================================
//
// Called when a newly approved worker clicks
// "Go to Dashboard" on the Approved screen.
//
// Requires the worker's JWT.
// The worker ID comes from req.workerId,
// so a worker cannot acknowledge another worker.
//

workerAuthRouter.post(
  '/approval/acknowledge',
  requireWorker,
  asyncHandler(async (req, res) => {
    const worker = await acknowledgeApproval(req.workerId!)

    res.json({
      ok: true,
      worker,
    })
  }),
)