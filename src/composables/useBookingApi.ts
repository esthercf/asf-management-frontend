

import { AvailableRoomDto, } from '../types/room.types'
import { BookingDto, CreateBookingDto, GetAvailabilityParams, GetBookingsParams, LockAutoResult } from '../types/booking.types'
import { DatatableResult } from '../types/common.types'
import { client } from '../services/http.client'



export function useBookingApi() {

  function getAvailability(params: GetAvailabilityParams = {}): Promise<AvailableRoomDto[]> {
    const { roomId, page = 1, limit = 100 } = params
    const q = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (roomId) q.set('roomId', roomId)
    return client.get<AvailableRoomDto[]>(`/bookings/availability?${q}`).then(r => r.data)
  }


  function lockSlot(roomId: string, date: string, startTime: number): Promise<{ expiresInSeconds: number }> {
    return client.post('/bookings/lock', { roomId, date, startTime }).then(r => r.data)
  }

  function unlockSlot(roomId: string, date: string, startTime: number): Promise<void> {
    return client.delete('/bookings/lock', { data: { roomId, date, startTime } }).then(r => r.data)
  }


  /**
   * GET /v1/bookings/special
   * Returns upcoming special-type bookings visible to the current user.
   * Backend enforces userId from the JWT — no userId param needed.
   */
  function getSpecialBookings(params: GetBookingsParams = {}): Promise<DatatableResult<BookingDto>> {
    const { page = 1, limit = 50 } = params
    const q = new URLSearchParams({ page: String(page), limit: String(limit) })
    return client.get<DatatableResult<BookingDto>>(`/bookings/special?${q}`).then(r => r.data)
  }

  /**
 * PATCH /v1/bookings/pick/:bookingId
 * Contestant claims an unassigned special booking slot.
 * Backend assigns req.payload.userId automatically — no body needed.
 */
  function pickBooking(bookingId: string): Promise<BookingDto> {
    return client.patch<BookingDto>(`/bookings/pick/${bookingId}`).then(r => r.data)
  }

  function getBookings(params: GetBookingsParams = {}): Promise<DatatableResult<BookingDto>> {
    const { page = 1, limit = 50, userId, roomId, day, month, textFilter, bookingTypeEnum, noUserId } = params
    const q = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (userId) q.set('userId', userId)
    if (roomId) q.set('roomId', roomId)
    if (day) q.set('day', String(day))
    if (month) q.set('month', String(month))
    if (textFilter) q.set('textFilter', textFilter)
    if (bookingTypeEnum) q.set('bookingTypeEnum', bookingTypeEnum)
    if (noUserId !== undefined) q.set('noUserId', String(noUserId))
    return client.get<DatatableResult<BookingDto>>(`/bookings?${q}`).then(r => r.data)
  }

  function getMyBookings(params: GetBookingsParams = {}): Promise<DatatableResult<BookingDto>> {
    const { page = 1, limit = 50, userId, toCome = true } = params
    const q = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (userId) q.set('userId', userId)
    return client.get<DatatableResult<BookingDto>>(`/bookings?${q}`).then(r => r.data)
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

function lockAuto(date: string, startTime: number): Promise<LockAutoResult | null> {
  return client
    .post<LockAutoResult | null>('/bookings/lock/auto', { date, startTime })
    .then(r => r.data)
}
  function assignBookingUser(bookingId: string, userId: string): Promise<BookingDto> {
    return client.patch<BookingDto>(`/bookings/assign/${bookingId}/user/${userId}`).then(r => r.data)
  }

  return {

    // availability
    getAvailability,
    // slots
    lockSlot, unlockSlot, lockAuto,
    // bookings
    getBookings, getMyBookings, getBooking, createBooking, deleteBooking, assignBookingUser, getSpecialBookings, pickBooking,

  }
}