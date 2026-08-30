import { client } from '../services/http.client'

export interface UserRehearsalPayload {
  artistEmail?: string
  artistFullName?: string
  roomNumber: number
  day: number
  startHour: number
  comments?: string
}

export function useUserRehearsalApi() {
  function saveRehearsal(studentId: string, payload: UserRehearsalPayload): Promise<void> {
    return client.put(`/user-rehearsals/${studentId}`, payload).then(r => r.data)
  }

  function deleteRehearsal(studentId: string): Promise<void> {
    return client.delete(`/user-rehearsals/${studentId}`).then(r => r.data)
  }

  return { saveRehearsal, deleteRehearsal }
}