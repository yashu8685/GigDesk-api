import { z } from 'zod'

export const listRequestsQuerySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  jobId: z.uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(15),
})

export const idParamSchema = z.object({
  id: z.uuid('Request id must be a valid uuid'),
})

export type ListRequestsQuery = z.infer<typeof listRequestsQuerySchema>
