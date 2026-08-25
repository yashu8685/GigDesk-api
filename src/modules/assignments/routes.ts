import { Router } from 'express'
import { asyncHandler } from '../../middleware/async-handler.js'
import { assignJobSchema, idParamSchema } from './schemas.js'
import { assignJobDirect, cancelAssignment } from './service.js'

export const assignmentsRouter = Router()

assignmentsRouter.post(
  '/assign',
  asyncHandler(async (req, res) => {
    const input = assignJobSchema.parse(req.body)
    const result = await assignJobDirect(req.adminId!, input)
    res.json({ ok: true, ...result })
  }),
)

assignmentsRouter.post(
  '/:id/cancel',
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params)
    const result = await cancelAssignment(id, req.adminId!)
    res.json({ ok: true, ...result })
  }),
)
