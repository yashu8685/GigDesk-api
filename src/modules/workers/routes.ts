import { Router } from 'express'
import { asyncHandler } from '../../middleware/async-handler.js'
import {
  idParamSchema,
  listWorkersQuerySchema,
  reviewSchema,
} from './schemas.js'
import { getWorker, listWorkers, reviewWorker } from './service.js'

export const workersRouter = Router()

workersRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = listWorkersQuerySchema.parse(req.query)
    const result = await listWorkers(query)
    res.json({ ok: true, ...result })
  }),
)

workersRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params)
    const worker = await getWorker(id)
    res.json({ ok: true, worker })
  }),
)

workersRouter.post(
  '/:id/review',
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params)
    const input = reviewSchema.parse(req.body)
    const worker = await reviewWorker(id, req.adminId!, input)
    res.json({ ok: true, worker })
  }),
)
