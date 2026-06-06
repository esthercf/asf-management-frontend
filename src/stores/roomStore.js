import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useRoomStore = defineStore('rooms', () => {
  // ── Rooms ────────────────────────────────────────────
  const rooms = ref([
    { id: 1, name: 'The Birch Room',   floor: '2nd Floor', capacity: 6,  amenities: ['Projector', 'Whiteboard', 'WiFi'], emoji: '🌿', available: true  },
    { id: 2, name: 'The Cedar Room',   floor: '3rd Floor', capacity: 12, amenities: ['TV Screen', 'Whiteboard', 'WiFi'], emoji: '🌲', available: false },
    { id: 3, name: 'The Maple Suite',  floor: '1st Floor', capacity: 4,  amenities: ['Whiteboard', 'WiFi'],              emoji: '🍁', available: true  },
    { id: 4, name: 'The Oak Lounge',   floor: '2nd Floor', capacity: 20, amenities: ['Projector', 'Microphone', 'WiFi'], emoji: '🌳', available: true  },
    { id: 5, name: 'The Willow Nook',  floor: '1st Floor', capacity: 2,  amenities: ['WiFi'],                            emoji: '🌾', available: false },
    { id: 6, name: 'The Aspen Space',  floor: '4th Floor', capacity: 8,  amenities: ['TV Screen', 'WiFi'],               emoji: '🍃', available: true  },
  ])

  // ── Bookings ─────────────────────────────────────────
  const bookings = ref([
    { id: 1, roomId: 2, roomName: 'The Cedar Room',  userId: 'u1', userName: 'Alice Martin',  date: '2026-06-09', start: '09:00', end: '11:00', purpose: 'Team study' },
    { id: 2, roomId: 5, roomName: 'The Willow Nook', userId: 'u2', userName: 'Bob Hernandez', date: '2026-06-07', start: '14:00', end: '15:30', purpose: 'Quiet reading' },
    { id: 3, roomId: 1, roomName: 'The Birch Room',  userId: 'u1', userName: 'Alice Martin',  date: '2026-06-10', start: '10:00', end: '12:00', purpose: 'Project meeting' },
    { id: 4, roomId: 4, roomName: 'The Oak Lounge',  userId: 'u3', userName: 'Carol Smith',   date: '2026-06-08', start: '13:00', end: '14:00', purpose: 'Presentation prep' },
  ])

  let nextBookingId = 5
  let nextRoomId = 7

  // ── Getters ──────────────────────────────────────────
  const availableRooms  = computed(() => rooms.value.filter(r => r.available))
  const unavailableRooms = computed(() => rooms.value.filter(r => !r.available))

  function bookingsForUser(userId) {
    return bookings.value.filter(b => b.userId === userId)
  }

  // ── Actions ──────────────────────────────────────────
  function addBooking(booking) {
    const room = rooms.value.find(r => r.id === booking.roomId)
    bookings.value.push({
      id: nextBookingId++,
      roomName: room?.name ?? 'Unknown Room',
      ...booking
    })
    // Mark room as unavailable for simplicity (replace with time-slot logic vs your API)
    if (room) room.available = false
  }

  function cancelBooking(bookingId) {
    const idx = bookings.value.findIndex(b => b.id === bookingId)
    if (idx === -1) return
    const booking = bookings.value[idx]
    bookings.value.splice(idx, 1)
    const room = rooms.value.find(r => r.id === booking.roomId)
    if (room) room.available = true
  }

  function addRoom(room) {
    rooms.value.push({ id: nextRoomId++, available: true, ...room })
  }

  function updateRoom(id, updates) {
    const room = rooms.value.find(r => r.id === id)
    if (room) Object.assign(room, updates)
  }

  function deleteRoom(id) {
    rooms.value = rooms.value.filter(r => r.id !== id)
    bookings.value = bookings.value.filter(b => b.roomId !== id)
  }

  return {
    rooms, bookings,
    availableRooms, unavailableRooms,
    bookingsForUser,
    addBooking, cancelBooking,
    addRoom, updateRoom, deleteRoom
  }
})
