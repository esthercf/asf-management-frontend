import { z } from 'zod'
import { EMAIL, HH_MM, timeField, wholeNumberField } from './helpers'

/**
 * Client-side validation for the rehearsal form inside the person's window of the Users screen.
 * It mirrors the backend (CreateOrUpdateUserRehearsalDto: whole room and day, HH:MM times, the
 * rest optional) plus the end-after-start rule the service applies, and two limits the server
 * does not have: a room number of at least 1, and a day between 1 and 31 (the day of the month).
 * An accompanist e-mail is optional, but when typed it must look like an e-mail: otherwise a typo
 * would silently save as a plain name with no link to the user.
 *
 * Every message is an i18n key under manager.users.rehearsal.validation.*
 */
const K = 'manager.users.rehearsal.validation.'

export const rehearsalFormSchema = z
    .object({
        category: z.string().min(1, { message: K + 'categoryRequired' }),
        artistEmail: z.string().trim().refine((v) => v === '' || EMAIL.test(v), { message: K + 'artistEmailInvalid' }),
        artistFullName: z.string(),
        roomNumber: wholeNumberField({ required: K + 'roomRequired', invalid: K + 'roomInvalid' }, { min: 1 }),
        day: wholeNumberField({ required: K + 'dayRequired', invalid: K + 'dayInvalid' }, { min: 1, max: 31 }),
        startTime: timeField({ required: K + 'startTimeRequired', invalid: K + 'timeInvalid' }),
        endTime: timeField({ required: K + 'endTimeRequired', invalid: K + 'timeInvalid' }),
        comments: z.string(),
    })
    .refine((f) => !HH_MM.test(f.startTime) || !HH_MM.test(f.endTime) || f.endTime > f.startTime, {
        message: K + 'endBeforeStart',
        path: ['endTime'],
    })