import type { NextFunction, Request, Response } from 'express'

/**
 * Wraps an async route handler so any thrown/rejected error lands in the
 * central error handler. Every server boundary uses this — no naked awaits.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    fn(req, res, next).catch(next)
  }
}
