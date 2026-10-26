import { z } from 'zod'

/**
 * Small building blocks shared by the form schemas (one schema file per screen).
 * Messages are always i18n keys, translated at the call site with zodErrorsToFieldMap.
 */

/** 24-hour time, HH:MM */
export const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/

/** A pragmatic e-mail check (the server is the final judge). */
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** A calendar date written YYYY-MM-DD that really exists (rejects 2027-02-31). */
export function isRealDate(value: string): boolean {
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (!m) return false
    const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
    return d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3])
}

/**
 * A whole number typed in a number input. `v-model.number` gives undefined before anything is
 * typed and '' once the field is emptied: both count as "missing".
 * @param keys.required message when nothing is typed
 * @param keys.invalid  message when it is not a whole number or is outside min/max
 */
export function wholeNumberField(keys: { required: string; invalid: string }, limits: { min?: number; max?: number } = {}) {
    let number = z.number({ error: (issue) => (issue.input === undefined ? keys.required : keys.invalid) }).int({ message: keys.invalid })
    if (limits.min !== undefined) number = number.min(limits.min, { message: keys.invalid })
    if (limits.max !== undefined) number = number.max(limits.max, { message: keys.invalid })
    return z.preprocess((v) => (v === '' || v === null ? undefined : v), number)
}

/** A required HH:MM time. */
export function timeField(keys: { required: string; invalid: string }) {
    return z.string().min(1, { message: keys.required }).regex(HH_MM, { message: keys.invalid })
}