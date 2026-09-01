import { GetRoomsParams, RoomDto } from '../types/room.types'
import { DatatableResult } from '../types/common.types'
import { client } from '../services/http.client'

export interface ImportRoomsResult {
  message: string
  total: number
  succeeded: number
  failed: number
  errors: { row: number; reason: string }[]
}

export function useRoomApi() {

   function getRooms(params: GetRoomsParams = {}): Promise<DatatableResult<RoomDto>> {
    const { page = 1, limit = 50, textFilter, sortByName } = params
    const q = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (textFilter) q.set('textFilter', textFilter)
    if (sortByName) q.set('sortByName', sortByName)
    return client.get<DatatableResult<RoomDto>>(`/rooms?${q}`).then(r => r.data)
  }

  function createRoom(dto: Partial<RoomDto>): Promise<RoomDto> {
    return client.post<RoomDto>('/rooms', dto).then(r => r.data)
  }

  function updateRoom(id: string, dto: Partial<RoomDto>): Promise<RoomDto> {
    return client.patch<RoomDto>(`/rooms/${id}`, dto).then(r => r.data)
  }

  function deleteRoom(id: string): Promise<void> {
    return client.delete(`/rooms/${id}`).then(r => r.data)
  }

  function importFromExcel(file: File): Promise<ImportRoomsResult> {
    const formData = new FormData()
    formData.append('file', file)
    return client.post<ImportRoomsResult>('/rooms/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  }

  return {
    getRooms, createRoom, updateRoom, deleteRoom, importFromExcel,
  }
}