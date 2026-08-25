import { z } from 'zod'

export const presignSchema = z.object({
  kind: z.enum(['id-proof', 'completion-photo']),
  contentType: z.string().regex(/^image\/(jpeg|png|webp)$/, 'Only jpeg/png/webp images allowed'),
})

export type PresignInput = z.infer<typeof presignSchema>
