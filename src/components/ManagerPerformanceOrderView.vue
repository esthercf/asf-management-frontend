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

    <select v-if="contestType === ContestTypeEnum.YOUTH" class="form-input filter-select"
      v-model="selectedCategory" @change="onRoundOrCategoryChange">
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
      <div style="display:flex; gap:.6rem; align-items:center;">
        <span v-if="isValidated" class="badge badge-green">{{ t('manager.performanceOrder.validated') }}</span>
        <span v-else class="badge badge-coral">{{ t('manager.performanceOrder.pendingValidation') }}</span>
      </div>
      <div style="display:flex; gap:.6rem;">
        <button class="btn btn-secondary" :disabled="generating" @click="generateOrder">
          <InlineSpinner v-if="generating" />
          <span v-else>🎲 {{ t('manager.performanceOrder.generate') }}</span>
        </button>
        <button v-if="!isValidated" class="btn btn-primary" :disabled="validating" @click="doValidate">
          <InlineSpinner v-if="validating" />
          <span v-else>✓ {{ t('manager.performanceOrder.validate') }}</span>
        </button>
        <button v-else class="btn btn-secondary" :disabled="validating" @click="doUnvalidate">
          <InlineSpinner v-if="validating" />
          <span v-else>🔓 {{ t('manager.performanceOrder.unvalidate') }}</span>
        </button>
      </div>
    </div>

    <div v-if="loadingBoard" class="empty-state">
      <div class="empty-icon">⏳</div>
      <p>{{ t('common.loading') }}</p>
    </div>

    <div v-else class="board">
      <!-- Unassigned column -->
      <div class="board-column">
        <div class="board-column-header">
          <h3>{{ t('manager.performanceOrder.unassigned') }}</h3>
          <span class="badge badge-lav">{{ unassignedEntries.length }}</span>
        </div>
        <VueDraggable
          v-model="unassignedEntries"
          class="board-list"
          :data-day-index="'null'"
          group="performance-order"
          :disabled="isValidated"
          item-key="_id"
          @end="onDragEnd"
        >
          <template #item="{ element }">
            <div class="entry-card" :class="{ 'entry-conflict': element.hasConflict, 'entry-pause': element.rowType !== 'performance' }">
              <template v-if="element.rowType === 'performance'">
                <div class="entry-main">
                  <strong>{{ element.studentFullName ?? '—' }}</strong>
                  <span class="muted-text">{{ element.studentCountryCode }}</span>
                </div>
                <div class="entry-times">{{ element.warmUpTime }} → {{ element.readyTime }} → {{ element.stageTime }}</div>
              </template>
              <template v-else>
                <div class="entry-main">{{ element.label }}</div>
              </template>
              <div class="entry-actions">
                <input class="entry-duration-input" type="number" min="1"
                  :value="element.stageDurationMinutes ?? element.durationMinutes"
                  :disabled="isValidated"
                  @change="onDurationChange(element, $event)" />
                <button class="btn btn-danger btn-sm" :disabled="isValidated" @click="removeEntry(element)">✕</button>
              </div>
            </div>
          </template>
        </VueDraggable>
      </div>

      <!-- One column per configured day -->
      <div v-for="(dayEntries, dayIdx) in dayColumns" :key="dayIdx" class="board-column">
        <div class="board-column-header">
          <h3>{{ t('manager.contestSettings.day') }} {{ dayIdx + 1 }}</h3>
          <span class="badge badge-lav">{{ dayEntries.length }}</span>
          <button class="btn btn-secondary btn-sm" :disabled="dayEntries.length === 0 || !isValidated"
            :title="!isValidated ? t('manager.performanceOrder.validateBeforeExport') : ''"
            @click="exportDay(dayIdx)">
            📥
          </button>
        </div>
        <VueDraggable
          v-model="dayColumns[dayIdx]"
          class="board-list"
          :data-day-index="String(dayIdx)"
          group="performance-order"
          :disabled="isValidated"
          item-key="_id"
          @end="onDragEnd"
        >
          <template #item="{ element }">
            <div class="entry-card" :class="{ 'entry-conflict': element.hasConflict, 'entry-pause': element.rowType !== 'performance' }">
              <template v-if="element.rowType === 'performance'">
                <div class="entry-main">
                  <strong>{{ element.studentFullName ?? '—' }}</strong>
                  <span class="muted-text">{{ element.studentCountryCode }}</span>
                </div>
                <div class="entry-times">{{ element.warmUpTime }} → {{ element.readyTime }} → {{ element.stageTime }}</div>
              </template>
              <template v-else>
                <div class="entry-main">{{ element.label }}</div>
              </template>
              <div class="entry-actions">
                <input class="entry-duration-input" type="number" min="1"
                  :value="element.stageDurationMinutes ?? element.durationMinutes"
                  :disabled="isValidated"
                  @change="onDurationChange(element, $event)" />
                <button class="btn btn-danger btn-sm" :disabled="isValidated" @click="removeEntry(element)">✕</button>
              </div>
            </div>
          </template>
        </VueDraggable>
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { VueDraggable } from 'vue-draggable-plus'
import { usePerformanceOrderApi, type PerformanceOrderEntryDto, type OrderScope } from '../composables/usePerformanceOrderApi'
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
const validating = ref(false)
const loadingBoard = ref(false)

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

const isValidated = computed(() => {
  const all = [...unassignedEntries.value, ...dayColumns.value.flat()]
  return all.length > 0 && all.every(e => e.status === 'validated')
})

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

async function doValidate() {
  validating.value = true
  try {
    await api.validate(currentScope.value)
    await loadBoard()
  } catch (e) {
    pageError.value = extractErrorMessage(e)
  } finally {
    validating.value = false
  }
}

async function doUnvalidate() {
  validating.value = true
  try {
    await api.unvalidate(currentScope.value)
    await loadBoard()
  } catch (e) {
    pageError.value = extractErrorMessage(e)
  } finally {
    validating.value = false
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
    await api.moveEntry(moved._id, targetDayIndex, evt.newIndex)
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
    await api.updateDuration(entry._id, minutes)
    await loadBoard()
  } catch (e) {
    pageError.value = extractErrorMessage(e)
  }
}

async function removeEntry(entry: PerformanceOrderEntryDto) {
  if (!confirm(t('manager.performanceOrder.removeConfirm'))) return
  try {
    await api.removeEntry(entry._id)
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
  min-width: 280px;
  max-width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  max-height: 75vh;
}

.board-column-header {
  display: flex;
  align-items: center;
  gap: .5rem;
  padding: .85rem 1rem;
  border-bottom: 1.5px solid var(--border);
}

.board-column-header h3 {
  margin: 0;
  font-size: .9rem;
  flex: 1;
}

.board-list {
  padding: .75rem;
  display: flex;
  flex-direction: column;
  gap: .6rem;
  overflow-y: auto;
  min-height: 60px;
}

.entry-card {
  background: var(--warm-50, #faf6ee);
  border: 1.5px solid var(--border);
  border-radius: 8px;
  padding: .6rem .7rem;
  cursor: grab;
  font-size: .82rem;
}

.entry-conflict {
  background: #ffe1e1;
  border-color: #e57373;
}

.entry-pause {
  background: var(--gold-50, #fdf8ee);
  text-align: center;
  font-weight: 700;
}

.entry-main {
  display: flex;
  justify-content: space-between;
  gap: .5rem;
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
</style>