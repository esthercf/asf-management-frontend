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

      <div class="nav-item" :class="{ active: view === 'mybookings' }" @click="view = 'mybookings'; loadMyBookings()">
        <span class="nav-icon">📅</span> {{ t('user.nav.myBookings') }}
        <span v-if="myBookings.length" class="badge badge-lav" style="margin-left:auto; padding:.15rem .55rem;">
          {{ myBookings.length }}
        </span>
      </div>

      <div class="nav-item" :class="{ active: view === 'book' }" @click="startBookingFlow">
        <span class="nav-icon">➕</span> {{ t('user.nav.book') }}
      </div>

      <div v-if="userProfile.hasSpecialAccess" class="nav-item" :class="{ active: view === 'special' }"
        @click="view = 'special'; loadSpecialBookings()">
        <span class="nav-icon">⭐</span> {{ t('user.nav.special') }}
        <span v-if="specialBookings.length" class="badge badge-gold" style="margin-left:auto; padding:.15rem .55rem;">
          {{ specialBookings.length }}
        </span>
      </div>

      <div class="nav-item" :class="{ active: view === 'profile' }" @click="view = 'profile'">
        <span class="nav-icon">👤</span> {{ t('user.nav.profile') }}
      </div>

      <div class="sidebar-footer">
        <div class="user-chip">
          <div class="avatar avatar-sage">{{ userProfile.initials }}</div>
          <div class="user-chip-info">
            <div class="name">{{ userProfile.fullName || t('common.loading') }}</div>
            <div class="role">{{ t('user.nav.contestant') }}</div>
          </div>
        </div>
        <button class="btn btn-secondary btn-sm" style="width:100%; margin-top:.75rem; justify-content:center;"
          @click="logout">
          {{ t('auth.logout') }}
        </button>
      </div>
    </aside>

    <!-- Main -->
    <main class="main">

      <!-- ── My Bookings (default view) ── -->
      <div v-if="view === 'mybookings'">
        <div class="page-header">
          <h1>{{ t('user.nav.myBookings') }}</h1>
          <p class="subtitle">{{ t('user.myBookings.subtitle') }}</p>
        </div>

        <!-- Next booking hero -->
        <template v-if="nextBooking">
          <div class="next-booking-hero card">
            <div class="next-booking-label">{{ t('user.myBookings.nextBooking') }}</div>
            <div class="next-booking-main">
              <div class="next-booking-date">
                <div class="next-booking-day">{{ nextBooking.day }}</div>
                <div class="next-booking-month">{{ monthName(nextBooking.month) }}</div>
              </div>
              <div class="next-booking-details">
                <div class="next-booking-room">{{ nextBooking.name || 'Room #' + nextBooking.roomNumber }}</div>
                <div class="next-booking-time">
                  {{ formatMinutes(nextBooking.startTime) }} – {{ formatMinutes(nextBooking.endTime) }}
                </div>
                <span class="badge badge-sky" style="margin-top:.5rem;">{{ nextBooking.usage }}</span>
              </div>
              <button class="btn btn-danger btn-sm next-booking-cancel" @click="cancelBooking(nextBooking.id)">
                {{ t('common.cancel') }}
              </button>
            </div>
          </div>
        </template>

        <!-- Bookings list -->
        <div v-if="loadingMyBookings" class="empty-state">
          <div class="empty-icon">⏳</div>
          <p>{{ t('common.loading') }}</p>
        </div>
        <div v-else-if="myBookings.length === 0" class="empty-state">
          <div class="empty-icon">📭</div>
          <p>{{ t('user.myBookings.empty') }}</p>
          <button class="btn btn-primary" style="margin-top:1rem;" @click="startBookingFlow">
            {{ t('user.nav.book') }} →
          </button>
        </div>
        <div v-else>
          <h2 class="section-title" style="margin-bottom:1rem;">{{ t('user.myBookings.allTitle') }}</h2>
          <div class="booking-list">
            <div v-for="booking in myBookings" :key="booking.id" class="booking-card card"
              :class="{ 'booking-past': isPastBooking(booking) }">
              <div class="booking-card-left">
                <div class="booking-date" :class="{ 'booking-date-past': isPastBooking(booking) }">
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
                <div style="display:flex; gap:.4rem; margin-top:.35rem; flex-wrap:wrap;">
                  <span class="badge badge-sky">{{ booking.usage }}</span>
                  <span v-if="isPastBooking(booking)" class="badge badge-coral">
                    {{ t('user.myBookings.past') }}
                  </span>
                </div>
              </div>
              <div class="booking-card-right">
                <button class="btn btn-danger btn-sm" :disabled="isPastBooking(booking)"
                  :title="isPastBooking(booking) ? t('staff.bookings.cannotCancelPast') : ''"
                  @click="cancelBooking(booking.id)">
                  {{ t('common.cancel') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── New Booking ── -->
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
          <button class="back-btn" @click="view = 'mybookings'">← {{ t('common.cancel') }}</button>
          <h2 class="section-title">{{ t('staff.newBooking.selectDay') }}</h2>
          <div v-if="loadingAvailability" class="empty-state">
            <div class="empty-icon">⏳</div>
            <p>{{ t('common.loading') }}</p>
          </div>
          <div v-else class="day-grid">
            <button v-for="d in availableDays" :key="d.iso" class="day-card"
              :class="{ selected: nbDay?.iso === d.iso, disabled: d.slotsCount === 0 }" :disabled="d.slotsCount === 0"
              @click="nbSelectDay(d)">
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
            <button v-for="slot in nbSlotsForDay" :key="slot.key" class="slot-card"
              :class="{ selected: nbSlot?.startTime === slot.startTime }" @click="nbSelectSlot(slot)">
              <div class="slot-time">{{ formatMinutes(slot.startTime) }}</div>
              <div class="slot-dash">–</div>
              <div class="slot-time">{{ formatMinutes(slot.endTime) }}</div>
              <div class="slot-rooms-count">
                {{ slot.roomCount }} {{ slot.roomCount !== 1 ? t('room.title').toLowerCase() :
                  t('staff.newBooking.room') }}
              </div>
            </button>
          </div>
          <div v-if="nbSlotsForDay.length === 0" class="empty-state">
            <div class="empty-icon">🕐</div>
            <p>{{ t('staff.newBooking.noSlots') }}</p>
          </div>
        </div>

        <!-- Step 3: Room -->
        <div v-if="nbStep === 3" class="step-panel">
          <button class="back-btn" @click="nbStep = 2">← {{ t('common.back') }}</button>
          <h2 class="section-title">{{ t('staff.newBooking.chooseRoom') }}</h2>
          <div class="room-grid">
            <button v-for="room in nbRoomsForSlot" :key="room.id" class="card room-card room-select-card"
              :class="{ selected: nbRoom?.id?.toString() === room.id?.toString() }" @click="nbSelectRoom(room)">
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
          <div class="modal-footer" style="justify-content:flex-start; margin-top:1.5rem; padding:0;">
            <button class="btn btn-secondary" @click="view = 'mybookings'">{{ t('common.cancel') }}</button>
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
            <button class="btn btn-primary" @click="startBookingFlow">
              + {{ t('staff.newBooking.anotherBooking') }}
            </button>
            <button class="btn btn-secondary" @click="view = 'mybookings'; loadMyBookings()">
              {{ t('user.nav.myBookings') }}
            </button>
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
          <div class="empty-icon">⏳</div>
          <p>{{ t('common.loading') }}</p>
        </div>
        <div v-else-if="specialBookings.length === 0" class="empty-state">
          <div class="empty-icon">⭐</div>
          <p>{{ t('user.special.empty') }}</p>
        </div>
        <div v-else>
          <div class="info-banner">{{ t('user.special.hint') }}</div>
          <div class="booking-list">
            <div v-for="booking in specialBookings" :key="booking.id" class="booking-card card booking-card-special">
              <div class="booking-card-left">
                <div class="booking-date booking-date-special">
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
                <button class="btn btn-primary btn-sm" :disabled="pickingId === booking.id"
                  @click="pickSpecialBooking(booking)">
                  {{ pickingId === booking.id ? t('common.loading') : t('user.special.pick') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── My Profile ── -->
      <div v-if="view === 'profile'">
        <div class="page-header">
          <h1>{{ t('user.nav.profile') }}</h1>
          <p class="subtitle">{{ t('user.profile.subtitle') }}</p>
        </div>

        <div v-if="userProfile.loading" class="empty-state">
          <div class="empty-icon">⏳</div>
          <p>{{ t('common.loading') }}</p>
        </div>
        <div v-else-if="userProfile.profile" class="card profile-card">
          <div class="profile-row">
            <div class="avatar avatar-sage profile-avatar">{{ userProfile.initials }}</div>
            <div>
              <div class="profile-name">{{ userProfile.fullName }}</div>
              <div class="profile-email">{{ userProfile.profile.email }}</div>
            </div>
          </div>

          <div class="profile-fields">
            <div class="profile-field">
              <div class="profile-field-label">{{ t('staff.users.columns.country') }}</div>
              <div class="profile-field-value">{{ userProfile.profile.countryCode ?? '—' }}</div>
            </div>
            <div class="profile-field">
              <div class="profile-field-label">{{ t('staff.users.columns.language') }}</div>
              <div class="profile-field-value">{{ userProfile.profile.language ?? '—' }}</div>
            </div>
            <div class="profile-field">
              <div class="profile-field-label">{{ t('staff.users.columns.phone') }}</div>
              <div class="profile-field-value">{{ formatPhone(userProfile.profile) }}</div>
            </div>
            <div class="profile-field">
              <div class="profile-field-label">{{ t('staff.users.columns.tshirt') }}</div>
              <div class="profile-field-value">{{ userProfile.profile.tshirtEnum ?? '—' }}</div>
            </div>
            <div v-if="userProfile.hasSpecialAccess" class="profile-field">
              <div class="profile-field-label">{{ t('staff.users.columns.bookingType') }}</div>
              <div class="profile-field-value">
                <div style="display:flex; gap:.4rem; flex-wrap:wrap;">
                  <span v-for="bt in userProfile.profile.bookingTypeEnum" :key="bt" class="badge badge-lav">
                    {{ bookingTypeLabel(bt) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <p class="profile-note">{{ t('user.profile.contactNote') }}</p>
        </div>
      </div>

    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useBookingApi } from '../composables/useBookingApi';
import { useAuthStore } from '../stores/auth.store';
import { useSessionApi } from '../composables/useSessionApi';
import { useUserApi } from '../composables/useUserApi';
import { UsageEnum, RoomSizeEnum, BookingTypeEnum } from '../enums/booking.enum';
import { BookingDto, AvailableRoomDto, BookingDayOption, BookingSlotOption } from '../types/booking.types';
import { UserDto } from '../types/user.types';
import { extractErrorMessage } from '../utiles/error.utiles';
import { useUserProfileStore } from '../stores/user-profile.store';


// ── Setup ─────────────────────────────────────────────────────────────────
const { t } = useI18n();
const router = useRouter();
const auth = useAuthStore();
const userProfile = useUserProfileStore();
const bookingApi = useBookingApi();
const userApi = useUserApi();
const sessionApi = useSessionApi();
const bookingpi = useBookingApi();

// ── View state ────────────────────────────────────────────────────────────
type ViewName = 'mybookings' | 'book' | 'special' | 'profile'
const view = ref<ViewName>('mybookings')

// ── Data refs ─────────────────────────────────────────────────────────────
const myBookings = ref<BookingDto[]>([])
const specialBookings = ref<BookingDto[]>([])
const availability = ref<AvailableRoomDto[]>([])

const loadingMyBookings = ref(false)
const loadingSpecial = ref(false)
const loadingAvailability = ref(false)

// ── Lifecycle ─────────────────────────────────────────────────────────────
onMounted(async () => {
  // Ensure user profile is loaded (may already be from login)
  if (auth.userId && !userProfile.profile) {
    await userProfile.fetch(auth.userId)
  }
  loadMyBookings()
  if (userProfile.hasSpecialAccess) {
    loadSpecialBookings()
  }
})

// ── Load functions ────────────────────────────────────────────────────────
async function loadMyBookings() {
  loadingMyBookings.value = true
  try {

    const data = await bookingApi.getMyBookings({
      page: 1,
      limit: 200,
      userId: auth.userId!,
      toCome: true //only upcoming bookings
    });
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
  } catch {
    specialBookings.value = []
  } finally {
    loadingSpecial.value = false
  }
}

// ── Computed ──────────────────────────────────────────────────────────────
const nextBooking = computed<BookingDto | null>(() => {
  const upcoming = myBookings.value
    .filter(b => !isPastBooking(b))
    .sort((a, b) => {
      const dateA = new Date(a.date + 'T00:00:00').getTime() + a.startTime * 60000
      const dateB = new Date(b.date + 'T00:00:00').getTime() + b.startTime * 60000
      return dateA - dateB
    })
  return upcoming[0] ?? null
})

// ── Booking actions ───────────────────────────────────────────────────────
async function cancelBooking(id: string) {
  if (!confirm(t('staff.bookings.cancelConfirm'))) return
  try {
    await bookingpi.deleteBooking(id)
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

// ── Auth ──────────────────────────────────────────────────────────────────
async function logout() {
  try { await sessionApi.logout() } finally {
    auth.clear()
    userProfile.clear()
    router.push('/login')
  }
}

// ── New Booking flow ──────────────────────────────────────────────────────
const nbStep = ref(1)
const nbDay = ref<BookingDayOption | null>(null)
const nbSlot = ref<BookingSlotOption | null>(null)
const nbRoom = ref<AvailableRoomDto | null>(null)
const nbUsage = UsageEnum.STUDY;
const nbConfirming = ref(false)
const nbLastBooking = ref<{ dateLabel: string; timeLabel: string; roomName: string } | null>(null)

function startBookingFlow() {
  nbStep.value = 1;
  nbDay.value = null;
  nbSlot.value = null;
  nbRoom.value = null;
  view.value = 'book';
  loadAvailability()
}

const availableDays = computed<BookingDayOption[]>(() => {
  const dayMap = new Map<string, BookingDayOption>()
  for (const room of availability.value) {
    for (const slot of (room.available ?? [])) {
      if (!dayMap.has(slot.date)) {
        const d = new Date(slot.date + 'T00:00:00')
        dayMap.set(slot.date, {
          iso: slot.date,
          weekday: d.toLocaleDateString('en', { weekday: 'short' }),
          dayNum: slot.day,
          month: d.toLocaleDateString('en', { month: 'short' }),
          slotsCount: 0,
        })
      }
      dayMap.get(slot.date)!.slotsCount++
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
      if (!slotMap.has(slot.startTime)) {
        slotMap.set(slot.startTime, { ...slot, roomCount: 0, key: slot.startTime })
      }
      slotMap.get(slot.startTime)!.roomCount++
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
  nbDay.value = day; nbSlot.value = null; nbRoom.value = null; nbStep.value = 2
}
function nbSelectSlot(slot: BookingSlotOption) {
  nbSlot.value = slot; nbRoom.value = null; nbStep.value = 3
}
function nbSelectRoom(room: AvailableRoomDto) {
  nbRoom.value = room; nbStep.value = 4
}

async function nbConfirm() {
  if (!nbDay.value || !nbSlot.value || !nbRoom.value) return
  nbConfirming.value = true
  try {
    await bookingApi.lockSlot(nbRoom.value.id.toString(), nbSlot.value.date, nbSlot.value.startTime)
    await bookingApi.createBooking({
      roomId: nbRoom.value.id,
      date: nbSlot.value.date + 'T00:00:00.000Z',
      hour: nbSlot.value.hour,
      minutes: nbSlot.value.minutes,
      usage: nbUsage,
    })
    nbLastBooking.value = {
      dateLabel: `${nbDay.value.weekday}, ${nbDay.value.dayNum} ${nbDay.value.month}`,
      timeLabel: `${formatMinutes(nbSlot.value.startTime)} – ${formatMinutes(nbSlot.value.endTime)}`,
      roomName: `${nbRoom.value.name} (#${nbRoom.value.roomNumber})`,
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
    [RoomSizeEnum.SMALL]: '🟢', [RoomSizeEnum.MEDIUM]: '🔵',
    [RoomSizeEnum.BIG]: '🟣', [RoomSizeEnum.BNAIG]: '🏠',
  }
  return size ? (emojis[size] ?? '🏠') : '🏠'
}

function monthName(month: number): string {
  return new Date(2000, month - 1, 1).toLocaleDateString('en', { month: 'short' })
}

function formatPhone(u: UserDto): string {
  if (!u.phoneNumber) return '—'
  return u.phoneCode ? `+${u.phoneCode} ${u.phoneNumber}` : u.phoneNumber
}

function bookingTypeLabel(bt: BookingTypeEnum): string {
  return t(`staff.users.bookingTypes.${bt}`)
}
</script>

<style scoped>
/* Steps */
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

/* Room cards */
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

/* Next booking hero */
.next-booking-hero {
  padding: 1.5rem;
  margin-bottom: 2rem;
  border-left: 4px solid var(--navy);
}

.next-booking-label {
  font-size: .72rem;
  font-weight: 800;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: .07em;
  margin-bottom: .75rem;
}

.next-booking-main {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.next-booking-date {
  width: 58px;
  text-align: center;
  flex-shrink: 0;
  background: var(--navy);
  border-radius: var(--radius-md, 8px);
  padding: .5rem;
  color: var(--white);
}

.next-booking-day {
  font-family: var(--font-display);
  font-size: 1.8rem;
  line-height: 1;
}

.next-booking-month {
  font-size: .65rem;
  font-weight: 800;
  text-transform: uppercase;
  opacity: .75;
}

.next-booking-details {
  flex: 1;
  min-width: 0;
}

.next-booking-room {
  font-weight: 800;
  font-size: 1rem;
  color: var(--ink);
}

.next-booking-time {
  font-size: .85rem;
  color: var(--muted);
  font-weight: 600;
  margin-top: .15rem;
}

.next-booking-cancel {
  flex-shrink: 0;
}

/* Booking list */
.booking-list {
  display: flex;
  flex-direction: column;
  gap: .85rem;
}

.booking-card {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1rem 1.25rem;
}

.booking-card-left {
  flex-shrink: 0;
}

.booking-date {
  width: 52px;
  text-align: center;
  background: var(--navy);
  border-radius: var(--radius-md, 8px);
  padding: .4rem .5rem;
  color: var(--white);
}

.booking-date-past {
  background: var(--muted);
}

.booking-date-special {
  background: var(--amber, #c8860a);
}

.booking-day {
  font-family: var(--font-display);
  font-size: 1.5rem;
  line-height: 1;
}

.booking-month {
  font-size: .65rem;
  font-weight: 800;
  text-transform: uppercase;
  opacity: .75;
}

.booking-year {
  font-size: .6rem;
  opacity: .6;
}

.booking-card-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: .2rem;
}

.booking-room {
  font-weight: 700;
  font-size: .9rem;
  color: var(--ink);
}

.booking-time {
  font-size: .82rem;
  color: var(--muted);
  font-weight: 600;
}

.booking-card-right {
  flex-shrink: 0;
}

.booking-past {
  opacity: .65;
}

.booking-card-special {
  border-left: 3px solid var(--gold, #e8b84b);
}

/* Special */
.badge-gold {
  background: var(--gold-100, #fdf8ee);
  color: var(--amber, #c8860a);
  border: 1.5px solid var(--gold, #e8b84b);
}

.info-banner {
  background: var(--gold-100, #fdf8ee);
  border: 1.5px solid var(--gold, #e8b84b);
  border-radius: var(--radius-sm, 6px);
  padding: .75rem 1rem;
  font-size: .85rem;
  font-weight: 600;
  color: var(--ink);
  margin-bottom: 1.25rem;
}

/* Profile */
.profile-card {
  padding: 1.75rem;
  max-width: 540px;
}

.profile-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.75rem;
  padding-bottom: 1.5rem;
  border-bottom: 1.5px solid var(--border);
}

.profile-avatar {
  width: 56px !important;
  height: 56px !important;
  font-size: 1.1rem !important;
}

.profile-name {
  font-family: var(--font-display);
  font-size: 1.2rem;
  color: var(--ink);
}

.profile-email {
  font-size: .82rem;
  color: var(--muted);
  margin-top: .15rem;
}

.profile-fields {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.profile-field {
  display: flex;
  align-items: baseline;
  gap: 1rem;
}

.profile-field-label {
  font-size: .75rem;
  font-weight: 800;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: .05em;
  min-width: 100px;
}

.profile-field-value {
  font-weight: 600;
  font-size: .88rem;
  color: var(--ink);
}

.profile-note {
  font-size: .78rem;
  color: var(--muted);
  margin-top: 1.5rem;
  font-style: italic;
}
</style>