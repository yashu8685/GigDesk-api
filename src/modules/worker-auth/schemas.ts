import { z } from 'zod'

/** Accepts "9800110002", "+91 98001 10002" or "+919800110002" — always normalizes to "+91XXXXXXXXXX". */
export const phoneSchema = z
  .string()
  .trim()
  .transform((s) => s.replace(/\s+/g, '').replace(/^0+/, ''))
  .transform((s) => (s.startsWith('+91') ? s : s.startsWith('91') && s.length === 12 ? `+${s}` : `+91${s.slice(-10)}`))
  .pipe(z.string().regex(/^\+91\d{10}$/, 'Phone must be a valid +91 number (10 digits, optionally with +91)'))

export const otpRequestSchema = z.object({
  phone: phoneSchema,
})

export const otpVerifySchema = z.object({
  phone: phoneSchema,
  code: z.string().trim().regex(/^\d{6}$/, 'Code must be 6 digits'),
})

export type OtpRequestInput = z.infer<typeof otpRequestSchema>
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>
