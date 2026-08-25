import type { NextFunction, Request, Response } from 'express'
import { jwtVerify } from 'jose'
import { env } from '../config/env.js'
import { unauthorized } from '../lib/http-error.js'

const secret = new TextEncoder().encode(env.AUTH_SECRET)

export async function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) {
      throw unauthorized('Missing bearer token')
    }
    const token = header.slice('Bearer '.length)
    const { payload } = await jwtVerify(token, secret)
    if (payload.role !== 'admin' || typeof payload.sub !== 'string') {
      throw unauthorized('Invalid token')
    }
    req.adminId = payload.sub
    next()
  } catch (error) {
    next(error)
  }
}
