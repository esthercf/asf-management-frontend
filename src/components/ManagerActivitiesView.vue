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
      <input :placeholder="t('manager.activities.searchPlaceholder')" v-model="teacherNameFilter" @input="debouncedReload" />
    </div>
    <select class="form-input filter-select" v-model="typeFilter" @change="reload">
      <option :value="undefined">{{ t('manager.activities.filters.allTypes') }}</option>
      <option v-for="ty in activityTypeOptions" :key="ty" :value="ty">{{ ty }}</option>
    </select>
    <button class="btn btn-primary" @click="openCreateModal">+ {{ t('manager.activities.create') }}</button>
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
          <th>{{ t('manager.users.columns.actions') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="a in activities" :key="a._id">
          <td>
            <strong>{{ a.teacherRawName }}</strong>
            <div v-if="a.teacherEmail" class="muted-text">{{ a.teacherEmail }}</div>
          </td>
          <td><span class="badge badge-sky">{{ a.type }}</span></td>
          <td>{{ a.date }}</td>
          <td>{{ formatMinutes(a.startTime) }} – {{ formatMinutes(a.endTime) }}</td>
          <td>{{ a.roomNumber ? '#' + a.roomNumber : '—' }}</td>
          <td>{{ a.studentEmail ?? '—' }}</td>
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
        <h2 class="modal-title">{{ editingActivity ? t('manager.activities.editTitle') : t('manager.activities.createTitle') }}</h2>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">{{ t('manager.activities.teacherName') }}</label>
            <input class="form-input" v-model="form.teacherRawName" :disabled="!!editingActivity"
              :title="editingActivity ? t('manager.activities.teacherImmutableHint') : ''" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('manager.activities.teacherEmail') }}</label>
            <input class="form-input" v-model="form.teacherEmail" :disabled="!!editingActivity" />
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
            <input class="form-input" type="date" v-model="form.date" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('manager.festivalEvents.startTime') }}</label>
            <input class="form-input" type="time" v-model="form.startTimeStr" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('manager.festivalEvents.durationMinutes') }}</label>
            <input class="form-input" type="number" min="1" v-model.number="form.durationMinutes" />
          </div>
        </div>

        <h3 class="section-title" style="font-size:.9rem; margin-top:.5rem;">{{ t('manager.activities.studentSection') }}</h3>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">{{ t('manager.activities.columns.student') }}</label>
            <input class="form-input" v-model="form.studentEmail" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('manager.users.folderCode') }}</label>
            <input class="form-input" v-model="form.folderCode" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">{{ t('manager.activities.comments') }}</label>
          <input class="form-input" v-model="form.comments" />
        </div>
        <div class="form-group">
          <label class="form-label">{{ t('manager.activities.internalComments') }}</label>
          <input class="form-input" v-model="form.internalComments" />
        </div>

        <div v-if="formError" class="error-banner">⚠️ {{ formError }}</div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="modalOpen = false">{{ t('common.cancel') }}</button>
          <button class="btn btn-primary" :disabled="saving" @click="save">
            <InlineSpinner v-if="saving" />
            <span v-else>{{ editingActivity ? t('common.save') : t('manager.activities.create') }} →</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useManagerActivityApi } from '../composables/useManagerActivityApi'
import { useRoomApi } from '../composables/useRoomApi'
import { extractErrorMessage } from '../utiles/error.utiles'
import InlineSpinner from './InlineSpinner.vue'
import { ActivityTypeEnum } from '../types/manager-activity.types'
import type { ActivityDto } from '../types/manager-activity.types'
import type { RoomDto } from '../types/room.types'

const { t } = useI18n()
const api = useManagerActivityApi()
const roomApi = useRoomApi()

const activityTypeOptions = Object.values(ActivityTypeEnum)

const activities = ref<ActivityDto[]>([])
const rooms = ref<RoomDto[]>([])
const loading = ref(false)
const pageError = ref('')

const page = ref(1)
const limit = 20
const totalPages = ref(1)
const teacherNameFilter = ref('')
const typeFilter = ref<ActivityTypeEnum | undefined>(undefined)

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
      teacherName: teacherNameFilter.value || undefined,
      type: typeFilter.value,
    })
    activities.value = data?.data ?? []
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
  comments: string
  internalComments: string
  studentEmail: string
  folderCode: string
}

function blankForm(): FormState {
  return {
    type: ActivityTypeEnum.MASTERCLASS, teacherRawName: '', teacherEmail: '',
    date: '', startTimeStr: '09:00', durationMinutes: 45, roomId: undefined,
    comments: '', internalComments: '', studentEmail: '', folderCode: '',
  }
}

const form = ref<FormState>(blankForm())

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
    comments: a.comments ?? '',
    internalComments: a.internalComments ?? '',
    studentEmail: a.studentEmail ?? '',
    folderCode: a.folderCode ?? '',
  }
  formError.value = ''
  modalOpen.value = true
}

async function save() {
  formError.value = ''
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
        comments: form.value.comments || undefined,
        internalComments: form.value.internalComments || undefined,
        studentEmail: form.value.studentEmail || undefined,
        folderCode: form.value.folderCode || undefined,
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
        comments: form.value.comments || undefined,
        internalComments: form.value.internalComments || undefined,
        studentEmail: form.value.studentEmail || undefined,
        folderCode: form.value.folderCode || undefined,
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