import { z } from 'zod'

/** Accepts "9800110002", "+91 98001 10002" or "+919800110002" — always normalizes to "+91XXXXXXXXXX". */
export const phoneSchema = z
  .string()
  .trim()
  .transform((s) => s.replace(/\s+/g, '').replace(/^0+/, ''))
  .transform((s) => (s.startsWith('+91') ? s : s.startsWith('91') && s.length === 12 ? `+${s}` : `+91${s.slice(-10)}`))
  .pipe(z.string().regex(/^\+91\d{10}$/, 'Phone must be a valid +91 number (10 digits, optionally with +91)'))

export const registerSchema = z.object({
  // Flutter sends surname + name; we accept either combined fullName or parts
  fullName: z.string().trim().min(3, 'Full name is required').max(120).optional(),
  surname: z.string().trim().min(1).max(60).optional(),
  name: z.string().trim().min(1).max(60).optional(),
  phone: phoneSchema,
  mobile: phoneSchema.optional(),
  email: z.string().trim().email('Invalid email').max(120).optional().or(z.literal('')),
  city: z.string().trim().min(1).max(100).optional(),
  district: z.string().trim().max(100).optional().or(z.literal('')),
  area: z.string().trim().min(1).max(100).optional(),
  pincode: z.string().trim().regex(/^\d{6}$/, 'Pincode must be 6 digits').optional(),
  address: z.string().trim().max(500).optional().or(z.literal('')),
  idProofUrl: z.url('A valid ID proof URL is required').optional(),
  aadhaarUrl: z.url().optional(),
  idProofKey: z.string().trim().min(1).optional(),
  profilePhotoUrl: z.url().optional().or(z.literal('')),
  drivingLicenseUrl: z.url().optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  const fullName = data.fullName ?? [data.surname, data.name].filter(Boolean).join(' ').trim()
  if (!fullName || fullName.length < 3) {
    ctx.addIssue({ code: 'custom', path: ['fullName'], message: 'Full name (or surname+name) is required' })
  }
  const idUrl = data.idProofUrl ?? data.aadhaarUrl ?? data.idProofKey
  if (!idUrl) {
    ctx.addIssue({ code: 'custom', path: ['idProofUrl'], message: 'Aadhaar/ID proof is required' })
  }
  if (!data.pincode && !data.address) {
    ctx.addIssue({ code: 'custom', path: ['pincode'], message: 'Pincode or address is required' })
  }
})

export const updateMeSchema = z.object({
  fullName: z.string().trim().min(3).max(120).optional(),
  city: z.string().trim().min(1).max(100).optional(),
  district: z.string().trim().max(100).optional().or(z.literal('')),
  area: z.string().trim().min(1).max(100).optional(),
  pincode: z.string().trim().regex(/^\d{6}$/).optional(),
  address: z.string().trim().max(500).optional(),
  isAvailable: z.boolean().optional(),
  lastLat: z.number().min(-90).max(90).optional(),
  lastLng: z.number().min(-180).max(180).optional(),
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
