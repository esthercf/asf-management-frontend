import { client } from '../services/http.client'
import type {
  FestivalEventDto,
  CreateFestivalEventDto,
  UpdateFestivalEventDto,
  GetFestivalEventsFilterDto,
} from '../types/manager-festival-event.types'

export interface ImportFestivalEventsResult {
  message: string
  total: number
  succeeded: number
  errors: { rowNumber: number; message: string }[]
}

/**
 * Matches Management's real festival-event.controller.ts exactly.
 * No pagination on this endpoint (confirmed directly from the
 * controller — findFiltered returns a plain array).
 */
export function useManagerFestivalEventApi() {
  function getFiltered(filters: GetFestivalEventsFilterDto = {}): Promise<FestivalEventDto[]> {
    const q = new URLSearchParams()
    if (filters.date) q.set('date', filters.date)
    if (filters.eventType) q.set('eventType', filters.eventType)
    if (filters.appliesTo) q.set('appliesTo', filters.appliesTo)
    if (filters.location) q.set('location', filters.location)
    return client.get<FestivalEventDto[]>(`/festival-events?${q}`).then(r => r.data)
  }

  function create(dto: CreateFestivalEventDto): Promise<FestivalEventDto> {
    return client.post<FestivalEventDto>('/festival-events', dto).then(r => r.data)
  }

  function update(id: string, dto: UpdateFestivalEventDto): Promise<FestivalEventDto> {
    return client.patch<FestivalEventDto>(`/festival-events/${id}`, dto).then(r => r.data)
  }

  function remove(id: string): Promise<void> {
    return client.delete(`/festival-events/${id}`).then(r => r.data)
  }

  function importFromExcel(file: File): Promise<ImportFestivalEventsResult> {
    const formData = new FormData()
    formData.append('file', file)
    return client.post<ImportFestivalEventsResult>('/festival-events/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  }

  return { getFiltered, create, update, remove, importFromExcel }
}