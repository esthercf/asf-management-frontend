<template>
  <div class="page-header">
    <h1>{{ t('manager.activities.title') }}</h1>
    <p class="subtitle">{{ t('manager.activities.subtitle') }}</p>
  </div>

  <div v-if="pageError" class="error-banner"
    style="margin-bottom:1.5rem; display:flex; align-items:center; justify-content:space-between; gap:1rem;">
    <span>⚠️ {{ pageError }}</span>
    <button class="btn btn-secondary btn-sm" @click="pageError = ''">✕</button>
  </div>

  <div class="section-row">
    <div class="search-bar">
      <span class="search-icon">🔍</span>
      <input :placeholder="t('manager.activities.searchPlaceholder')" v-model="teacherNameFilter"
        @input="debouncedReload" />
    </div>
    <select class="form-input filter-select" v-model="typeFilter" @change="reload">
      <option :value="undefined">{{ t('manager.activities.filters.allTypes') }}</option>
      <option v-for="ty in activityTypeOptions" :key="ty" :value="ty">{{ ty }}</option>
    </select>
    <button class="btn btn-primary" @click="openCreateModal">+ {{ t('manager.activities.create') }}</button>
    <button class="btn btn-secondary" :disabled="importing" @click="activityFileInput?.click()">
      <InlineSpinner v-if="importing" />
      <span v-else>📥 {{ t('manager.activities.import') }}</span>
    </button>
    <input ref="activityFileInput" type="file" accept=".xlsx" style="display:none;" @change="onFileSelected" />
    <button class="btn btn-secondary" @click="showUserFilter = !showUserFilter">
      {{ showUserFilter ? t('manager.activities.hideArtistJuryFilter') : t('manager.activities.filterByArtistJury') }}
    </button>
  </div>

  <div v-if="importResult" class="card import-result-card">
    <p><strong>{{ importResult.succeeded }}/{{ importResult.total }} {{ t('manager.activities.importedCount')
        }}</strong></p>
    <ul v-if="importResult.errors.length > 0" class="import-errors">
      <li v-for="err in importResult.errors" :key="err.rowNumber">
        {{ t('manager.activities.importRow', { row: err.rowNumber }) }}: {{ err.message }}
      </li>
    </ul>
    <button class="btn btn-secondary btn-sm" @click="importResult = null">{{ t('common.close') }}</button>
  </div>

  <div v-if="showUserFilter" class="form-group" style="max-width:340px; margin-bottom:1.25rem;">
    <MultiUserSelector v-model="selectedUserIds" :options="artistJuryOptions"
      :label="t('manager.activities.filterByArtistJury')" @update:modelValue="onUserFilterChange" />
  </div>

  <div v-if="loading" class="empty-state">
    <div class="empty-icon">⏳</div>
    <p>{{ t('common.loading') }}</p>
  </div>

  <div v-else class="card" style="overflow:hidden;">
    <table class="data-table">
      <thead>
        <tr>
          <th>{{ t('manager.activities.columns.teacher') }}</th>
          <th>{{ t('manager.activities.columns.type') }}</th>
          <th>{{ t('manager.activities.columns.date') }}</th>
          <th>{{ t('manager.activities.columns.time') }}</th>
          <th>{{ t('manager.activities.columns.room') }}</th>
          <th>{{ t('manager.activities.columns.student') }}</th>
          <th>{{ t('manager.activities.columns.users') }}</th>
          <th>{{ t('manager.activities.columns.actions') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="a in activities" :key="a._id">
          <td>
            <strong>{{ a.teacherRawName }}</strong>
            <div v-if="a.teacherEmail" class="muted-text">{{ a.teacherEmail }}</div>
          </td>
          <td>
            <span class="badge badge-sky">{{ a.type }}</span>
            <div v-if="a.label" style="font-size:.8rem; margin-top:.3rem;">{{ a.label }}</div>
            <div v-if="a.location" class="muted-text" style="font-size:.75rem;">{{ a.location }}</div>
          </td>
          <td>{{ a.date }}</td>
          <td>{{ formatMinutes(a.startTime) }} – {{ formatMinutes(a.endTime) }}</td>
          <td>{{ a.roomNumber ? '#' + a.roomNumber : '—' }}</td>
          <td>{{ a.studentEmail ?? '—' }}</td>
          <td>
            <div v-if="a.users && a.users.length > 0" class="bt-tags">
              <span v-for="u in a.users" :key="u.id" class="badge badge-lav bt-tag">
                {{ u.firstnames }} {{ u.surnames }}
              </span>
            </div>
            <span v-else class="muted-text">—</span>
          </td>
          <td>
            <div style="display:flex; gap:.5rem;">
              <button class="btn btn-secondary btn-sm" @click="openEditModal(a)">{{ t('common.edit') }}</button>
              <button class="btn btn-danger btn-sm" @click="removeActivity(a._id)">{{ t('common.delete') }}</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="activities.length === 0" class="empty-state">
      <div class="empty-icon">🎓</div>
      <p>{{ t('manager.activities.empty') }}</p>
    </div>
  </div>

  <div v-if="totalPages > 1" class="pagination-row">
    <button class="btn btn-secondary btn-sm" :disabled="page <= 1" @click="goToPage(page - 1)">←</button>
    <span class="pagination-label">{{ page }} / {{ totalPages }}</span>
    <button class="btn btn-secondary btn-sm" :disabled="page >= totalPages" @click="goToPage(page + 1)">→</button>
  </div>

  <!-- Create/Edit Modal -->
  <Teleport to="body">
    <div v-if="modalOpen" class="modal-overlay" @click.self="modalOpen = false">
      <div class="modal modal-wide">
        <h2 class="modal-title">{{ editingActivity ? t('manager.activities.editTitle') :
          t('manager.activities.createTitle') }}</h2>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">{{ t('manager.activities.teacherName') }}</label>
            <input class="form-input" :class="{ 'has-error': fieldErrors.teacherRawName }" v-model="form.teacherRawName"
              :disabled="!!editingActivity"
              :title="editingActivity ? t('manager.activities.teacherImmutableHint') : ''" />
            <span v-if="fieldErrors.teacherRawName" class="field-error">{{ fieldErrors.teacherRawName }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('manager.activities.teacherEmail') }}</label>
            <input class="form-input" :class="{ 'has-error': fieldErrors.teacherEmail }" v-model="form.teacherEmail"
              :disabled="!!editingActivity" />
            <span v-if="fieldErrors.teacherEmail" class="field-error">{{ fieldErrors.teacherEmail }}</span>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">{{ t('manager.activities.columns.type') }}</label>
            <select class="form-input" v-model="form.type" :disabled="!!editingActivity"
              :title="editingActivity ? t('manager.activities.typeImmutableHint') : ''">
              <option v-for="ty in activityTypeOptions" :key="ty" :value="ty">{{ ty }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('manager.activities.columns.room') }}</label>
            <select class="form-input" v-model="form.roomId">
              <option :value="undefined">{{ t('manager.activities.noRoom') }}</option>
              <option v-for="r in rooms" :key="r.id" :value="r.id">{{ r.name }} (#{{ r.roomNumber }})</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">{{ t('manager.activities.columns.date') }}</label>
            <input class="form-input" :class="{ 'has-error': fieldErrors.date }" type="date" v-model="form.date" />
            <span v-if="fieldErrors.date" class="field-error">{{ fieldErrors.date }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('manager.activities.startTime') }}</label>
            <input class="form-input" :class="{ 'has-error': fieldErrors.startTimeStr }" type="time"
              v-model="form.startTimeStr" />
            <span v-if="fieldErrors.startTimeStr" class="field-error">{{ fieldErrors.startTimeStr }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('manager.activities.durationMinutes') }}</label>
            <input class="form-input" :class="{ 'has-error': fieldErrors.durationMinutes }" type="number" min="1"
              v-model.number="form.durationMinutes" />
            <span v-if="fieldErrors.durationMinutes" class="field-error">{{ fieldErrors.durationMinutes }}</span>
          </div>
        </div>

        <h3 class="section-title" style="font-size:.9rem; margin-top:.5rem;">{{ t('manager.activities.studentSection')
        }}</h3>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">{{ t('manager.activities.columns.student') }}</label>
            <template v-if="form.type === ActivityTypeEnum.MASTERCLASS">
              <input class="form-input" :value="editingActivity?.studentFullName || '—'" disabled />
              <span class="field-hint">{{ t('manager.activities.masterclassStudentHint') }}</span>
            </template>
            <template v-else>
              <input class="form-input" :class="{ 'has-error': fieldErrors.studentEmail }"
                v-model="form.studentEmail" />
              <span v-if="fieldErrors.studentEmail" class="field-error">{{ fieldErrors.studentEmail }}</span>
            </template>
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('manager.activities.folderCode') }}</label>
            <input v-if="form.type === ActivityTypeEnum.MASTERCLASS" class="form-input"
              :value="editingActivity?.folderCode || '—'" disabled />
            <input v-else class="form-input" v-model="form.folderCode" />
          </div>
        </div>

        <div class="form-group">
          <select class="form-input" v-model="linkedRoleFilter" style="max-width:200px; margin-bottom:.4rem;">
            <option value="">{{ t('manager.activities.linkedRoles.all') }}</option>
            <option :value="RoleType.Artist">{{ t('manager.activities.linkedRoles.Artist') }}</option>
            <option :value="RoleType.Jury">{{ t('manager.activities.linkedRoles.Jury') }}</option>
            <option :value="RoleType.Staff">{{ t('manager.activities.linkedRoles.Staff') }}</option>
          </select>
          <MultiUserSelector v-model="form.userIds" :options="linkedUserOptions"
            :label="t('manager.activities.linkedUsers')" />
          <span class="field-hint">{{ t('manager.activities.linkedUsersHint') }}</span>
        </div>

        <div class="form-group">
          <label class="form-label">{{ t('manager.activities.label') }}</label>
          <input class="form-input" v-model="form.label" :placeholder="t('manager.activities.labelPlaceholder')" />
          <span class="field-hint">{{ t('manager.activities.labelHint') }}</span>
        </div>
        <div class="form-group">
          <label class="form-label">{{ t('manager.activities.comments') }}</label>
          <input class="form-input" v-model="form.comments" />
        </div>
        <div class="form-group">
          <label class="form-label">{{ t('manager.activities.location') }}</label>
          <input class="form-input" v-model="form.location" />
        </div>

        <div v-if="formError" class="error-banner">⚠️ {{ formError }}</div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="modalOpen = false">{{ t('common.cancel') }}</button>
          <button class="btn btn-primary" :disabled="saving" @click="save">
            <InlineSpinner v-if="saving" />
            <span v-else>{{ editingActivity ? t('common.save') : t('manager.activities.create') }}</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoomApi } from '../composables/useRoomApi'
import { extractErrorMessage } from '../utiles/error.utiles'
import InlineSpinner from './InlineSpinner.vue'
import { zodErrorsToFieldMap } from '../utiles/zod.utiles'
import { activityFormSchema } from '../validation/activity.schema'
import { useModalScrollLock } from '../composables/useModalScrollLock'
import { ActivityTypeEnum } from '../types/manager-activity.types'
import type { ActivityDto } from '../types/manager-activity.types'
import type { RoomDto } from '../types/room.types'
import { RoleType } from '../enums/roles.enum'
import type { UserBaseDto } from '../types/booking.types'
import { useManagerUserApi } from '../composables/useManagerUserApi'
import MultiUserSelector from './MultiUserSelector.vue'
import { useManagerActivityApi, type ImportActivitiesResult } from '../composables/useManagerActivityApi'

const { t } = useI18n()
const api = useManagerActivityApi()
const roomApi = useRoomApi()
const userApi = useManagerUserApi()

const activityTypeOptions = Object.values(ActivityTypeEnum)
const artistJuryOptions = ref<UserBaseDto[]>([])

const activities = ref<ActivityDto[]>([])
const rooms = ref<RoomDto[]>([])
const loading = ref(false)
const pageError = ref('')

const activityFileInput = ref<HTMLInputElement | null>(null)
const importing = ref(false)
const importResult = ref<ImportActivitiesResult | null>(null)

async function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  importing.value = true
  importResult.value = null
  pageError.value = ''
  try {
    importResult.value = await api.importFromExcel(file)
    await reload()
  } catch (e) {
    pageError.value = extractErrorMessage(e)
  } finally {
    importing.value = false
    input.value = ''
  }
}

const page = ref(1)
const limit = 20
const totalPages = ref(1)
const teacherNameFilter = ref('')
const typeFilter = ref<ActivityTypeEnum | undefined>(undefined)

onMounted(async () => {
  await loadRooms()
  await loadArtistJuryOptions()
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
      teacherName: teacherNameFilter.value || undefined,
      type: typeFilter.value,
      userIds: selectedUserIds.value.length > 0 ? selectedUserIds.value : undefined,
    })
    activities.value = data?.data ?? []
    totalPages.value = data?.metadata?.totalPages ?? 1
  } catch (e) {
    pageError.value = extractErrorMessage(e)
  } finally {
    loading.value = false
  }
}

const selectedUserIds = ref<string[]>([])
const showUserFilter = ref(false)

function onUserFilterChange() {
  page.value = 1
  reload()
}

// ── "Linked users": a small role filter, done here in the browser on the list already loaded ──
const linkableRoles = new Map<string, RoleType[]>() // person id → roles
const linkedRoleFilter = ref<RoleType | ''>('') // '' = everyone
/** The people shown in the "Linked users" list: those of the chosen role, plus anyone already ticked */
const linkedUserOptions = computed(() => artistJuryOptions.value.filter(u =>
  !linkedRoleFilter.value ||
  linkableRoles.get(u.id)?.includes(linkedRoleFilter.value) ||
  form.value.userIds.includes(u.id)))

async function loadArtistJuryOptions() {
  // People an activity can be linked to (and whose schedules can show it): artists (the tuner too),
  // jury, and staff volunteers
  const data = await userApi.getUsers({ roleType: [RoleType.Artist, RoleType.Jury, RoleType.Staff], limit: 200 })
  linkableRoles.clear()
  for (const u of data?.data ?? []) linkableRoles.set(u.id, u.roles)
  artistJuryOptions.value = (data?.data ?? []).map(u => ({
    id: u.id, email: u.email, firstnames: u.firstnames, surnames: u.surnames,
  }))
}
let debounceTimer: ReturnType<typeof setTimeout> | undefined
function debouncedReload() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    page.value = 1
    reload()
  }, 350)
}

function goToPage(p: number) {
  page.value = p
  reload()
}

async function removeActivity(id: string) {
  if (!confirm(t('manager.activities.deleteConfirm'))) return
  try {
    await api.remove(id)
    await reload()
  } catch (e) {
    pageError.value = extractErrorMessage(e)
  }
}

function formatMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

// ── Create/Edit modal ──────────────────────────────────────────────────
const modalOpen = ref(false)
const editingActivity = ref<ActivityDto | null>(null)
const saving = ref(false)
const formError = ref('')

interface FormState {
  type: ActivityTypeEnum
  teacherRawName: string
  teacherEmail: string
  date: string
  startTimeStr: string
  durationMinutes: number
  roomId: string | undefined
  label: string
  comments: string
  location: string
  studentEmail: string
  folderCode: string
  userIds: string[]
}

function blankForm(): FormState {
  return {
    type: ActivityTypeEnum.MASTERCLASS, teacherRawName: '', teacherEmail: '',
    date: '', startTimeStr: '09:00', durationMinutes: 45, roomId: undefined,
    label: '', comments: '', location: '', studentEmail: '', folderCode: '', userIds: [],
  }
}

const form = ref<FormState>(blankForm())

// ── Field messages of the zod validation ──
const activitySchema = computed(() => activityFormSchema(!editingActivity.value))
const fieldErrors = ref<Record<string, string>>({})
// Once a message is showing, re-check on every change so it goes away as soon as the field is fixed.
// (Registered BEFORE the watcher below, so that opening the window ends with a clean slate.)
watch(form, () => {
  if (Object.keys(fieldErrors.value).length === 0) return
  const result = activitySchema.value.safeParse(form.value)
  fieldErrors.value = result.success ? {} : zodErrorsToFieldMap(result.error, t)
}, { deep: true })

watch(modalOpen, () => {
  fieldErrors.value = {}
})

// The page behind the open window must not scroll
useModalScrollLock(modalOpen)

function openCreateModal() {
  editingActivity.value = null
  form.value = blankForm()
  formError.value = ''
  modalOpen.value = true
}

function openEditModal(a: ActivityDto) {
  editingActivity.value = a
  form.value = {
    type: a.type,
    teacherRawName: a.teacherRawName,
    teacherEmail: a.teacherEmail ?? '',
    date: a.date,
    startTimeStr: `${a.hour.toString().padStart(2, '0')}:${a.minutes.toString().padStart(2, '0')}`,
    durationMinutes: a.endTime - a.startTime,
    roomId: a.roomId,
    label: a.label ?? '',
    comments: a.comments ?? '',
    location: a.location ?? '',
    studentEmail: a.studentEmail ?? '',
    folderCode: a.folderCode ?? '',
    userIds: a.userIds ?? [],
  }
  formError.value = ''
  modalOpen.value = true
}

async function save() {
  formError.value = ''
  const result = activitySchema.value.safeParse(form.value)
  if (!result.success) {
    fieldErrors.value = zodErrorsToFieldMap(result.error, t)
    return
  }
  fieldErrors.value = {}
  // Trimmed values and a real number for the duration, as checked
  form.value.teacherRawName = result.data.teacherRawName
  form.value.teacherEmail = result.data.teacherEmail
  form.value.durationMinutes = result.data.durationMinutes
  saving.value = true
  try {
    const [hourStr, minuteStr] = form.value.startTimeStr.split(':')

    if (editingActivity.value) {
      // type/teacherRawName/teacherEmail deliberately not sent — the
      // real UpdateActivityDto has no fields for these (they're
      // create-only, confirmed directly from the backend DTO).
      await api.update(editingActivity.value._id, {
        date: form.value.date,
        hour: Number(hourStr),
        minutes: Number(minuteStr),
        durationMinutes: form.value.durationMinutes,
        roomId: form.value.roomId,
        label: form.value.label.trim(),
        comments: form.value.comments || undefined,
        location: form.value.location.trim(), // empty = clear it
        // A masterclass gets its student only from its purchase
        studentEmail: form.value.type === ActivityTypeEnum.MASTERCLASS ? undefined : form.value.studentEmail || undefined,
        folderCode: form.value.type === ActivityTypeEnum.MASTERCLASS ? undefined : form.value.folderCode || undefined,
        userIds: form.value.userIds.length > 0 ? form.value.userIds : undefined,
      })
    } else {
      await api.create({
        type: form.value.type,
        teacherRawName: form.value.teacherRawName,
        teacherEmail: form.value.teacherEmail || undefined,
        date: form.value.date,
        hour: Number(hourStr),
        minutes: Number(minuteStr),
        durationMinutes: form.value.durationMinutes,
        roomId: form.value.roomId,
        label: form.value.label.trim() || undefined,
        comments: form.value.comments || undefined,
        location: form.value.location || undefined,
        // A masterclass gets its student only from its purchase
        studentEmail: form.value.type === ActivityTypeEnum.MASTERCLASS ? undefined : form.value.studentEmail || undefined,
        folderCode: form.value.type === ActivityTypeEnum.MASTERCLASS ? undefined : form.value.folderCode || undefined,
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

defineExpose({ reload })
</script>

<style scoped>
.modal-wide {
  max-width: 640px;
  width: 90vw;
}

.filter-select {
  max-width: 200px;
}

.muted-text {
  color: var(--muted);
  font-size: .78rem;
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
</style>