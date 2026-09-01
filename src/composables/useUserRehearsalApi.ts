import { client } from '../services/http.client'

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

export function useUserRehearsalApi() {
  function saveRehearsal(studentId: string, payload: UserRehearsalPayload): Promise<void> {
    return client.put(`/user-rehearsals/${studentId}`, payload).then(r => r.data)
  }

  function deleteRehearsal(studentId: string): Promise<void> {
    return client.delete(`/user-rehearsals/${studentId}`).then(r => r.data)
  }

  function importFromExcel(file: File): Promise<ImportUserRehearsalsResult> {
    const formData = new FormData()
    formData.append('file', file)
    return client.post('/user-rehearsals/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  }

  return { saveRehearsal, deleteRehearsal, importFromExcel }
}