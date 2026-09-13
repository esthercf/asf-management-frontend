<template>
  <div class="page-header">
    <h1>{{ t('manager.performanceOrder.title') }}</h1>
    <p class="subtitle">{{ t('manager.performanceOrder.subtitle') }}</p>
  </div>

  <div v-if="pageError" class="error-banner"
    style="margin-bottom:1.5rem; display:flex; align-items:center; justify-content:space-between; gap:1rem;">
    <span>⚠️ {{ pageError }}</span>
    <button class="btn btn-secondary btn-sm" @click="pageError = ''">✕</button>
  </div>

  <div class="section-row">
    <div class="contest-type-toggle">
      <button class="btn" :class="contestType === ContestTypeEnum.SOLO ? 'btn-primary' : 'btn-secondary'"
        @click="switchContestType(ContestTypeEnum.SOLO)">{{ t('manager.contestSettings.solo') }}</button>
      <button class="btn" :class="contestType === ContestTypeEnum.YOUTH ? 'btn-primary' : 'btn-secondary'"
        @click="switchContestType(ContestTypeEnum.YOUTH)">{{ t('manager.contestSettings.youth') }}</button>
    </div>

    <select class="form-input filter-select" v-model="selectedRoundName" @change="onRoundOrCategoryChange">
      <option value="" disabled>{{ t('manager.performanceOrder.selectRound') }}</option>
      <option v-for="r in rounds" :key="r.name" :value="r.name">{{ r.name }}</option>
    </select>

    <select v-if="contestType === ContestTypeEnum.YOUTH" class="form-input filter-select" v-model="selectedCategory"
      @change="onRoundOrCategoryChange">
      <option value="" disabled>{{ t('manager.performanceOrder.selectCategory') }}</option>
      <option v-for="c in availableCategoriesForRound" :key="c" :value="c">{{ c }}</option>
    </select>
  </div>

  <div v-if="!readyToLoadBoard" class="empty-state">
    <div class="empty-icon">🎯</div>
    <p>{{ t('manager.performanceOrder.selectScopeFirst') }}</p>
  </div>

  <template v-else>
    <div class="section-row" style="margin-bottom:1rem;">
      <div class="legend-row">
        <span class="legend-item"><span class="legend-dot legend-dot-active"></span>{{
          t('manager.performanceOrder.checkedIn') }}</span>
        <span class="legend-item"><span class="legend-dot legend-dot-inactive"></span>{{
          t('manager.performanceOrder.notCheckedIn') }}</span>
        <span class="legend-item"><span class="legend-swatch legend-swatch-overtime"></span>{{
          t('manager.performanceOrder.pastEndTime') }}</span>
      </div>
      <div style="display:flex; gap:.6rem;">
        <button class="btn btn-secondary" :disabled="generating" @click="generateOrder">
          <InlineSpinner v-if="generating" />
          <span v-else>🎲 {{ t('manager.performanceOrder.generate') }}</span>
        </button>
        <button class="btn btn-secondary" :disabled="autoFilling || unassignedEntries.length === 0" @click="doAutoFill">
          <InlineSpinner v-if="autoFilling" />
          <span v-else>📅 {{ t('manager.performanceOrder.autoFill') }}</span>
        </button>
        <button class="btn btn-secondary" :disabled="recalculating" @click="doRecalculate">
          <InlineSpinner v-if="recalculating" />
          <span v-else>🔄 {{ t('manager.performanceOrder.recalculate') }}</span>
        </button>
      </div>
    </div>

    <div v-if="loadingBoard" class="empty-state">
      <div class="empty-icon">⏳</div>
      <p>{{ t('common.loading') }}</p>
    </div>

    <div v-else class="board">
      <!-- Unassigned column — never has its own validation state -->
      <div class="board-column">
        <div class="board-column-header">
          <h3>{{ t('manager.performanceOrder.unassigned') }}</h3>
          <span class="badge badge-lav">{{ unassignedEntries.length }}</span>
        </div>
        <VueDraggable v-model="unassignedEntries" class="board-list" :data-day-index="'null'" group="performance-order"
          item-key="id" @end="onDragEnd">
          <div v-for="element in unassignedEntries" :key="element.id" class="entry-card" :class="entryClasses(element)">
            <template v-if="element.rowType === 'performance'">
              <div class="entry-main">
                <strong>
                  <span class="status-dot" :class="element.studentActive ? 'status-dot-active' : 'status-dot-inactive'"
                    :title="element.studentActive ? t('manager.performanceOrder.checkedIn') : t('manager.performanceOrder.notCheckedIn')"></span>
                  {{ element.studentFullName ?? '—' }}
                </strong>
                <span class="muted-text">{{ element.studentCountryCode }}</span>
              </div>
              <div class="entry-times">{{ element.warmUpTime }} → {{ element.readyTime }} → {{ element.stageTime }}
              </div>
            </template>
            <template v-else>
              <div class="entry-main entry-pause-label">⏸ {{ element.label }}</div>
            </template>
            <div class="entry-actions">
              <input class="entry-duration-input" type="number" min="1"
                :value="element.stageDurationMinutes ?? element.durationMinutes"
                @change="onDurationChange(element, $event)" />
              <button class="btn btn-danger btn-sm" @click="removeEntry(element)">✕</button>
            </div>
          </div>
        </VueDraggable>
        <button class="btn btn-secondary btn-sm insert-pause-btn" @click="openInsertPauseModal(null)">
          ⏸ {{ t('manager.performanceOrder.insertPause') }}
        </button>
      </div>

      <!-- One column per configured day -->
      <div v-for="(dayEntries, dayIdx) in dayColumns" :key="dayIdx" class="board-column">
        <div class="board-column-header">
          <h3>{{ t('manager.contestSettings.day') }} {{ dayIdx + 1 }}</h3>
          <span class="badge badge-lav">{{ dayEntries.length }}</span>
          <span class="badge badge-sm" :class="isDayValidated(dayIdx) ? 'badge-green' : 'badge-coral'">
            {{ isDayValidated(dayIdx) ? t('manager.performanceOrder.validated') :
              t('manager.performanceOrder.pendingValidation') }}
          </span>
        </div>
        <div class="board-column-actions">
          <button v-if="!isDayValidated(dayIdx)" class="btn btn-primary btn-sm"
            :disabled="dayEntries.length === 0 || validatingDay === dayIdx" @click="doValidateDay(dayIdx)">
            <InlineSpinner v-if="validatingDay === dayIdx" />
            <span v-else>✓ {{ t('manager.performanceOrder.validate') }}</span>
          </button>
          <button v-else class="btn btn-secondary btn-sm" :disabled="validatingDay === dayIdx"
            @click="doUnvalidateDay(dayIdx)">
            <InlineSpinner v-if="validatingDay === dayIdx" />
            <span v-else>🔓 {{ t('manager.performanceOrder.unvalidate') }}</span>
          </button>
          <button class="btn btn-secondary btn-sm" :disabled="dayEntries.length === 0 || !isDayValidated(dayIdx)"
            :title="!isDayValidated(dayIdx) ? t('manager.performanceOrder.validateBeforeExport') : ''"
            @click="exportDay(dayIdx)">
            📥
          </button>
        </div>
        <VueDraggable v-model="dayColumns[dayIdx]" class="board-list" :data-day-index="String(dayIdx)"
          group="performance-order" :disabled="isDayValidated(dayIdx)" item-key="id" @end="onDragEnd">
          <div v-for="element in dayColumns[dayIdx]" :key="element.id" class="entry-card"
            :class="entryClasses(element)">
            <template v-if="element.rowType === 'performance'">
              <div class="entry-main">
                <strong>
                  <span class="status-dot" :class="element.studentActive ? 'status-dot-active' : 'status-dot-inactive'"
                    :title="element.studentActive ? t('manager.performanceOrder.checkedIn') : t('manager.performanceOrder.notCheckedIn')"></span>
                  {{ element.studentFullName ?? '—' }}
                </strong>
                <span class="muted-text">{{ element.studentCountryCode }}</span>
              </div>
              <div class="entry-times">{{ element.warmUpTime }} → {{ element.readyTime }} → {{ element.stageTime }}
              </div>
            </template>
            <template v-else>
              <div class="entry-main entry-pause-label">⏸ {{ element.label }}</div>
            </template>
            <div class="entry-actions">
              <input class="entry-duration-input" type="number" min="1"
                :value="element.stageDurationMinutes ?? element.durationMinutes" :disabled="isDayValidated(dayIdx)"
                @change="onDurationChange(element, $event)" />
              <button class="btn btn-danger btn-sm" :disabled="isDayValidated(dayIdx)"
                @click="removeEntry(element)">✕</button>
            </div>
          </div>
        </VueDraggable>
        <div class="column-footer-actions">
          <button class="btn btn-secondary btn-sm insert-pause-btn" :disabled="isDayValidated(dayIdx)"
            @click="openInsertPauseModal(dayIdx)">
            ⏸ {{ t('manager.performanceOrder.insertPause') }}
          </button>
          <button class="btn btn-secondary btn-sm insert-pause-btn" :disabled="isDayValidated(dayIdx)"
            @click="openMissingStudentModal(dayIdx)">
            🔍 {{ t('manager.performanceOrder.addMissingStudent') }}
          </button>
        </div>
      </div>
    </div>
  </template>

  <!-- Insert Pause Modal -->
  <Teleport to="body">
    <div v-if="pauseModalOpen" class="modal-overlay" @click.self="pauseModalOpen = false">
      <div class="modal">
        <h2 class="modal-title">{{ t('manager.performanceOrder.insertPause') }}</h2>
        <div class="form-group">
          <label class="form-label">{{ t('manager.performanceOrder.pauseType') }}</label>
          <select class="form-input" v-model="pauseForm.rowType">
            <option value="pause">{{ t('manager.performanceOrder.pause') }}</option>
            <option value="lunch">{{ t('manager.performanceOrder.lunch') }}</option>
          </select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">{{ t('manager.contestSettings.pauseDuration') }}</label>
            <input class="form-input" type="number" min="1" v-model.number="pauseForm.durationMinutes" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('manager.performanceOrder.pauseLabel') }}</label>
            <input class="form-input" v-model="pauseForm.label" />
          </div>
        </div>
        <p class="muted-text">{{ t('manager.performanceOrder.pauseAppendsHint') }}</p>
        <div v-if="pauseFormError" class="error-banner">⚠️ {{ pauseFormError }}</div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="pauseModalOpen = false">{{ t('common.cancel') }}</button>
          <button class="btn btn-primary" :disabled="insertingPause" @click="submitInsertPause">
            <InlineSpinner v-if="insertingPause" />
            <span v-else>{{ t('common.save') }}</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Add Missing Student Modal -->
  <Teleport to="body">
    <div v-if="missingStudentModalOpen" class="modal-overlay" @click.self="missingStudentModalOpen = false">
      <div class="modal">
        <h2 class="modal-title">{{ t('manager.performanceOrder.addMissingStudent') }}</h2>
        <div class="form-group">
          <label class="form-label">{{ t('manager.users.searchPlaceholder') }}</label>
          <input class="form-input" v-model="missingSearchText" @input="debouncedMissingSearch"
            :placeholder="t('manager.users.searchPlaceholder')" />
        </div>
        <div v-if="searchingMissing" class="empty-state" style="padding:1.5rem 0;">
          <InlineSpinner />
        </div>
        <div v-else-if="missingCandidates.length === 0" class="muted-text" style="padding:.5rem 0;">
          {{ t('manager.performanceOrder.noMissingStudentsFound') }}
        </div>
        <div v-else class="missing-candidates-list">
          <div v-for="c in missingCandidates" :key="c._id" class="missing-candidate-row">
            <span>{{ c.firstnames }} {{ c.surnames }} <span class="muted-text">({{ c.email }})</span></span>
            <button class="btn btn-primary btn-sm" :disabled="addingMissingId === c._id"
              @click="confirmAddMissing(c._id)">
              <InlineSpinner v-if="addingMissingId === c._id" />
              <span v-else>{{ t('common.add') }}</span>
            </button>
          </div>
        </div>
        <div v-if="missingStudentError" class="error-banner">⚠️ {{ missingStudentError }}</div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="missingStudentModalOpen = false">{{ t('common.close') }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { VueDraggable } from 'vue-draggable-plus'
import { usePerformanceOrderApi, type PerformanceOrderEntryDto, type OrderScope, type MissingCandidateDto } from '../composables/usePerformanceOrderApi'
import { useContestSettingsApi, ContestTypeEnum, type ContestRoundDto } from '../composables/useContestSettingsApi'
import { extractErrorMessage } from '../utiles/error.utiles'
import InlineSpinner from './InlineSpinner.vue'

const { t } = useI18n()
const api = usePerformanceOrderApi()
const settingsApi = useContestSettingsApi()

const pageError = ref('')

const contestType = ref<ContestTypeEnum>(ContestTypeEnum.SOLO)
const rounds = ref<ContestRoundDto[]>([])
const selectedRoundName = ref('')
const selectedCategory = ref('')

const generating = ref(false)
const autoFilling = ref(false)
const loadingBoard = ref(false)
const validatingDay = ref<number | null>(null)

const unassignedEntries = ref<PerformanceOrderEntryDto[]>([])
const dayColumns = ref<PerformanceOrderEntryDto[][]>([])

async function switchContestType(type: ContestTypeEnum) {
  contestType.value = type
  selectedRoundName.value = ''
  selectedCategory.value = ''
  unassignedEntries.value = []
  dayColumns.value = []
  await loadRounds()
}

async function loadRounds() {
  try {
    const settings = await settingsApi.getOrCreate(contestType.value, '')
    rounds.value = settings.rounds
  } catch (e) {
    pageError.value = extractErrorMessage(e)
  }
}

const recalculating = ref(false)

async function doRecalculate() {
  recalculating.value = true
  pageError.value = ''
  try {
    await api.recalculate(currentScope.value)
    await loadBoard()
  } catch (e) {
    pageError.value = extractErrorMessage(e)
  } finally {
    recalculating.value = false
  }
}

const availableCategoriesForRound = computed(() => {
  const round = rounds.value.find(r => r.name === selectedRoundName.value)
  return round?.categoryConfigs.map(c => c.category).filter((c): c is string => !!c) ?? []
})

const readyToLoadBoard = computed(() => {
  if (!selectedRoundName.value) return false
  if (contestType.value === ContestTypeEnum.YOUTH && !selectedCategory.value) return false
  return true
})

const currentScope = computed<OrderScope>(() => ({
  contestType: contestType.value,
  round: selectedRoundName.value,
  category: contestType.value === ContestTypeEnum.YOUTH ? selectedCategory.value : null,
}))

const configuredDayCount = computed(() => {
  const round = rounds.value.find(r => r.name === selectedRoundName.value)
  const config = round?.categoryConfigs.find(c => c.category === (currentScope.value.category || null))
  return config?.days.length ?? 0
})

function isDayValidated(dayIdx: number): boolean {
  const entries = dayColumns.value[dayIdx]
  return !!entries && entries.length > 0 && entries.every(e => e.status === 'validated')
}

function entryClasses(element: PerformanceOrderEntryDto) {
  return {
    'entry-conflict': element.hasConflict,
    'entry-pause': element.rowType !== 'performance',
    'entry-inactive': element.rowType === 'performance' && !element.studentActive,
    'entry-overtime': element.rowType === 'performance' && element.pastEndTime,
  }
}

function onRoundOrCategoryChange() {
  if (readyToLoadBoard.value) loadBoard()
}

async function loadBoard() {
  loadingBoard.value = true
  pageError.value = ''
  try {
    const scope = currentScope.value
    const [unassigned, ...days] = await Promise.all([
      api.getFiltered(scope, null),
      ...Array.from({ length: configuredDayCount.value }, (_, i) => api.getFiltered(scope, i)),
    ])
    unassignedEntries.value = unassigned
    dayColumns.value = days
  } catch (e) {
    pageError.value = extractErrorMessage(e)
  } finally {
    loadingBoard.value = false
  }
}

async function generateOrder() {
  if (!confirm(t('manager.performanceOrder.generateConfirm'))) return
  generating.value = true
  pageError.value = ''
  try {
    await api.generate(currentScope.value)
    await loadBoard()
  } catch (e) {
    pageError.value = extractErrorMessage(e)
  } finally {
    generating.value = false
  }
}

async function doAutoFill() {
  autoFilling.value = true
  pageError.value = ''
  try {
    await api.autoFillDays(currentScope.value)
    await loadBoard()
  } catch (e) {
    pageError.value = extractErrorMessage(e)
  } finally {
    autoFilling.value = false
  }
}

async function doValidateDay(dayIdx: number) {
  validatingDay.value = dayIdx
  try {
    await api.validate(currentScope.value, dayIdx)
    await loadBoard()
  } catch (e) {
    pageError.value = extractErrorMessage(e)
  } finally {
    validatingDay.value = null
  }
}

async function doUnvalidateDay(dayIdx: number) {
  validatingDay.value = dayIdx
  try {
    await api.unvalidate(currentScope.value, dayIdx)
    await loadBoard()
  } catch (e) {
    pageError.value = extractErrorMessage(e)
  } finally {
    validatingDay.value = null
  }
}

/**
 * VueDraggable already mutates the local v-model arrays for us on
 * drop (moving the item between arrays when dragged across columns,
 * sharing the group). This just reads where it actually landed and
 * tells the backend, then reloads to pick up the server's own
 * recalculated times/conflict flags for every affected row.
 */
async function onDragEnd(evt: { to: HTMLElement; newIndex?: number }) {
  if (evt.newIndex === undefined) return // SortableJS can omit this on a cancelled/no-op drag

  const dayIndexAttr = evt.to.dataset.dayIndex
  const targetDayIndex = dayIndexAttr === 'null' ? null : Number(dayIndexAttr)
  const targetList = targetDayIndex === null ? unassignedEntries.value : dayColumns.value[targetDayIndex]
  const moved = targetList[evt.newIndex]
  if (!moved) return

  try {
    await api.moveEntry(moved.id, targetDayIndex, evt.newIndex)
  } catch (e) {
    pageError.value = extractErrorMessage(e)
  } finally {
    await loadBoard()
  }
}

async function onDurationChange(entry: PerformanceOrderEntryDto, event: Event) {
  const minutes = Number((event.target as HTMLInputElement).value)
  if (!minutes || minutes < 1) return
  try {
    await api.updateDuration(entry.id, minutes)
    await loadBoard()
  } catch (e) {
    pageError.value = extractErrorMessage(e)
  }
}

async function removeEntry(entry: PerformanceOrderEntryDto) {
  if (!confirm(t('manager.performanceOrder.removeConfirm'))) return
  try {
    await api.removeEntry(entry.id)
    await loadBoard()
  } catch (e) {
    pageError.value = extractErrorMessage(e)
  }
}

async function exportDay(dayIndex: number) {
  try {
    await api.exportDay(currentScope.value, dayIndex, `${contestType.value}-${selectedRoundName.value}-day${dayIndex + 1}.xlsx`)
  } catch (e) {
    pageError.value = extractErrorMessage(e)
  }
}

// ── Manual pause/lunch insertion ────────────────────────────────────────
const pauseModalOpen = ref(false)
const pauseModalTargetDayIndex = ref<number | null>(null)
const insertingPause = ref(false)
const pauseFormError = ref('')
const pauseForm = ref({ rowType: 'pause' as 'pause' | 'lunch', durationMinutes: 15, label: '' })

function openInsertPauseModal(dayIndex: number | null) {
  pauseModalTargetDayIndex.value = dayIndex
  pauseForm.value = { rowType: 'pause', durationMinutes: 15, label: '' }
  pauseFormError.value = ''
  pauseModalOpen.value = true
}

async function submitInsertPause() {
  pauseFormError.value = ''
  if (!pauseForm.value.durationMinutes || pauseForm.value.durationMinutes < 1) {
    pauseFormError.value = t('manager.contestSettings.validation.dayRequired')
    return
  }
  insertingPause.value = true
  try {
    const targetList = pauseModalTargetDayIndex.value === null ? unassignedEntries.value : dayColumns.value[pauseModalTargetDayIndex.value]
    const label = pauseForm.value.label || (pauseForm.value.rowType === 'lunch' ? 'LUNCH' : `PAUSE ${pauseForm.value.durationMinutes} min`)
    await api.insertPause(
      currentScope.value,
      pauseModalTargetDayIndex.value,
      targetList.length,
      pauseForm.value.durationMinutes,
      label,
      pauseForm.value.rowType,
    )
    pauseModalOpen.value = false
    await loadBoard()
  } catch (e) {
    pauseFormError.value = extractErrorMessage(e)
  } finally {
    insertingPause.value = false
  }
}

// ── Missing student search + re-add ─────────────────────────────────────
const missingStudentModalOpen = ref(false)
const missingStudentTargetDayIndex = ref<number | null>(null)
const missingSearchText = ref('')
const missingCandidates = ref<MissingCandidateDto[]>([])
const searchingMissing = ref(false)
const addingMissingId = ref<string | null>(null)
const missingStudentError = ref('')

function openMissingStudentModal(dayIndex: number) {
  missingStudentTargetDayIndex.value = dayIndex
  missingSearchText.value = ''
  missingCandidates.value = []
  missingStudentError.value = ''
  missingStudentModalOpen.value = true
  runMissingSearch()
}

let missingSearchDebounce: ReturnType<typeof setTimeout> | undefined
function debouncedMissingSearch() {
  if (missingSearchDebounce) clearTimeout(missingSearchDebounce)
  missingSearchDebounce = setTimeout(runMissingSearch, 350)
}

async function runMissingSearch() {
  searchingMissing.value = true
  try {
    missingCandidates.value = await api.searchMissingCandidates(currentScope.value, missingSearchText.value || undefined)
  } catch (e) {
    missingStudentError.value = extractErrorMessage(e)
  } finally {
    searchingMissing.value = false
  }
}

async function confirmAddMissing(studentId: string) {
  if (missingStudentTargetDayIndex.value === null) return
  addingMissingId.value = studentId
  missingStudentError.value = ''
  try {
    await api.addMissingStudent(currentScope.value, missingStudentTargetDayIndex.value, studentId)
    missingStudentModalOpen.value = false
    await loadBoard()
  } catch (e) {
    missingStudentError.value = extractErrorMessage(e)
  } finally {
    addingMissingId.value = null
  }
}

loadRounds()
</script>

<style scoped>
.contest-type-toggle {
  display: flex;
  gap: .5rem;
}

.filter-select {
  max-width: 220px;
}

.legend-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: .35rem;
  font-size: .75rem;
  color: var(--muted);
  font-weight: 600;
}

.legend-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  display: inline-block;
}

.legend-dot-active {
  background: #4caf50;
}

.legend-dot-inactive {
  background: #d0d0d0;
}

.legend-swatch {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  display: inline-block;
}

.legend-swatch-overtime {
  background: #ffcc80;
  border: 1px solid #e65100;
}

.board {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  align-items: flex-start;
}

.board-column {
  background: var(--white);
  border: 1.5px solid var(--border);
  border-radius: 10px;
  min-width: 290px;
  max-width: 290px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  max-height: 78vh;
}

.board-column-header {
  display: flex;
  align-items: center;
  gap: .5rem;
  padding: .85rem 1rem .5rem;
  flex-wrap: wrap;
}

.board-column-header h3 {
  margin: 0;
  font-size: .9rem;
  flex: 1;
}

.badge-sm {
  font-size: .65rem;
  padding: .1rem .45rem;
}

.board-column-actions {
  display: flex;
  gap: .4rem;
  padding: 0 1rem .75rem;
  border-bottom: 1.5px solid var(--border);
}

.column-footer-actions {
  display: flex;
  flex-direction: column;
  gap: .4rem;
  padding: 0 .75rem .75rem;
}

.board-list {
  padding: .75rem;
  display: flex;
  flex-direction: column;
  gap: .6rem;
  overflow-y: auto;
  min-height: 60px;
}

.insert-pause-btn {
  justify-content: center;
}

.entry-card {
  background: var(--white);
  border: 1.5px solid var(--border);
  border-left: 4px solid var(--navy, #1a2b4a);
  border-radius: 8px;
  padding: .6rem .7rem;
  cursor: grab;
  font-size: .82rem;
}

.entry-card:active {
  cursor: grabbing;
}

.entry-pause {
  background: var(--gold-50, #fdf8ee);
  border: 1.5px dashed var(--gold, #e8b84b);
  border-left: 1.5px dashed var(--gold, #e8b84b);
  text-align: center;
}

.entry-pause-label {
  font-weight: 800;
  letter-spacing: .03em;
  text-transform: uppercase;
  font-size: .75rem;
  color: #9a6b00;
  justify-content: center;
}

.entry-conflict {
  background: #ffe1e1;
  border-color: #e57373;
  border-left-color: #c62828;
}

.entry-overtime {
  background: #fff3e0;
  border-color: #ffb74d;
  border-left-color: #e65100;
}

.entry-inactive {
  opacity: .6;
}

.entry-inactive:hover {
  opacity: .85;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-right: .1rem;
}

.status-dot-active {
  background: #4caf50;
}

.status-dot-inactive {
  background: #b0b0b0;
}

.entry-main {
  display: flex;
  align-items: center;
  gap: .4rem;
  justify-content: space-between;
}

.entry-main strong {
  display: flex;
  align-items: center;
  gap: .35rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.entry-times {
  font-size: .74rem;
  color: var(--muted);
  margin-top: .2rem;
}

.entry-actions {
  display: flex;
  align-items: center;
  gap: .4rem;
  margin-top: .4rem;
}

.entry-duration-input {
  width: 52px;
  padding: .2rem .3rem;
  font-size: .75rem;
  border: 1px solid var(--border);
  border-radius: 4px;
}

.muted-text {
  color: var(--muted);
  font-size: .75rem;
}

.missing-candidates-list {
  display: flex;
  flex-direction: column;
  gap: .5rem;
  max-height: 260px;
  overflow-y: auto;
  margin: .75rem 0;
}

.missing-candidate-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: .5rem .7rem;
  border: 1.5px solid var(--border);
  border-radius: 8px;
  font-size: .85rem;
}
</style>