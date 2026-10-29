import { z } from 'zod'

/**
 * Client-side validation for the create/edit form of the Event Styles screen.
 *  - name required, unique among the styles (ignoring case);
 *  - fill colour required, font colour optional: 6 hex digits. "#dadada" and "dadada" are accepted
 *    and saved as "DADADA" (the backend wants 6 digits, no "#").
 *
 * @param otherNames names of the OTHER styles (leave out the one being edited)
 * Every message is an i18n key under manager.eventStyles.validation.*
 */
const K = 'manager.eventStyles.validation.'
const HEX6 = /^[0-9A-F]{6}$/

/** " #dadada " → "DADADA" */
const normalizeHex = (v: string) => v.trim().replace(/^#/, '').toUpperCase()

export function eventStyleFormSchema(otherNames: string[]) {
    const taken = otherNames.map((n) => n.trim().toLowerCase())
    return z.object({
        name: z
            .string()
            .trim()
            .min(1, { message: K + 'nameRequired' })
            .refine((v) => !taken.includes(v.toLowerCase()), { message: K + 'nameTaken' }),
        fillColorHex: z
            .string()
            .transform(normalizeHex)
            .refine((v) => v !== '', { message: K + 'fillColorRequired' })
            .refine((v) => v === '' || HEX6.test(v), { message: K + 'colorInvalid' }),
        fontColorHex: z
            .string()
            .transform(normalizeHex)
            .refine((v) => v === '' || HEX6.test(v), { message: K + 'colorInvalid' }),
        bold: z.boolean(),
        isDefaultForActivities: z.boolean(),
    })
}