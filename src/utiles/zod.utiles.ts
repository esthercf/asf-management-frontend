import type { ZodError } from 'zod'

/**
 * Converts a failed Zod parse result into a flat { fieldPath: message } map,
 * suitable for showing inline under each form field.
 *
 * Each schema's issue `message` is expected to be an i18n key (see e.g.
 * validation/room.schema.ts) — translation happens here via the `t` you
 * pass in, rather than this helper calling useI18n() itself, since
 * useI18n() can only be called during component setup, not later inside
 * an event handler where validation actually runs.
 */
export function zodErrorsToFieldMap(
  error: ZodError,
  t: (key: string) => string,
): Record<string, string> {
  const map: Record<string, string> = {}
  for (const issue of error.issues) {
    const field = issue.path.join('.')
    if (!map[field]) {
      map[field] = t(issue.message)
    }
  }
  return map
}