import { z } from 'zod'

/**
 * Client-side validation for the login form. Deliberately only checks
 * presence + email format — NOT password strength. Strength rules apply
 * when a password is being *set* (reset-password form), not when an
 * existing password is being used to log in; a user's real password may
 * predate today's strength rules, and login must still accept it.
 */
export const loginSchema = z.object({
    email: z.string()
        .trim()
        .min(1, { message: 'common.validation.required' })
        .email({ message: 'common.validation.invalidEmail' }),
    password: z.string()
        .min(1, { message: 'common.validation.required' }),
})

export type LoginValues = z.infer<typeof loginSchema>