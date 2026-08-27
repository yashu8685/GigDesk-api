import { z } from 'zod'

export const listPayoutsQuerySchema = z.object({
  status: z.enum(['pending', 'paid']).optional(),
  workerId: z.uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(15),
})

export const idParamSchema = z.object({
  id: z.uuid(),
})

export type ListPayoutsQuery = z.infer<typeof listPayoutsQuerySchema>
