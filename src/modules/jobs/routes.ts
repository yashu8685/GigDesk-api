import { Router } from 'express'
import { asyncHandler } from '../../middleware/async-handler.js'
import {
  cancelJobSchema,
  createJobSchema,
  idParamSchema,
  listJobsQuerySchema,
} from './schemas.js'
import { cancelJob, createJob, getJob, listJobs } from './service.js'

export const jobsRouter = Router()

jobsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const input = createJobSchema.parse(req.body)
    const job = await createJob(req.adminId!, input)
    res.status(201).json({ ok: true, job })
  }),
)

jobsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = listJobsQuerySchema.parse(req.query)
    const result = await listJobs(query)
    res.json({ ok: true, ...result })
  }),
)

jobsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params)
    const result = await getJob(id)
    res.json({ ok: true, ...result })
  }),
)

jobsRouter.post(
  '/:id/cancel',
  asyncHandler(async (req, res) => {
    const { id } = idParamSchema.parse(req.params)
    const input = cancelJobSchema.parse(req.body)
    const result = await cancelJob(id, req.adminId!, input)
    res.json({ ok: true, ...result })
  }),
)
