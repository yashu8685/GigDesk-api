import { z } from 'zod'

/** Accepts "+91 98001 10002" or "+919800110002" — always normalizes to "+91XXXXXXXXXX". */
export const phoneSchema = z
  .string()
  .trim()
  .transform((s) => s.replace(/\s+/g, ''))
  .pipe(z.string().regex(/^\+91\d{10}$/, 'Phone must be a valid +91 number'))

export const registerSchema = z.object({
  fullName: z.string().trim().min(3, 'Full name is required').max(120),
  phone: phoneSchema,
  city: z.string().trim().min(1, 'City is required').max(100),
  area: z.string().trim().min(1, 'Area is required').max(100),
  pincode: z.string().trim().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  idProofUrl: z.url('A valid ID proof URL is required'),
})

export const updateMeSchema = z.object({
  fullName: z.string().trim().min(3).max(120).optional(),
  city: z.string().trim().min(1).max(100).optional(),
  area: z.string().trim().min(1).max(100).optional(),
  pincode: z.string().trim().regex(/^\d{6}$/).optional(),
})

export const completeSchema = z.object({
  proofPhotoUrl: z.url('A completion photo URL is required — no proof, no completion'),
})

export const idParamSchema = z.object({
  id: z.uuid(),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type UpdateMeInput = z.infer<typeof updateMeSchema>
export type CompleteInput = z.infer<typeof completeSchema>
