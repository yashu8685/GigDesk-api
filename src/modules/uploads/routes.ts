import { Router } from 'express'
import { asyncHandler } from '../../middleware/async-handler.js'
import { presignSchema } from './schemas.js'
import { presignUpload } from './service.js'

export const uploadsRouter = Router()

uploadsRouter.post(
  '/presign',
  asyncHandler(async (req, res) => {
    const input = presignSchema.parse(req.body)
    res.json({ ok: true, ...(await presignUpload(input)) })
  }),
)
