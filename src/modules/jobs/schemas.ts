import { z } from 'zod'

export const createJobSchema = z.object({
  title: z.string().trim().min(3, 'Title is required').max(200),
  description: z.string().trim().max(2000).default(''),
  city: z.string().trim().min(1, 'City is required').max(100),
  district: z.string().trim().min(1).max(100).optional(),
  area: z.string().trim().min(1, 'Area is required').max(100),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  payAmountInr: z.coerce.number().int().positive('Pay must be positive'),
  deadline: z.coerce.date().refine((d) => d.getTime() > Date.now(), { message: 'Deadline must be in the future' }),
})

export const listJobsQuerySchema = z.object({
  status: z.enum(['open', 'assigned', 'completed', 'cancelled']).optional(),
  city: z.string().trim().min(1).max(100).optional(),
  district: z.string().trim().min(1).max(100).optional(),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Pincode must be 6 digits')
    .optional(),
  search: z.string().trim().max(200).optional(),
  workerId: z.uuid().optional(),
  assignedWorkerId: z.uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(15),
})

export const idParamSchema = z.object({
  id: z.uuid('Job id must be a valid uuid'),
})

export const cancelJobSchema = z.object({
  reason: z.string().trim().min(1, 'Reason is required').max(500),
})

export type CreateJobInput = z.infer<typeof createJobSchema>
export type ListJobsQuery = z.infer<typeof listJobsQuerySchema>
export type CancelJobInput = z.infer<typeof cancelJobSchema>
