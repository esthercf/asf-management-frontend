import { z } from 'zod'
import { HH_MM, isRealDate, timeField } from './helpers'

/**
 * Client-side validation for the day create/edit form of the Day Schedules screen.
 * It mirrors the backend (UpdateDayScheduleSlotsDto: at least one slot, HH:MM times) and adds
 * the rules that keep a day sensible: a real date, every slot ending after it starts, and no two
 * slots of the same day overlapping (a pause between slots is fine, touching slots too).
 * The date check only matters on create: on edit the date input is read-only.
 *
 * Every message is an i18n key under manager.daySchedules.validation.*
 */
const K = 'manager.daySchedules.validation.'

const slotSchema = z
    .object({
        start: timeField({ required: K + 'startRequired', invalid: K + 'timeInvalid' }),
        end: timeField({ required: K + 'endRequired', invalid: K + 'timeInvalid' }),
    })
    .refine((s) => !HH_MM.test(s.start) || !HH_MM.test(s.end) || s.end > s.start, {
        message: K + 'endBeforeStart',
        path: ['end'],
        when: () => true,
    })

export const dayScheduleFormSchema = z
    .object({
        date: z
            .string()
            .min(1, { message: K + 'dateRequired' })
            .refine(isRealDate, { message: K + 'dateInvalid' }),
        slots: z.array(slotSchema).min(1, { message: K + 'slotsRequired' }),
    })
    .superRefine((f, ctx) => {
        // Compare only the complete, well-ordered slots: the others already have their own message.
        const valid = f.slots
            .map((s, index) => ({ ...s, index }))
            .filter((s) => HH_MM.test(s.start) && HH_MM.test(s.end) && s.end > s.start)
            .sort((a, b) => a.start.localeCompare(b.start))
        for (let i = 1; i < valid.length; i++) {
            if (valid[i].start < valid[i - 1].end) {
                ctx.addIssue({ code: 'custom', message: K + 'overlap', path: ['slots', valid[i].index, 'start'] })
            }
        }
    })

export type DayScheduleFormValues = z.infer<typeof dayScheduleFormSchema>