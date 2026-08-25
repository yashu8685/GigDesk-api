import { ZodError } from 'zod'
import type { NextFunction, Request, Response } from 'express'
import { HttpError } from '../lib/http-error.js'
import { env } from '../config/env.js'

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof HttpError) {
    res.status(error.status).json({ ok: false, error: error.message })
    return
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      ok: false,
      error: 'Validation failed',
      issues: error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      })),
    })
    return
  }

  console.error('[api.gigdesk] Unhandled error:', error)
  res.status(500).json({
    ok: false,
    error:
      env.NODE_ENV === 'production'
        ? 'Internal server error'
        : `Internal server error: ${error instanceof Error ? error.message : String(error)}`,
  })
}
