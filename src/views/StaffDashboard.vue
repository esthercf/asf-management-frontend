<template>
  <div class="page">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-logo">
        <div class="logo-icon">📚</div>
        <div>
          <div class="logo-text">StudySpace</div>
          <div class="logo-sub">Staff Panel</div>
        </div>
      </div>

      <span class="nav-section-label">Manage</span>
      <div class="nav-item" :class="{ active: view === 'overview' }" @click="view = 'overview'">
        <span class="nav-icon">📊</span> Overview
      </div>
      <div class="nav-item" :class="{ active: view === 'rooms' }" @click="view = 'rooms'">
        <span class="nav-icon">🏠</span> Rooms
      </div>
      <div class="nav-item" :class="{ active: view === 'bookings' }" @click="view = 'bookings'">
        <span class="nav-icon">📅</span> All Bookings
        <span v-if="store.bookings.length" class="badge badge-lav" style="margin-left:auto; padding:.15rem .55rem;">{{ store.bookings.length }}</span>
      </div>

      <div class="sidebar-footer">
        <div class="user-chip">
          <div class="avatar avatar-coral">JS</div>
          <div class="user-chip-info">
            <div class="name">Jane S.</div>
            <div class="role">Staff Admin</div>
          </div>
        </div>
        <button class="btn btn-secondary btn-sm" style="width:100%; margin-top:.75rem; justify-content:center;" @click="$router.push('/login')">
          ← Switch role
        </button>
      </div>
    </aside>

    <!-- Main -->
    <main class="main">

      <!-- ── Overview ── -->
      <div v-if="view === 'overview'">
        <div class="page-header">
          <h1>Good morning, Jane ☀️</h1>
          <p class="subtitle">Here's what's happening with your spaces today.</p>
        </div>

        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-icon">🏠</div>
            <div class="stat-value">{{ store.rooms.length }}</div>
            <div class="stat-label">Total rooms</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">✅</div>
            <div class="stat-value">{{ store.availableRooms.length }}</div>
            <div class="stat-label">Available</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🔴</div>
            <div class="stat-value">{{ store.unavailableRooms.length }}</div>
            <div class="stat-label">Occupied</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📅</div>
            <div class="stat-value">{{ store.bookings.length }}</div>
            <div class="stat-label">Total bookings</div>
          </div>
        </div>

        <!-- Quick room status -->
        <div class="section-row">
          <h2 class="section-title">Room Status</h2>
          <button class="btn btn-primary btn-sm" @click="openAddRoom">+ Add Room</button>
        </div>
        <div class="room-grid">
          <div v-for="room in store.rooms" :key="room.id" class="card room-card">
            <div class="room-card-header">
              <div>
                <div class="room-name">{{ room.name }}</div>
                <div class="room-floor">{{ room.floor }}</div>
              </div>
              <div class="room-emoji">{{ room.emoji }}</div>
            </div>
            <div class="room-details">
              <span class="room-detail">👥 {{ room.capacity }} seats</span>
            </div>
            <div class="room-card-footer">
              <span class="badge" :class="room.available ? 'badge-green' : 'badge-coral'">
                {{ room.available ? '✓ Available' : '✗ Occupied' }}
              </span>
              <button class="btn btn-secondary btn-sm" @click="toggleAvailability(room)">
                {{ room.available ? 'Mark occupied' : 'Mark free' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Rooms management ── -->
      <div v-if="view === 'rooms'">
        <div class="page-header">
          <h1>Manage Rooms</h1>
          <p class="subtitle">Add, edit, or remove study spaces.</p>
        </div>

        <div class="section-row">
          <div class="search-bar">
            <span class="search-icon">🔍</span>
            <input placeholder="Search rooms…" v-model="roomSearch" />
          </div>
          <button class="btn btn-primary" @click="openAddRoom">+ Add Room</button>
        </div>

        <div class="card" style="overflow:hidden;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Room</th>
                <th>Floor</th>
                <th>Capacity</th>
                <th>Amenities</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="room in filteredRooms" :key="room.id">
                <td><strong>{{ room.emoji }} {{ room.name }}</strong></td>
                <td>{{ room.floor }}</td>
                <td>{{ room.capacity }} seats</td>
                <td style="max-width:180px; color: var(--muted); font-size:.82rem;">{{ room.amenities.join(', ') }}</td>
                <td>
                  <span class="badge" :class="room.available ? 'badge-green' : 'badge-coral'">
                    {{ room.available ? 'Available' : 'Occupied' }}
                  </span>
                </td>
                <td>
                  <div style="display:flex; gap:.5rem;">
                    <button class="btn btn-secondary btn-sm" @click="openEditRoom(room)">Edit</button>
                    <button class="btn btn-danger btn-sm" @click="deleteRoom(room.id)">Delete</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="filteredRooms.length === 0" class="empty-state">
            <div class="empty-icon">🔍</div>
            <p>No rooms found.</p>
          </div>
        </div>
      </div>

      <!-- ── All Bookings ── -->
      <div v-if="view === 'bookings'">
        <div class="page-header">
          <h1>All Bookings</h1>
          <p class="subtitle">View, manage, or create bookings for any user.</p>
        </div>

        <div class="section-row">
          <div class="search-bar">
            <span class="search-icon">🔍</span>
            <input placeholder="Search by user or room…" v-model="bookingSearch" />
          </div>
          <button class="btn btn-primary" @click="openAddBooking">+ Add Booking</button>
        </div>

        <div class="card" style="overflow:hidden;">
          <table class="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Room</th>
                <th>Date</th>
                <th>Time</th>
                <th>Purpose</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="booking in filteredBookings" :key="booking.id">
                <td>
                  <div style="display:flex; align-items:center; gap:.6rem;">
                    <div class="avatar avatar-sage" style="width:28px; height:28px; font-size:.7rem;">
                      {{ initials(booking.userName) }}
                    </div>
                    {{ booking.userName }}
                  </div>
                </td>
                <td><strong>{{ booking.roomName }}</strong></td>
                <td>{{ formatDate(booking.date) }}</td>
                <td>{{ booking.start }} – {{ booking.end }}</td>
                <td style="color: var(--muted);">{{ booking.purpose || '—' }}</td>
                <td>
                  <button class="btn btn-danger btn-sm" @click="cancelBooking(booking.id)">Cancel</button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="filteredBookings.length === 0" class="empty-state">
            <div class="empty-icon">📭</div>
            <p>No bookings found.</p>
          </div>
        </div>
      </div>
    </main>

    <!-- ── Add/Edit Room Modal ── -->
    <Teleport to="body">
      <div v-if="roomModal" class="modal-overlay" @click.self="roomModal = false">
        <div class="modal">
          <h2 class="modal-title">{{ editingRoom ? 'Edit Room' : 'Add New Room' }}</h2>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Room Name</label>
              <input class="form-input" v-model="roomForm.name" placeholder="The Birch Room" />
            </div>
            <div class="form-group">
              <label class="form-label">Emoji</label>
              <input class="form-input" v-model="roomForm.emoji" placeholder="🌿" style="font-size:1.4rem;" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Floor</label>
              <input class="form-input" v-model="roomForm.floor" placeholder="2nd Floor" />
            </div>
            <div class="form-group">
              <label class="form-label">Capacity</label>
              <input class="form-input" type="number" min="1" v-model.number="roomForm.capacity" placeholder="6" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Amenities (comma separated)</label>
            <input class="form-input" v-model="roomForm.amenitiesStr" placeholder="Projector, Whiteboard, WiFi" />
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-input" v-model="roomForm.available">
              <option :value="true">Available</option>
              <option :value="false">Occupied</option>
            </select>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" @click="roomModal = false">Cancel</button>
            <button class="btn btn-primary" @click="saveRoom">
              {{ editingRoom ? 'Save changes' : 'Add Room' }} →
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── Add Booking Modal (staff) ── -->
    <Teleport to="body">
      <div v-if="bookingModal" class="modal-overlay" @click.self="bookingModal = false">
        <div class="modal">
          <h2 class="modal-title">Create a Booking</h2>

          <div class="form-group">
            <label class="form-label">Room</label>
            <select class="form-input" v-model.number="bookingForm.roomId">
              <option v-for="r in store.rooms" :key="r.id" :value="r.id">{{ r.emoji }} {{ r.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">User Name</label>
            <input class="form-input" v-model="bookingForm.userName" placeholder="Student name" />
          </div>
          <div class="form-group">
            <label class="form-label">Date</label>
            <input class="form-input" type="date" v-model="bookingForm.date" :min="today" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Start time</label>
              <input class="form-input" type="time" v-model="bookingForm.start" />
            </div>
            <div class="form-group">
              <label class="form-label">End time</label>
              <input class="form-input" type="time" v-model="bookingForm.end" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Purpose</label>
            <input class="form-input" v-model="bookingForm.purpose" placeholder="e.g. Exam prep, Study group…" />
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" @click="bookingModal = false">Cancel</button>
            <button class="btn btn-primary" @click="confirmAddBooking">Create booking →</button>
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
const view  = ref('overview')

// ── Search ────────────────────────────────────────────
const roomSearch    = ref('')
const bookingSearch = ref('')

const filteredRooms = computed(() =>
  store.rooms.filter(r =>
    r.name.toLowerCase().includes(roomSearch.value.toLowerCase())
  )
)

const filteredBookings = computed(() =>
  store.bookings.filter(b =>
    b.userName.toLowerCase().includes(bookingSearch.value.toLowerCase()) ||
    b.roomName.toLowerCase().includes(bookingSearch.value.toLowerCase())
  )
)

// ── Room modal ────────────────────────────────────────
const roomModal  = ref(false)
const editingRoom = ref(null)
const roomForm   = ref({ name: '', emoji: '🏠', floor: '', capacity: 6, amenitiesStr: '', available: true })

function openAddRoom() {
  editingRoom.value = null
  roomForm.value = { name: '', emoji: '🏠', floor: '', capacity: 6, amenitiesStr: '', available: true }
  roomModal.value = true
}

function openEditRoom(room) {
  editingRoom.value = room
  roomForm.value = {
    name: room.name,
    emoji: room.emoji,
    floor: room.floor,
    capacity: room.capacity,
    amenitiesStr: room.amenities.join(', '),
    available: room.available
  }
  roomModal.value = true
}

function saveRoom() {
  const data = {
    name: roomForm.value.name,
    emoji: roomForm.value.emoji,
    floor: roomForm.value.floor,
    capacity: roomForm.value.capacity,
    amenities: roomForm.value.amenitiesStr.split(',').map(s => s.trim()).filter(Boolean),
    available: roomForm.value.available
  }
  if (editingRoom.value) {
    store.updateRoom(editingRoom.value.id, data)
  } else {
    store.addRoom(data)
  }
  roomModal.value = false
}

function deleteRoom(id) {
  if (confirm('Delete this room and all its bookings?')) store.deleteRoom(id)
}

function toggleAvailability(room) {
  store.updateRoom(room.id, { available: !room.available })
}

// ── Booking modal ─────────────────────────────────────
const bookingModal = ref(false)
const today = new Date().toISOString().split('T')[0]
const bookingForm = ref({ roomId: null, userName: '', date: today, start: '09:00', end: '10:00', purpose: '' })

function openAddBooking() {
  bookingForm.value = {
    roomId: store.rooms[0]?.id ?? null,
    userName: '',
    date: today,
    start: '09:00',
    end: '10:00',
    purpose: ''
  }
  bookingModal.value = true
}

function confirmAddBooking() {
  if (!bookingForm.value.roomId || !bookingForm.value.userName) return
  store.addBooking({ userId: 'staff-created', ...bookingForm.value })
  bookingModal.value = false
  view.value = 'bookings'
}

function cancelBooking(id) {
  if (confirm('Cancel this booking?')) store.cancelBooking(id)
}

// ── Helpers ───────────────────────────────────────────
function initials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>
