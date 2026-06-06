<template>
  <div class="page">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-logo">
        <div class="logo-icon">📚</div>
        <div>
          <div class="logo-text">StudySpace</div>
          <div class="logo-sub">Room Booking</div>
        </div>
      </div>

      <span class="nav-section-label">Menu</span>
      <div class="nav-item" :class="{ active: view === 'rooms' }" @click="view = 'rooms'">
        <span class="nav-icon">🏠</span> Browse Rooms
      </div>
      <div class="nav-item" :class="{ active: view === 'bookings' }" @click="view = 'bookings'">
        <span class="nav-icon">📅</span> My Bookings
        <span v-if="myBookings.length" class="badge badge-green" style="margin-left:auto; padding:.15rem .55rem;">{{ myBookings.length }}</span>
      </div>

      <div class="sidebar-footer">
        <div class="user-chip">
          <div class="avatar avatar-sage">AM</div>
          <div class="user-chip-info">
            <div class="name">Alice Martin</div>
            <div class="role">Student</div>
          </div>
        </div>
        <button class="btn btn-secondary btn-sm" style="width:100%; margin-top:.75rem; justify-content:center;" @click="$router.push('/login')">
          ← Switch role
        </button>
      </div>
    </aside>

    <!-- Main -->
    <main class="main">

      <!-- ── Browse Rooms ── -->
      <div v-if="view === 'rooms'">
        <div class="page-header">
          <h1>Find a Room</h1>
          <p class="subtitle">Browse available spaces and book one in seconds.</p>
        </div>

        <!-- Stats -->
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-icon">✅</div>
            <div class="stat-value">{{ store.availableRooms.length }}</div>
            <div class="stat-label">Available now</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📍</div>
            <div class="stat-value">{{ store.rooms.length }}</div>
            <div class="stat-label">Total rooms</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📅</div>
            <div class="stat-value">{{ myBookings.length }}</div>
            <div class="stat-label">My bookings</div>
          </div>
        </div>

        <!-- Filters -->
        <div class="filter-chips">
          <button class="chip" :class="{ active: filter === 'all' }"       @click="filter = 'all'">All rooms</button>
          <button class="chip" :class="{ active: filter === 'available' }" @click="filter = 'available'">✅ Available</button>
          <button class="chip" :class="{ active: filter === 'small' }"     @click="filter = 'small'">👤 Up to 4 people</button>
          <button class="chip" :class="{ active: filter === 'large' }"     @click="filter = 'large'">👥 6+ people</button>
        </div>

        <!-- Room Grid -->
        <div class="room-grid">
          <div
            v-for="room in filteredRooms"
            :key="room.id"
            class="card room-card"
          >
            <div class="room-card-header">
              <div>
                <div class="room-name">{{ room.name }}</div>
                <div class="room-floor">{{ room.floor }}</div>
              </div>
              <div class="room-emoji">{{ room.emoji }}</div>
            </div>

            <div class="room-details">
              <span class="room-detail">👥 {{ room.capacity }} seats</span>
              <span v-for="a in room.amenities" :key="a" class="room-detail">· {{ a }}</span>
            </div>

            <div class="room-card-footer">
              <span class="badge" :class="room.available ? 'badge-green' : 'badge-coral'">
                {{ room.available ? '✓ Available' : '✗ Booked' }}
              </span>
              <button
                class="btn btn-primary btn-sm"
                :disabled="!room.available"
                style="opacity: 1"
                :style="!room.available ? 'opacity:.45; cursor:not-allowed;' : ''"
                @click="openBooking(room)"
              >
                Book →
              </button>
            </div>
          </div>
        </div>

        <div v-if="filteredRooms.length === 0" class="empty-state">
          <div class="empty-icon">🔍</div>
          <p>No rooms match your filter.</p>
        </div>
      </div>

      <!-- ── My Bookings ── -->
      <div v-if="view === 'bookings'">
        <div class="page-header">
          <h1>My Bookings</h1>
          <p class="subtitle">Manage your upcoming reservations.</p>
        </div>

        <div v-if="myBookings.length === 0" class="empty-state card" style="padding: 4rem;">
          <div class="empty-icon">📭</div>
          <p>You have no upcoming bookings.</p>
          <button class="btn btn-primary" style="margin-top:1.25rem;" @click="view = 'rooms'">Browse rooms →</button>
        </div>

        <div v-else class="booking-list">
          <div v-for="booking in myBookings" :key="booking.id" class="card booking-item">
            <div class="booking-time-block">
              <div class="day">{{ getDayLabel(booking.date) }}</div>
              <div class="date">{{ getDay(booking.date) }}</div>
            </div>
            <div class="booking-info">
              <div class="room-name-b">{{ booking.roomName }}</div>
              <div class="booking-meta">{{ booking.start }} – {{ booking.end }} · {{ booking.purpose }}</div>
            </div>
            <div class="booking-actions">
              <span class="badge badge-green">Confirmed</span>
              <button class="btn btn-danger btn-sm" @click="cancel(booking.id)">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Book Modal -->
    <Teleport to="body">
      <div v-if="bookingModal" class="modal-overlay" @click.self="bookingModal = false">
        <div class="modal">
          <h2 class="modal-title">Book {{ selectedRoom?.name }}</h2>

          <div class="form-group">
            <label class="form-label">Date</label>
            <input class="form-input" type="date" v-model="form.date" :min="today" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Start time</label>
              <input class="form-input" type="time" v-model="form.start" />
            </div>
            <div class="form-group">
              <label class="form-label">End time</label>
              <input class="form-input" type="time" v-model="form.end" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Purpose</label>
            <input class="form-input" type="text" v-model="form.purpose" placeholder="e.g. Study group, Exam prep…" />
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" @click="bookingModal = false">Cancel</button>
            <button class="btn btn-primary" @click="confirmBooking">Confirm booking →</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoomStore } from '@/stores/roomStore'

const store = useRoomStore()
const view  = ref('rooms')
const filter = ref('all')

// ── Filters ──────────────────────────────────────────
const filteredRooms = computed(() => {
  if (filter.value === 'available') return store.rooms.filter(r => r.available)
  if (filter.value === 'small')     return store.rooms.filter(r => r.capacity <= 4)
  if (filter.value === 'large')     return store.rooms.filter(r => r.capacity >= 6)
  return store.rooms
})

// Current user mock
const CURRENT_USER = { id: 'u1', name: 'Alice Martin' }
const myBookings = computed(() => store.bookingsForUser(CURRENT_USER.id))

// ── Booking modal ─────────────────────────────────────
const bookingModal = ref(false)
const selectedRoom = ref(null)
const today = new Date().toISOString().split('T')[0]

const form = ref({ date: today, start: '09:00', end: '10:00', purpose: '' })

function openBooking(room) {
  selectedRoom.value = room
  form.value = { date: today, start: '09:00', end: '10:00', purpose: '' }
  bookingModal.value = true
}

function confirmBooking() {
  if (!form.value.date || !form.value.start || !form.value.end) return
  store.addBooking({
    roomId: selectedRoom.value.id,
    userId: CURRENT_USER.id,
    userName: CURRENT_USER.name,
    ...form.value
  })
  bookingModal.value = false
  view.value = 'bookings'
}

function cancel(id) {
  if (confirm('Cancel this booking?')) store.cancelBooking(id)
}

// ── Date helpers ──────────────────────────────────────
function getDayLabel(dateStr) {
  return new Date(dateStr).toLocaleDateString('en', { weekday: 'short' })
}
function getDay(dateStr) {
  return new Date(dateStr).getDate()
}
</script>
