import { z } from 'zod'
import { wholeNumberField } from './helpers'

/**
 * Client-side validation for the Performance Order screen.
 *  - the pause/lunch window: a whole number of minutes, 1 or more; the label is optional
 *    (empty = "PAUSE 15 min" or "LUNCH");
 *  - the duration box of each entry on the board: the same rule (see entryDurationSchema).
 *
 * Every message is an i18n key under manager.performanceOrder.validation.*
 */
const K = 'manager.performanceOrder.validation.'

const duration = () =>
    wholeNumberField({ required: K + 'durationRequired', invalid: K + 'durationInvalid' }, { min: 1 })

export const pauseFormSchema = z.object({
    rowType: z.enum(['pause', 'lunch']),
    durationMinutes: duration(),
    label: z.string().trim(),
})

/** One entry's duration, as typed in its box on the board */
export const entryDurationSchema = duration()