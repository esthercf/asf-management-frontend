<template>
  <div class="page-header">
    <h1>{{ t('manager.festivalEvents.title') }}</h1>
    <p class="subtitle">{{ t('manager.festivalEvents.subtitle') }}</p>
  </div>

  <div v-if="pageError" class="error-banner"
    style="margin-bottom:1.5rem; display:flex; align-items:center; justify-content:space-between; gap:1rem;">
    <span>⚠️ {{ pageError }}</span>
    <button class="btn btn-secondary btn-sm" @click="pageError = ''">✕</button>
  </div>

  <div class="section-row">
    <div class="search-bar">
      <span class="search-icon">🔍</span>
      <input type="date" class="form-input" v-model="dateFilter" @change="reload" />
    </div>
    <select class="form-input filter-select" v-model="typeFilter" @change="reload">
      <option :value="undefined">{{ t('manager.festivalEvents.filters.allTypes') }}</option>
      <option v-for="ty in eventTypeOptions" :key="ty" :value="ty">{{ eventTypeLabel(ty) }}</option>
    </select>
    <button class="btn btn-primary" @click="openCreateModal">+ {{ t('manager.festivalEvents.create') }}</button>
    <button class="btn btn-secondary" :disabled="importing" @click="fileInput?.click()">
      <InlineSpinner v-if="importing" />
      <span v-else>📥 {{ t('manager.festivalEvents.import') }}</span>
    </button>
    <input ref="fileInput" type="file" accept=".xlsx" style="display:none;" @change="onFileSelected" />
  </div>

  <div v-if="importResult" class="card import-result-card">
    <p><strong>{{ importResult.message }}</strong></p>
    <ul v-if="importResult.errors.length > 0" class="import-errors">
      <li v-for="err in importResult.errors" :key="err.rowNumber">
        {{ t('manager.festivalEvents.importRowError', { row: err.rowNumber }) }}: {{ err.message }}
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
          <th>{{ t('manager.festivalEvents.columns.label') }}</th>
          <th>{{ t('manager.festivalEvents.columns.type') }}</th>
          <th>{{ t('manager.festivalEvents.columns.date') }}</th>
          <th>{{ t('manager.festivalEvents.columns.time') }}</th>
          <th>{{ t('manager.festivalEvents.columns.location') }}</th>
          <th>{{ t('manager.festivalEvents.columns.appliesTo') }}</th>
          <th>{{ t('manager.festivalEvents.columns.style') }}</th>
          <th>{{ t('manager.users.columns.actions') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="ev in events" :key="ev._id">
          <td><strong>{{ ev.label }}</strong></td>
          <td><span class="badge badge-sky">{{ eventTypeLabel(ev.eventType) }}</span></td>
          <td>{{ ev.date }}</td>
          <td>{{ formatHM(ev.hour, ev.minutes) }} – {{ formatMinutes(ev.endTime) }}</td>
          <td>{{ ev.location ?? '—' }}</td>
          <td>{{ ev.appliesTo.join(', ') }}</td>
          <td>
            <span v-if="styleById.get(ev.styleId ?? '')" class="style-chip" :style="{
              background: '#' + styleById.get(ev.styleId ?? '')!.fillColorHex,
            }">{{ styleById.get(ev.styleId ?? '')!.name }}</span>
            <span v-else class="muted-text">—</span>
          </td>
          <td>
            <div style="display:flex; gap:.5rem;">
              <button class="btn btn-secondary btn-sm" @click="openEditModal(ev)">{{ t('common.edit') }}</button>
              <button class="btn btn-danger btn-sm" @click="removeEvent(ev._id)">{{ t('common.delete') }}</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="events.length === 0" class="empty-state">
      <div class="empty-icon">📅</div>
      <p>{{ t('manager.festivalEvents.empty') }}</p>
    </div>
  </div>

  <!-- Create/Edit Modal -->
  <Teleport to="body">
    <div v-if="modalOpen" class="modal-overlay" @click.self="modalOpen = false">
      <div class="modal modal-wide">
        <h2 class="modal-title">{{ editingEvent ? t('manager.festivalEvents.editTitle') :
          t('manager.festivalEvents.createTitle') }}</h2>

        <div class="form-group">
          <label class="form-label">{{ t('manager.festivalEvents.columns.label') }}</label>
          <input class="form-input" v-model="form.label" />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">{{ t('manager.festivalEvents.columns.type') }}</label>
            <select class="form-input" v-model="form.eventType">
              <option v-for="ty in eventTypeOptions" :key="ty" :value="ty">{{ ty }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('manager.festivalEvents.columns.date') }}</label>
            <input class="form-input" type="date" v-model="form.date" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">{{ t('manager.festivalEvents.startTime') }}</label>
            <input class="form-input" type="time" v-model="form.startTimeStr" />
          </div>
           <div class="form-group">
            <label class="form-label">{{ t('manager.festivalEvents.endTime') }}</label>
            <input class="form-input" type="time" v-model="form.endTimeStr" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">{{ t('manager.festivalEvents.columns.location') }}</label>
            <input class="form-input" v-model="form.location" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('manager.festivalEvents.style') }}</label>
            <select class="form-input" v-model="form.styleId">
              <option :value="undefined">{{ t('manager.festivalEvents.noStyle') }}</option>
              <option v-for="s in eventStyles" :key="s._id" :value="s._id">{{ s.name }}</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">{{ t('manager.festivalEvents.appliesToHint') }}</label>
          <input class="form-input" v-model="appliesToText" placeholder="ALL, YOUTH_A, YOUTH_B" />
        </div>

        <div v-if="formError" class="error-banner">⚠️ {{ formError }}</div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="modalOpen = false">{{ t('common.cancel') }}</button>
          <button class="btn btn-primary" :disabled="saving" @click="save">
            <InlineSpinner v-if="saving" />
            <span v-else>{{ editingEvent ? t('common.save') : t('manager.festivalEvents.create') }}</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useManagerFestivalEventApi } from '../composables/useManagerFestivalEventApi'
import type { ImportFestivalEventsResult } from '../composables/useManagerFestivalEventApi'
import { useManagerEventStyleApi } from '../composables/useManagerEventStyleApi'
import { extractErrorMessage } from '../utiles/error.utiles'
import InlineSpinner from './InlineSpinner.vue'
import { FestivalEventTypeEnum } from '../types/manager-festival-event.types'
import type { FestivalEventDto } from '../types/manager-festival-event.types'
import type { EventStyleDto } from '../types/manager-event-style.types'

const { t } = useI18n()
const api = useManagerFestivalEventApi()
const styleApi = useManagerEventStyleApi()

const eventTypeOptions = Object.values(FestivalEventTypeEnum)

function eventTypeLabel(type: FestivalEventTypeEnum): string {
  return t(`manager.festivalEvents.types.${type}`)
}

const events = ref<FestivalEventDto[]>([])
const eventStyles = ref<EventStyleDto[]>([])
const styleById = computed(() => new Map(eventStyles.value.map(s => [s._id, s])))
const loading = ref(false)
const pageError = ref('')

const dateFilter = ref('')
const typeFilter = ref<FestivalEventTypeEnum | undefined>(undefined)

onMounted(async () => {
  await loadStyles()
  await reload()
})

async function loadStyles() {
  try {
    eventStyles.value = await styleApi.getAll()
  } catch (e) {
    pageError.value = extractErrorMessage(e)
  }
}

async function reload() {
  loading.value = true
  try {
    events.value = await api.getFiltered({
      date: dateFilter.value || undefined,
      eventType: typeFilter.value,
    })
  } catch (e) {
    pageError.value = extractErrorMessage(e)
  } finally {
    loading.value = false
  }
}

async function removeEvent(id: string) {
  if (!confirm(t('manager.festivalEvents.deleteConfirm'))) return
  try {
    await api.remove(id)
    await reload()
  } catch (e) {
    pageError.value = extractErrorMessage(e)
  }
}

// ── Import ─────────────────────────────────────────────────────────────
const fileInput = ref<HTMLInputElement | null>(null)
const importing = ref(false)
const importResult = ref<ImportFestivalEventsResult | null>(null)

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
    input.value = '' // allow re-selecting the same file
  }
}

function formatHM(hour: number, minutes: number): string {
  return `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

function formatMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

// ── Create/Edit modal ──────────────────────────────────────────────────
const modalOpen = ref(false)
const editingEvent = ref<FestivalEventDto | null>(null)
const saving = ref(false)
const formError = ref('')
const appliesToText = ref('')

interface FormState {
  label: string
  eventType: FestivalEventTypeEnum
  date: string
  startTimeStr: string // 'HH:mm', bridges to hour/minutes for the API
  endTimeStr: string 
  location: string
  styleId: string | undefined
}

function blankForm(): FormState {
  return {
    label: '', eventType: FestivalEventTypeEnum.OTHER, date: '',
    startTimeStr: '09:00',endTimeStr: '09:45', location: '', styleId: undefined,
  }
}

const form = ref<FormState>(blankForm())

function openCreateModal() {
  editingEvent.value = null
  form.value = blankForm()
  appliesToText.value = 'ALL'
  formError.value = ''
  modalOpen.value = true
}

function openEditModal(ev: FestivalEventDto) {
  editingEvent.value = ev
  form.value = {
    label: ev.label,
    eventType: ev.eventType,
    date: ev.date,
    startTimeStr: formatHM(ev.hour, ev.minutes),
    endTimeStr: formatHM(Math.floor(ev.endTime / 60), ev.endTime % 60),
    location: ev.location ?? '',
    styleId: ev.styleId,
  }
  appliesToText.value = ev.appliesTo.join(', ')
  formError.value = ''
  modalOpen.value = true
}

async function save() {
  formError.value = ''
  const [hourStr, minuteStr] = form.value.startTimeStr.split(':')
  const [endHourStr, endMinuteStr] = form.value.endTimeStr.split(':')
  if (Number(endHourStr) * 60 + Number(endMinuteStr) <= Number(hourStr) * 60 + Number(minuteStr)) {
    formError.value = t('manager.festivalEvents.validation.endAfterStart')
    return
  }

  saving.value = true
  try {
    const appliesTo = appliesToText.value.split(',').map(s => s.trim()).filter(Boolean)

    if (editingEvent.value) {
      await api.update(editingEvent.value._id, {
        label: form.value.label,
        eventType: form.value.eventType,
        date: form.value.date,
        hour: Number(hourStr),
        minutes: Number(minuteStr),
        endHour: Number(endHourStr),
        endMinutes: Number(endMinuteStr),
        location: form.value.location || undefined,
        appliesTo,
        styleId: form.value.styleId,
      })
    } else {
      await api.create({
        label: form.value.label,
        eventType: form.value.eventType,
        date: form.value.date,
        hour: Number(hourStr),
        minutes: Number(minuteStr),
        endHour: Number(endHourStr),
        endMinutes: Number(endMinuteStr),
        location: form.value.location || undefined,
        appliesTo,
        styleId: form.value.styleId,
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
  font-size: .82rem;
}

.style-chip {
  padding: .2rem .6rem;
  border-radius: 6px;
  font-size: .78rem;
  font-weight: 600;
  border: 1px solid var(--border);
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