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

  // body-parser / express.json() JSON parse errors have status 400 and type entity.parse.failed
  if (
    error instanceof SyntaxError &&
    typeof (error as unknown as { status?: number }).status === 'number' &&
    (error as unknown as { status: number }).status === 400
  ) {
    const bodyParseError = error as unknown as { body?: string; type?: string }
    res.status(400).json({
      ok: false,
      error: 'Invalid JSON',
      message: error.message,
      body: bodyParseError.body,
      type: bodyParseError.type,
    })
    return
  }

  // jose JWT errors should be 401, not 500
  if (
    error instanceof Error &&
    (error.name === 'JWTExpired' ||
      error.name === 'JWSSignatureVerificationFailed' ||
      error.name === 'JWTInvalid' ||
      error.name === 'JWSInvalid' ||
      error.name === 'JOSEError' ||
      error.name === 'JWTClaimValidationFailed')
  ) {
    res.status(401).json({ ok: false, error: 'Invalid or expired token' })
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
