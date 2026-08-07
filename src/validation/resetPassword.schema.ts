import { z } from 'zod'

/**
 * Client-side validation for the "set new password" step of the password
 * reset flow. Mirrors the backend's strength rule (enforced there only in
 * non-local environments) — enforced here unconditionally so users always
 * get clear, immediate, per-field feedback instead of a failed API call.
 *
 * Note: unlike the old hand-rolled check, an empty password is reported as
 * "too short" rather than a separate "required" message — Zod's min-length
 * check naturally covers both cases with one message, which is simpler and
 * still clear for the user.
 */
const passwordRules = z.string()
  .min(8, { message: 'common.validation.passwordTooShort' })
  .regex(/[A-Z]/, { message: 'common.validation.passwordNeedsUppercase' })
  .regex(/[a-z]/, { message: 'common.validation.passwordNeedsLowercase' })
  .regex(/\d/, { message: 'common.validation.passwordNeedsNumber' })
  .regex(/[@#$!%*?&]/, { message: 'common.validation.passwordNeedsSpecial' })

export const resetPasswordSchema = z
  .object({
    password: passwordRules,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'common.validation.passwordMismatch',
    path: ['confirmPassword'],
  })

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>