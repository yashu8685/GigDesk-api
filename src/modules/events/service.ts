import { and, count, desc, eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { eventLog, jobs } from '../../db/schemas/index.js'
import type { ListEventsQuery } from './schemas.js'

export async function listEvents(query: ListEventsQuery) {
  const conditions = []
  if (query.type) conditions.push(eq(eventLog.type, query.type))
  if (query.jobId) conditions.push(eq(eventLog.jobId, query.jobId))
  if (query.status) conditions.push(eq(eventLog.status, query.status))
  const where = conditions.length > 0 ? and(...conditions) : undefined

  const [items, [totals]] = await Promise.all([
    db
      .select({
        id: eventLog.id,
        type: eventLog.type,
        jobId: eventLog.jobId,
        jobTitle: jobs.title,
        payload: eventLog.payload,
        status: eventLog.status,
        createdAt: eventLog.createdAt,
        processedAt: eventLog.processedAt,
      })
      .from(eventLog)
      .leftJoin(jobs, eq(eventLog.jobId, jobs.id))
      .where(where)
      .orderBy(desc(eventLog.createdAt))
      .limit(query.pageSize)
      .offset((query.page - 1) * query.pageSize),
    db.select({ value: count() }).from(eventLog).where(where),
  ])

  const total = totals!.value
  return { items, total, page: query.page, pageSize: query.pageSize, totalPages: Math.ceil(total / query.pageSize) }
}
