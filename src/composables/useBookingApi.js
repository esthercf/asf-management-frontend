/**
 * useBookingApi
 * All HTTP calls to your NestJS backend (base: /api/v1)
 * Auth token is read from localStorage key 'asf_token'
 */

const BASE = import.meta.env.VITE_API_BASE ?? '/v1'

function token() {
  return localStorage.getItem('asf_token') ?? ''
}

function headers(extra = {}) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token()}`,
    ...extra,
  }
}

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw Object.assign(new Error(err.message ?? res.statusText), { status: res.status, data: err })
  }
  if (res.status === 204) return null
  return res.json()
}

export function useBookingApi() {
  // ── Auth ──────────────────────────────────────────────
  /** POST /v1/session  →  { accessToken, refreshToken, roles, userId } */
  async function login(email, password) {
    const res = await fetch(`${BASE}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) throw new Error('Invalid credentials')
    const data = await res.json()
    localStorage.setItem('asf_token', data.accessToken)
    localStorage.setItem('asf_refresh', data.refreshToken)
    localStorage.setItem('asf_userId', data.userId)
    localStorage.setItem('asf_roles', JSON.stringify(data.roles ?? []))
    return data
  }

  function logout() {
    localStorage.removeItem('asf_token')
    localStorage.removeItem('asf_refresh')
    localStorage.removeItem('asf_userId')
    localStorage.removeItem('asf_roles')
  }

  function currentUserId() {
    return localStorage.getItem('asf_userId')
  }

  function currentRoles() {
    try { return JSON.parse(localStorage.getItem('asf_roles') ?? '[]') } catch { return [] }
  }

  // ── Availability ──────────────────────────────────────
  /**
   * GET /v1/bookings/availability  →  AvailableRoomDto[]
   * Each room has: { id, name, roomNumber, floor, available: AvailableBookingDto[] }
   * Each slot has: { roomId, roomName, date, startTime, endTime, day, month, year, hour, minutes }
   */
  async function getAvailability(roomId) {
    const q = roomId ? `?roomId=${roomId}` : ''
    return request('GET', `/bookings/availability${q}`)
  }

  // ── Slot locking ──────────────────────────────────────
  /** POST /v1/bookings/lock  →  { expiresInSeconds } */
  async function lockSlot(roomId, date, startTime) {
    return request('POST', '/bookings/lock', { roomId, date, startTime })
  }

  /** DELETE /v1/bookings/lock  →  204 */
  async function unlockSlot(roomId, date, startTime) {
    return request('DELETE', '/bookings/lock', { roomId, date, startTime })
  }

  // ── Bookings ──────────────────────────────────────────
  /**
   * GET /v1/bookings  →  Datatable<BookingDto>
   * Staff sees all; users see only their own (backend enforces this).
   */
  async function getBookings({ page = 1, limit = 50, userId, roomId, day, month, textFilter } = {}) {
    const params = new URLSearchParams({ page, limit })
    if (userId)     params.set('userId', userId)
    if (roomId)     params.set('roomId', roomId)
    if (day)        params.set('day', day)
    if (month)      params.set('month', month)
    if (textFilter) params.set('textFilter', textFilter)
    return request('GET', `/bookings?${params}`)
  }

  /** Convenience: get only the current user's upcoming bookings */
  async function getMyBookings() {
    return request('GET', '/bookings?limit=100')
  }

  /** GET /v1/bookings/:id  →  BookingDto */
  async function getBooking(id) {
    return request('GET', `/bookings/${id}`)
  }

  /**
   * POST /v1/bookings  →  BookingDto
   * Body: { roomId, date (ISO), hour, minutes, usage?, userId? }
   */
  async function createBooking({ roomId, date, hour, minutes, usage = 'STUDY', userId }) {
    return request('POST', '/bookings', { roomId, date, hour, minutes, usage, userId })
  }

  /** DELETE /v1/bookings/:id  →  204 */
  async function deleteBooking(id) {
    return request('DELETE', `/bookings/${id}`)
  }

  // ── Rooms ─────────────────────────────────────────────
  /** GET /v1/rooms  →  Datatable<RoomDto> */
  async function getRooms({ page = 1, limit = 50, textFilter } = {}) {
    const params = new URLSearchParams({ page, limit })
    if (textFilter) params.set('textFilter', textFilter)
    return request('GET', `/rooms?${params}`)
  }

  /** POST /v1/rooms  →  RoomDto */
  async function createRoom(dto) {
    return request('POST', '/rooms', dto)
  }

  /** PATCH /v1/rooms/:id  →  RoomDto */
  async function updateRoom(id, dto) {
    return request('PATCH', `/rooms/${id}`, dto)
  }

  /** DELETE /v1/rooms/:id  →  204 */
  async function deleteRoom(id) {
    return request('DELETE', `/rooms/${id}`)
  }

  return {
    // auth
    login, logout, currentUserId, currentRoles,
    // availability
    getAvailability,
    // slots
    lockSlot, unlockSlot,
    // bookings
    getBookings, getMyBookings, getBooking, createBooking, deleteBooking,
    // rooms
    getRooms, createRoom, updateRoom, deleteRoom,
  }
}
