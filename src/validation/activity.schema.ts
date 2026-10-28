import { z } from 'zod'
import { EMAIL, HH_MM, isRealDate, timeField, wholeNumberField } from './helpers'

/**
 * Client-side validation for the create/edit form of the Activities screen.
 *  - create only (teacher and type can't change afterwards): teacher name required; teacher email
 *    must look like an email, and is REQUIRED for a masterclass (purchases find it by that email);
 *  - date required and real; start time HH:MM; duration a whole number of minutes, 1 or more;
 *  - the activity must end the same day (not after 24:00);
 *  - student email (not for masterclasses, whose student comes from the purchase): an email if given.
 * The room is optional. Whether a masterclass clashes with another one is checked by the backend.
 *
 * @param isCreate true for "New activity", false when editing
 * Every message is an i18n key under manager.activities.validation.*
 */
const K = 'manager.activities.validation.'
const MASTERCLASS = 'masterclass'

export function activityFormSchema(isCreate: boolean) {
    return z
        .object({
            type: z.string(),
            teacherRawName: z.string().trim(),
            teacherEmail: z.string().trim(),
            date: z
                .string()
                .min(1, { message: K + 'dateRequired' })
                .refine(isRealDate, { message: K + 'dateInvalid' }),
            startTimeStr: timeField({ required: K + 'startRequired', invalid: K + 'timeInvalid' }),
            durationMinutes: wholeNumberField({ required: K + 'durationRequired', invalid: K + 'durationInvalid' }, { min: 1 }),
            studentEmail: z.string().trim(),
        })
        .superRefine((f, ctx) => {
            if (isCreate) {
                if (!f.teacherRawName) {
                    ctx.addIssue({ code: 'custom', message: K + 'teacherNameRequired', path: ['teacherRawName'] })
                }
                if (f.teacherEmail && !EMAIL.test(f.teacherEmail)) {
                    ctx.addIssue({ code: 'custom', message: K + 'emailInvalid', path: ['teacherEmail'] })
                } else if (!f.teacherEmail && f.type === MASTERCLASS) {
                    ctx.addIssue({ code: 'custom', message: K + 'teacherEmailRequiredMasterclass', path: ['teacherEmail'] })
                }
            }
            if (f.type !== MASTERCLASS && f.studentEmail && !EMAIL.test(f.studentEmail)) {
                ctx.addIssue({ code: 'custom', message: K + 'emailInvalid', path: ['studentEmail'] })
            }
        })
        .refine((f) => {
            if (!HH_MM.test(f.startTimeStr) || typeof f.durationMinutes !== 'number') return true
            const [h, m] = f.startTimeStr.split(':').map(Number)
            return h * 60 + m + f.durationMinutes <= 24 * 60
        }, { message: K + 'endsNextDay', path: ['durationMinutes'], when: () => true })
}