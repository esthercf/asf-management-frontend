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
    <button class="btn btn-secondary" :disabled="importing" @click="fileInput?.click()">
      <InlineSpinner v-if="importing" />
      <span v-else>📥 {{ t('manager.purchases.import') }}</span>
    </button>
    <input ref="fileInput" type="file" accept=".xlsx" style="display:none;" @change="onFileSelected" />
  </div>

  <label class="checkbox-row" style="margin-bottom:1rem;">
    <input type="checkbox" v-model="createPurchaseOnImport" />
    {{ t('manager.purchases.createOnImport') }}
  </label>

  <div v-if="importResult" class="card import-result-card">
    <p><strong>{{ t('manager.purchases.importSummary', {
      created: importResult.succeeded,
      skipped: importResult.skipped ?? 0,
      failed: importResult.failed,
    }) }}</strong></p>

    <template v-if="importResult.pending?.length">
      <p>{{ t('manager.purchases.importPendingTitle') }}</p>
      <ul class="import-errors">
        <li v-for="p in importResult.pending" :key="'p' + p.row">
          {{ t('manager.purchases.importRow', { row: p.row }) }}: {{ p.reason }}
        </li>
      </ul>
    </template>

    <template v-if="importResult.errors.length > 0">
      <p>{{ t('manager.purchases.importErrorsTitle') }}</p>
      <ul class="import-errors">
        <li v-for="err in importResult.errors" :key="'e' + err.row">
          {{ t('manager.purchases.importRow', { row: err.row }) }}: {{ err.reason }}
        </li>
      </ul>
    </template>
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
          <th>{{ t('manager.purchases.columns.student') }}</th>
          <th>{{ t('manager.purchases.columns.teacher') }}</th>
          <th>{{ t('manager.purchases.columns.slot') }}</th>
          <th>{{ t('manager.purchases.columns.status') }}</th>
          <th>{{ t('manager.purchases.columns.price') }}</th>
          <th>{{ t('manager.purchases.columns.purchasedAt') }}</th>
          <th>{{ t('manager.purchases.columns.comments') }}</th>
          <th>{{ t('manager.purchases.columns.actions') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in purchases" :key="p._id">
          <td>
            <strong>{{ p.studentRawName }}</strong>
            <div class="muted-text">{{ p.studentEmail }}</div>
          </td>
          <td>
            <span v-if="shownSlot(p).teacherRawName">{{ shownSlot(p).teacherRawName }}</span>
            <span v-else class="muted-text">—</span>
          </td>
          <td>
           <span v-if="shownSlot(p).date">{{ shownSlot(p).date }} — {{ formatSlotTime(shownSlot(p).hour, shownSlot(p).minutes) }}</span>
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
    <button class="btn btn-secondary btn-sm" :disabled="page >= totalPages" @click="goToPage(page + 1)">→</button>
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
            <input class="form-input" :class="{ 'has-error': fieldErrors.studentEmail }" v-model="studentQuery"
              :placeholder="t('manager.purchases.studentSearchPlaceholder')" @input="onStudentQueryChange"
              @focus="showStudentResults = true" @blur="onStudentBlur" />
            <div v-if="showStudentResults && studentResults.length > 0" class="results-dropdown">
              <button v-for="u in studentResults" :key="u.id" type="button" class="result-row"
                @mousedown.prevent="pickStudent(u)">
                {{ u.firstnames }} {{ u.surnames }} — {{ u.email }} <span v-if="u.folderCode">({{ u.folderCode
                }})</span>
              </button>
            </div>
          </div>
          <span v-if="fieldErrors.studentEmail" class="field-error">{{ fieldErrors.studentEmail }}</span>
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
            <span>{{ shownSlot(editingPurchase).teacherRawName || '—' }}<span
                v-if="shownSlot(editingPurchase).teacherEmail"> ({{ shownSlot(editingPurchase).teacherEmail }})</span></span>
          </div>
          <div class="detail-row">
            <span class="detail-label">{{ t('manager.purchases.columns.slot') }}</span>
            <span>
              <template v-if="shownSlot(editingPurchase).date">{{ shownSlot(editingPurchase).date }} — {{
                formatSlotTime(shownSlot(editingPurchase).hour, shownSlot(editingPurchase).minutes) }}</template>
              <span v-if="hasMoved(editingPurchase)" class="muted-text"> ({{ t('manager.purchases.soldFor', {
                slot: `${editingPurchase.date} ${formatSlotTime(editingPurchase.hour, editingPurchase.minutes)}`,
              }) }})</span>
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
            <input class="form-input" :class="{ 'has-error': fieldErrors.price }" type="number" step="0.01"
              v-model.number="form.price" />
            <span v-if="fieldErrors.price" class="field-error">{{ fieldErrors.price }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('manager.purchases.currency') }}</label>
            <input class="form-input" :class="{ 'has-error': fieldErrors.currency }" v-model="form.currency"
              placeholder="EUR" />
            <span v-if="fieldErrors.currency" class="field-error">{{ fieldErrors.currency }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('manager.purchases.orderReference') }}</label>
            <input class="form-input" v-model="form.orderReference" :disabled="!!editingPurchase" />
          </div>
        </div>
        <div class="form-row" v-if="!editingPurchase">
          <div class="form-group">
            <label class="form-label">{{ t('manager.purchases.purchasedAt') }}</label>
            <input class="form-input" :class="{ 'has-error': fieldErrors.purchasedAt }" type="date"
              v-model="form.purchasedAt" />
            <span v-if="fieldErrors.purchasedAt" class="field-error">{{ fieldErrors.purchasedAt }}</span>
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
          <label class="form-label">{{ t('manager.purchases.masterclass') }}</label>
          <span v-if="fieldErrors.activityId" class="field-error">{{ fieldErrors.activityId }}</span>
          <select class="form-input" :class="{ 'has-error': fieldErrors.activityId }" v-model="form.activityId">
            <option v-if="!editingPurchase.activityId" value="">{{ t('manager.purchases.noMasterclass') }}</option>
            <option v-else :value="editingPurchase.activityId">{{ t('manager.purchases.currentMasterclass') }}</option>
            <option v-for="a in freeMasterclasses" :key="a._id" :value="a._id">{{ masterclassLabel(a) }}</option>
          </select>
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

        <!-- The masterclass is planned in advance (Activities import) and sold here. Without one,
             the purchase is saved as pending and assigned later. -->
        <template v-if="!editingPurchase">
          <h3 class="section-title" style="font-size:.9rem; margin-top:1rem;">{{
            t('manager.purchases.schedulingSection') }}</h3>
          <div class="form-group">
            <label class="form-label">{{ t('manager.purchases.masterclass') }}</label>
            <span v-if="fieldErrors.activityId" class="field-error">{{ fieldErrors.activityId }}</span>
            <select class="form-input" :class="{ 'has-error': fieldErrors.activityId }" v-model="form.activityId">
              <option value="">{{ t('manager.purchases.noMasterclass') }}</option>
              <option v-for="a in freeMasterclasses" :key="a._id" :value="a._id">{{ masterclassLabel(a) }}</option>
            </select>
            <p v-if="freeMasterclasses.length === 0" class="field-hint">{{ t('manager.purchases.noFreeMasterclasses') }}
            </p>
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
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useManagerMasterclassPurchaseApi, type ImportPurchasesResult } from '../composables/useManagerMasterclassPurchaseApi'
import { useManagerActivityApi } from '../composables/useManagerActivityApi'
import { useManagerUserApi } from '../composables/useManagerUserApi'
import { extractErrorMessage } from '../utiles/error.utiles'
import InlineSpinner from './InlineSpinner.vue'
import { zodErrorsToFieldMap } from '../utiles/zod.utiles'
import { purchaseFormSchema } from '../validation/purchase.schema'
import { useModalScrollLock } from '../composables/useModalScrollLock'
import { PurchaseStatusEnum } from '../types/manager-masterclass-purchase.types'
import type { MasterclassPurchaseDto } from '../types/manager-masterclass-purchase.types'
import { ActivityTypeEnum } from '../types/manager-activity.types'
import type { ActivityDto } from '../types/manager-activity.types'
import type { ManagerUserBaseDto } from '../types/manager-user.types'
import { TshirtEnum } from '../enums/user.enum'

const { t } = useI18n()
const api = useManagerMasterclassPurchaseApi()
const activityApi = useManagerActivityApi()
const userApi = useManagerUserApi()

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

/** Where the masterclass is now; without one (pending, or older data) what it was sold for */
function shownSlot(p: MasterclassPurchaseDto) {
  return p.currentSlot ?? { teacherRawName: p.teacherRawName ?? '', teacherEmail: p.teacherEmail, date: p.date ?? '', hour: p.hour, minutes: p.minutes }
}
/** True when the masterclass was moved (or changed teacher) after the sale */
function hasMoved(p: MasterclassPurchaseDto): boolean {
  const c = p.currentSlot
  return !!c && (c.date !== p.date || c.hour !== p.hour || c.minutes !== p.minutes || c.teacherRawName !== p.teacherRawName)
}

const purchases = ref<MasterclassPurchaseDto[]>([])

const loading = ref(false)
const pageError = ref('')

const page = ref(1)
const limit = 20
const totalPages = ref(1)
const statusFilter = ref<PurchaseStatusEnum | undefined>(undefined)
const unassignedOnly = ref(false)

// ── Import ────────────────────────────────────────────────────────────
const fileInput = ref<HTMLInputElement | null>(null)
const importing = ref(false)
const importResult = ref<ImportPurchasesResult | null>(null)
const createPurchaseOnImport = ref(true)

async function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  importing.value = true
  importResult.value = null
  pageError.value = ''
  try {
    importResult.value = await api.importFromExcel(file, createPurchaseOnImport.value)
    await reload()
  } catch (e) {
    pageError.value = extractErrorMessage(e)
  } finally {
    importing.value = false
    input.value = ''
  }
}

onMounted(async () => {
  await reload()
})


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
  activityId: string // the chosen masterclass; '' = none yet (the purchase stays pending)
}

function blankForm(): FormState {
  return { price: undefined, currency: '', orderReference: '', status: PurchaseStatusEnum.PENDING, comments: '', purchasedAt: '', tshirtEnum: undefined, activityId: '' }
}
const form = ref<FormState>(blankForm())

// ── Free masterclasses (planned in advance, not sold yet) ──
const freeMasterclasses = ref<ActivityDto[]>([])
async function loadFreeMasterclasses() {
  try {
    const data = await activityApi.getFiltered({ type: ActivityTypeEnum.MASTERCLASS, freeOnly: true, limit: 500 })
    freeMasterclasses.value = (data?.data ?? []).sort((a, b) =>
      a.date.localeCompare(b.date) || a.hour - b.hour || a.minutes - b.minutes)
  } catch (e) {
    formError.value = extractErrorMessage(e)
  }
}
// ── Field messages of the zod validation ──
const purchaseSchema = computed(() => purchaseFormSchema(!editingPurchase.value, editingPurchase.value?.activityId))
/** What zod checks: the form plus the picked student (which lives outside the form) */
function formToCheck() {
  return { ...form.value, studentEmail: pickedStudent.value?.email ?? '' }
}
const fieldErrors = ref<Record<string, string>>({})
// Once a message is showing, re-check on every change so it goes away as soon as the field is fixed.
// (Registered BEFORE the watcher below, so that opening the window ends with a clean slate.)
watch([form, pickedStudent], () => {
  if (Object.keys(fieldErrors.value).length === 0) return
  const result = purchaseSchema.value.safeParse(formToCheck())
  fieldErrors.value = result.success ? {} : zodErrorsToFieldMap(result.error, t)
}, { deep: true })

watch(modalOpen, () => {
  fieldErrors.value = {}
})

// The page behind the open window must not scroll
useModalScrollLock(modalOpen)

/** "2026-11-12 10:00 — Ana Pérez (room 3)" */
function masterclassLabel(a: ActivityDto): string {
  const room = a.roomNumber ? ` (${t('manager.purchases.roomShort', { room: a.roomNumber })})` : ''
  return `${a.date} ${formatSlotTime(a.hour, a.minutes)} — ${a.teacherRawName}${room}`
}


function openCreateModal() {
  editingPurchase.value = null
  pickedStudent.value = null
  studentQuery.value = ''
  form.value = blankForm()
  formError.value = ''
  modalOpen.value = true
  loadFreeMasterclasses()
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
    activityId: p.activityId ?? '',
  }
  formError.value = ''
  modalOpen.value = true
  loadFreeMasterclasses()
}

async function save() {
  formError.value = ''

  const result = purchaseSchema.value.safeParse(formToCheck())
  if (!result.success) {
    fieldErrors.value = zodErrorsToFieldMap(result.error, t)
    return
  }
  fieldErrors.value = {}
  // Put the cleaned values back (real number or empty price, EUR in capitals, trimmed reference),
  // so the requests below send exactly what was checked
  form.value.price = result.data.price
  form.value.currency = result.data.currency
  form.value.orderReference = result.data.orderReference

  saving.value = true
  try {
    if (editingPurchase.value) {
      // Only send activityId when it really changes (assigning a pending purchase, or moving it)
      const newActivityId = form.value.activityId && form.value.activityId !== editingPurchase.value.activityId
        ? form.value.activityId
        : undefined
      await api.update(editingPurchase.value._id, {
        activityId: newActivityId,
        // A pending purchase that gets a masterclass is scheduled now
        status: newActivityId && form.value.status === PurchaseStatusEnum.PENDING
          ? PurchaseStatusEnum.SCHEDULED
          : form.value.status,
        price: form.value.price,
        currency: form.value.currency || undefined,
        comments: form.value.comments || undefined,
      })
    } else {
      // The masterclass was planned in advance; the backend copies its teacher, date and time
      // and writes the student on it. Without one, the purchase is saved as pending.
      await api.create({
        studentRawName: `${pickedStudent.value!.firstnames} ${pickedStudent.value!.surnames}`,
        studentEmail: pickedStudent.value!.email,
        activityId: form.value.activityId || undefined,
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