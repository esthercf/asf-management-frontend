import { z } from 'zod'

/**
 * Client-side validation for the "request a reset link" form —
 * presence + email format only.
 */
export const forgotPasswordSchema = z.object({
    email: z.string()
        .trim()
        .min(1, { message: 'common.validation.required' })
        .email({ message: 'common.validation.invalidEmail' }),
})

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>