import { client } from '../services/http.client'

export interface ImportUserRehearsalsResult {
  total: number
  succeeded: number
  failed: number
  errors: { row: number; reason: string }[]
  message: string
}

/**
 * The rehearsals Excel import. Everything else about rehearsals (building, editing, validating)
 * happens on the Rehearsals board: see useRehearsalOrderApi.
 */
export function useUserRehearsalApi() {
  function importFromExcel(file: File): Promise<ImportUserRehearsalsResult> {
    const formData = new FormData()
    formData.append('file', file)
    return client.post('/user-rehearsals/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  }

  return { importFromExcel }
}