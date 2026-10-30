import { z } from 'zod'
import { HH_MM, isRealDate, timeField } from './helpers'

/**
 * Client-side validation for the create/edit form of the Festival Events screen.
 *  - label required; date required and real;
 *  - start and end time required (HH:MM), end after start;
 *  - at least one "Applies To" category (the checkboxes only offer valid ones).
 * Type, location and style are optional or always set.
 *
 * Every message is an i18n key under manager.festivalEvents.validation.*
 */
const K = 'manager.festivalEvents.validation.'

export const festivalEventFormSchema = z
    .object({
        label: z.string().trim().min(1, { message: K + 'labelRequired' }),
        date: z
            .string()
            .min(1, { message: K + 'dateRequired' })
            .refine(isRealDate, { message: K + 'dateInvalid' }),
        startTimeStr: timeField({ required: K + 'startRequired', invalid: K + 'timeInvalid' }),
        endTimeStr: timeField({ required: K + 'endRequired', invalid: K + 'timeInvalid' }),
        appliesTo: z.array(z.string()).min(1, { message: K + 'appliesToRequired' }),
    })
    .refine((f) => !HH_MM.test(f.startTimeStr) || !HH_MM.test(f.endTimeStr) || f.endTimeStr > f.startTimeStr, {
        message: K + 'endAfterStart',
        path: ['endTimeStr'],
        when: () => true,
    })