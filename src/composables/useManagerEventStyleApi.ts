import { client } from '../services/http.client'
import type { EventStyleDto, CreateEventStyleDto, UpdateEventStyleDto } from '../types/manager-event-style.types'

/**
 * Matches Management's real event-style.controller.ts exactly.
 * Note: findAll() returns a plain array, NOT a Datatable — the backend
 * has no pagination for this endpoint (confirmed directly from the
 * controller: `async findAll(): Promise<EventStyleDto[]>`).
 */
export function useManagerEventStyleApi() {
  function getAll(): Promise<EventStyleDto[]> {
    return client.get<EventStyleDto[]>('/event-styles').then(r => r.data)
  }

  function create(dto: CreateEventStyleDto): Promise<EventStyleDto> {
    return client.post<EventStyleDto>('/event-styles', dto).then(r => r.data)
  }

  function update(id: string, dto: UpdateEventStyleDto): Promise<EventStyleDto> {
    return client.patch<EventStyleDto>(`/event-styles/${id}`, dto).then(r => r.data)
  }

  function remove(id: string): Promise<void> {
    return client.delete(`/event-styles/${id}`).then(r => r.data)
  }

  function seedDefaults(): Promise<EventStyleDto[]> {
    return client.post<EventStyleDto[]>('/event-styles/seed-defaults').then(r => r.data)
  }

  return { getAll, create, update, remove, seedDefaults }
}