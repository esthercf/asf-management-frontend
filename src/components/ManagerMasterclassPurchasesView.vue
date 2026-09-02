<template>
  <div class="page-header">
    <h1>{{ t('manager.purchases.title') }}</h1>
    <p class="subtitle">{{ t('manager.purchases.subtitle') }}</p>
  </div>

  <div v-if="pageError" class="error-banner"
    style="margin-bottom:1.5rem; display:flex; align-items:center; justify-content:space-between; gap:1rem;">
    <span>⚠️ {{ pageError }}</span>
    <button class="btn btn-secondary btn-sm" @click="pageError = ''">✕</button>
  </div>

  <div class="section-row">
    <select class="form-input filter-select" v-model="statusFilter" @change="reload">
      <option :value="undefined">{{ t('manager.purchases.filters.allStatus') }}</option>
      <option v-for="s in statusOptions" :key="s" :value="s">{{ statusLabel(s) }}</option>
    </select>
    <label class="checkbox-row">
      <input type="checkbox" v-model="unassignedOnly" @change="reload" />
      {{ t('manager.purchases.filters.unassignedOnly') }}
    </label>
    <button class="btn btn-primary" @click="openCreateModal">+ {{ t('manager.purchases.create') }}</button>
  </div>

  <div v-if="loading" class="empty-state">
    <div class="empty-icon">⏳</div>
    <p>{{ t('common.loading') }}</p>
  </div>

  <div v-else class="card" style="overflow:hidden;">
    <table class="data-table">
      <thead>
        <tr>
          <th>{{ t('manager.purchases.columns.student') }}</th>
          <th>{{ t('manager.purchases.columns.teacher') }}</th>
          <th>{{ t('manager.purchases.columns.slot') }}</th>
          <th>{{ t('manager.purchases.columns.status') }}</th>
          <th>{{ t('manager.purchases.columns.price') }}</th>
          <th>{{ t('manager.purchases.columns.purchasedAt') }}</th>
          <th>{{ t('manager.purchases.columns.comments') }}</th>
          <th>{{ t('manager.users.columns.actions') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in purchases" :key="p._id">
          <td>
            <strong>{{ p.studentRawName }}</strong>
            <div class="muted-text">{{ p.studentEmail }}</div>
          </td>
          <td>
            <span v-if="p.teacherRawName">{{ p.teacherRawName }}</span>
            <span v-else class="muted-text">—</span>
          </td>
          <td>
            <span v-if="p.date">{{ p.date }} — {{ formatSlotTime(p.hour, p.minutes) }}</span>
            <span v-else class="muted-text">—</span>
          </td>
          <td>
            <span class="badge" :class="statusBadgeClass(p.status)">{{ statusLabel(p.status) }}</span>
          </td>
          <td>{{ p.price != null ? `${p.price} ${p.currency ?? ''}` : '—' }}</td>
          <td>{{ p.purchasedAt ? new Date(p.purchasedAt).toLocaleDateString() : '—' }}</td>
          <td>{{ p.comments || '—' }}</td>
          <td>
            <div style="display:flex; gap:.5rem;">
              <button class="btn btn-secondary btn-sm" @click="openEditModal(p)">{{ t('common.edit') }}</button>
              <button class="btn btn-danger btn-sm" @click="removePurchase(p._id)">{{ t('common.delete') }}</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="purchases.length === 0" class="empty-state">
      <div class="empty-icon">🎫</div>
      <p>{{ t('manager.purchases.empty') }}</p>
    </div>
  </div>

  <div v-if="totalPages > 1" class="pagination-row">
    <button class="btn btn-secondary btn-sm" :disabled="page <= 1" @click="goToPage(page - 1)">←</button>
    <span class="pagination-label">{{ page }} / {{ totalPages }}</span>
    <button class="btn btn-secondary btn-sm" :disabled="page >= totalPages" @click="goToPage(page + 1)"></button>
  </div>

  <!-- Create/Edit Modal -->
  <Teleport to="body">
    <div v-if="modalOpen" class="modal-overlay" @click.self="modalOpen = false">
      <div class="modal modal-wide">
        <h2 class="modal-title">{{ editingPurchase ? t('manager.purchases.editTitle') :
          t('manager.purchases.createTitle') }}</h2>

        <!-- Student search — create only; editing a purchase never changes who the student is -->
        <div v-if="!editingPurchase" class="form-group">
          <label class="form-label">{{ t('manager.purchases.student') }}</label>
          <div class="search-wrap">
            <input class="form-input" v-model="studentQuery" :placeholder="t('manager.users.searchPlaceholder')"
              @input="onStudentQueryChange" @focus="showStudentResults = true" @blur="onStudentBlur" />
            <div v-if="showStudentResults && studentResults.length > 0" class="results-dropdown">
              <button v-for="u in studentResults" :key="u.id" type="button" class="result-row"
                @mousedown.prevent="pickStudent(u)">
                {{ u.firstnames }} {{ u.surnames }} — {{ u.email }} <span v-if="u.folderCode">({{ u.folderCode
                }})</span>
              </button>
            </div>
          </div>
          <div v-if="pickedStudent" class="selected-chip" style="margin-top:.5rem;">
            <span>{{ pickedStudent.firstnames }} {{ pickedStudent.surnames }} — {{ pickedStudent.email }}</span>
            <button class="clear-btn" type="button" @click="pickedStudent = null">✕</button>
          </div>
        </div>
        <div v-else class="form-group">
          <label class="form-label">{{ t('manager.purchases.student') }}</label>
          <div class="static-value">{{ editingPurchase.studentRawName }} — {{ editingPurchase.studentEmail }}</div>
        </div>

        <div v-if="editingPurchase" class="details-grid">
          <div class="detail-row">
            <span class="detail-label">{{ t('manager.purchases.columns.teacher') }}</span>
            <span>{{ editingPurchase.teacherRawName || '—' }}<span v-if="editingPurchase.teacherEmail"> ({{
              editingPurchase.teacherEmail }})</span></span>
          </div>
          <div class="detail-row">
            <span class="detail-label">{{ t('manager.purchases.columns.slot') }}</span>
            <span>
              <template v-if="editingPurchase.date">{{ editingPurchase.date }} — {{ formatSlotTime(editingPurchase.hour,
                editingPurchase.minutes) }}</template>
              <template v-else>—</template>
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">{{ t('manager.purchases.purchasedAt') }}</span>
            <span>{{ editingPurchase.purchasedAt ? new Date(editingPurchase.purchasedAt).toLocaleDateString() : '—'
              }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">{{ t('manager.purchases.tshirt') }}</span>
            <span>{{ editingPurchase.tshirtEnum || '—' }}</span>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">{{ t('manager.purchases.columns.price') }}</label>
            <input class="form-input" type="number" step="0.01" v-model.number="form.price" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('manager.purchases.currency') }}</label>
            <input class="form-input" v-model="form.currency" placeholder="EUR" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('manager.purchases.orderReference') }}</label>
            <input class="form-input" v-model="form.orderReference" :disabled="!!editingPurchase" />
          </div>
        </div>
        <div class="form-row" v-if="!editingPurchase">
          <div class="form-group">
            <label class="form-label">{{ t('manager.purchases.purchasedAt') }}</label>
            <input class="form-input" type="date" v-model="form.purchasedAt" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('manager.purchases.tshirt') }}</label>
            <select class="form-input" v-model="form.tshirtEnum">
              <option :value="undefined">{{ t('manager.purchases.noTshirt') }}</option>
              <option v-for="s in tshirtOptions" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
        </div>

        <div v-if="editingPurchase" class="form-group">
          <label class="form-label">{{ t('manager.purchases.columns.status') }}</label>
          <select class="form-input" v-model="form.status">
            <option v-for="s in statusOptions" :key="s" :value="s">{{ statusLabel(s) }}</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">{{ t('manager.purchases.columns.comments') }}</label>
          <input class="form-input" v-model="form.comments" />
        </div>

        <!-- Every purchase always has a teaching slot behind it — matches
             the real buying flow (student + slot chosen together, never
             "pay now, figure out the teacher later"). -->
        <template v-if="!editingPurchase">
          <h3 class="section-title" style="font-size:.9rem; margin-top:1rem;">{{
            t('manager.purchases.schedulingSection') }}</h3>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">{{ t('manager.activities.teacherName') }}</label>
              <input class="form-input" v-model="activityForm.teacherRawName" />
            </div>
            <div class="form-group">
              <label class="form-label">{{ t('manager.activities.teacherEmail') }}</label>
              <input class="form-input" v-model="activityForm.teacherEmail" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">{{ t('manager.activities.columns.room') }}</label>
              <select class="form-input" v-model="activityForm.roomId">
                <option :value="undefined">{{ t('manager.activities.noRoom') }}</option>
                <option v-for="r in rooms" :key="r.id" :value="r.id">{{ r.name }} (#{{ r.roomNumber }})</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">{{ t('manager.activities.columns.date') }}</label>
              <input class="form-input" type="date" v-model="activityForm.date" />
            </div>
            <div class="form-group">
              <label class="form-label">{{ t('manager.festivalEvents.startTime') }}</label>
              <input class="form-input" type="time" v-model="activityForm.startTimeStr" />
            </div>
            <div class="form-group">
              <label class="form-label">{{ t('manager.festivalEvents.durationMinutes') }}</label>
              <input class="form-input" type="number" min="1" v-model.number="activityForm.durationMinutes" />
            </div>
          </div>
        </template>

        <div v-if="formError" class="error-banner">⚠️ {{ formError }}</div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="modalOpen = false">{{ t('common.cancel') }}</button>
          <button class="btn btn-primary" :disabled="saving" @click="save">
            <InlineSpinner v-if="saving" />
            <span v-else>{{ editingPurchase ? t('common.save') : t('manager.purchases.create') }}</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useManagerMasterclassPurchaseApi } from '../composables/useManagerMasterclassPurchaseApi'
import { useManagerActivityApi } from '../composables/useManagerActivityApi'
import { useManagerUserApi } from '../composables/useManagerUserApi'
import { useRoomApi } from '../composables/useRoomApi'
import { extractErrorMessage } from '../utiles/error.utiles'
import InlineSpinner from './InlineSpinner.vue'
import { PurchaseStatusEnum } from '../types/manager-masterclass-purchase.types'
import type { MasterclassPurchaseDto } from '../types/manager-masterclass-purchase.types'
import { ActivityTypeEnum } from '../types/manager-activity.types'
import type { RoomDto } from '../types/room.types'
import type { ManagerUserBaseDto } from '../types/manager-user.types'
import { TshirtEnum } from '../enums/user.enum'
const { t } = useI18n()
const api = useManagerMasterclassPurchaseApi()
const activityApi = useManagerActivityApi()
const userApi = useManagerUserApi()
const roomApi = useRoomApi()

const statusOptions = Object.values(PurchaseStatusEnum)
const tshirtOptions = Object.values(TshirtEnum)
function statusLabel(s: PurchaseStatusEnum): string {
  return t(`manager.purchases.status.${s}`)
}
function statusBadgeClass(s: PurchaseStatusEnum): string {
  if (s === PurchaseStatusEnum.SCHEDULED) return 'badge-green'
  if (s === PurchaseStatusEnum.CANCELLED) return 'badge-coral'
  return 'badge-lav'
}

function formatSlotTime(hour: number | undefined, minutes: number | undefined): string {
  if (hour === undefined || minutes === undefined) return ''
  return `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

const purchases = ref<MasterclassPurchaseDto[]>([])
const rooms = ref<RoomDto[]>([])
const loading = ref(false)
const pageError = ref('')

const page = ref(1)
const limit = 20
const totalPages = ref(1)
const statusFilter = ref<PurchaseStatusEnum | undefined>(undefined)
const unassignedOnly = ref(false)

onMounted(async () => {
  await loadRooms()
  await reload()
})

async function loadRooms() {
  try {
    const data = await roomApi.getRooms({ limit: 200 })
    rooms.value = data?.data ?? []
  } catch (e) {
    pageError.value = extractErrorMessage(e)
  }
}

async function reload() {
  loading.value = true
  try {
    const data = await api.getFiltered({
      page: page.value,
      limit,
      status: statusFilter.value,
      unassignedOnly: unassignedOnly.value || undefined,
    })
    purchases.value = data?.data ?? []
    totalPages.value = data?.metadata?.totalPages ?? 1
  } catch (e) {
    pageError.value = extractErrorMessage(e)
  } finally {
    loading.value = false
  }
}

function goToPage(p: number) {
  page.value = p
  reload()
}

async function removePurchase(id: string) {
  if (!confirm(t('manager.purchases.deleteConfirm'))) return
  try {
    await api.remove(id)
    await reload()
  } catch (e) {
    pageError.value = extractErrorMessage(e)
  }
}

// ── Student search (create only) ────────────────────────────────────────
const studentQuery = ref('')
const studentResults = ref<ManagerUserBaseDto[]>([])
const showStudentResults = ref(false)
const pickedStudent = ref<ManagerUserBaseDto | null>(null)
let studentDebounce: ReturnType<typeof setTimeout> | undefined

async function onStudentQueryChange() {
  if (studentDebounce) clearTimeout(studentDebounce)
  studentDebounce = setTimeout(async () => {
    if (studentQuery.value.trim().length < 2) { studentResults.value = []; return }
    try {
      const data = await userApi.getUsers({ page: 1, limit: 10, textFilter: studentQuery.value.trim() })
      studentResults.value = (data?.data ?? []).map(u => ({ id: u.id, email: u.email, firstnames: u.firstnames, surnames: u.surnames, folderCode: u.folderCode }))
    } catch {
      studentResults.value = []
    }
  }, 300)
}
function pickStudent(u: ManagerUserBaseDto) {
  pickedStudent.value = u
  showStudentResults.value = false
  studentQuery.value = ''
}
function onStudentBlur() {
  setTimeout(() => { showStudentResults.value = false }, 100)
}

// ── Create/Edit modal ──────────────────────────────────────────────────
const modalOpen = ref(false)
const editingPurchase = ref<MasterclassPurchaseDto | null>(null)
const saving = ref(false)
const formError = ref('')


interface FormState {
  price: number | undefined
  currency: string
  orderReference: string
  status: PurchaseStatusEnum
  comments: string
  purchasedAt: string
  tshirtEnum: TshirtEnum | undefined
}
function blankForm(): FormState {
  return { price: undefined, currency: '', orderReference: '', status: PurchaseStatusEnum.PENDING, comments: '', purchasedAt: '', tshirtEnum: undefined }
}
const form = ref<FormState>(blankForm())

interface ActivityFormState {
  teacherRawName: string
  teacherEmail: string
  roomId: string | undefined
  date: string
  startTimeStr: string
  durationMinutes: number
}
function blankActivityForm(): ActivityFormState {
  return { teacherRawName: '', teacherEmail: '', roomId: undefined, date: '', startTimeStr: '09:00', durationMinutes: 45 }
}
const activityForm = ref<ActivityFormState>(blankActivityForm())

function openCreateModal() {
  editingPurchase.value = null
  pickedStudent.value = null
  studentQuery.value = ''
  form.value = blankForm()
  activityForm.value = blankActivityForm()
  formError.value = ''
  modalOpen.value = true
}

function openEditModal(p: MasterclassPurchaseDto) {
  editingPurchase.value = p
  form.value = {
    price: p.price,
    currency: p.currency ?? '',
    orderReference: p.orderReference ?? '',
    status: p.status,
    comments: p.comments ?? '',
    purchasedAt: '',
    tshirtEnum: p.tshirtEnum,
  }
  formError.value = ''
  modalOpen.value = true
}

async function save() {
  formError.value = ''

  if (!editingPurchase.value && !pickedStudent.value) {
    formError.value = t('manager.purchases.validation.studentRequired')
    return
  }
  if (!editingPurchase.value && (!activityForm.value.teacherRawName || !activityForm.value.teacherEmail || !activityForm.value.date)) {
    formError.value = t('manager.purchases.validation.schedulingRequired')
    return
  }

  saving.value = true
  try {
    if (editingPurchase.value) {
      await api.update(editingPurchase.value._id, {
        status: form.value.status,
        price: form.value.price,
        currency: form.value.currency || undefined,
        comments: form.value.comments || undefined,
      })
    } else {
      const [hourStr, minuteStr] = activityForm.value.startTimeStr.split(':')
      const activity = await activityApi.create({
        type: ActivityTypeEnum.MASTERCLASS,
        teacherRawName: activityForm.value.teacherRawName,
        teacherEmail: activityForm.value.teacherEmail || undefined,
        date: activityForm.value.date,
        hour: Number(hourStr),
        minutes: Number(minuteStr),
        durationMinutes: activityForm.value.durationMinutes,
        roomId: activityForm.value.roomId,
        studentEmail: pickedStudent.value!.email,
        folderCode: pickedStudent.value!.folderCode,
      })

            await api.create({
        studentRawName: `${pickedStudent.value!.firstnames} ${pickedStudent.value!.surnames}`,
        studentEmail: pickedStudent.value!.email,
        activityId: activity._id,
        // Sent explicitly rather than left to the backend's activityId
        // fallback resolution — using the just-created Activity's own
        // returned value (not activityForm directly), since findOrCreate()
        // may have matched an already-existing Activity with its own
        // stored teacherEmail rather than creating a fresh one.
        teacherRawName: activity.teacherRawName,
        teacherEmail: activity.teacherEmail!,
        date: activity.date,
        hour: activity.hour,
        minutes: activity.minutes,
        price: form.value.price,
        currency: form.value.currency || undefined,
        orderReference: form.value.orderReference || undefined,
        comments: form.value.comments || undefined,
        purchasedAt: form.value.purchasedAt || undefined,
        tshirtEnum: form.value.tshirtEnum,
      })
    }
    modalOpen.value = false
    await reload()
  } catch (e) {
    formError.value = extractErrorMessage(e)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.modal-wide {
  max-width: 680px;
  width: 90vw;
}

.filter-select {
  max-width: 200px;
}

.muted-text {
  color: var(--muted);
  font-size: .78rem;
}

.field-hint {
  font-size: .82rem;
  color: var(--muted);
  margin-bottom: .5rem;
}

.pagination-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.25rem;
}

.pagination-label {
  font-size: .82rem;
  font-weight: 700;
  color: var(--muted);
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: .5rem;
  font-size: .85rem;
  font-weight: 600;
  cursor: pointer;
}

.checkbox-row input {
  width: auto;
}

.search-wrap {
  position: relative;
}

.results-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 50;
  background: var(--white);
  border: 1.5px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, .1);
  max-height: 200px;
  overflow-y: auto;
}

.result-row {
  display: block;
  width: 100%;
  padding: .6rem .8rem;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  font-size: .85rem;
}

.result-row:hover {
  background: var(--gold-100, #f6efe0);
}

.selected-chip {
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  border: 1.5px solid var(--gold, #e8b84b);
  background: var(--gold-50, #fdf8ee);
  border-radius: 8px;
  padding: .4rem .7rem;
  font-size: .85rem;
}

.clear-btn {
  border: none;
  background: none;
  cursor: pointer;
  color: var(--muted);
  font-weight: 700;
}

.static-value {
  padding: .6rem .8rem;
  background: var(--gray-50, #f5f5f5);
  border-radius: 8px;
  font-size: .88rem;
  color: var(--ink);
}

.details-grid {
  display: flex;
  flex-direction: column;
  gap: .6rem;
  margin: 1rem 0;
  padding: .85rem 1rem;
  background: var(--gray-50, #f5f5f5);
  border-radius: 8px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: .85rem;
}

.detail-label {
  font-weight: 700;
  color: var(--muted);
}
</style>