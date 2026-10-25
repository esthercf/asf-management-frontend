import { z } from 'zod'

/**
 * Client-side validation for the four forms of the Contest Settings screen. It mirrors the backend
 * (CreateRoundDto, CreateCategoryConfigDto, ContestRoundDayDto) and adds a few sensible rules the
 * server does not enforce: no two rounds with the same name (rounds are found by name), and an end
 * time that comes after the start time.
 *
 * Every message is an i18n key under manager.contestSettings.validation.* — translate with
 * zodErrorsToFieldMap(result.error, t) at the call site.
 */
const K = 'manager.contestSettings.validation.'
const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/

/** A calendar date written YYYY-MM-DD that really exists (rejects 2027-02-31). */
const isRealDate = (value: string): boolean => {
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return false
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  return d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3])
}

/** A whole number; an emptied number field (v-model.number gives '') counts as "missing". */
const wholeNumber = (min: number, minKey: string) =>
  z.preprocess(
    (v) => (v === '' || v === null ? undefined : v),
    z.number({ error: (issue) => (issue.input === undefined ? K + 'numberRequired' : K + 'numberInvalid') })
      .int({ message: K + 'numberInteger' })
      .min(min, { message: minKey }),
  )

export const contestNameSchema = z.object({
  contestName: z.string().trim().max(100, { message: K + 'nameTooLong' }),
})

/** @param existingNames the rounds this contest already has (a round is found by its name) */
export const roundFormSchema = (existingNames: string[]) =>
  z.object({
    name: z.string().trim()
      .min(1, { message: K + 'roundNameRequired' })
      .max(80, { message: K + 'roundNameTooLong' })
      .refine((n) => !existingNames.some((e) => e.trim().toLowerCase() === n.toLowerCase()), { message: K + 'roundNameDuplicate' }),
  })

/** @param requireCategory true when a Youth category has to be chosen (creating, not editing) */
export const categoryConfigSchema = (opts: { requireCategory: boolean }) =>
  z.object({
    category: opts.requireCategory ? z.string().min(1, { message: K + 'categoryRequired' }) : z.string(),
    venue: z.string().trim().min(1, { message: K + 'venueRequired' }),
    pieces: z.array(z.string()).refine((p) => p.some((x) => x.trim() !== ''), { message: K + 'pieceRequired' }),
    defaultWarmUpOffsetMinutes: wholeNumber(0, K + 'minZero'),
    defaultReadyOffsetMinutes: wholeNumber(0, K + 'minZero'),
    defaultStageDurationMinutes: wholeNumber(1, K + 'minOne'),
    defaultPauseEveryNPerformances: wholeNumber(1, K + 'minOne'),
    defaultPauseDurationMinutes: wholeNumber(0, K + 'minZero'),
  })

export const contestDaySchema = z
  .object({
    date: z.string().min(1, { message: K + 'dateRequired' }).refine(isRealDate, { message: K + 'dateInvalid' }),
    startTime: z.string().min(1, { message: K + 'startTimeRequired' }).regex(HH_MM, { message: K + 'timeInvalid' }),
    endTime: z.string().refine((v) => v === '' || HH_MM.test(v), { message: K + 'timeInvalid' }),
    morningAccompanistId: z.string(),
    afternoonAccompanistId: z.string(),
  })
  .refine((d) => !d.endTime || !HH_MM.test(d.startTime) || !HH_MM.test(d.endTime) || d.endTime > d.startTime, {
    message: K + 'endBeforeStart',
    path: ['endTime'],
  })