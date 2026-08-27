import { Router } from 'express'
import { asyncHandler } from '../../middleware/async-handler.js'
import { getLocations } from './service.js'

export const metaRouter = Router()

metaRouter.get(
  '/locations',
  asyncHandler(async (_req, res) => {
    const result = await getLocations()
    res.json({ ok: true, ...result })
  }),
)
