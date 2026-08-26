import { Router } from 'express'
import { asyncHandler } from '../../middleware/async-handler.js'
import { requireAdmin } from '../../middleware/require-admin.js'
import {
  changePasswordSchema,
  loginSchema,
  updateProfileSchema,
} from './schemas.js'
import { changePassword, getMe, login, updateProfile } from './service.js'

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

authRouter.patch(
  '/profile',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const input = updateProfileSchema.parse(req.body)
    const admin = await updateProfile(req.adminId!, input)
    res.json({ ok: true, admin })
  }),
)

authRouter.post(
  '/change-password',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const input = changePasswordSchema.parse(req.body)
    await changePassword(req.adminId!, input)
    res.json({ ok: true })
  }),
)
