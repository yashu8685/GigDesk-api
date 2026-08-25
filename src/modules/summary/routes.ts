import { Router } from 'express'
import { asyncHandler } from '../../middleware/async-handler.js'
import { getSummary } from './service.js'

export const summaryRouter = Router()

summaryRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json({ ok: true, ...(await getSummary()) })
  }),
)
