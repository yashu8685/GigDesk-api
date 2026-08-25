import { Router } from 'express'
import { asyncHandler } from '../../middleware/async-handler.js'
import { registerSchema } from '../worker/schemas.js'
import { register } from '../worker/service.js'
import { otpRequestSchema, otpVerifySchema } from './schemas.js'
import { requestOtp, verifyOtp } from './service.js'

export const workerAuthRouter = Router()

// Registration is public — it happens before any login exists
workerAuthRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const input = registerSchema.parse(req.body)
    res.status(201).json({ ok: true, ...(await register(input)) })
  }),
)

workerAuthRouter.post(
  '/otp/request',
  asyncHandler(async (req, res) => {
    const input = otpRequestSchema.parse(req.body)
    res.json({ ok: true, ...(await requestOtp(input)) })
  }),
)

workerAuthRouter.post(
  '/otp/verify',
  asyncHandler(async (req, res) => {
    const input = otpVerifySchema.parse(req.body)
    res.json({ ok: true, ...(await verifyOtp(input)) })
  }),
)
