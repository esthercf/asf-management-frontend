import { z } from 'zod'
import { RoleType } from '../enums/roles.enum'
import { BookingTypeEnum } from '../enums/booking.enum'
import { CountryCode, GenderEnum, LanguageEnum, TshirtEnum } from '../enums/user.enum'

/**
 * Client-side validation for the create/edit person form of the Users screen. It mirrors the
 * backend (NewUserDto when creating, UpdateUserDto when editing): names and a valid e-mail are
 * required to create, and the date of birth is required for contestants only. Nothing is required
 * when EDITING (a contestant imported without a date must still be able to save other changes),
 * but whatever is filled in has to be valid. The address fields have no rules on the server, so
 * none here either.
 *
 * Every message is an i18n key under manager.users.validation.* — translate with
 * zodErrorsToFieldMap(result.error, t) at the call site.
 */
const K = 'manager.users.validation.'
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const EARLIEST_BIRTHDATE = Date.UTC(1900, 0, 1)

/** 'invalid' = not a real YYYY-MM-DD date; 'range' = in the future or before 1900; null = fine. */
function birthdateProblem(value: string): 'invalid' | 'range' | null {
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (!m) return 'invalid'
    const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
    if (d.getUTCMonth() !== Number(m[2]) - 1 || d.getUTCDate() !== Number(m[3])) return 'invalid'
    return d.getTime() < EARLIEST_BIRTHDATE || d.getTime() > Date.now() ? 'range' : null
}

/** @param opts.editing true when an existing person is being edited (the e-mail is fixed then) */
export const userFormSchema = (opts: { editing: boolean }) =>
    z
        .object({
            firstnames: z.string().trim().min(1, { message: K + 'firstnamesRequired' }),
            surnames: z.string().trim().min(1, { message: K + 'surnamesRequired' }),
            email: opts.editing
                ? z.string()
                : z.string().trim().min(1, { message: K + 'emailRequired' }).regex(EMAIL, { message: K + 'emailInvalid' }),
            folderCode: z.string(),
            phoneCode: z.string(),
            phoneNumber: z.string(),
            countryCode: z.nativeEnum(CountryCode, { message: K + 'chooseOption' }),
            language: z.nativeEnum(LanguageEnum, { message: K + 'chooseOption' }),
                birthdate: z.string(),
      notes: z.string().max(500, { message: K + 'notesTooLong' }),
            gender: z.nativeEnum(GenderEnum, { message: K + 'chooseOption' }),
            tshirtEnum: z.nativeEnum(TshirtEnum, { message: K + 'chooseOption' }),
            role: z.nativeEnum(RoleType, { message: K + 'chooseOption' }),
            bookingTypeEnum: z.array(z.nativeEnum(BookingTypeEnum)),
            addressLine: z.string(),
            locality: z.string(),
            addressCountry: z.string(),
            zipCode: z.string(),
            gdpr: z.boolean(),
        })
        .superRefine((f, ctx) => {
            if (f.birthdate === '') {
                if (!opts.editing && f.role === RoleType.Contestant) {
                    ctx.addIssue({ code: 'custom', path: ['birthdate'], message: K + 'birthdateRequired' })
                }
                return
            }
            const problem = birthdateProblem(f.birthdate)
            if (problem) ctx.addIssue({ code: 'custom', path: ['birthdate'], message: K + (problem === 'invalid' ? 'birthdateInvalid' : 'birthdateRange') })
        })