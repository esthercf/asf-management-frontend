import { client } from '../services/http.client'
import { ContestTypeEnum } from './useContestSettingsApi'

export enum PerformanceOrderRowTypeEnum {
  PERFORMANCE = 'performance',
  PAUSE = 'pause',
  LUNCH = 'lunch',
}

export enum PerformanceOrderStatusEnum {
  PENDING_VALIDATION = 'pending_validation',
  VALIDATED = 'validated',
}

export interface PerformanceOrderEntryDto {
  _id: string
  contestType: ContestTypeEnum
  round: string
  category: string | null
  position: number
  dayIndex: number | null
  dayDate: string | null
  rowType: PerformanceOrderRowTypeEnum
  studentId?: string
  accompanistId?: string
  stageDurationMinutes?: number
  durationMinutes?: number
  label?: string
  warmUpTime?: string | null
  readyTime?: string | null
  stageTime?: string | null
  status: PerformanceOrderStatusEnum
  hasConflict?: boolean
  studentFullName?: string | null
  studentCountryCode?: string | null
  studentTeacherName?: string | null
  accompanistFullName?: string | null
}

export interface OrderScope {
  contestType: ContestTypeEnum
  round: string
  category?: string | null
}

/**
 * Matches Management's real performance-order.controller.ts endpoints
 * exactly. dayIndex omitted from getFiltered() means "the unassigned
 * pool" — matches the entity's own null-means-unassigned convention.
 */
export function usePerformanceOrderApi() {
  function scopeQuery(scope: OrderScope): URLSearchParams {
    const q = new URLSearchParams({ contestType: scope.contestType, round: scope.round })
    if (scope.category) q.set('category', scope.category)
    return q
  }

  function generate(scope: OrderScope): Promise<PerformanceOrderEntryDto[]> {
    return client.post<PerformanceOrderEntryDto[]>('/performance-order/generate', scope).then(r => r.data)
  }

  function getFiltered(scope: OrderScope, dayIndex: number | null): Promise<PerformanceOrderEntryDto[]> {
    const q = scopeQuery(scope)
    if (dayIndex !== null) q.set('dayIndex', String(dayIndex))
    return client.get<PerformanceOrderEntryDto[]>(`/performance-order?${q}`).then(r => r.data)
  }

  function moveEntry(id: string, targetDayIndex: number | null, targetPosition: number): Promise<void> {
    const body: { targetDayIndex?: number; targetPosition: number } = { targetPosition }
    if (targetDayIndex !== null) body.targetDayIndex = targetDayIndex
    return client.patch(`/performance-order/${id}/move`, body).then(r => r.data)
  }

  function updateDuration(id: string, minutes: number): Promise<void> {
    return client.patch(`/performance-order/${id}/duration`, { minutes }).then(r => r.data)
  }

  function removeEntry(id: string): Promise<void> {
    return client.delete(`/performance-order/${id}`).then(r => r.data)
  }

  function validate(scope: OrderScope): Promise<void> {
    return client.post('/performance-order/validate', scope).then(r => r.data)
  }

  function unvalidate(scope: OrderScope): Promise<void> {
    return client.post('/performance-order/unvalidate', scope).then(r => r.data)
  }

  /**
   * Same blob-download pattern used for diplomas/schedules — the
   * endpoint returns a raw .xlsx stream, so axios needs
   * responseType: 'blob' rather than the shared client's normal JSON
   * handling.
   */
  async function exportDay(scope: OrderScope, dayIndex: number, fallbackFilename: string): Promise<void> {
    const q = new URLSearchParams()
    if (scope.category) q.set('category', scope.category)
    const response = await client.request({
      url: `/performance-order/export/${scope.contestType}/${scope.round}/${dayIndex}?${q}`,
      method: 'post',
      responseType: 'blob',
    })
    const blob = response.data as Blob
    const disposition = response.headers['content-disposition'] as string | undefined
    const match = disposition?.match(/filename="?([^"]+)"?/)
    const filename = match?.[1] ?? fallbackFilename

    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return { generate, getFiltered, moveEntry, updateDuration, removeEntry, validate, unvalidate, exportDay }
}