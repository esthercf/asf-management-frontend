
import type { AxiosError } from 'axios'
import { i18n } from '../i18n'

export interface BackendError {
    code: string
    message: string
    context?: Record<string, any>
}


export interface BackendError {
  code: string
  message: string
  context?: Record<string, any>
}

/**
 * Maps a backend error code (or known HTTP status) to a translated message.
 * Falls back to the backend's raw message, then to a generic translated fallback.
 */
export function extractErrorMessage(e: unknown): string {
  const { t } = i18n.global

  // Network error (no response at all — backend unreachable)
  const err = e as AxiosError<BackendError>
  if (!err?.response) {
    return t('errors.NetworkError')
  }

  const status = err.response.status
  const code = err.response.data?.code

  // 1. Try exact backend error code first (most specific)
  if (code && i18n.global.te(`errors.${code}`)) {
    return t(`errors.${code}`)
  }

  // 2. Fall back to HTTP status-based generic messages
  if (status === 401) return t('errors.Unauthorized')
  if (status === 403) return t('errors.Forbidden')
  if (status === 404) return t('errors.NotFound')

  // 3. Fall back to whatever message the backend sent raw (untranslated, last resort)
  if (err.response.data?.message) {
    return err.response.data.message
  }

  // 4. Total fallback
  return t('errors.Unknown')
}