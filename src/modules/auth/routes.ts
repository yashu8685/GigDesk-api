import { Router } from 'express'
import { asyncHandler } from '../../middleware/async-handler.js'
import { requireAdmin } from '../../middleware/require-admin.js'
import { loginSchema } from './schemas.js'
import { getMe, login } from './service.js'

export const authRouter = Router()

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const input = loginSchema.parse(req.body)
    const result = await login(input)
    res.json({ ok: true, ...result })
  }),
)

authRouter.get(
  '/me',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const admin = await getMe(req.adminId!)
    res.json({ ok: true, admin })
  }),
)
