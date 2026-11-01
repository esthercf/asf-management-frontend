
import { z } from 'zod'
import { HH_MM, isRealDate, timeField, wholeNumberField } from './helpers'

/**
 * Client-side validation for the Rehearsals screen.
 * boardSettingsSchema — a board's settings: rehearsal days (real date + HH:MM start, no date twice),
 * minutes per student and pause length (whole, ≥ 1), and an optional default room (whole, ≥ 1).
 *
 * Every message is an i18n key under manager.rehearsalOrder.validation.*
 */
const K = 'manager.rehearsalOrder.validation.'

const daySchema = z.object({
    date: z
        .string()
        .min(1, { message: K + 'dateRequired' })
        .refine(isRealDate, { message: K + 'dateInvalid' }),
    startTime: timeField({ required: K + 'startRequired', invalid: K + 'timeInvalid' }),
})

export const boardSettingsSchema = z
    .object({
        days: z.array(daySchema),
        defaultSlotMinutes: wholeNumberField({ required: K + 'minutesRequired', invalid: K + 'minutesInvalid' }, { min: 1 }),
        defaultPauseMinutes: wholeNumberField({ required: K + 'minutesRequired', invalid: K + 'minutesInvalid' }, { min: 1 }),
        // Optional: empty = no default room
        defaultRoomNumber: z.preprocess(
            (v) => (v === '' || v === null || v === undefined ? null : v),
            z.number({ message: K + 'roomInvalid' }).int({ message: K + 'roomInvalid' }).min(1, { message: K + 'roomInvalid' }).nullable(),
        ),
        rehearsalCategory: z.string(), // '' = empty (see the board's settings)
    })
    .superRefine((f, ctx) => {
        // The same date only once (the message goes on its second appearance)
        const seen = new Set<string>()
        f.days.forEach((d, i) => {
            if (!d.date || !HH_MM.test(d.startTime)) return
            if (seen.has(d.date)) ctx.addIssue({ code: 'custom', message: K + 'dateTwice', path: ['days', i, 'date'] })
            seen.add(d.date)
        })
    })


/**
 * The details window of one row. Student rows: minutes, pianist (none / from the list / typed name),
 * room (optional), piece (optional). Pauses: minutes and label. The chosen pianist option needs its value.
 */
export const rowFormSchema = z
    .object({
        isPause: z.boolean(),
        durationMinutes: wholeNumberField({ required: K + 'minutesRequired', invalid: K + 'minutesInvalid' }, { min: 1 }),
        pianistChoice: z.enum(['none', 'user', 'name']),
        accompanistId: z.string(),
        accompanistName: z.string().trim().max(100, { message: K + 'pianistNameTooLong' }),
        roomNumber: z.preprocess(
            (v) => (v === '' || v === null || v === undefined ? null : v),
            z.number({ message: K + 'roomInvalid' }).int({ message: K + 'roomInvalid' }).min(1, { message: K + 'roomInvalid' }).nullable(),
        ),
        piece: z.string().trim().max(200, { message: K + 'pieceTooLong' }),
        label: z.string().trim().max(60, { message: K + 'labelTooLong' }),
    })
    .superRefine((f, ctx) => {
        if (f.isPause) return
        if (f.pianistChoice === 'user' && !f.accompanistId) {
            ctx.addIssue({ code: 'custom', message: K + 'pianistUserRequired', path: ['accompanistId'] })
        }
        if (f.pianistChoice === 'name' && !f.accompanistName) {
            ctx.addIssue({ code: 'custom', message: K + 'pianistNameRequired', path: ['accompanistName'] })
        }
    })