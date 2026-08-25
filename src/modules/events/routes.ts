import { Router } from 'express'
import { asyncHandler } from '../../middleware/async-handler.js'
import { listEventsQuerySchema } from './schemas.js'
import { listEvents } from './service.js'

export const eventsRouter = Router()

eventsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = listEventsQuerySchema.parse(req.query)
    res.json({ ok: true, ...(await listEvents(query)) })
  }),
)
