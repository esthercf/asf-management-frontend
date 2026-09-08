import { client } from '../services/http.client'
import { DatatableResult } from '../types/common.types'

export interface UserRehearsalPayload {
  artistEmail?: string
  artistFullName?: string
  roomNumber: number
  day: number
  startTime: string
  endTime: string
  comments?: string
}

export interface ImportUserRehearsalsResult {
  total: number
  succeeded: number
  failed: number
  errors: { row: number; reason: string }[]
  message: string
}

export interface UserRehearsalDto {
  _id: string
  studentId: string
  studentEmail: string
  studentFullName?: string | null
  artistId?: string | null
  artistEmail?: string
  artistFullName: string
  roomId?: string | null
  roomNumber: number
  day: number
  startTime: string
  endTime: string
  comments?: string
  category: string
}

export interface GetRehearsalsFilter {
  studentEmail?: string
  artistEmail?: string
  roomNumber?: number
  day?: number
  page?: number
  limit?: number
}

export function useUserRehearsalApi() {
  function getFiltered(filter: GetRehearsalsFilter = {}): Promise<DatatableResult<UserRehearsalDto>> {
    const q = new URLSearchParams()
    if (filter.studentEmail) q.set('studentEmail', filter.studentEmail)
    if (filter.artistEmail) q.set('artistEmail', filter.artistEmail)
    if (filter.roomNumber !== undefined) q.set('roomNumber', String(filter.roomNumber))
    if (filter.day !== undefined) q.set('day', String(filter.day))
    q.set('page', String(filter.page ?? 1))
    q.set('limit', String(filter.limit ?? 20))
    return client.get<DatatableResult<UserRehearsalDto>>(`/user-rehearsals?${q}`).then(r => r.data)
  }

  /** @deprecated superseded by createRehearsal()/updateRehearsal(), which are category-aware. */
  function saveRehearsal(studentId: string, payload: UserRehearsalPayload): Promise<void> {
    return client.put(`/user-rehearsals/${studentId}`, payload).then(r => r.data)
  }

  /** @deprecated superseded by deleteRehearsal(studentId, category). */
  function deleteRehearsalLegacy(studentId: string): Promise<void> {
    return client.delete(`/user-rehearsals/${studentId}`).then(r => r.data)
  }

  function createRehearsal(studentId: string, category: string, payload: UserRehearsalPayload): Promise<void> {
    return client.post(`/user-rehearsals/${studentId}/${category}`, payload).then(r => r.data)
  }

  function updateRehearsal(studentId: string, category: string, payload: UserRehearsalPayload): Promise<void> {
    return client.put(`/user-rehearsals/${studentId}/${category}`, payload).then(r => r.data)
  }
  function deleteRehearsal(studentId: string, category: string): Promise<void> {
    return client.delete(`/user-rehearsals/${studentId}/${category}`).then(r => r.data)
  }

  function importFromExcel(file: File): Promise<ImportUserRehearsalsResult> {
    const formData = new FormData()
    formData.append('file', file)
    return client.post('/user-rehearsals/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  }

  return { getFiltered, saveRehearsal, deleteRehearsalLegacy, createRehearsal, updateRehearsal, deleteRehearsal, importFromExcel }
}