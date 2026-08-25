import { Router } from 'express'
import { asyncHandler } from '../../middleware/async-handler.js'
import { idParamSchema, listRequestsQuerySchema } from './schemas.js'
import { approveRequest, listRequests, rejectRequest } from './service.js'

export const requestsRouter = Router()

requestsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = listRequestsQuerySchema.parse(req.query)
    const result = await listRequests(query)
    res.json({ ok: true, ...result })
  }),
)

requestsRouter.post(
  '/:id/approve',
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params)
    const result = await approveRequest(id, req.adminId!)
    res.json({ ok: true, ...result })
  }),
)

requestsRouter.post(
  '/:id/reject',
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params)
    const result = await rejectRequest(id, req.adminId!)
    res.json({ ok: true, ...result })
  }),
)
