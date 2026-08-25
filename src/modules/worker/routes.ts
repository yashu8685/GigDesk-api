import { Router } from 'express'
import { asyncHandler } from '../../middleware/async-handler.js'
import {
  completeSchema,
  idParamSchema,
  updateMeSchema,
} from './schemas.js'
import {
  activeAssignment,
  availableJobs,
  completeAssignment,
  earnings,
  getMe,
  home,
  jobDetailForWorker,
  markAllNotificationsRead,
  markNotificationRead,
  myAssignments,
  myRequests,
  notificationsList,
  performance,
  requestJob,
  updateMe,
} from './service.js'

export const workerRouter = Router()

workerRouter.get(
  '/me',
  asyncHandler(async (req, res) => {
    res.json({ ok: true, worker: await getMe(req.workerId!) })
  }),
)

workerRouter.patch(
  '/me',
  asyncHandler(async (req, res) => {
    const input = updateMeSchema.parse(req.body)
    res.json({ ok: true, worker: await updateMe(req.workerId!, input) })
  }),
)

workerRouter.get(
  '/home',
  asyncHandler(async (req, res) => {
    res.json({ ok: true, ...(await home(req.workerId!)) })
  }),
)

workerRouter.get(
  '/jobs/available',
  asyncHandler(async (req, res) => {
    res.json({ ok: true, ...(await availableJobs(req.workerId!)) })
  }),
)

workerRouter.get(
  '/jobs/:id',
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params)
    res.json({ ok: true, ...(await jobDetailForWorker(req.workerId!, id)) })
  }),
)

workerRouter.post(
  '/jobs/:id/request',
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params)
    res.json({ ok: true, ...(await requestJob(req.workerId!, id)) })
  }),
)

workerRouter.get(
  '/requests',
  asyncHandler(async (req, res) => {
    res.json({ ok: true, items: await myRequests(req.workerId!) })
  }),
)

workerRouter.get(
  '/assignments',
  asyncHandler(async (req, res) => {
    res.json({ ok: true, items: await myAssignments(req.workerId!) })
  }),
)

workerRouter.get(
  '/assignments/active',
  asyncHandler(async (req, res) => {
    res.json({ ok: true, assignment: await activeAssignment(req.workerId!) })
  }),
)

workerRouter.post(
  '/assignments/:id/complete',
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params)
    const input = completeSchema.parse(req.body)
    res.json({ ok: true, ...(await completeAssignment(req.workerId!, id, input)) })
  }),
)

workerRouter.get(
  '/earnings',
  asyncHandler(async (req, res) => {
    res.json({ ok: true, ...(await earnings(req.workerId!)) })
  }),
)

workerRouter.get(
  '/performance',
  asyncHandler(async (req, res) => {
    res.json({ ok: true, ...(await performance(req.workerId!)) })
  }),
)

workerRouter.get(
  '/area',
  asyncHandler(async (req, res) => {
    const me = await getMe(req.workerId!)
    res.json({
      ok: true,
      area: { city: me.city, area: me.area, pincode: me.pincode },
    })
  }),
)

workerRouter.get(
  '/notifications',
  asyncHandler(async (req, res) => {
    const unreadOnly = req.query.unread === '1' || req.query.unread === 'true'
    res.json({
      ok: true,
      items: await notificationsList(req.workerId!, unreadOnly),
    })
  }),
)

workerRouter.post(
  '/notifications/read-all',
  asyncHandler(async (req, res) => {
    res.json({ ok: true, ...(await markAllNotificationsRead(req.workerId!)) })
  }),
)

workerRouter.post(
  '/notifications/:id/read',
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params)
    res.json({ ok: true, ...(await markNotificationRead(req.workerId!, id)) })
  }),
)
