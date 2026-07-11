<template>
  <div class="page">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-logo">
        <div class="logo-icon">📚</div>
        <div>
          <div class="logo-text">StudySpace</div>
          <div class="logo-sub">{{ t('user.panel') }}</div>
        </div>
      </div>

      <span class="nav-section-label">{{ t('user.nav.section') }}</span>
      <div class="nav-item" :class="{ active: view === 'overview' }" @click="view = 'overview'">
        <span class="nav-icon">📊</span> {{ t('user.nav.overview') }}
      </div>
      <div class="nav-item" :class="{ active: view === 'book' }" @click="view = 'book'; loadAvailability()">
        <span class="nav-icon">➕</span> {{ t('user.nav.book') }}
      </div>
      <div class="nav-item" :class="{ active: view === 'mybookings' }" @click="view = 'mybookings'; loadMyBookings()">
        <span class="nav-icon">📅</span> {{ t('user.nav.myBookings') }}
        <span v-if="myBookings.length" class="badge badge-lav" style="margin-left:auto; padding:.15rem .55rem;">
          {{ myBookings.length }}
        </span>
      </div>
      <div
        v-if="hasSpecialAccess"
        class="nav-item"
        :class="{ active: view === 'special' }"
        @click="view = 'special'; loadSpecialBookings()"
      >
        <span class="nav-icon">⭐</span> {{ t('user.nav.special') }}
        <span v-if="specialBookings.length" class="badge badge-gold" style="margin-left:auto; padding:.15rem .55rem;">
          {{ specialBookings.length }}
        </span>
      </div>

      <div class="sidebar-footer">
        <div class="user-chip">
          <div class="avatar avatar-sage">
            {{ userInitials }}
          </div>
          <div class="user-chip-info">
            <div class="name">{{ auth.userId ? t('user.nav.myAccount') : '…' }}</div>
            <div class="role">{{ t('user.nav.contestant') }}</div>
          </div>
        </div>
        <button
          class="btn btn-secondary btn-sm"
          style="width:100%; margin-top:.75rem; justify-content:center;"
          @click="logout"
        >
          {{ t('auth.logout') }}
        </button>
      </div>
    </aside>

    <!-- Main -->
    <main class="main">

      <!-- ── Overview ── -->
      <div v-if="view === 'overview'">
        <div class="page-header">
          <h1>{{ t('user.overview.greeting') }}</h1>
          <p class="subtitle">{{ t('user.overview.subtitle') }}</p>
        </div>

        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-icon">📅</div>
            <div class="stat-value">{{ myBookings.length }}</div>
            <div class="stat-label">{{ t('user.overview.myBookings') }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">✅</div>
            <div class="stat-value">{{ totalFreeSlots }}</div>
            <div class="stat-label">{{ t('user.overview.freeSlots') }}</div>
          </div>
          <div v-if="hasSpecialAccess" class="stat-card stat-card-special">
            <div class="stat-icon">⭐</div>
            <div class="stat-value">{{ specialBookings.length }}</div>
            <div class="stat-label">{{ t('user.overview.specialSlots') }}</div>
          </div>
        </div>

        <!-- Upcoming bookings preview -->
        <div class="section-row">
          <h2 class="section-title">{{ t('user.overview.upcomingTitle') }}</h2>
          <button class="btn btn-primary btn-sm" @click="view = 'book'; loadAvailability()">
            + {{ t('user.nav.book') }}
          </button>
        </div>

        <div v-if="loadingMyBookings" class="empty-state">
          <div class="empty-icon">⏳</div><p>{{ t('common.loading') }}</p>
        </div>
        <div v-else-if="myBookings.length === 0" class="empty-state">
          <div class="empty-icon">📭</div>
          <p>{{ t('user.overview.noBookings') }}</p>
          <button class="btn btn-primary" style="margin-top:1rem;" @click="view = 'book'; loadAvailability()">
            {{ t('user.nav.book') }} →
          </button>
        </div>
        <div v-else class="booking-list">
          <div v-for="booking in upcomingBookings" :key="booking.id" class="booking-card card">
            <div class="booking-card-left">
              <div class="booking-date">
                <div class="booking-day">{{ booking.day }}</div>
                <div class="booking-month">{{ monthName(booking.month) }}</div>
              </div>
            </div>
            <div class="booking-card-body">
              <div class="booking-room">{{ booking.name || 'Room #' + booking.roomNumber }}</div>
              <div class="booking-time">{{ formatMinutes(booking.startTime) }} – {{ formatMinutes(booking.endTime) }}</div>
              <span class="badge badge-sky" style="margin-top:.35rem;">{{ booking.usage }}</span>
            </div>
            <div class="booking-card-right">
              <button
                class="btn btn-danger btn-sm"
                :disabled="isPastBooking(booking)"
                @click="cancelBooking(booking.id)"
              >
                {{ t('common.cancel') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Special slots teaser -->
        <template v-if="hasSpecialAccess && specialBookings.length > 0">
          <div class="section-row" style="margin-top:2rem;">
            <h2 class="section-title">⭐ {{ t('user.overview.specialTitle') }}</h2>
            <button class="btn btn-secondary btn-sm" @click="view = 'special'; loadSpecialBookings()">
              {{ t('user.overview.viewSpecial') }}
            </button>
          </div>
          <p class="subtitle" style="margin-bottom:1.25rem;">{{ t('user.overview.specialHint') }}</p>
        </template>
      </div>

      <!-- ── Book a room ── -->
      <div v-if="view === 'book'">
        <div class="page-header">
          <h1>{{ t('user.book.title') }}</h1>
          <p class="subtitle">{{ t('user.book.subtitle') }}</p>
        </div>

        <!-- Step indicator -->
        <div class="steps-row">
          <div class="step" :class="{ active: nbStep >= 1, done: nbStep > 1 }">
            <div class="step-num">{{ nbStep > 1 ? '✓' : '1' }}</div>
            <div class="step-label">{{ t('staff.newBooking.steps.day') }}</div>
          </div>
          <div class="step-line" :class="{ active: nbStep > 1 }"></div>
          <div class="step" :class="{ active: nbStep >= 2, done: nbStep > 2 }">
            <div class="step-num">{{ nbStep > 2 ? '✓' : '2' }}</div>
            <div class="step-label">{{ t('staff.newBooking.steps.slot') }}</div>
          </div>
          <div class="step-line" :class="{ active: nbStep > 2 }"></div>
          <div class="step" :class="{ active: nbStep >= 3, done: nbStep > 3 }">
            <div class="step-num">{{ nbStep > 3 ? '✓' : '3' }}</div>
            <div class="step-label">{{ t('staff.newBooking.steps.room') }}</div>
          </div>
          <div class="step-line" :class="{ active: nbStep > 3 }"></div>
          <div class="step" :class="{ active: nbStep >= 4 }">
            <div class="step-num">4</div>
            <div class="step-label">{{ t('staff.newBooking.steps.confirm') }}</div>
          </div>
        </div>

        <!-- Step 1: Day -->
        <div v-if="nbStep === 1" class="step-panel">
          <button class="back-btn" @click="view = 'overview'">← {{ t('common.cancel') }}</button>
          <h2 class="section-title">{{ t('staff.newBooking.selectDay') }}</h2>
          <div v-if="loadingAvailability" class="empty-state">
            <div class="empty-icon">⏳</div><p>{{ t('common.loading') }}</p>
          </div>
          <div v-else class="day-grid">
            <button
              v-for="d in availableDays"
              :key="d.iso"
              class="day-card"
              :class="{ selected: nbDay?.iso === d.iso, disabled: d.slotsCount === 0 }"
              :disabled="d.slotsCount === 0"
              @click="nbSelectDay(d)"
            >
              <div class="day-card-weekday">{{ d.weekday }}</div>
              <div class="day-card-num">{{ d.dayNum }}</div>
              <div class="day-card-month">{{ d.month }}</div>
              <div class="day-card-slots">
                <span v-if="d.slotsCount > 0" class="badge badge-green">{{ d.slotsCount }}</span>
                <span v-else class="badge badge-coral">{{ t('staff.newBooking.full') }}</span>
              </div>
            </button>
          </div>
          <div v-if="!loadingAvailability && availableDays.length === 0" class="empty-state">
            <div class="empty-icon">📭</div>
            <p>{{ t('user.book.noAvailability') }}</p>
          </div>
        </div>

        <!-- Step 2: Slot -->
        <div v-if="nbStep === 2" class="step-panel">
          <button class="back-btn" @click="nbStep = 1">← {{ t('common.back') }}</button>
          <h2 class="section-title">
            {{ t('staff.newBooking.availableSlots') }} — {{ nbDay?.weekday }}, {{ nbDay?.dayNum }} {{ nbDay?.month }}
          </h2>
          <div class="slot-grid">
            <button
              v-for="slot in nbSlotsForDay"
              :key="slot.key"
              class="slot-card"
              :class="{ selected: nbSlot?.startTime === slot.startTime }"
              @click="nbSelectSlot(slot)"
            >
              <div class="slot-time">{{ formatMinutes(slot.startTime) }}</div>
              <div class="slot-dash">–</div>
              <div class="slot-time">{{ formatMinutes(slot.endTime) }}</div>
              <div class="slot-rooms-count">
                {{ slot.roomCount }} {{ slot.roomCount !== 1 ? t('room.title').toLowerCase() : t('staff.newBooking.room') }}
              </div>
            </button>
          </div>
          <div v-if="nbSlotsForDay.length === 0" class="empty-state">
            <div class="empty-icon">🕐</div><p>{{ t('staff.newBooking.noSlots') }}</p>
          </div>
        </div>

        <!-- Step 3: Room -->
        <div v-if="nbStep === 3" class="step-panel">
          <button class="back-btn" @click="nbStep = 2">← {{ t('common.back') }}</button>
          <h2 class="section-title">{{ t('staff.newBooking.chooseRoom') }}</h2>
          <div class="room-grid">
            <button
              v-for="room in nbRoomsForSlot"
              :key="room.id"
              class="card room-card room-select-card"
              :class="{ selected: nbRoom?.id?.toString() === room.id?.toString() }"
              @click="nbSelectRoom(room)"
            >
              <div class="room-card-header">
                <div>
                  <div class="room-name">{{ room.name }}</div>
                  <div class="room-floor">
                    Room #{{ room.roomNumber }}{{ room.floor != null ? ' · Floor ' + room.floor : '' }}
                  </div>
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
          <button class="back-btn" @click="nbStep = 3">← {{ t('common.back') }}</button>
          <h2 class="section-title">{{ t('staff.newBooking.confirmTitle') }}</h2>
          <div class="confirm-card card">
            <div class="confirm-row">
              <span class="confirm-icon">📅</span>
              <div>
                <div class="confirm-label">{{ t('booking.fields.date') }}</div>
                <div class="confirm-value">{{ nbDay?.weekday }}, {{ nbDay?.dayNum }} {{ nbDay?.month }}</div>
              </div>
            </div>
            <div class="confirm-row">
              <span class="confirm-icon">🕐</span>
              <div>
                <div class="confirm-label">{{ t('booking.fields.time') }}</div>
                <div class="confirm-value">
                  {{ formatMinutes(nbSlot?.startTime) }} – {{ formatMinutes(nbSlot?.endTime) }}
                </div>
              </div>
            </div>
            <div class="confirm-row">
              <span class="confirm-icon">🏠</span>
              <div>
                <div class="confirm-label">{{ t('booking.fields.room') }}</div>
                <div class="confirm-value">{{ nbRoom?.name }} (#{{ nbRoom?.roomNumber }})</div>
              </div>
            </div>
          </div>
          <div class="form-group" style="margin-top:1.5rem; max-width:320px;">
            <label class="form-label">{{ t('booking.fields.usage') }}</label>
            <select class="form-input" v-model="nbUsage">
              <option v-for="usage in usageOptions" :key="usage" :value="usage">
                {{ usageLabel(usage) }}
              </option>
            </select>
          </div>
          <div class="modal-footer" style="justify-content:flex-start; margin-top:1.5rem; padding:0;">
            <button class="btn btn-secondary" @click="view = 'overview'">{{ t('common.cancel') }}</button>
            <button class="btn btn-primary" :disabled="nbConfirming" @click="nbConfirm">
              {{ nbConfirming ? t('common.loading') : t('user.book.confirm') }}
            </button>
          </div>
        </div>

        <!-- Step 5: Success -->
        <div v-if="nbStep === 5" class="step-panel success-panel">
          <div class="success-icon">✅</div>
          <h2 class="section-title">{{ t('user.book.successTitle') }}</h2>
          <div class="confirm-card card" style="margin-top:1.5rem; max-width:420px;">
            <div class="confirm-row">
              <span class="confirm-icon">📅</span>
              <div>
                <div class="confirm-label">{{ t('booking.fields.date') }}</div>
                <div class="confirm-value">{{ nbLastBooking?.dateLabel }}</div>
              </div>
            </div>
            <div class="confirm-row">
              <span class="confirm-icon">🕐</span>
              <div>
                <div class="confirm-label">{{ t('booking.fields.time') }}</div>
                <div class="confirm-value">{{ nbLastBooking?.timeLabel }}</div>
              </div>
            </div>
            <div class="confirm-row">
              <span class="confirm-icon">🏠</span>
              <div>
                <div class="confirm-label">{{ t('booking.fields.room') }}</div>
                <div class="confirm-value">{{ nbLastBooking?.roomName }}</div>
              </div>
            </div>
          </div>
          <div style="display:flex; gap:.75rem; margin-top:1.75rem;">
            <button class="btn btn-primary" @click="resetBookingFlow">
              + {{ t('staff.newBooking.anotherBooking') }}
            </button>
            <button class="btn btn-secondary" @click="view = 'mybookings'; loadMyBookings()">
              {{ t('user.nav.myBookings') }}
            </button>
          </div>
        </div>
      </div>

      <!-- ── My Bookings ── -->
      <div v-if="view === 'mybookings'">
        <div class="page-header">
          <h1>{{ t('user.nav.myBookings') }}</h1>
          <p class="subtitle">{{ t('user.myBookings.subtitle') }}</p>
        </div>

        <div v-if="loadingMyBookings" class="empty-state">
          <div class="empty-icon">⏳</div><p>{{ t('common.loading') }}</p>
        </div>
        <div v-else-if="myBookings.length === 0" class="empty-state">
          <div class="empty-icon">📭</div>
          <p>{{ t('booking.empty') }}</p>
          <button class="btn btn-primary" style="margin-top:1rem;" @click="view = 'book'; loadAvailability()">
            {{ t('user.nav.book') }} →
          </button>
        </div>
        <div v-else class="booking-list">
          <div
            v-for="booking in myBookings"
            :key="booking.id"
            class="booking-card card"
            :class="{ 'booking-past': isPastBooking(booking) }"
          >
            <div class="booking-card-left">
              <div class="booking-date">
                <div class="booking-day">{{ booking.day }}</div>
                <div class="booking-month">{{ monthName(booking.month) }}</div>
                <div class="booking-year">{{ booking.year }}</div>
              </div>
            </div>
            <div class="booking-card-body">
              <div class="booking-room">{{ booking.name || 'Room #' + booking.roomNumber }}</div>
              <div class="booking-time">
                {{ formatMinutes(booking.startTime) }} – {{ formatMinutes(booking.endTime) }}
              </div>
              <span class="badge badge-sky" style="margin-top:.35rem;">{{ booking.usage }}</span>
              <span v-if="isPastBooking(booking)" class="badge badge-coral" style="margin-top:.35rem; margin-left:.4rem;">
                {{ t('user.myBookings.past') }}
              </span>
            </div>
            <div class="booking-card-right">
              <button
                class="btn btn-danger btn-sm"
                :disabled="isPastBooking(booking)"
                :title="isPastBooking(booking) ? t('staff.bookings.cannotCancelPast') : ''"
                @click="cancelBooking(booking.id)"
              >
                {{ t('common.cancel') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Special Bookings ── -->
      <div v-if="view === 'special'">
        <div class="page-header">
          <h1>⭐ {{ t('user.special.title') }}</h1>
          <p class="subtitle">{{ t('user.special.subtitle') }}</p>
        </div>

        <div v-if="loadingSpecial" class="empty-state">
          <div class="empty-icon">⏳</div><p>{{ t('common.loading') }}</p>
        </div>
        <div v-else-if="specialBookings.length === 0" class="empty-state">
          <div class="empty-icon">⭐</div>
          <p>{{ t('user.special.empty') }}</p>
        </div>
        <div v-else>
          <p class="info-banner">{{ t('user.special.hint') }}</p>
          <div class="booking-list">
            <div
              v-for="booking in specialBookings"
              :key="booking.id"
              class="booking-card card booking-card-special"
            >
              <div class="booking-card-left">
                <div class="booking-date">
                  <div class="booking-day">{{ booking.day }}</div>
                  <div class="booking-month">{{ monthName(booking.month) }}</div>
                </div>
              </div>
              <div class="booking-card-body">
                <div class="booking-room">{{ booking.name || 'Room #' + booking.roomNumber }}</div>
                <div class="booking-time">
                  {{ formatMinutes(booking.startTime) }} – {{ formatMinutes(booking.endTime) }}
                </div>
                <span class="badge badge-gold" style="margin-top:.35rem;">⭐ {{ t('user.special.label') }}</span>
              </div>
              <div class="booking-card-right">
                <button
                  class="btn btn-primary btn-sm"
                  :disabled="pickingId === booking.id"
                  @click="pickSpecialBooking(booking)"
                >
                  {{ pickingId === booking.id ? t('common.loading') : t('user.special.pick') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import type {
  AvailableRoomDto,
} from '../types/room.types'
import { AvailableBookingDto, BookingDto } from '../types/booking.types'
import { useBookingApi } from '../composables/useBookingApi'
import { UsageEnum, RoomSizeEnum } from '../enums/booking.enum'
import { useAuthStore } from '../stores/auth.store'
import { extractErrorMessage } from '../utiles/error.utiles'
import { useSessionApi } from '../composables/useSessionApi'
import { useUserApi } from '../composables/useUserApi'
import { useRoomApi } from '../composables/useRoomApi'

// ── Local UI-only interfaces ──────────────────────────────────────────────

interface BookingDayOption {
  iso:        string
  weekday:    string
  dayNum:     number
  month:      string
  slotsCount: number
}

interface BookingSlotOption extends AvailableBookingDto {
  roomCount: number
  key:       number
}


const { t }  = useI18n();
const router = useRouter();
const auth   = useAuthStore();
const sessionApi    = useSessionApi();
const bookingApi    = useBookingApi();

const usageOptions = Object.values(UsageEnum);


type ViewName = 'overview' | 'book' | 'mybookings' | 'special'
const view = ref<ViewName>('overview')


const userInitials = computed(() => {
  // We don't have the full user object here — just show first letter of userId or '?'
  return auth.userId ? auth.userId.slice(0, 2).toUpperCase() : '?'
})

/**
 * A user has special access if their bookingTypeEnum includes anything
 * other than ALL (which everyone has).
 * This is a frontend hint only — backend enforces the real check.
 */
const hasSpecialAccess = computed(() =>
  auth.roles.length > 0   // always show for now; backend will 403 if not entitled
)

// ── Data refs ─────────────────────────────────────────────────────────────
const myBookings      = ref<BookingDto[]>([])
const specialBookings = ref<BookingDto[]>([])
const availability    = ref<AvailableRoomDto[]>([])

const loadingMyBookings = ref(false)
const loadingSpecial    = ref(false)
const loadingAvailability = ref(false)

onMounted(() => {
  loadMyBookings()
  loadAvailability()
  loadSpecialBookings()
})


async function loadMyBookings() {
  loadingMyBookings.value = true
  try {
    const data = await bookingApi.getMyBookings()
    myBookings.value = data?.data ?? []
  } catch (e) {
    console.error(extractErrorMessage(e))
  } finally {
    loadingMyBookings.value = false
  }
}

async function loadAvailability() {
  loadingAvailability.value = true
  try {
    availability.value = await bookingApi.getAvailability({ page: 1, limit: 1000 }) ?? []
  } catch (e) {
    console.error(extractErrorMessage(e))
  } finally {
    loadingAvailability.value = false
  }
}

async function loadSpecialBookings() {
  loadingSpecial.value = true
  try {
    const data = await bookingApi.getSpecialBookings({ page: 1, limit: 100 })
    specialBookings.value = data?.data ?? []
  } catch (e) {
    // 403 means user doesn't have special access — silently hide the section
    specialBookings.value = []
  } finally {
    loadingSpecial.value = false
  }
}


const totalFreeSlots = computed(() =>
  availability.value.reduce((sum, r) => sum + (r.available?.length ?? 0), 0)
)

const upcomingBookings = computed(() =>
  myBookings.value
    .filter(b => !isPastBooking(b))
    .slice(0, 5)
)


async function cancelBooking(id: string) {
  if (!confirm(t('staff.bookings.cancelConfirm'))) return
  try {
    await bookingApi.deleteBooking(id)
    await loadMyBookings()
  } catch (e) {
    console.error(extractErrorMessage(e))
  }
}

const pickingId = ref<string | null>(null)

async function pickSpecialBooking(booking: BookingDto) {
  if (!confirm(t('user.special.confirmPick'))) return
  pickingId.value = booking.id
  try {
    await bookingApi.pickBooking(booking.id)
    await loadMyBookings()
    await loadSpecialBookings()
    view.value = 'mybookings'
  } catch (e) {
    console.error(extractErrorMessage(e))
  } finally {
    pickingId.value = null
  }
}


async function logout() {
  try {
    await sessionApi.logout()
  } finally {
    auth.clear()
    router.push('/login')
  }
}


const nbStep       = ref(1)
const nbDay        = ref<BookingDayOption | null>(null)
const nbSlot       = ref<BookingSlotOption | null>(null)
const nbRoom       = ref<AvailableRoomDto | null>(null)
const nbUsage      = ref<UsageEnum>(UsageEnum.STUDY)
const nbConfirming = ref(false)
const nbLastBooking = ref<{ dateLabel: string; timeLabel: string; roomName: string } | null>(null)

function resetBookingFlow() {
  nbStep.value  = 1
  nbDay.value   = null
  nbSlot.value  = null
  nbRoom.value  = null
  nbUsage.value = UsageEnum.STUDY
  view.value    = 'book'
  loadAvailability()
}

const availableDays = computed<BookingDayOption[]>(() => {
  const dayMap = new Map<string, BookingDayOption>()
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

const nbSlotsForDay = computed<BookingSlotOption[]>(() => {
  if (!nbDay.value) return []
  const slotMap = new Map<number, BookingSlotOption>()
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

const nbRoomsForSlot = computed<AvailableRoomDto[]>(() => {
  if (!nbDay.value || !nbSlot.value) return []
  return availability.value.filter(room =>
    room.available?.some(s => s.date === nbDay.value!.iso && s.startTime === nbSlot.value!.startTime)
  )
})

function nbSelectDay(day: BookingDayOption) {
  nbDay.value  = day
  nbSlot.value = null
  nbRoom.value = null
  nbStep.value = 2
}

function nbSelectSlot(slot: BookingSlotOption) {
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
    await bookingApi.lockSlot(nbRoom.value.id.toString(), nbSlot.value.date, nbSlot.value.startTime)
    await bookingApi.createBooking({
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
    loadMyBookings()
    loadAvailability()
  } catch (e) {
    console.error(extractErrorMessage(e))
  } finally {
    nbConfirming.value = false
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────
function formatMinutes(mins: number | undefined | null): string {
  if (mins == null) return ''
  return `${Math.floor(mins / 60).toString().padStart(2, '0')}:${(mins % 60).toString().padStart(2, '0')}`
}

function isPastBooking(booking: BookingDto): boolean {
  const d = new Date(booking.date + 'T00:00:00')
  d.setMinutes(booking.endTime)
  return d < new Date()
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

function usageLabel(usage: UsageEnum): string {
  return t(`booking.usage.${usage}`)
}

function monthName(month: number): string {
  return new Date(2000, month - 1, 1).toLocaleDateString('en', { month: 'short' })
}
</script>

<style scoped>
/* ── Steps ── */
.steps-row { display: flex; align-items: center; gap: 0; margin-bottom: 2.5rem; }
.step { display: flex; flex-direction: column; align-items: center; gap: .4rem; }
.step-num {
  width: 36px; height: 36px; border-radius: 50%;
  border: 2px solid var(--border); background: var(--white);
  display: flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: .85rem; color: var(--muted); transition: var(--transition);
}
.step.active .step-num { border-color: var(--navy); background: var(--navy); color: var(--white); }
.step.done   .step-num { border-color: var(--gold); background: var(--gold); color: var(--navy-deep); }
.step-label { font-size: .75rem; font-weight: 700; color: var(--muted); }
.step.active .step-label { color: var(--navy); }
.step-line { flex: 1; height: 2px; background: var(--border); margin: 0 .75rem; margin-bottom: 1.2rem; transition: var(--transition); }
.step-line.active { background: var(--gold); }
.step-panel { animation: fadeIn .2s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

/* ── Back button ── */
.back-btn {
  font-size: .82rem; font-weight: 700; color: var(--muted); cursor: pointer;
  margin-bottom: 1.25rem; display: inline-flex; align-items: center; gap: .3rem; transition: var(--transition);
}
.back-btn:hover { color: var(--navy); }

/* ── Day cards ── */
.day-grid { display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 2rem; }
.day-card {
  background: var(--white); border: 2px solid var(--border); border-radius: var(--radius-lg);
  padding: 1.25rem 1.5rem; min-width: 110px;
  display: flex; flex-direction: column; align-items: center; gap: .35rem;
  cursor: pointer; transition: var(--transition); font-family: var(--font-body);
}
.day-card:hover:not(.disabled) { border-color: var(--navy); box-shadow: var(--shadow-md); transform: translateY(-2px); }
.day-card.selected { border-color: var(--navy); background: var(--navy); }
.day-card.selected .day-card-weekday,
.day-card.selected .day-card-month { color: rgba(255,255,255,.65); }
.day-card.selected .day-card-num { color: var(--white); }
.day-card.disabled { opacity: .45; cursor: not-allowed; }
.day-card-weekday { font-size: .75rem; font-weight: 800; color: var(--muted); text-transform: uppercase; letter-spacing: .06em; }
.day-card-num { font-family: var(--font-display); font-size: 2rem; line-height: 1; color: var(--ink); }
.day-card-month { font-size: .78rem; font-weight: 700; color: var(--muted); }
.day-card-slots { margin-top: .4rem; }

/* ── Slot cards ── */
.slot-grid { display: flex; flex-wrap: wrap; gap: .85rem; margin-bottom: 1.5rem; }
.slot-card {
  background: var(--white); border: 2px solid var(--border); border-radius: var(--radius-md);
  padding: 1rem 1.5rem; display: flex; flex-direction: column; align-items: center; gap: .2rem;
  cursor: pointer; transition: var(--transition); font-family: var(--font-body); min-width: 120px;
}
.slot-card:hover { border-color: var(--navy); box-shadow: var(--shadow-sm); transform: translateY(-1px); }
.slot-card.selected { border-color: var(--gold); background: var(--gold-100); }
.slot-time { font-family: var(--font-display); font-size: 1.2rem; color: var(--ink); }
.slot-dash { color: var(--muted); font-weight: 700; font-size: .8rem; }
.slot-rooms-count { font-size: .72rem; font-weight: 700; color: var(--muted); }

/* ── Room select cards ── */
.room-select-card { cursor: pointer; text-align: left; }
.room-select-card:hover { border-color: var(--navy); transform: translateY(-2px); }
.room-select-card.selected { border-color: var(--gold); background: var(--gold-50); box-shadow: 0 0 0 3px rgba(232,184,75,.2); }

/* ── Confirm ── */
.confirm-card { padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 1rem; max-width: 480px; }
.confirm-row { display: flex; align-items: center; gap: 1rem; }
.confirm-icon { font-size: 1.4rem; flex-shrink: 0; }
.confirm-label { font-size: .75rem; font-weight: 800; color: var(--muted); text-transform: uppercase; letter-spacing: .05em; }
.confirm-value { font-weight: 700; font-size: .95rem; color: var(--ink); margin-top: .1rem; }
.success-panel { text-align: left; }
.success-icon { font-size: 3rem; margin-bottom: .75rem; }

/* ── Booking list ── */
.booking-list { display: flex; flex-direction: column; gap: .85rem; }
.booking-card {
  display: flex; align-items: center; gap: 1.25rem;
  padding: 1rem 1.25rem;
}
.booking-card-left { flex-shrink: 0; }
.booking-date {
  width: 52px; text-align: center;
  background: var(--navy); border-radius: var(--radius-md, 8px);
  padding: .4rem .5rem; color: var(--white);
}
.booking-day   { font-family: var(--font-display); font-size: 1.5rem; line-height: 1; }
.booking-month { font-size: .65rem; font-weight: 800; text-transform: uppercase; opacity: .75; }
.booking-year  { font-size: .6rem; opacity: .6; }
.booking-card-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: .2rem; }
.booking-room  { font-weight: 700; font-size: .9rem; color: var(--ink); }
.booking-time  { font-size: .82rem; color: var(--muted); font-weight: 600; }
.booking-card-right { flex-shrink: 0; }
.booking-past { opacity: .6; }

/* ── Special slots ── */
.booking-card-special { border-left: 3px solid var(--gold, #e8b84b); }
.badge-gold { background: var(--gold-100, #fdf8ee); color: var(--amber, #c8860a); border: 1.5px solid var(--gold, #e8b84b); }

/* ── Info banner ── */
.info-banner {
  background: var(--gold-100, #fdf8ee); border: 1.5px solid var(--gold, #e8b84b);
  border-radius: var(--radius-sm, 6px); padding: .75rem 1rem;
  font-size: .85rem; font-weight: 600; color: var(--ink);
  margin-bottom: 1.25rem;
}

/* ── Stat card special ── */
.stat-card-special { border-top: 3px solid var(--gold, #e8b84b); }
</style>