import { z } from 'zod'

export const listEventsQuerySchema = z.object({
  type: z.string().trim().max(100).optional(),
  jobId: z.uuid().optional(),
  status: z.enum(['pending', 'processed']).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(30),
})

export type ListEventsQuery = z.infer<typeof listEventsQuerySchema>
