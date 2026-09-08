<template>
  <div class="page-header">
    <h1>{{ t('manager.rehearsals.title') }}</h1>
    <p class="subtitle">{{ t('manager.rehearsals.subtitle') }}</p>
  </div>

  <div v-if="pageError" class="error-banner"
    style="margin-bottom:1.5rem; display:flex; align-items:center; justify-content:space-between; gap:1rem;">
    <span>⚠️ {{ pageError }}</span>
    <button class="btn btn-secondary btn-sm" @click="pageError = ''">✕</button>
  </div>

  <div class="section-row">
    <div class="search-bar">
      <span class="search-icon">🔍</span>
      <input :placeholder="t('manager.rehearsals.searchByStudent')" v-model="studentEmailFilter"
        @input="debouncedReload" />
    </div>
    <div class="search-bar">
      <span class="search-icon">🔍</span>
      <input :placeholder="t('manager.rehearsals.searchByArtist')" v-model="artistEmailFilter"
        @input="debouncedReload" />
    </div>
    <button class="btn btn-primary" @click="openCreateModal">+ {{ t('manager.rehearsals.create') }}</button>
    <button class="btn btn-secondary" :disabled="importing" @click="rehearsalFileInput?.click()">
      <InlineSpinner v-if="importing" />
      <span v-else>📥 {{ t('manager.rehearsals.import') }}</span>
    </button>
    <input ref="rehearsalFileInput" type="file" accept=".xlsx" style="display:none;" @change="onFileSelected" />
  </div>

  <div v-if="importResult" class="card import-result-card">
    <p><strong>{{ importResult.message }}</strong></p>
    <ul v-if="importResult.errors.length > 0" class="import-errors">
      <li v-for="err in importResult.errors" :key="err.row">
        {{ t('manager.festivalEvents.importRowError', { row: err.row }) }}: {{ err.reason }}
      </li>
    </ul>
    <button class="btn btn-secondary btn-sm" @click="importResult = null">{{ t('common.close') }}</button>
  </div>

  <div v-if="loading" class="empty-state">
    <div class="empty-icon">⏳</div>
    <p>{{ t('common.loading') }}</p>
  </div>

  <div v-else class="card" style="overflow:hidden;">
    <table class="data-table">
      <thead>
        <tr>
          <th>{{ t('manager.rehearsals.columns.student') }}</th>
          <th>{{ t('manager.rehearsals.columns.artist') }}</th>
          <th>{{ t('manager.rehearsals.columns.room') }}</th>
          <th>{{ t('manager.rehearsals.columns.day') }}</th>
          <th>{{ t('manager.rehearsals.columns.time') }}</th>
          <th>{{ t('manager.rehearsals.columns.comments') }}</th>
          <th>{{ t('manager.users.columns.actions') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in rehearsals" :key="r._id">
          <td>
            <strong>{{ r.studentFullName ?? t('manager.diplomas.noStudentLinked') }}</strong>
            <div class="muted-text">{{ r.studentEmail }}</div>
          </td>
          <td>
            <strong>{{ r.artistFullName || '—' }}</strong>
            <div v-if="r.artistEmail" class="muted-text">{{ r.artistEmail }}</div>
          </td>
          <td>#{{ r.roomNumber }}</td>
          <td>{{ r.day }}</td>
          <td>{{ r.startTime }} – {{ r.endTime }}</td>
          <td>{{ r.comments || '—' }}</td>
          <td>
            <div style="display:flex; gap:.5rem;">
              <button class="btn btn-secondary btn-sm" @click="openEditModal(r)">{{ t('common.edit') }}</button>
              <button class="btn btn-danger btn-sm" @click="removeRehearsal(r)">{{ t('common.delete') }}</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="rehearsals.length === 0" class="empty-state">
      <div class="empty-icon">🎻</div>
      <p>{{ t('manager.rehearsals.empty') }}</p>
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
        <h2 class="modal-title">
          {{ editingRehearsal ? t('manager.rehearsals.editTitle') : t('manager.rehearsals.createTitle') }}
        </h2>

        <div class="form-group">
          <label class="form-label">{{ t('manager.rehearsals.columns.student') }}</label>
          <div v-if="editingRehearsal" class="form-input" style="background:var(--warm-50, #f6f0e6);">
            {{ editingRehearsal.studentFullName ?? editingRehearsal.studentEmail }}
          </div>
          <UserSelector v-else v-model="selectedStudentId" :options="studentOptions" />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">{{ t('manager.rehearsals.artistEmail') }}</label>
            <input class="form-input" v-model="form.artistEmail" type="email" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('manager.rehearsals.artistFullName') }}</label>
            <input class="form-input" v-model="form.artistFullName" />
            <span class="field-hint">{{ t('manager.rehearsals.artistFallbackHint') }}</span>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">{{ t('manager.rehearsals.columns.room') }}</label>
            <select class="form-input" v-model.number="form.roomNumber">
              <option :value="undefined" disabled>{{ t('manager.diplomas.templatePlaceholder') }}</option>
              <option v-for="r in rooms" :key="r.id" :value="r.roomNumber">{{ r.name }} (#{{ r.roomNumber }})</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('manager.rehearsals.columns.day') }}</label>
            <input class="form-input" type="number" v-model.number="form.day" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('manager.rehearsals.startTime') }}</label>
            <input class="form-input" type="time" v-model="form.startTime" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('manager.rehearsals.endTime') }}</label>
            <input class="form-input" type="time" v-model="form.endTime" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">{{ t('manager.rehearsals.columns.comments') }}</label>
          <input class="form-input" v-model="form.comments" />
        </div>

        <div v-if="formError" class="error-banner">⚠️ {{ formError }}</div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="modalOpen = false">{{ t('common.cancel') }}</button>
          <button class="btn btn-primary" :disabled="saving" @click="save">
            <InlineSpinner v-if="saving" />
            <span v-else>{{ t('common.save') }}</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  useUserRehearsalApi,
  type UserRehearsalDto,
  type ImportUserRehearsalsResult,
} from '../composables/useUserRehearsalApi'
import { useManagerUserApi } from '../composables/useManagerUserApi'
import { useRoomApi } from '../composables/useRoomApi'
import { extractErrorMessage } from '../utiles/error.utiles'
import { RoleType } from '../enums/roles.enum'
import InlineSpinner from './InlineSpinner.vue'
import UserSelector from './UserSelector.vue'
import type { UserBaseDto } from '../types/booking.types'
import type { RoomDto } from '../types/room.types'

const { t } = useI18n()
const api = useUserRehearsalApi()
const userApi = useManagerUserApi()
const roomApi = useRoomApi()

const rehearsals = ref<UserRehearsalDto[]>([])
const rooms = ref<RoomDto[]>([])
const studentOptions = ref<UserBaseDto[]>([])
const loading = ref(false)
const pageError = ref('')

const page = ref(1)
const limit = 20
const totalPages = ref(1)
const studentEmailFilter = ref('')
const artistEmailFilter = ref('')

onMounted(async () => {
  await loadRooms()
  await loadStudentOptions()
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

async function loadStudentOptions() {
  try {
    const data = await userApi.getUsers({ roleType: [RoleType.Contestant], limit: 500 })
    studentOptions.value = (data?.data ?? []).map(u => ({
      id: u.id, email: u.email, firstnames: u.firstnames, surnames: u.surnames,
    }))
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
      studentEmail: studentEmailFilter.value || undefined,
      artistEmail: artistEmailFilter.value || undefined,
    })
    rehearsals.value = data?.data ?? []
    totalPages.value = data?.metadata?.totalPages ?? 1
  } catch (e) {
    pageError.value = extractErrorMessage(e)
  } finally {
    loading.value = false
  }
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

// ── Import ────────────────────────────────────────────────────────────
const rehearsalFileInput = ref<HTMLInputElement | null>(null)
const importing = ref(false)
const importResult = ref<ImportUserRehearsalsResult | null>(null)

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

// ── Create/Edit modal ──────────────────────────────────────────────────
const modalOpen = ref(false)
const editingRehearsal = ref<UserRehearsalDto | null>(null)
const selectedStudentId = ref<string | null>(null)
const saving = ref(false)
const formError = ref('')

interface FormState {
  artistEmail: string
  artistFullName: string
  roomNumber: number | undefined
  day: number | undefined
  startTime: string
  endTime: string
  comments: string
}

function blankForm(): FormState {
  return { artistEmail: '', artistFullName: '', roomNumber: undefined, day: undefined, startTime: '', endTime: '', comments: '' }
}

const form = ref<FormState>(blankForm())

function openCreateModal() {
  editingRehearsal.value = null
  selectedStudentId.value = null
  form.value = blankForm()
  formError.value = ''
  modalOpen.value = true
}

function openEditModal(r: UserRehearsalDto) {
  editingRehearsal.value = r
  form.value = {
    artistEmail: r.artistEmail ?? '',
    artistFullName: r.artistFullName ?? '',
    roomNumber: r.roomNumber,
    day: r.day,
    startTime: r.startTime,
    endTime: r.endTime,
    comments: r.comments ?? '',
  }
  formError.value = ''
  modalOpen.value = true
}

async function save() {
  const studentId = editingRehearsal.value?.studentId ?? selectedStudentId.value
  if (!studentId) {
    formError.value = t('manager.rehearsals.validation.studentRequired')
    return
  }
  if (form.value.roomNumber === undefined || form.value.day === undefined || !form.value.startTime || !form.value.endTime) {
    formError.value = t('manager.users.rehearsal.validation.required')
    return
  }
  formError.value = ''
  saving.value = true
  try {
    await api.saveRehearsal(studentId, {
      artistEmail: form.value.artistEmail || undefined,
      artistFullName: form.value.artistFullName || undefined,
      roomNumber: form.value.roomNumber,
      day: form.value.day,
      startTime: form.value.startTime,
      endTime: form.value.endTime,
      comments: form.value.comments || undefined,
    })
    modalOpen.value = false
    await reload()
  } catch (e) {
    formError.value = extractErrorMessage(e)
  } finally {
    saving.value = false
  }
}

async function removeRehearsal(r: UserRehearsalDto) {
  if (!confirm(t('manager.rehearsals.deleteConfirm'))) return
  try {
    await api.deleteRehearsal(r.studentId)
    await reload()
  } catch (e) {
    pageError.value = extractErrorMessage(e)
  }
}
</script>

<style scoped>
.modal-wide {
  max-width: 640px;
  width: 90vw;
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

.field-hint {
  font-size: .78rem;
  color: var(--muted);
  display: block;
  margin-top: .3rem;
}

.import-result-card {
  padding: 1rem 1.25rem;
  margin-bottom: 1.25rem;
}

.import-errors {
  margin: .75rem 0;
  padding-left: 1.25rem;
  font-size: .85rem;
  color: var(--red, #c00);
}
</style>