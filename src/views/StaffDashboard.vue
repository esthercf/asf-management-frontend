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
      <div class="nav-item" :class="{ active: view === 'rooms' }" @click="view = 'rooms'; loadRooms()">
        <span class="nav-icon">🏠</span> Rooms
      </div>
      <div class="nav-item" :class="{ active: view === 'bookings' }" @click="view = 'bookings'; loadBookings()">
        <span class="nav-icon">📅</span> All Bookings
        <span v-if="bookings.length" class="badge badge-lav" style="margin-left:auto; padding:.15rem .55rem;">{{
          bookings.length }}</span>
      </div>
      <div class="nav-item" :class="{ active: view === 'newbooking' }" @click="startNewBooking">
        <span class="nav-icon">➕</span> New Booking
      </div>

      <div class="sidebar-footer">
        <div class="user-chip">
          <div class="avatar avatar-coral">JS</div>
          <div class="user-chip-info">
            <div class="name">Staff</div>
            <div class="role">Admin</div>
          </div>
        </div>
        <button class="btn btn-secondary btn-sm" style="width:100%; margin-top:.75rem; justify-content:center;"
          @click="$router.push('/login')">
          ← Switch role
        </button>
      </div>
    </aside>

    <!-- Main -->
    <main class="main">

      <!-- ── Overview ── -->
      <div v-if="view === 'overview'">
        <div class="page-header">
          <h1>Good morning ☀️</h1>
          <p class="subtitle">Here's what's happening today.</p>
        </div>

        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-icon">🏠</div>
            <div class="stat-value">{{ rooms.length }}</div>
            <div class="stat-label">Total rooms</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">✅</div>
            <div class="stat-value">{{ totalFreeSlots }}</div>
            <div class="stat-label">Free slots</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📅</div>
            <div class="stat-value">{{ bookings.length }}</div>
            <div class="stat-label">Total bookings</div>
          </div>
        </div>

        <!-- Quick availability overview -->
        <div class="section-row">
          <h2 class="section-title">Room Availability</h2>
          <button class="btn btn-primary btn-sm" @click="startNewBooking">+ New Booking</button>
        </div>

        <div v-if="loadingAvailability" class="empty-state">
          <div class="empty-icon">⏳</div>
          <p>Loading…</p>
        </div>
        <div v-else class="room-grid">
          <div v-for="room in availability" :key="room.id" class="card room-card">
            <div class="room-card-header">
              <div>
                <div class="room-name">{{ room.name }}</div>
                <div class="room-floor">Room #{{ room.roomNumber }}{{ room.floor != null ? ' · Floor ' + room.floor : ''
                  }}</div>
              </div>
              <div class="room-emoji">{{ sizeEmoji(room.size) }}</div>
            </div>
            <div class="room-details">
              <span class="room-detail">{{ (room.available ?? []).length }} free slots</span>
              <span v-if="room.windows" class="room-detail">· 🪟 Windows</span>
            </div>
            <div class="room-card-footer">
              <span class="badge" :class="(room.available ?? []).length > 0 ? 'badge-green' : 'badge-coral'">
                {{ (room.available ?? []).length > 0 ? '✓ Has slots' : '✗ Full' }}
              </span>
              <span class="badge badge-sky">{{ room.size ?? 'N/A' }}</span>
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

        <div v-if="loadingRooms" class="empty-state">
          <div class="empty-icon">⏳</div>
          <p>Loading…</p>
        </div>
        <div v-else class="card" style="overflow:hidden;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Room</th>
                <th>Number</th>
                <th>Floor</th>
                <th>Size</th>
                <th>Windows</th>
                <th>Comments</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="room in filteredRooms" :key="room.id">
                <td><strong>{{ sizeEmoji(room.size) }} {{ room.name }}</strong></td>
                <td>#{{ room.roomNumber }}</td>
                <td>{{ room.floor ?? '—' }}</td>
                <td>{{ room.size ?? 'N/A' }}</td>
                <td>{{ room.windows ? '🪟 Yes' : 'No' }}</td>
                <td>{{ room.comments || '—' }}</td>
                <td>
                  <span class="badge" :class="room.active ? 'badge-green' : 'badge-coral'">
                    {{ room.active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td>
                  <div style="display:flex; gap:.5rem;">
                    <button class="btn btn-secondary btn-sm" @click="openEditRoom(room)">Edit</button>
                    <button class="btn btn-danger btn-sm" @click="removeRoom(room.id)">Delete</button>
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
          <p class="subtitle">View and manage every reservation.</p>
        </div>

        <div class="section-row">
          <div class="search-bar">
            <span class="search-icon">🔍</span>
            <input placeholder="Search by user or room…" v-model="bookingSearch" @input="loadBookings" />
          </div>
          <button class="btn btn-primary" @click="startNewBooking">+ New Booking</button>
        </div>

        <div v-if="loadingBookings" class="empty-state">
          <div class="empty-icon">⏳</div>
          <p>Loading…</p>
        </div>
        <div v-else class="card" style="overflow:hidden;">
          <table class="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Room</th>
                <th>Date</th>
                <th>Time</th>
                <th>Usage</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="booking in filteredBookings" :key="booking.id">
                <td>
                  <div style="display:flex; align-items:center; gap:.6rem;">
                    <div class="avatar avatar-sage" style="width:28px; height:28px; font-size:.7rem;">
                      {{ initials(booking.user?.firstnames ?? booking.userId?.toString() ?? '?') }}
                    </div>
                    {{ booking.user?.firstnames ?? booking.userId ?? '—' }}
                  </div>
                </td>
                <td><strong>{{ booking.name || 'Room #' + booking.roomNumber }}</strong></td>
                <td>{{ formatDate(booking.date) }}</td>
                <td>{{ formatMinutes(booking.startTime) }} – {{ formatMinutes(booking.endTime) }}</td>
                <td><span class="badge badge-sky">{{ booking.usage }}</span></td>
                <td>
                  <button class="btn btn-danger btn-sm" @click="removeBooking(booking.id)">Cancel</button>
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

      <!-- ── New Booking (Staff flow) ── -->
      <div v-if="view === 'newbooking'">
        <div class="page-header">
          <h1>Create a Booking</h1>
          <p class="subtitle">Pick a day, a slot, then a room — or leave room to auto-assign.</p>
        </div>

        <!-- Step indicator -->
        <div class="steps-row">
          <div class="step" :class="{ active: nbStep >= 1, done: nbStep > 1 }">
            <div class="step-num">{{ nbStep > 1 ? '✓' : '1' }}</div>
            <div class="step-label">Day</div>
          </div>
          <div class="step-line" :class="{ active: nbStep > 1 }"></div>
          <div class="step" :class="{ active: nbStep >= 2, done: nbStep > 2 }">
            <div class="step-num">{{ nbStep > 2 ? '✓' : '2' }}</div>
            <div class="step-label">Slot</div>
          </div>
          <div class="step-line" :class="{ active: nbStep > 2 }"></div>
          <div class="step" :class="{ active: nbStep >= 3, done: nbStep > 3 }">
            <div class="step-num">{{ nbStep > 3 ? '✓' : '3' }}</div>
            <div class="step-label">Room</div>
          </div>
          <div class="step-line" :class="{ active: nbStep > 3 }"></div>
          <div class="step" :class="{ active: nbStep >= 4 }">
            <div class="step-num">4</div>
            <div class="step-label">Confirm</div>
          </div>
        </div>

        <!-- Step 1: Day -->
        <div v-if="nbStep === 1" class="step-panel">
          <h2 class="section-title">Select a day</h2>
          <div class="day-grid">
            <button v-for="d in availableDays" :key="d.iso" class="day-card"
              :class="{ selected: nbDay?.iso === d.iso, disabled: d.slotsCount === 0 }" :disabled="d.slotsCount === 0"
              @click="nbSelectDay(d)">
              <div class="day-card-weekday">{{ d.weekday }}</div>
              <div class="day-card-num">{{ d.dayNum }}</div>
              <div class="day-card-month">{{ d.month }}</div>
              <div class="day-card-slots">
                <span v-if="d.slotsCount > 0" class="badge badge-green">{{ d.slotsCount }}</span>
                <span v-else class="badge badge-coral">Full</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Step 2: Slot -->
        <div v-if="nbStep === 2" class="step-panel">
          <button class="back-btn" @click="nbStep = 1">← Back</button>
          <h2 class="section-title">Available slots — {{ nbDay?.weekday }}, {{ nbDay?.dayNum }} {{ nbDay?.month }}</h2>
          <div class="slot-grid">
            <button v-for="slot in nbSlotsForDay" :key="slot.key" class="slot-card"
              :class="{ selected: nbSlot?.startTime === slot.startTime }" @click="nbSelectSlot(slot)">
              <div class="slot-time">{{ formatMinutes(slot.startTime) }}</div>
              <div class="slot-dash">–</div>
              <div class="slot-time">{{ formatMinutes(slot.endTime) }}</div>
              <div class="slot-rooms-count">{{ slot.roomCount }} room{{ slot.roomCount !== 1 ? 's' : '' }}</div>
            </button>
          </div>
          <div v-if="nbSlotsForDay.length === 0" class="empty-state">
            <div class="empty-icon">🕐</div>
            <p>No slots for this day.</p>
          </div>
        </div>

        <!-- Step 3: Room -->
        <div v-if="nbStep === 3" class="step-panel">
          <button class="back-btn" @click="nbStep = 2">← Back</button>
          <h2 class="section-title">Choose a room</h2>
          <div class="room-grid">
            <button v-for="room in nbRoomsForSlot" :key="room.id" class="card room-card room-select-card"
              :class="{ selected: nbRoom?.id?.toString() === room.id?.toString() }" @click="nbSelectRoom(room)">
              <div class="room-card-header">
                <div>
                  <div class="room-name">{{ room.name }}</div>
                  <div class="room-floor">Room #{{ room.roomNumber }}{{ room.floor != null ? ' · Floor ' + room.floor :
                    '' }}</div>
                </div>
                <div class="room-emoji">{{ sizeEmoji(room.size) }}</div>
              </div>
              <div class="room-details">
                <span v-if="room.windows" class="room-detail">🪟 Windows</span>
                <span class="room-detail">{{ room.size ?? 'N/A' }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Step 4: Confirm -->
        <div v-if="nbStep === 4" class="step-panel">
          <button class="back-btn" @click="nbStep = 3">← Back</button>
          <h2 class="section-title">Confirm booking</h2>

          <div class="confirm-card card">
            <div class="confirm-row">
              <span class="confirm-icon">📅</span>
              <div>
                <div class="confirm-label">Date</div>
                <div class="confirm-value">{{ nbDay?.weekday }}, {{ nbDay?.dayNum }} {{ nbDay?.month }}</div>
              </div>
            </div>
            <div class="confirm-row">
              <span class="confirm-icon">🕐</span>
              <div>
                <div class="confirm-label">Slot</div>
                <div class="confirm-value">{{ formatMinutes(nbSlot?.startTime) }} – {{ formatMinutes(nbSlot?.endTime) }}
                </div>
              </div>
            </div>
            <div class="confirm-row">
              <span class="confirm-icon">🏠</span>
              <div>
                <div class="confirm-label">Room</div>
                <div class="confirm-value">{{ nbRoom?.name }} (#{{ nbRoom?.roomNumber }})</div>
              </div>
            </div>
          </div>

          <div class="form-row" style="margin-top:1.5rem; max-width:480px;">
            <div class="form-group">
              <label class="form-label">User name (optional)</label>
              <input class="form-input" v-model="nbUserName" placeholder="Student name…" />
            </div>
            <div class="form-group">
              <label class="form-label">Usage</label>
              <select class="form-input" v-model="nbUsage">
                <option value="STUDY">📖 Study</option>
                <option value="MASTERCLASS">🎓 Masterclass</option>
                <option value="WORKSHOP">🔧 Workshop</option>
                <option value="LUTIER">🎸 Lutier</option>
                <option value="ARTIST">🎨 Artist</option>
                <option value="MANAGER">🏛️ Manager</option>
              </select>
            </div>
          </div>

          <div class="modal-footer" style="justify-content:flex-start; margin-top:1.5rem; padding:0;">
            <button class="btn btn-secondary" @click="view = 'overview'">Cancel</button>
            <button class="btn btn-primary" :disabled="nbConfirming" @click="nbConfirm">
              {{ nbConfirming ? 'Creating…' : 'Create booking →' }}
            </button>
          </div>
        </div>

        <!-- Step 5: Success -->
        <div v-if="nbStep === 5" class="step-panel success-panel">
          <div class="success-icon">✅</div>
          <h2 class="section-title">Booking created!</h2>
          <div class="confirm-card card" style="margin-top:1.5rem; max-width:420px;">
            <div class="confirm-row">
              <span class="confirm-icon">📅</span>
              <div>
                <div class="confirm-label">Date</div>
                <div class="confirm-value">{{ nbLastBooking?.dateLabel }}</div>
              </div>
            </div>
            <div class="confirm-row">
              <span class="confirm-icon">🕐</span>
              <div>
                <div class="confirm-label">Time</div>
                <div class="confirm-value">{{ nbLastBooking?.timeLabel }}</div>
              </div>
            </div>
            <div class="confirm-row">
              <span class="confirm-icon">🏠</span>
              <div>
                <div class="confirm-label">Room</div>
                <div class="confirm-value">{{ nbLastBooking?.roomName }}</div>
              </div>
            </div>
          </div>
          <div style="display:flex; gap:.75rem; margin-top:1.75rem;">
            <button class="btn btn-primary" @click="startNewBooking">+ Another booking</button>
            <button class="btn btn-secondary" @click="view = 'bookings'; loadBookings()">View all bookings</button>
          </div>
        </div>
      </div>
    </main>

    <!-- Add/Edit Room Modal -->
    <Teleport to="body">
      <div v-if="roomModal" class="modal-overlay" @click.self="roomModal = false">
        <div class="modal">
          <h2 class="modal-title">{{ editingRoom ? 'Edit Room' : 'Add New Room' }}</h2>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Name</label>
              <input class="form-input" v-model="roomForm.name" placeholder="The Birch Room" />
            </div>
            <div class="form-group">
              <label class="form-label">Room Number</label>
              <input class="form-input" type="number" v-model.number="roomForm.roomNumber" placeholder="101" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Floor</label>
              <input class="form-input" type="number" v-model.number="roomForm.floor" placeholder="1" />
            </div>
            <div class="form-group">
              <label class="form-label">Size</label>
              <select class="form-input" v-model="roomForm.size">
                <option v-for="size in roomSizeOptions" :key="size" :value="size">
                  {{ sizeLabel(size) }}
                </option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Comments</label>
            <input class="form-input" v-model="roomForm.comments" placeholder="Any notes…" />
          </div>
          <div class="form-group">
            <label class="form-label" style="display:flex; align-items:center; gap:.5rem;">
              <input type="checkbox" v-model="roomForm.windows" style="width:auto;" />
              Has windows
            </label>
          </div>
          <div v-if="roomError" class="error-banner">⚠️ {{ roomError }}</div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="roomModal = false">Cancel</button>
            <button class="btn btn-primary" @click="saveRoom">
              {{ editingRoom ? 'Save changes' : 'Add Room' }} →
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBookingApi } from '../composables/useBookingApi'
import type {
  RoomDto,
  BookingDto,
  AvailableRoomDto,
  AvailableBookingDto,
  SlotOption,
  DayOption,
} from '../types/booking.types'
import { RoomSizeEnum, UsageEnum } from '../enums/booking.enum'
import { RoomFormState } from '../types/room.types'
import { extractErrorMessage } from '../utiles/error.utiles'

const roomSizeOptions = Object.values(RoomSizeEnum)

function sizeLabel(size: RoomSizeEnum): string {
  const labels: Record<RoomSizeEnum, string> = {
    [RoomSizeEnum.SMALL]:  'Small',
    [RoomSizeEnum.MEDIUM]: 'Medium',
    [RoomSizeEnum.BIG]:    'Big',
    [RoomSizeEnum.BNAIG]:  'N/A',
  }
  return labels[size]
}

const roomError = ref('')
const api = useBookingApi()

// ── View state ────────────────────────────────────────
type ViewName = 'overview' | 'rooms' | 'bookings' | 'newbooking'
const view = ref<ViewName>('overview')

// ── Data ──────────────────────────────────────────────
const rooms        = ref<RoomDto[]>([])
const bookings     = ref<BookingDto[]>([])
const availability = ref<AvailableRoomDto[]>([])

const loadingRooms        = ref(false)
const loadingBookings     = ref(false)
const loadingAvailability = ref(false)

const roomSearch    = ref('')
const bookingSearch = ref('')

onMounted(() => {
  loadAvailability()
  loadRooms()
  loadBookings()
})

async function loadAvailability() {
  loadingAvailability.value = true
  try {
    availability.value = await api.getAvailability({ page: 1, limit: 1000 }) ?? []
  } catch (e) {
    roomError.value = extractErrorMessage(e, 'Failed to load availability.')
  } finally {
    loadingAvailability.value = false
  }
}

async function loadRooms() {
  loadingRooms.value = true
  try {
    const data = await api.getRooms({ limit: 200 })
    rooms.value = data?.data ?? []
  } catch (e) {
    roomError.value = extractErrorMessage(e, 'Failed to load rooms.')
  } finally {
    loadingRooms.value = false
  }
}

async function loadBookings() {
  loadingBookings.value = true
  try {
    const data = await api.getBookings({ limit: 200, textFilter: bookingSearch.value || undefined })
    bookings.value = data?.data ?? []
  } catch (e) {
    roomError.value = extractErrorMessage(e, 'Failed to load bookings.')
  } finally {
    loadingBookings.value = false
  }
}

const totalFreeSlots = computed(() =>
  availability.value.reduce((sum, r) => sum + (r.available?.length ?? 0), 0)
)

// ── Filtered lists ────────────────────────────────────
const filteredRooms = computed(() =>
  rooms.value.filter(r => r.name?.toLowerCase().includes(roomSearch.value.toLowerCase()))
)

const filteredBookings = computed(() => {
  const q = bookingSearch.value.toLowerCase()
  return bookings.value.filter(b =>
    (b.user?.firstnames ?? '').toLowerCase().includes(q) ||
    (b.name ?? '').toLowerCase().includes(q)
  )
})

// ── Room CRUD ─────────────────────────────────────────

const roomModal   = ref(false)
const editingRoom = ref<RoomDto | null>(null)
const roomForm    = ref<RoomFormState>({
  name: '', roomNumber: null, floor: null, size: RoomSizeEnum.MEDIUM, comments: '', windows: false,
})

function openAddRoom() {
  editingRoom.value = null
  roomForm.value = { name: '', roomNumber: null, floor: null, size: RoomSizeEnum.MEDIUM, comments: '', windows: false }
  roomError.value = ''
  roomModal.value = true
}

function openEditRoom(room: RoomDto) {
  editingRoom.value = room
  roomForm.value = {
    name:       room.name,
    roomNumber: room.roomNumber,
    floor:      room.floor ?? null,
    size:       room.size ?? RoomSizeEnum.MEDIUM,
    comments:   room.comments ?? '',
    windows:    !!room.windows,
  }
  roomError.value = ''
  roomModal.value = true
}

function toApiPayload(form: RoomFormState) {
  return {
    name:       form.name,
    roomNumber: form.roomNumber ?? undefined,
    floor:      form.floor ?? undefined,
    size:       form.size,
    comments:   form.comments || undefined,
    windows:    form.windows,
  }
}

async function saveRoom() {
  roomError.value = ''
  try {
    const payload = toApiPayload(roomForm.value)
       console.log('PAYLOAD BEING SENT:', payload)   // ← add this

    if (editingRoom.value) {
      await api.updateRoom(editingRoom.value.id, payload)
    } else {
      await api.createRoom(payload)
    }
    roomModal.value = false
    await loadRooms()
  } catch (e) {
    roomError.value = extractErrorMessage(e, 'Failed to save room.')
  }
}

async function removeRoom(id: string) {
  if (!confirm('Delete this room?')) return
  try {
    await api.deleteRoom(id)
    await loadRooms()
  } catch (e) {
    roomError.value = extractErrorMessage(e, 'Failed to delete room.')
  }
}

async function removeBooking(id: string) {
  if (!confirm('Cancel this booking?')) return
  try {
    await api.deleteBooking(id)
    await loadBookings()
  } catch (e) {
    roomError.value = extractErrorMessage(e, 'Failed to cancel booking.')
  }
}


const nbStep        = ref(1)
const nbDay         = ref<DayOption  | null>(null)
const nbSlot        = ref<SlotOption | null>(null)
const nbRoom        = ref<AvailableRoomDto | null>(null)
const nbUserName    = ref('')
const nbUsage       = ref<UsageEnum>(UsageEnum.STUDY)
const nbConfirming  = ref(false)
const nbLastBooking = ref<{ dateLabel: string; timeLabel: string; roomName: string } | null>(null)

function startNewBooking() {
  nbStep.value = 1
  nbDay.value = null
  nbSlot.value = null
  nbRoom.value = null
  nbUserName.value = ''
  nbUsage.value = UsageEnum.STUDY
  view.value = 'newbooking'
  loadAvailability()
}

// Build unique days from availability
const availableDays = computed<DayOption[]>(() => {
  const dayMap = new Map<string, DayOption>()
  for (const room of availability.value) {
    for (const slot of (room.available ?? [])) {
      const key = slot.date
      if (!dayMap.has(key)) {
        const d = new Date(slot.date + 'T00:00:00')
        dayMap.set(key, {
          iso:        slot.date,
          weekday:    d.toLocaleDateString('en', { weekday: 'short' }),
          dayNum:     slot.day,
          month:      d.toLocaleDateString('en', { month: 'short' }),
          slotsCount: 0,
        })
      }
      dayMap.get(key)!.slotsCount++
    }
  }
  return Array.from(dayMap.values()).sort((a, b) => a.iso.localeCompare(b.iso))
})

// Build unique time slots for the selected day, with count of rooms available per slot
const nbSlotsForDay = computed<SlotOption[]>(() => {
  if (!nbDay.value) return []
  const slotMap = new Map<number, SlotOption>()
  for (const room of availability.value) {
    for (const slot of (room.available ?? [])) {
      if (slot.date !== nbDay.value.iso) continue
      const key = slot.startTime
      if (!slotMap.has(key)) {
        slotMap.set(key, { ...slot, roomCount: 0, key })
      }
      slotMap.get(key)!.roomCount++
    }
  }
  return Array.from(slotMap.values()).sort((a, b) => a.startTime - b.startTime)
})

// Rooms that have the selected slot free
const nbRoomsForSlot = computed<AvailableRoomDto[]>(() => {
  if (!nbDay.value || !nbSlot.value) return []
  return availability.value.filter(room =>
    room.available?.some(s => s.date === nbDay.value!.iso && s.startTime === nbSlot.value!.startTime)
  )
})

function nbSelectDay(day: DayOption) {
  nbDay.value = day
  nbSlot.value = null
  nbRoom.value = null
  nbStep.value = 2
}

function nbSelectSlot(slot: SlotOption) {
  nbSlot.value = slot
  nbRoom.value = null
  nbStep.value = 3
}

function nbSelectRoom(room: AvailableRoomDto) {
  nbRoom.value = room
  nbStep.value = 4
}

async function nbConfirm() {
  if (!nbDay.value || !nbSlot.value || !nbRoom.value) return
  nbConfirming.value = true
  try {
    // Lock first
    await api.lockSlot(nbRoom.value.id.toString(), nbSlot.value.date, nbSlot.value.startTime)

    // Create booking
    await api.createBooking({
      roomId:  nbRoom.value.id,
      date:    new Date(nbSlot.value.date + 'T00:00:00').toISOString(),
      hour:    nbSlot.value.hour,
      minutes: nbSlot.value.minutes,
      usage:   nbUsage.value,
    })

    nbLastBooking.value = {
      dateLabel: `${nbDay.value.weekday}, ${nbDay.value.dayNum} ${nbDay.value.month}`,
      timeLabel: `${formatMinutes(nbSlot.value.startTime)} – ${formatMinutes(nbSlot.value.endTime)}`,
      roomName:  `${nbRoom.value.name} (#${nbRoom.value.roomNumber})`,
    }
    nbStep.value = 5
    loadBookings()
    loadAvailability()
  } catch (e) {
    roomError.value = extractErrorMessage(e, 'Booking failed.')
  } finally {
    nbConfirming.value = false
  }
}

// ── Helpers ───────────────────────────────────────────
function formatMinutes(mins: number | undefined | null): string {
  if (mins == null) return ''
  return `${Math.floor(mins / 60).toString().padStart(2, '0')}:${(mins % 60).toString().padStart(2, '0')}`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })
}

function initials(name = ''): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function sizeEmoji(size: RoomSizeEnum | undefined): string {
  const emojis: Record<RoomSizeEnum, string> = {
    [RoomSizeEnum.SMALL]:  '🟢',
    [RoomSizeEnum.MEDIUM]: '🔵',
    [RoomSizeEnum.BIG]:    '🟣',
    [RoomSizeEnum.BNAIG]:  '🏠',
  }
  return size ? (emojis[size] ?? '🏠') : '🏠'
}
</script>

<style scoped>
.steps-row {
  display: flex;
  align-items: center;
  gap: 0;
  margin-bottom: 2.5rem;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .4rem;
}

.step-num {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid var(--border);
  background: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: .85rem;
  color: var(--muted);
  transition: var(--transition);
}

.step.active .step-num {
  border-color: var(--navy);
  background: var(--navy);
  color: var(--white);
}

.step.done .step-num {
  border-color: var(--gold);
  background: var(--gold);
  color: var(--navy-deep);
}

.step-label {
  font-size: .75rem;
  font-weight: 700;
  color: var(--muted);
}

.step.active .step-label {
  color: var(--navy);
}

.step-line {
  flex: 1;
  height: 2px;
  background: var(--border);
  margin: 0 .75rem;
  margin-bottom: 1.2rem;
  transition: var(--transition);
}

.step-line.active {
  background: var(--gold);
}

.step-panel {
  animation: fadeIn .2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.back-btn {
  font-size: .82rem;
  font-weight: 700;
  color: var(--muted);
  cursor: pointer;
  margin-bottom: 1.25rem;
  display: inline-flex;
  align-items: center;
  gap: .3rem;
  transition: var(--transition);
}

.back-btn:hover {
  color: var(--navy);
}

/* Day cards */
.day-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
}

.day-card {
  background: var(--white);
  border: 2px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.25rem 1.5rem;
  min-width: 110px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .35rem;
  cursor: pointer;
  transition: var(--transition);
  font-family: var(--font-body);
}

.day-card:hover:not(.disabled) {
  border-color: var(--navy);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.day-card.selected {
  border-color: var(--navy);
  background: var(--navy);
}

.day-card.selected .day-card-weekday,
.day-card.selected .day-card-month {
  color: rgba(255, 255, 255, .65);
}

.day-card.selected .day-card-num {
  color: var(--white);
}

.day-card.disabled {
  opacity: .45;
  cursor: not-allowed;
}

.day-card-weekday {
  font-size: .75rem;
  font-weight: 800;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: .06em;
}

.day-card-num {
  font-family: var(--font-display);
  font-size: 2rem;
  line-height: 1;
  color: var(--ink);
}

.day-card-month {
  font-size: .78rem;
  font-weight: 700;
  color: var(--muted);
}

.day-card-slots {
  margin-top: .4rem;
}

/* Slot cards */
.slot-grid {
  display: flex;
  flex-wrap: wrap;
  gap: .85rem;
  margin-bottom: 1.5rem;
}

.slot-card {
  background: var(--white);
  border: 2px solid var(--border);
  border-radius: var(--radius-md);
  padding: 1rem 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .2rem;
  cursor: pointer;
  transition: var(--transition);
  font-family: var(--font-body);
  min-width: 120px;
}

.slot-card:hover {
  border-color: var(--navy);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

.slot-card.selected {
  border-color: var(--gold);
  background: var(--gold-100);
}

.slot-time {
  font-family: var(--font-display);
  font-size: 1.2rem;
  color: var(--ink);
}

.slot-dash {
  color: var(--muted);
  font-weight: 700;
  font-size: .8rem;
}

.slot-rooms-count {
  font-size: .72rem;
  font-weight: 700;
  color: var(--muted);
}

/* Room select cards */
.room-select-card {
  cursor: pointer;
  text-align: left;
}

.room-select-card:hover {
  border-color: var(--navy);
  transform: translateY(-2px);
}

.room-select-card.selected {
  border-color: var(--gold);
  background: var(--gold-50);
  box-shadow: 0 0 0 3px rgba(232, 184, 75, .2);
}

/* Confirm */
.confirm-card {
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 480px;
}

.confirm-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.confirm-icon {
  font-size: 1.4rem;
  flex-shrink: 0;
}

.confirm-label {
  font-size: .75rem;
  font-weight: 800;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: .05em;
}

.confirm-value {
  font-weight: 700;
  font-size: .95rem;
  color: var(--ink);
  margin-top: .1rem;
}

.success-panel {
  text-align: left;
}

.success-icon {
  font-size: 3rem;
  margin-bottom: .75rem;
}
</style>
