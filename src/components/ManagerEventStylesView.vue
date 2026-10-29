<template>
  <div class="page-header">
    <h1>{{ t('manager.eventStyles.title') }}</h1>
    <p class="subtitle">{{ t('manager.eventStyles.subtitle') }}</p>
  </div>

  <div v-if="pageError" class="error-banner"
    style="margin-bottom:1.5rem; display:flex; align-items:center; justify-content:space-between; gap:1rem;">
    <span>⚠️ {{ pageError }}</span>
    <button class="btn btn-secondary btn-sm" @click="pageError = ''">✕</button>
  </div>

  <div class="section-row">
    <button class="btn btn-primary" @click="openCreateModal">+ {{ t('manager.eventStyles.create') }}</button>
    <button v-if="styles.length === 0" class="btn btn-secondary" :disabled="seeding" @click="seedDefaults">
      <InlineSpinner v-if="seeding" />
      <span v-else>✨ {{ t('manager.eventStyles.seedDefaults') }}</span>
    </button>
  </div>

  <div v-if="loading" class="empty-state">
    <div class="empty-icon">⏳</div>
    <p>{{ t('common.loading') }}</p>
  </div>

  <div v-else class="card" style="overflow:hidden;">
    <table class="data-table">
      <thead>
        <tr>
          <th>{{ t('manager.eventStyles.columns.preview') }}</th>
          <th>{{ t('manager.eventStyles.columns.name') }}</th>
          <th>{{ t('manager.eventStyles.columns.fillColor') }}</th>
          <th>{{ t('manager.eventStyles.columns.fontColor') }}</th>
          <th>{{ t('manager.eventStyles.columns.bold') }}</th>
          <th>{{ t('manager.eventStyles.actions') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="s in styles" :key="s._id">
          <td>
            <div class="style-preview" :style="{
              background: '#' + s.fillColorHex,
              color: s.fontColorHex ? '#' + s.fontColorHex : '#000',
              fontWeight: s.bold ? 700 : 400,
            }">Aa</div>
          </td>
          <td><strong>{{ s.name }}</strong></td>
          <td>#{{ s.fillColorHex }}</td>
          <td>{{ s.fontColorHex ? '#' + s.fontColorHex : '—' }}</td>
          <td>{{ s.bold ? t('common.yes') : t('common.no') }}</td>
          <td>
            <div style="display:flex; gap:.5rem;">
              <button class="btn btn-secondary btn-sm" @click="openEditModal(s)">{{ t('common.edit') }}</button>
              <button class="btn btn-danger btn-sm" @click="removeStyle(s._id)">{{ t('common.delete') }}</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="styles.length === 0" class="empty-state">
      <div class="empty-icon">🎨</div>
      <p>{{ t('manager.eventStyles.empty') }}</p>
    </div>
  </div>

  <!-- Create/Edit Modal -->
  <Teleport to="body">
    <div v-if="modalOpen" class="modal-overlay" @click.self="modalOpen = false">
      <div class="modal">
        <h2 class="modal-title">{{ editingStyle ? t('manager.eventStyles.editTitle') :
          t('manager.eventStyles.createTitle') }}</h2>

        <div class="form-group">
          <label class="form-label">{{ t('manager.eventStyles.columns.name') }}</label>
          <input class="form-input" :class="{ 'has-error': fieldErrors.name }" v-model="form.name" />
          <span v-if="fieldErrors.name" class="field-error">{{ fieldErrors.name }}</span>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">{{ t('manager.eventStyles.columns.fillColor') }}</label>
            <span v-if="fieldErrors.fillColorHex" class="field-error">{{ fieldErrors.fillColorHex }}</span>
            <div style="display:flex; gap:.5rem; align-items:center;">
              <input type="color" v-model="fillColorPicker" style="width:44px; height:38px; padding:0; border:none;" />
              <input class="form-input" :class="{ 'has-error': fieldErrors.fillColorHex }" v-model="form.fillColorHex"
                placeholder="DEFAULT_FILL" maxlength="7" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('manager.eventStyles.columns.fontColor') }}</label>
            <span v-if="fieldErrors.fontColorHex" class="field-error">{{ fieldErrors.fontColorHex }}</span>
            <div style="display:flex; gap:.5rem; align-items:center;">
              <input type="color" v-model="fontColorPicker" style="width:44px; height:38px; padding:0; border:none;" />
              <input class="form-input" :class="{ 'has-error': fieldErrors.fontColorHex }" v-model="form.fontColorHex"
                :placeholder="t('manager.eventStyles.fontColorPlaceholder', { hex: noHash(COLOUR_PALETTE.black) })" maxlength="7" />
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" style="display:flex; align-items:center; gap:.5rem;">
            <input type="checkbox" v-model="form.bold" style="width:auto;" />
            {{ t('manager.eventStyles.columns.bold') }}
          </label>
        </div>
        <div class="form-group">
          <label class="form-label" style="display:flex; align-items:center; gap:.5rem;">
            <input type="checkbox" v-model="form.isDefaultForActivities" style="width:auto;" />
            {{ t('manager.eventStyles.defaultForActivities') }}
          </label>
          <span class="field-hint">{{ t('manager.eventStyles.defaultForActivitiesHint') }}</span>
        </div>

        <div class="form-group">
          <label class="form-label">{{ t('manager.eventStyles.preview') }}</label>
          <div class="style-preview style-preview-large" :style="{
            background: '#' + (form.fillColorHex || 'FFFFFF'),
            color: form.fontColorHex ? '#' + form.fontColorHex : '#000',
            fontWeight: form.bold ? 700 : 400,
          }">{{ form.name || t('manager.eventStyles.previewSample') }}</div>
        </div>

        <div v-if="formError" class="error-banner">⚠️ {{ formError }}</div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="modalOpen = false">{{ t('common.cancel') }}</button>
          <button class="btn btn-primary" :disabled="saving" @click="save">
            <InlineSpinner v-if="saving" />
            <span v-else>{{ editingStyle ? t('common.save') : t('manager.eventStyles.create') }}</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useManagerEventStyleApi } from '../composables/useManagerEventStyleApi'
import { extractErrorMessage } from '../utiles/error.utiles'
import InlineSpinner from './InlineSpinner.vue'
import { zodErrorsToFieldMap } from '../utiles/zod.utiles'
import { eventStyleFormSchema } from '../validation/eventStyle.schema'
import { useModalScrollLock } from '../composables/useModalScrollLock'
import type { EventStyleDto } from '../types/manager-event-style.types'
import { COLOUR_PALETTE } from '../constants/colors'

/** '#DADADA' → 'DADADA' (the backend stores colours without '#') */
const noHash = (c: string) => c.replace(/^#/, '')
const DEFAULT_FILL = noHash(COLOUR_PALETTE.lightGray)

const { t } = useI18n()
const api = useManagerEventStyleApi()

const styles = ref<EventStyleDto[]>([])
const loading = ref(false)
const seeding = ref(false)
const pageError = ref('')

onMounted(() => {
  reload()
})

async function reload() {
  loading.value = true
  try {
    styles.value = await api.getAll()
  } catch (e) {
    pageError.value = extractErrorMessage(e)
  } finally {
    loading.value = false
  }
}

async function seedDefaults() {
  seeding.value = true
  try {
    await api.seedDefaults()
    await reload()
  } catch (e) {
    pageError.value = extractErrorMessage(e)
  } finally {
    seeding.value = false
  }
}

async function removeStyle(id: string) {
  if (!confirm(t('manager.eventStyles.deleteConfirm'))) return
  try {
    await api.remove(id)
    await reload()
  } catch (e) {
    pageError.value = extractErrorMessage(e)
  }
}

// ── Create/Edit modal ──────────────────────────────────────────────────
const modalOpen = ref(false)
const editingStyle = ref<EventStyleDto | null>(null)
const saving = ref(false)
const formError = ref('')

interface FormState {
  name: string
  fillColorHex: string
  fontColorHex: string
  bold: boolean
  isDefaultForActivities: boolean
}

const form = ref<FormState>({ name: '', fillColorHex: DEFAULT_FILL, fontColorHex: '', bold: false, isDefaultForActivities: false })

const fillColorPicker = computed({
  get: () => '#' + (form.value.fillColorHex.replace(/^#/, '') || COLOUR_PALETTE.white),
  set: (v: string) => { form.value.fillColorHex = v.replace('#', '').toUpperCase() },
})
const fontColorPicker = computed({
  get: () => '#' + (form.value.fontColorHex.replace(/^#/, '') || COLOUR_PALETTE.black),
  set: (v: string) => { form.value.fontColorHex = v.replace('#', '').toUpperCase() },
})

// ── Field messages of the zod validation ──
// The name must differ from the OTHER styles (the one being edited may keep its own name)
const styleSchema = computed(() => eventStyleFormSchema(
  styles.value.filter(s => s._id !== editingStyle.value?._id).map(s => s.name),
))
const fieldErrors = ref<Record<string, string>>({})
// Once a message is showing, re-check on every change so it goes away as soon as the field is fixed.
// (Registered BEFORE the watcher below, so that opening the window ends with a clean slate.)
watch(form, () => {
  if (Object.keys(fieldErrors.value).length === 0) return
  const result = styleSchema.value.safeParse(form.value)
  fieldErrors.value = result.success ? {} : zodErrorsToFieldMap(result.error, t)
}, { deep: true })

watch(modalOpen, () => {
  fieldErrors.value = {}
})

// The page behind the open window must not scroll
useModalScrollLock(modalOpen)

function openCreateModal() {
  editingStyle.value = null
  form.value = { name: '', fillColorHex: 'DADADA', fontColorHex: '', bold: false, isDefaultForActivities: false }
  formError.value = ''
  modalOpen.value = true
}

function openEditModal(s: EventStyleDto) {
  editingStyle.value = s
  form.value = {
    name: s.name,
    fillColorHex: s.fillColorHex,
    fontColorHex: s.fontColorHex ?? '',
    bold: s.bold,
    isDefaultForActivities: s.isDefaultForActivities ?? false,
  }
  formError.value = ''
  modalOpen.value = true
}

async function save() {
  formError.value = ''
  const result = styleSchema.value.safeParse(form.value)
  if (!result.success) {
    fieldErrors.value = zodErrorsToFieldMap(result.error, t)
    return
  }
  fieldErrors.value = {}
  const data = result.data // trimmed name, colours as "DADADA"
  saving.value = true
  try {
    const payload = {
      name: data.name,
      fillColorHex: data.fillColorHex,
      fontColorHex: data.fontColorHex || undefined,
      bold: form.value.bold,
      isDefaultForActivities: form.value.isDefaultForActivities,
    }
    if (editingStyle.value) {
      await api.update(editingStyle.value._id, payload)
    } else {
      await api.create(payload)
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
.style-preview {
  width: 48px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: .8rem;
  border: 1px solid var(--border);
}

.style-preview-large {
  width: 100%;
  height: 56px;
  border-radius: 8px;
  font-size: .95rem;
}
</style>
