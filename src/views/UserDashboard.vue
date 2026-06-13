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
      <div class="nav-item" :class="{ active: view === 'book' }" @click="view = 'book'">
        <span class="nav-icon">🗓️</span> Book a Slot
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

      <!-- ── Book a Slot ── -->
      <div v-if="view === 'book'">
        <div class="page-header">
          <h1>Book a Study Room</h1>
          <p class="subtitle">Pick a day and a slot — we'll assign you a free room.</p>
        </div>

        <!-- Step indicator -->
        <div class="steps-row">
          <div class="step" :class="{ active: step >= 1, done: step > 1 }">
            <div class="step-num">{{ step > 1 ? '✓' : '1' }}</div>
            <div class="step-label">Choose day</div>
          </div>
          <div class="step-line" :class="{ active: step > 1 }"></div>
          <div class="step" :class="{ active: step >= 2, done: step > 2 }">
            <div class="step-num">{{ step > 2 ? '✓' : '2' }}</div>
            <div class="step-label">Pick a slot</div>
          </div>
          <div class="step-line" :class="{ active: step > 2 }"></div>
          <div class="step" :class="{ active: step >= 3 }">
            <div class="step-num">3</div>
            <div class="step-label">Confirm</div>
          </div>
        </div>

        <!-- Step 1: Day picker -->
        <div v-if="step === 1" class="step-panel">
          <h2 class="section-title">Which day works for you?</h2>
          <div class="day-grid">
            <button
              v-for="d in availableDays"
              :key="d.iso"
              class="day-card"
              :class="{ selected: selectedDay?.iso === d.iso, disabled: d.slotsCount === 0 }"
              :disabled="d.slotsCount === 0"
              @click="selectDay(d)"
            >
              <div class="day-card-weekday">{{ d.weekday }}</div>
              <div class="day-card-num">{{ d.dayNum }}</div>
              <div class="day-card-month">{{ d.month }}</div>
              <div class="day-card-slots">
                <span v-if="d.slotsCount > 0" class="badge badge-green">{{ d.slotsCount }} slots</span>
                <span v-else class="badge badge-coral">Full</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Step 2: Slot picker -->
        <div v-if="step === 2" class="step-panel">
          <button class="back-btn" @click="step = 1">← Back</button>
          <h2 class="section-title">Available slots for {{ selectedDay?.weekday }}, {{ selectedDay?.dayNum }} {{ selectedDay?.month }}</h2>
          <p class="subtitle" style="margin-bottom:1.5rem">Each slot is 1 hour · Max 2 slots per day</p>

          <div class="slot-grid">
            <button
              v-for="slot in slotsForSelectedDay"
              :key="slot.startTime"
              class="slot-card"
              :class="{ selected: selectedSlot?.startTime === slot.startTime, locked: slot.locked }"
              :disabled="slot.locked"
              @click="selectSlot(slot)"
            >
              <div class="slot-time">{{ formatMinutes(slot.startTime) }}</div>
              <div class="slot-dash">–</div>
              <div class="slot-time">{{ formatMinutes(slot.endTime) }}</div>
              <div v-if="slot.locked" class="slot-locked-label">Taken</div>
            </button>
          </div>

          <div v-if="slotsForSelectedDay.length === 0" class="empty-state">
            <div class="empty-icon">🕐</div>
            <p>No slots available for this day.</p>
          </div>
        </div>

        <!-- Step 3: Confirm -->
        <div v-if="step === 3" class="step-panel">
          <button class="back-btn" @click="step = 2">← Back</button>
          <h2 class="section-title">Confirm your booking</h2>

          <div class="confirm-card card">
            <div class="confirm-row">
              <span class="confirm-icon">📅</span>
              <div>
                <div class="confirm-label">Date</div>
                <div class="confirm-value">{{ selectedDay?.weekday }}, {{ selectedDay?.dayNum }} {{ selectedDay?.month }}</div>
              </div>
            </div>
            <div class="confirm-row">
              <span class="confirm-icon">🕐</span>
              <div>
                <div class="confirm-label">Time slot</div>
                <div class="confirm-value">{{ formatMinutes(selectedSlot?.startTime) }} – {{ formatMinutes(selectedSlot?.endTime) }}</div>
              </div>
            </div>
            <div class="confirm-row">
              <span class="confirm-icon">🏠</span>
              <div>
                <div class="confirm-label">Room</div>
                <div class="confirm-value">Auto-assigned · any available room</div>
              </div>
            </div>
          </div>

          <div class="form-group" style="margin-top:1.5rem">
            <label class="form-label">Usage</label>
            <select class="form-input" v-model="selectedUsage" style="max-width:280px;">
              <option value="STUDY">📖 Study</option>
              <option value="MASTERCLASS">🎓 Masterclass</option>
              <option value="WORKSHOP">🔧 Workshop</option>
            </select>
          </div>

          <div v-if="lockCountdown > 0" class="lock-banner">
            🔒 Slot reserved for <strong>{{ lockCountdown }}s</strong> — confirm before it expires!
          </div>

          <div class="modal-footer" style="justify-content:flex-start; margin-top:1.5rem; padding:0;">
            <button class="btn btn-secondary" @click="cancelBookingFlow">Cancel</button>
            <button class="btn btn-primary" :disabled="confirming" @click="confirmBooking">
              {{ confirming ? 'Booking…' : 'Confirm booking →' }}
            </button>
          </div>
        </div>

        <!-- Step 4: Success -->
        <div v-if="step === 4" class="step-panel success-panel">
          <div class="success-icon">🎉</div>
          <h2 class="section-title">You're booked!</h2>
          <p class="subtitle">Your room has been reserved. See you there!</p>
          <div class="confirm-card card" style="margin-top:1.5rem; max-width:420px;">
            <div class="confirm-row">
              <span class="confirm-icon">📅</span>
              <div>
                <div class="confirm-label">Date</div>
                <div class="confirm-value">{{ lastBooking?.dateLabel }}</div>
              </div>
            </div>
            <div class="confirm-row">
              <span class="confirm-icon">🕐</span>
              <div>
                <div class="confirm-label">Time</div>
                <div class="confirm-value">{{ lastBooking?.timeLabel }}</div>
              </div>
            </div>
            <div class="confirm-row">
              <span class="confirm-icon">🏠</span>
              <div>
                <div class="confirm-label">Room</div>
                <div class="confirm-value">{{ lastBooking?.roomName ?? 'Assigned' }}</div>
              </div>
            </div>
          </div>
          <button class="btn btn-primary" style="margin-top:1.75rem;" @click="resetFlow">Book another slot</button>
        </div>
      </div>

      <!-- ── My Bookings ── -->
      <div v-if="view === 'bookings'">
        <div class="page-header">
          <h1>My Bookings</h1>
          <p class="subtitle">Your upcoming reservations.</p>
        </div>

        <div v-if="myBookings.length === 0" class="empty-state card" style="padding: 4rem;">
          <div class="empty-icon">📭</div>
          <p>You have no upcoming bookings.</p>
          <button class="btn btn-primary" style="margin-top:1.25rem;" @click="view = 'book'">Book a slot →</button>
        </div>

        <div v-else class="booking-list">
          <div v-for="booking in myBookings" :key="booking.id" class="card booking-item">
            <div class="booking-time-block">
              <div class="day">{{ getDayLabel(booking.date) }}</div>
              <div class="date">{{ getDay(booking.date) }}</div>
            </div>
            <div class="booking-info">
              <div class="room-name-b">{{ booking.name || 'Room #' + booking.roomNumber }}</div>
              <div class="booking-meta">
                {{ formatMinutes(booking.startTime) }} – {{ formatMinutes(booking.endTime) }}
                · {{ booking.usage }}
              </div>
            </div>
            <div class="booking-actions">
              <span class="badge badge-green">Confirmed</span>
              <button class="btn btn-danger btn-sm" @click="cancelBooking(booking.id)">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useBookingApi } from '@/composables/useBookingApi'

const api = useBookingApi()

// ── View & step state ─────────────────────────────────
const view = ref('book')
const step = ref(1)

// ── Availability data (fetched from API) ──────────────
// Shape: AvailableRoomDto[] → [ { id, name, roomNumber, available: AvailableBookingDto[] }, … ]
const availability = ref([])     // raw API response
const myBookings   = ref([])
const confirming   = ref(false)
const lastBooking  = ref(null)

// ── Selection state ───────────────────────────────────
const selectedDay    = ref(null)   // { iso, weekday, dayNum, month, slotsCount }
const selectedSlot   = ref(null)   // AvailableBookingDto
const selectedUsage  = ref('STUDY')

// ── Lock countdown timer ──────────────────────────────
const lockCountdown = ref(0)
let lockTimer = null

// ── Load data on mount ────────────────────────────────
loadAvailability()
loadMyBookings()

async function loadAvailability() {
  try {
    const data = await api.getAvailability()
    availability.value = data
  } catch (e) {
    console.error('Failed to load availability', e)
  }
}

async function loadMyBookings() {
  try {
    const data = await api.getMyBookings()
    myBookings.value = data?.data ?? []
  } catch (e) {
    console.error('Failed to load bookings', e)
  }
}

// ── Compute unique days across all rooms ──────────────
const availableDays = computed(() => {
  const dayMap = new Map()
  for (const room of availability.value) {
    for (const slot of (room.available ?? [])) {
      const key = slot.date
      if (!dayMap.has(key)) {
        const d = new Date(slot.date + 'T00:00:00')
        dayMap.set(key, {
          iso:       slot.date,
          weekday:   d.toLocaleDateString('en', { weekday: 'short' }),
          dayNum:    slot.day,
          month:     d.toLocaleDateString('en', { month: 'short' }),
          slotsCount: 0,
        })
      }
      dayMap.get(key).slotsCount++
    }
  }
  return Array.from(dayMap.values()).sort((a, b) => a.iso.localeCompare(b.iso))
})

// ── Slots for the selected day (deduplicated by startTime) ──
const slotsForSelectedDay = computed(() => {
  if (!selectedDay.value) return []
  const seen = new Set()
  const slots = []
  for (const room of availability.value) {
    for (const slot of (room.available ?? [])) {
      if (slot.date !== selectedDay.value.iso) continue
      if (seen.has(slot.startTime)) continue
      seen.add(slot.startTime)
      slots.push({ ...slot, locked: false })
    }
  }
  return slots.sort((a, b) => a.startTime - b.startTime)
})

// ── Step navigation ───────────────────────────────────
function selectDay(day) {
  selectedDay.value = day
  selectedSlot.value = null
  step.value = 2
}

async function selectSlot(slot) {
  selectedSlot.value = slot

  // Find any room that has this slot free
  const room = availability.value.find(r =>
    r.available?.some(s => s.date === slot.date && s.startTime === slot.startTime)
  )
  if (!room) return

  // Lock the slot on the backend
  try {
    const res = await api.lockSlot(room.id.toString(), slot.date, slot.startTime)
    startLockCountdown(res.expiresInSeconds ?? 60)
  } catch (e) {
    console.error('Lock failed', e)
  }

  step.value = 3
}

function startLockCountdown(seconds) {
  lockCountdown.value = seconds
  clearInterval(lockTimer)
  lockTimer = setInterval(() => {
    lockCountdown.value--
    if (lockCountdown.value <= 0) {
      clearInterval(lockTimer)
      // Slot expired — go back to slot picker
      if (step.value === 3) {
        step.value = 2
        loadAvailability()
      }
    }
  }, 1000)
}

async function confirmBooking() {
  if (!selectedDay.value || !selectedSlot.value) return
  confirming.value = true

  // Find the room that has this slot
  const room = availability.value.find(r =>
    r.available?.some(s => s.date === selectedSlot.value.date && s.startTime === selectedSlot.value.startTime)
  )

  try {
    const booking = await api.createBooking({
      roomId: room.id,
      date:   new Date(selectedSlot.value.date + 'T00:00:00').toISOString(),
      hour:   selectedSlot.value.hour,
      minutes: selectedSlot.value.minutes,
      usage:  selectedUsage.value,
    })

    lastBooking.value = {
      dateLabel: `${selectedDay.value.weekday}, ${selectedDay.value.dayNum} ${selectedDay.value.month}`,
      timeLabel:  `${formatMinutes(selectedSlot.value.startTime)} – ${formatMinutes(selectedSlot.value.endTime)}`,
      roomName:  booking.name ?? room.name,
    }

    clearInterval(lockTimer)
    step.value = 4
    loadMyBookings()
    loadAvailability()
  } catch (e) {
    console.error('Booking failed', e)
  } finally {
    confirming.value = false
  }
}

async function cancelBookingFlow() {
  // Unlock the slot if we locked one
  if (selectedSlot.value && step.value === 3) {
    const room = availability.value.find(r =>
      r.available?.some(s => s.date === selectedSlot.value.date && s.startTime === selectedSlot.value.startTime)
    )
    if (room) {
      try { await api.unlockSlot(room.id.toString(), selectedSlot.value.date, selectedSlot.value.startTime) } catch {}
    }
  }
  resetFlow()
}

function resetFlow() {
  step.value = 1
  selectedDay.value = null
  selectedSlot.value = null
  selectedUsage.value = 'STUDY'
  lockCountdown.value = 0
  clearInterval(lockTimer)
  loadAvailability()
}

async function cancelBooking(id) {
  if (!confirm('Cancel this booking?')) return
  try {
    await api.deleteBooking(id)
    await loadMyBookings()
  } catch (e) { console.error(e) }
}

// ── Helpers ───────────────────────────────────────────
function formatMinutes(mins) {
  if (mins == null) return ''
  const h = Math.floor(mins / 60).toString().padStart(2, '0')
  const m = (mins % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}
function getDayLabel(dateStr) {
  return new Date(dateStr).toLocaleDateString('en', { weekday: 'short' })
}
function getDay(dateStr) {
  return new Date(dateStr).getDate()
}

onUnmounted(() => clearInterval(lockTimer))
</script>

<style scoped>
/* ── Steps ───────────────────────────────────── */
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
  width: 36px; height: 36px;
  border-radius: 50%;
  border: 2px solid var(--border);
  background: var(--white);
  display: flex; align-items: center; justify-content: center;
  font-weight: 800;
  font-size: .85rem;
  color: var(--muted);
  transition: var(--transition);
}
.step.active .step-num  { border-color: var(--navy); background: var(--navy); color: var(--white); }
.step.done .step-num    { border-color: var(--gold); background: var(--gold); color: var(--navy-deep); }
.step-label { font-size: .75rem; font-weight: 700; color: var(--muted); }
.step.active .step-label { color: var(--navy); }
.step-line {
  flex: 1;
  height: 2px;
  background: var(--border);
  margin: 0 .75rem;
  margin-bottom: 1.2rem;
  transition: var(--transition);
}
.step-line.active { background: var(--gold); }

/* ── Step panels ─────────────────────────────── */
.step-panel { animation: fadeIn .2s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

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
.back-btn:hover { color: var(--navy); }

/* ── Day grid ────────────────────────────────── */
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
.day-card:hover:not(.disabled) { border-color: var(--navy); box-shadow: var(--shadow-md); transform: translateY(-2px); }
.day-card.selected { border-color: var(--navy); background: var(--navy); }
.day-card.selected .day-card-weekday,
.day-card.selected .day-card-month { color: rgba(255,255,255,.65); }
.day-card.selected .day-card-num { color: var(--white); }
.day-card.disabled { opacity: .45; cursor: not-allowed; }

.day-card-weekday { font-size: .75rem; font-weight: 800; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; }
.day-card-num     { font-family: var(--font-display); font-size: 2rem; line-height: 1; color: var(--ink); }
.day-card-month   { font-size: .78rem; font-weight: 700; color: var(--muted); }
.day-card-slots   { margin-top: .4rem; }

/* ── Slot grid ───────────────────────────────── */
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
  align-items: center;
  gap: .5rem;
  cursor: pointer;
  transition: var(--transition);
  font-family: var(--font-body);
}
.slot-card:hover:not(.locked) { border-color: var(--navy); box-shadow: var(--shadow-sm); transform: translateY(-1px); }
.slot-card.selected { border-color: var(--gold); background: var(--gold-100); }
.slot-card.locked { opacity: .4; cursor: not-allowed; background: var(--warm-50); }
.slot-time { font-family: var(--font-display); font-size: 1.2rem; color: var(--ink); }
.slot-dash { color: var(--muted); font-weight: 700; }
.slot-locked-label { font-size: .72rem; font-weight: 800; color: var(--red); margin-left: .5rem; }

/* ── Confirm card ────────────────────────────── */
.confirm-card {
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 480px;
}
.confirm-row { display: flex; align-items: center; gap: 1rem; }
.confirm-icon { font-size: 1.4rem; flex-shrink: 0; }
.confirm-label { font-size: .75rem; font-weight: 800; color: var(--muted); text-transform: uppercase; letter-spacing: .05em; }
.confirm-value { font-weight: 700; font-size: .95rem; color: var(--ink); margin-top: .1rem; }

/* ── Lock banner ─────────────────────────────── */
.lock-banner {
  margin-top: 1.25rem;
  padding: .8rem 1.2rem;
  background: var(--gold-100);
  border: 1.5px solid var(--gold);
  border-radius: var(--radius-md);
  font-size: .88rem;
  font-weight: 600;
  color: #7a5000;
  max-width: 480px;
}

/* ── Success ─────────────────────────────────── */
.success-panel { text-align: left; }
.success-icon { font-size: 3rem; margin-bottom: .75rem; }
</style>
