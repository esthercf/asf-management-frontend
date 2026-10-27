import { z } from 'zod'
import { wholeNumberField } from './helpers'

/**
 * Client-side validation for the rule create/edit form of the Booking Limits screen.
 * It mirrors the backend (BookingLimitRuleDto: name, whole minutes and priority) and adds the
 * rules that stop a rule from being useless or confusing:
 *  - the name is unique among the rules (ignoring case), since the list tells rules apart by name;
 *  - minutes are 0 or more (0 = no booking that day); priority may be any whole number;
 *  - no contradictions: a tag in "all of" or "any of" and also in "none of", or a flag both
 *    required and forbidden, would make a rule that never matches anyone;
 *  - "exact match" needs at least one tag in "all of" (otherwise it means "users with no tags").
 *
 * @param otherNames names of the OTHER rules (leave out the one being edited)
 * Every message is an i18n key under manager.bookingLimits.validation.*
 */
const K = 'manager.bookingLimits.validation.'

const overlaps = (a: string[], b: string[]) => a.some((x) => b.includes(x))

export function bookingLimitRuleSchema(otherNames: string[]) {
    const taken = otherNames.map((n) => n.trim().toLowerCase())
    return z
        .object({
            name: z
                .string()
                .trim()
                .min(1, { message: K + 'nameRequired' })
                .refine((v) => !taken.includes(v.toLowerCase()), { message: K + 'nameTaken' }),
            maxMinutesPerDay: wholeNumberField({ required: K + 'minutesRequired', invalid: K + 'minutesInvalid' }, { min: 0 }),
            priority: wholeNumberField({ required: K + 'priorityRequired', invalid: K + 'priorityInvalid' }),
            active: z.boolean(),
            allOfBookingTypes: z.array(z.string()),
            anyOfBookingTypes: z.array(z.string()),
            noneOfBookingTypes: z.array(z.string()),
            exactMatch: z.boolean(),
            requiredFlags: z.array(z.string()),
            forbiddenFlags: z.array(z.string()),
            comments: z.string().optional(),
        })
        .superRefine((f, ctx) => {
            if (overlaps(f.allOfBookingTypes, f.noneOfBookingTypes) || overlaps(f.anyOfBookingTypes, f.noneOfBookingTypes)) {
                ctx.addIssue({ code: 'custom', message: K + 'tagsContradict', path: ['noneOfBookingTypes'] })
            }
            if (overlaps(f.requiredFlags, f.forbiddenFlags)) {
                ctx.addIssue({ code: 'custom', message: K + 'flagsContradict', path: ['forbiddenFlags'] })
            }
            if (f.exactMatch && f.allOfBookingTypes.length === 0) {
                ctx.addIssue({ code: 'custom', message: K + 'exactMatchNeedsTags', path: ['allOfBookingTypes'] })
            }
        })
}