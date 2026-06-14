import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { RoomDto, GetRoomsParams, CreateRoomDto, UpdateRoomDto } from '../types/room.types'
import { BookingDto, CreateBookingDto, GetBookingsParams } from '../types/booking.types'
import { useBookingApi } from '../composables/useBookingApi'

export const useRoomStore = defineStore('rooms', () => {
  const api = useBookingApi()

  // ── State ────────────────────────────────────────────
  const rooms = ref<RoomDto[]>([])
  const bookings = ref<BookingDto[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ── Getters ──────────────────────────────────────────
  const availableRooms = computed(() => rooms.value.filter(r => r.active))
  const unavailableRooms = computed(() => rooms.value.filter(r => !r.active))

  function bookingsForUser(userId: string) {
    return bookings.value.filter(b => b.userId === userId)
  }

  // ── Actions (API integrated) ─────────────────────────
  async function fetchRooms(params?: GetRoomsParams) {
    try {
      loading.value = true
      const result = await api.getRooms(params)
      rooms.value = result.items   // DatatableResult<RoomDto>
    } catch (e: any) {
      error.value = e.response?.data?.message ?? String(e)
    } finally {
      loading.value = false
    }
  }

  async function fetchBookings(params?: GetBookingsParams) {
    try {
      loading.value = true
      const result = await api.getBookings(params)
      bookings.value = result.items   // DatatableResult<BookingDto>
    } catch (e: any) {
      error.value = e.response?.data?.message ?? String(e)
    } finally {
      loading.value = false
    }
  }

  async function addRoom(dto: CreateRoomDto) {
    try {
      const room = await api.createRoom(dto)
      rooms.value.push(room)
    } catch (e: any) {
      error.value = e.response?.data?.message ?? String(e)
    }
  }

  async function updateRoom(id: string, dto: UpdateRoomDto) {
    try {
      const updated = await api.updateRoom(id, dto)
      const idx = rooms.value.findIndex(r => r.id === id)
      if (idx !== -1) rooms.value[idx] = updated
    } catch (e: any) {
      error.value = e.response?.data?.message ?? String(e)
    }
  }

  async function deleteRoom(id: string) {
    try {
      await api.deleteRoom(id)
      rooms.value = rooms.value.filter(r => r.id !== id)
      bookings.value = bookings.value.filter(b => b.roomId !== id)
    } catch (e: any) {
      error.value = e.response?.data?.message ?? String(e)
    }
  }

  async function addBooking(dto: CreateBookingDto) {
    try {
      const booking = await api.createBooking(dto)
      bookings.value.push(booking)
      const room = rooms.value.find(r => r.id === booking.roomId)
      if (room) room.active = false
    } catch (e: any) {
      error.value = e.response?.data?.message ?? String(e)
    }
  }

  async function cancelBooking(id: string) {
    try {
      await api.deleteBooking(id)
      bookings.value = bookings.value.filter(b => b.id !== id)
    } catch (e: any) {
      error.value = e.response?.data?.message ?? String(e)
    }
  }

  return {
    rooms, bookings, loading, error,
    availableRooms, unavailableRooms,
    bookingsForUser,
    fetchRooms, fetchBookings,
    addRoom, updateRoom, deleteRoom,
    addBooking, cancelBooking
  }
})
