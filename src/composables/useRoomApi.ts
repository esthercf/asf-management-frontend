
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../stores/auth.store'
import { GetRoomsParams, RoomDto } from '../types/room.types'
import { DatatableResult } from '../types/common.types'
import { extractErrorMessage } from '../utiles/error.utiles'
import { useToastStore } from '../stores/toast.store'
import { client } from '../services/http.client'



// On 401 → try refresh once, queue concurrent requests, redirect on failure
let isRefreshing = false
let queue: Array<() => void> = []

client.interceptors.response.use(
  (res) => res,// request succeeded → just pass it through, do nothing
  async (error) => {// request failed → run this
    const auth = useAuthStore();
    const toast = useToastStore();
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }// the original request that failed

    if (error.response?.status === 401 && !original._retry) {// unauthorized, token expired && we haven't already tried once (prevents infinite loops)
      original._retry = true

      if (isRefreshing) {
        return new Promise((resolve) => {
          queue.push(() => resolve(client(original)))
        })
      }

      isRefreshing = true
      try {
        await auth.refresh()
        queue.forEach(fn => fn())
        queue = []
        return client(original)
      } catch {
        auth.clear() // delete tokens from store + localStorage
        window.location.href = '/login'// kick user back to login page
      } finally {
        isRefreshing = false // always reset the flag, success or failure
      }
    }
    if (error.response?.status !== 401) {
      toast.show(extractErrorMessage(error))
    }
    return Promise.reject(error)
  }
)

export function useRoomApi() {


  function getRooms(params: GetRoomsParams = {}): Promise<DatatableResult<RoomDto>> {
    console.log('client:', JSON.stringify(client, null, 2));
    console.log('client:', JSON.stringify(client.head, null, 2));
    const { page = 1, limit = 50, textFilter } = params
    const q = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (textFilter) q.set('textFilter', textFilter)
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


  return {
    getRooms, createRoom, updateRoom, deleteRoom,

  }
}