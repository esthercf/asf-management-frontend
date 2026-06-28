
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../stores/auth.store'
import { SessionDto } from '../types/session.types'
import { AvailableRoomDto, GetRoomsParams, RoomDto } from '../types/room.types'
import { BookingDto, CreateBookingDto, GetAvailabilityParams, GetBookingsParams } from '../types/booking.types'
import { DatatableResult } from '../types/common.types'
import { extractErrorMessage } from '../utiles/error.utiles'
import { useToastStore } from '../stores/toast.store'
import type { UserDto, GetUsersParams, UpdateUserDto, UpdateUserActiveDto } from '../types/user.types'





// ── Axios client ───────────────────────────────────────────────────────────

const client: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
  withCredentials: true,
})
/**interceptor:without interceptor this should be done manually in every single API call
 * Attach access token to every request*/
client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const auth = useAuthStore();

  if (auth.accessToken) {
    config.headers.Authorization = `Bearer ${auth.accessToken}`
  }
  return config
})

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

// ── Composable ─────────────────────────────────────────────────────────────
export function useBookingApi() {
  // ── Auth ────────────────────────────────────────────────────────────────
  async function login(email: string, password: string): Promise<SessionDto> {
    const { data } = await client.post<SessionDto>('/sessions', { email, password })
    console.log('roles:', data.roles)
    return data
  }

  function logout(): Promise<void> {
    return client.post('/sessions/logout').then(r => r.data)
  }

  function refresh(userId: string, refreshToken: string): Promise<SessionDto> {
    return client.post<SessionDto>(
      '/sessions/refresh',
      { userId, refreshToken }
    ).then(r => r.data)
  }


  // ── Availability ─────────────────────────────────────────────────────────
  function getAvailability(params: GetAvailabilityParams = {}): Promise<AvailableRoomDto[]> {
    const { roomId, page = 1, limit = 100 } = params
    const q = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (roomId) q.set('roomId', roomId)
    return client.get<AvailableRoomDto[]>(`/bookings/availability?${q}`).then(r => r.data)
  }

  // ── Slot locking ──────────────────────────────────────────────────────────

  function lockSlot(roomId: string, date: string, startTime: number): Promise<{ expiresInSeconds: number }> {
    return client.post('/bookings/lock', { roomId, date, startTime }).then(r => r.data)
  }

  function unlockSlot(roomId: string, date: string, startTime: number): Promise<void> {
    return client.delete('/bookings/lock', { data: { roomId, date, startTime } }).then(r => r.data)
  }

  // ── Bookings ──────────────────────────────────────────────────────────────

  function getBookings(params: GetBookingsParams = {}): Promise<DatatableResult<BookingDto>> {
    const { page = 1, limit = 50, userId, roomId, day, month, textFilter } = params
    const q = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (userId) q.set('userId', userId)
    if (roomId) q.set('roomId', roomId)
    if (day) q.set('day', String(day))
    if (month) q.set('month', String(month))
    if (textFilter) q.set('textFilter', textFilter)
    return client.get<DatatableResult<BookingDto>>(`/bookings?${q}`).then(r => r.data)
  }

  function getMyBookings(): Promise<DatatableResult<BookingDto>> {
    return client.get<DatatableResult<BookingDto>>('/bookings?limit=100').then(r => r.data)
  }

  function getBooking(id: string): Promise<BookingDto> {
    return client.get<BookingDto>(`/bookings/${id}`).then(r => r.data)
  }

  function createBooking(params: CreateBookingDto): Promise<BookingDto> {
    return client.post<BookingDto>('/bookings', params).then(r => r.data)
  }

  function deleteBooking(id: string): Promise<void> {
    return client.delete(`/bookings/${id}`).then(r => r.data)
  }

  // ── Rooms ─────────────────────────────────────────────────────────────────

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

  // ── Users ─────────────────────────────────────────────────────────────────

  function getUsers(params: GetUsersParams = {}): Promise<DatatableResult<UserDto>> {
    const { page = 1, limit = 50, textFilter, roleType, active, bookingTypeEnum, sortByCreationDate, sortByName } = params
    const q = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (textFilter) q.set('textFilter', textFilter)
    if (roleType) q.set('roleType', roleType)
    if (active) q.set('active', active)
    if (bookingTypeEnum) q.set('bookingTypeEnum', bookingTypeEnum)
    if (sortByCreationDate) q.set('sortByCreationDate', sortByCreationDate)
    if (sortByName) q.set('sortByName', sortByName)
    return client.get<DatatableResult<UserDto>>(`/users?${q}`).then(r => r.data)
  }
  function getUser(id: string): Promise<UserDto> {
    return client.get<UserDto>(`/users/${id}`).then(r => r.data)
  }

  function updateUser(id: string, dto: UpdateUserDto): Promise<UserDto> {
    return client.patch<UserDto>(`/users/${id}`, dto).then(r => r.data)
  }

  function updateUserActiveByEmail(email: string, active: boolean): Promise<string> {
    const dto: UpdateUserActiveDto = { active, showPassword: false }
    return client.put<string>(`/users/active/byEmail/${encodeURIComponent(email)}`, dto).then(r => r.data)
  }

  // ── Add these to the returned object ────────────────────────────────────────

  return {
    // auth
    login, logout, refresh,
    // availability
    getAvailability,
    // slots
    lockSlot, unlockSlot,
    // bookings
    getBookings, getMyBookings, getBooking, createBooking, deleteBooking,
    // rooms
    getRooms, createRoom, updateRoom, deleteRoom,
    // users
    getUsers, getUser, updateUser, updateUserActiveByEmail,

  }
}