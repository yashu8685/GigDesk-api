import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Must be a valid email'),
  password: z.string().min(1, 'Password is required'),
})

export type LoginInput = z.infer<typeof loginSchema>

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required').max(120),
  phone: z
    .string()
    .trim()
    .refine((v) => v === '' || /^\d{10}$/.test(v), {
      message: 'Phone must be a 10-digit number',
    })
    .optional(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
})

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().email('Must be a valid email'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
})

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
