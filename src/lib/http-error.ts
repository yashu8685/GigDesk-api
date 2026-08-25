export class HttpError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'HttpError'
  }
}

export function badRequest(message: string): HttpError {
  return new HttpError(400, message)
}

export function unauthorized(message = 'Unauthorized'): HttpError {
  return new HttpError(401, message)
}

export function forbidden(message = 'Forbidden'): HttpError {
  return new HttpError(403, message)
}

export function notFound(message = 'Not found'): HttpError {
  return new HttpError(404, message)
}

export function conflict(message: string): HttpError {
  return new HttpError(409, message)
}
