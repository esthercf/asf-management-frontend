import { z } from 'zod'
import { isRealDate } from './helpers'

/**
 * Client-side validation for the create/edit form of the Masterclass Purchases screen.
 *  - create: a student must be picked; "purchased at" is optional but real and not in the future;
 *  - price (optional): 0 or more, at most 2 decimals;
 *  - currency (optional): 3 letters, stored in capitals (EUR);
 *  - a cancelled purchase can't take a masterclass (cancelling is what frees one).
 * The masterclass itself is optional (without one the purchase stays pending); whether it is
 * still free is checked by the backend.
 *
 * @param isCreate           true for "New purchase", false when editing
 * @param currentActivityId  the masterclass the edited purchase already has (keeping it is fine)
 * Every message is an i18n key under manager.purchases.validation.*
 */
const K = 'manager.purchases.validation.'

/** Today as YYYY-MM-DD in the browser's own time zone */
function today(): string {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function purchaseFormSchema(isCreate: boolean, currentActivityId?: string) {
    return z
        .object({
            studentEmail: z.string(),
            activityId: z.string(),
            status: z.string(),
            price: z.preprocess(
                (v) => (v === '' || v === null ? undefined : v),
                z
                    .number({ message: K + 'priceInvalid' })
                    .min(0, { message: K + 'priceInvalid' })
                    .refine((n) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-6, { message: K + 'priceInvalid' })
                    .optional(),
            ),
            currency: z
                .string()
                .trim()
                .transform((v) => v.toUpperCase())
                .refine((v) => v === '' || /^[A-Z]{3}$/.test(v), { message: K + 'currencyInvalid' }),
            orderReference: z.string().trim(),
            purchasedAt: z
                .string()
                .refine((v) => v === '' || isRealDate(v), { message: K + 'purchasedAtInvalid' })
                .refine((v) => v === '' || v <= today(), { message: K + 'purchasedAtFuture' }),
            comments: z.string(),
        })
        .superRefine((f, ctx) => {
            if (isCreate && !f.studentEmail) {
                ctx.addIssue({ code: 'custom', message: K + 'studentRequired', path: ['studentEmail'] })
            }
            if (f.status === 'cancelled' && f.activityId && f.activityId !== currentActivityId) {
                ctx.addIssue({ code: 'custom', message: K + 'cancelledNoMasterclass', path: ['activityId'] })
            }
        })
}