import cors from 'cors'
import express from 'express'
import { env } from './config/env.js'
import { errorHandler } from './middleware/error-handler.js'
import { requireAdmin } from './middleware/require-admin.js'
import { requireWorker } from './middleware/require-worker.js'
import { assignmentsRouter } from './modules/assignments/routes.js'
import { authRouter } from './modules/auth/routes.js'
import { eventsRouter } from './modules/events/routes.js'
import { jobsRouter } from './modules/jobs/routes.js'
import { metaRouter } from './modules/meta/routes.js'
import { payoutsRouter } from './modules/payouts/routes.js'
import { requestsRouter } from './modules/requests/routes.js'
import { summaryRouter } from './modules/summary/routes.js'
import { uploadsRouter } from './modules/uploads/routes.js'
import { workerAuthRouter } from './modules/worker-auth/routes.js'
import { workerRouter } from './modules/worker/routes.js'
import { workersRouter } from './modules/workers/routes.js'
import { healthRouter } from './routes/health.js'

export function createApp() {
  const app = express()

  app.use(
    cors({
      origin: env.CORS_ORIGINS,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    }),
  )
  app.use(express.json({ limit: '1mb' }))

  // Public
  app.use('/health', healthRouter)
  app.use('/auth', authRouter)
  app.use('/worker', workerAuthRouter) // otp/request, otp/verify
  app.use('/uploads', uploadsRouter)

  // Worker app (JWT role: worker)
  app.use('/worker', requireWorker)
  app.use('/worker', workerRouter)

  // Admin web (JWT role: admin)
  app.use('/admin', requireAdmin)
  app.use('/admin/workers', workersRouter)
  app.use('/admin/jobs', jobsRouter)
  app.use('/admin/requests', requestsRouter)
  app.use('/admin/assignments', assignmentsRouter)
  app.use('/admin/payouts', payoutsRouter)
  app.use('/admin/events', eventsRouter)
  app.use('/admin/summary', summaryRouter)
  app.use('/admin/meta', metaRouter)

  app.use(errorHandler)
  return app
}
