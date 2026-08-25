import { z } from 'zod'

export const assignJobSchema = z.object({
  jobId: z.uuid(),
  workerId: z.uuid(),
})

export const idParamSchema = z.object({
  id: z.uuid('Assignment id must be a valid uuid'),
})

export type AssignJobInput = z.infer<typeof assignJobSchema>
