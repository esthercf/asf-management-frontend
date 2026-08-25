import { client } from '../services/http.client'
import { DatatableResult } from '../types/common.types'
import type {
  ActivityDto,
  CreateActivityDto,
  UpdateActivityDto,
  GetActivitiesFilterDto,
} from '../types/manager-activity.types'

/**
 * Matches Management's real activity.controller.ts exactly. Note the
 * query params are all individual @Query() args on the backend (not a
 * single DTO class) — page/limit default to '1'/'20' server-side if
 * omitted, confirmed directly from the controller.
 */
export function useManagerActivityApi() {
  function getFiltered(filters: GetActivitiesFilterDto = {}): Promise<DatatableResult<ActivityDto>> {
    const q = new URLSearchParams()
    if (filters.teacherEmail) q.set('teacherEmail', filters.teacherEmail)
    if (filters.teacherName) q.set('teacherName', filters.teacherName)
    if (filters.type) q.set('type', filters.type)
    if (filters.roomNumber !== undefined) q.set('roomNumber', String(filters.roomNumber))
    if (filters.studentEmail) q.set('studentEmail', filters.studentEmail)
    if (filters.fromDate) q.set('fromDate', filters.fromDate)
    if (filters.toDate) q.set('toDate', filters.toDate)
    q.set('page', String(filters.page ?? 1))
    q.set('limit', String(filters.limit ?? 20))
    return client.get<DatatableResult<ActivityDto>>(`/activities?${q}`).then(r => r.data)
  }

  function create(dto: CreateActivityDto): Promise<ActivityDto> {
    return client.post<ActivityDto>('/activities', dto).then(r => r.data)
  }

  function update(id: string, dto: UpdateActivityDto): Promise<ActivityDto> {
    return client.patch<ActivityDto>(`/activities/${id}`, dto).then(r => r.data)
  }

  function remove(id: string): Promise<void> {
    return client.delete(`/activities/${id}`).then(r => r.data)
  }

  return { getFiltered, create, update, remove }
}