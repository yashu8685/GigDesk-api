import type { Request } from 'express'

declare global {
  namespace Express {
    interface Request {
      adminId?: string
      workerId?: string
    }
  }
}

export type { Request }
