
import type { AxiosError } from 'axios'

export interface BackendError {
    code: string
    message: string
    context?: Record<string, any>
}

export function extractErrorMessage(e: unknown, fallback = 'Something went wrong.'): string {
    const err = e as AxiosError<BackendError>
    return err.response?.data?.message ?? fallback
}