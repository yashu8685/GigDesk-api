import { Router } from 'express'
import { asyncHandler } from '../../middleware/async-handler.js'
import { idParamSchema, listPayoutsQuerySchema } from './schemas.js'
import { listPayouts, markPaid } from './service.js'

export const payoutsRouter = Router()

payoutsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = listPayoutsQuerySchema.parse(req.query)
    res.json({ ok: true, ...(await listPayouts(query)) })
  }),
)

payoutsRouter.post(
  '/:id/mark-paid',
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params)
    res.json({ ok: true, ...(await markPaid(id, req.adminId!)) })
  }),
)
