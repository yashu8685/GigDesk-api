import { z } from 'zod'

export const listWorkersQuerySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  city: z.string().trim().min(1).max(100).optional(),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Pincode must be 6 digits')
    .optional(),
  search: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
})

export const idParamSchema = z.object({
  id: z.uuid('Worker id must be a valid uuid'),
})

export const reviewSchema = z
  .object({
    decision: z.enum(['approve', 'reject']),
    reason: z.string().trim().max(500).optional(),
  })
  .refine(
    (v) => v.decision !== 'reject' || (v.reason !== undefined && v.reason !== ''),
    { message: 'Reason is required when rejecting', path: ['reason'] },
  )

export type ListWorkersQuery = z.infer<typeof listWorkersQuerySchema>
export type ReviewInput = z.infer<typeof reviewSchema>
