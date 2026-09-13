<template>
  <div class="page-header">
    <h1>{{ t('manager.contestSettings.title') }}</h1>
    <p class="subtitle">{{ t('manager.contestSettings.subtitle') }}</p>
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
  </div>

  <div v-if="loading" class="empty-state">
    <div class="empty-icon">⏳</div>
    <p>{{ t('common.loading') }}</p>
  </div>

  <template v-else-if="settings">
    <div class="card" style="padding:1.5rem; margin-bottom:1.5rem; max-width:560px;">
      <div class="form-group">
        <label class="form-label">{{ t('manager.contestSettings.contestName') }}</label>
        <div style="display:flex; gap:.6rem;">
          <input class="form-input" v-model="contestNameDraft" />
          <button class="btn btn-secondary" :disabled="savingName || contestNameDraft === settings.contestName"
            @click="saveContestName">
            <InlineSpinner v-if="savingName" />
            <span v-else>{{ t('common.save') }}</span>
          </button>
        </div>
      </div>
    </div>

    <div class="section-row">
      <h2 class="section-title">{{ t('manager.contestSettings.roundsTitle') }}</h2>
      <button class="btn btn-primary" @click="openCreateRoundModal">+ {{ t('manager.contestSettings.addRound') }}</button>
    </div>

    <div v-if="settings.rounds.length === 0" class="empty-state">
      <div class="empty-icon">🎭</div>
      <p>{{ t('manager.contestSettings.noRounds') }}</p>
    </div>

    <div v-for="round in settings.rounds" :key="round.name" class="card round-card">
      <div class="round-card-header">
        <h3 class="round-name">{{ round.name }}</h3>
        <div style="display:flex; gap:.5rem;">
          <button v-if="availableCategories(round).length > 0" class="btn btn-secondary btn-sm"
            @click="openCreateConfigModal(round.name)">
            + {{ t('manager.contestSettings.addCategoryConfig') }}
          </button>
          <button class="btn btn-danger btn-sm" @click="removeRound(round.name)">{{ t('common.delete') }}</button>
        </div>
      </div>

      <div v-if="round.categoryConfigs.length === 0" class="empty-state">
        <p>{{ t('manager.contestSettings.noCategoryConfigs') }}</p>
      </div>

      <div v-for="config in round.categoryConfigs" :key="config.category ?? 'solo'" class="category-config-card">
        <div class="config-header">
          <strong v-if="config.category">{{ config.category }}</strong>
          <strong v-else>{{ t('manager.contestSettings.configuration') }}</strong>
          <div style="display:flex; gap:.4rem;">
            <button class="btn btn-secondary btn-sm" @click="openEditConfigModal(round.name, config)">{{ t('common.edit') }}</button>
            <button class="btn btn-danger btn-sm" @click="removeCategoryConfig(round.name, config.category)">{{ t('common.delete') }}</button>
          </div>
        </div>

        <p class="config-venue">{{ config.venue }}</p>
        <div class="round-pieces">
          <span v-for="(piece, i) in config.pieces" :key="i" class="badge badge-lav bt-tag">{{ piece }}</span>
        </div>

        <div class="round-defaults">
          <span>{{ t('manager.contestSettings.warmUp') }}: {{ config.defaultWarmUpOffsetMinutes }}min</span>
          <span>{{ t('manager.contestSettings.ready') }}: {{ config.defaultReadyOffsetMinutes }}min</span>
          <span>{{ t('manager.contestSettings.stage') }}: {{ config.defaultStageDurationMinutes }}min</span>
          <span>{{ t('manager.contestSettings.pauseEvery') }}: {{ config.defaultPauseEveryNPerformances }}</span>
          <span>{{ t('manager.contestSettings.pauseDuration') }}: {{ config.defaultPauseDurationMinutes }}min</span>
        </div>

        <div class="round-days-section">
          <div class="section-row" style="margin-bottom:.5rem;">
            <h4 class="days-title">{{ t('manager.contestSettings.daysTitle') }}</h4>
            <button class="btn btn-secondary btn-sm" @click="openAddDayModal(round.name, config.category)">
              + {{ t('manager.contestSettings.addDay') }}
            </button>
          </div>
          <div v-if="config.days.length === 0" class="muted-text">{{ t('manager.contestSettings.noDays') }}</div>
          <div v-else class="days-list">
            <div v-for="(day, idx) in config.days" :key="idx" class="day-row">
              <span><strong>{{ t('manager.contestSettings.day') }} {{ idx + 1 }}</strong> — {{ day.date }} @ {{ day.startTime }}</span>
              <div style="display:flex; gap:.4rem;">
                <button class="btn btn-secondary btn-sm" @click="openEditDayModal(round.name, config.category, idx, day)">{{ t('common.edit') }}</button>
                <button class="btn btn-danger btn-sm" @click="removeDay(round.name, config.category, idx)">{{ t('common.delete') }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>

  <!-- Create Round Modal (name only) -->
  <Teleport to="body">
    <div v-if="roundModalOpen" class="modal-overlay" @click.self="roundModalOpen = false">
      <div class="modal">
        <h2 class="modal-title">{{ t('manager.contestSettings.createRound') }}</h2>
        <div class="form-group">
          <label class="form-label">{{ t('manager.contestSettings.roundName') }}</label>
          <input class="form-input" v-model="newRoundName" />
        </div>
        <div v-if="roundFormError" class="error-banner">⚠️ {{ roundFormError }}</div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="roundModalOpen = false">{{ t('common.cancel') }}</button>
          <button class="btn btn-primary" :disabled="savingRound" @click="saveRound">
            <InlineSpinner v-if="savingRound" />
            <span v-else>{{ t('common.save') }}</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Create/Edit Category Config Modal -->
  <Teleport to="body">
    <div v-if="configModalOpen" class="modal-overlay" @click.self="configModalOpen = false">
      <div class="modal modal-wide">
        <h2 class="modal-title">{{ editingConfigCategory !== undefined ? t('manager.contestSettings.editCategoryConfig') : t('manager.contestSettings.addCategoryConfig') }}</h2>

        <div v-if="contestType === ContestTypeEnum.YOUTH" class="form-group">
          <label class="form-label">{{ t('manager.diplomas.bookingType') }}</label>
          <select class="form-input" v-model="configForm.category" :disabled="editingConfigCategory !== undefined">
            <option value="" disabled>{{ t('manager.diplomas.bookingTypePlaceholder') }}</option>
            <option v-for="c in youthCategoryOptions" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">{{ t('manager.contestSettings.venue') }}</label>
          <input class="form-input" v-model="configForm.venue" />
        </div>

        <div class="form-group">
          <label class="form-label">{{ t('manager.contestSettings.pieces') }}</label>
          <div v-for="(piece, i) in configForm.pieces" :key="i" style="display:flex; gap:.5rem; margin-bottom:.5rem;">
            <input class="form-input" v-model="configForm.pieces[i]" />
            <button class="btn btn-danger btn-sm" @click="configForm.pieces.splice(i, 1)">✕</button>
          </div>
          <button class="btn btn-secondary btn-sm" @click="configForm.pieces.push('')">
            + {{ t('manager.contestSettings.addPiece') }}
          </button>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">{{ t('manager.contestSettings.warmUp') }}</label>
            <input class="form-input" type="number" min="0" v-model.number="configForm.defaultWarmUpOffsetMinutes" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('manager.contestSettings.ready') }}</label>
            <input class="form-input" type="number" min="0" v-model.number="configForm.defaultReadyOffsetMinutes" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('manager.contestSettings.stage') }}</label>
            <input class="form-input" type="number" min="1" v-model.number="configForm.defaultStageDurationMinutes" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">{{ t('manager.contestSettings.pauseEvery') }}</label>
            <input class="form-input" type="number" min="1" v-model.number="configForm.defaultPauseEveryNPerformances" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('manager.contestSettings.pauseDuration') }}</label>
            <input class="form-input" type="number" min="0" v-model.number="configForm.defaultPauseDurationMinutes" />
          </div>
        </div>

        <div v-if="configFormError" class="error-banner">⚠️ {{ configFormError }}</div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="configModalOpen = false">{{ t('common.cancel') }}</button>
          <button class="btn btn-primary" :disabled="savingConfig" @click="saveConfig">
            <InlineSpinner v-if="savingConfig" />
            <span v-else>{{ t('common.save') }}</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Add/Edit Day Modal -->
  <Teleport to="body">
    <div v-if="dayModalOpen" class="modal-overlay" @click.self="dayModalOpen = false">
      <div class="modal">
        <h2 class="modal-title">{{ editingDayIndex !== null ? t('manager.contestSettings.editDay') : t('manager.contestSettings.addDay') }}</h2>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">{{ t('manager.contestSettings.date') }}</label>
            <input class="form-input" type="date" v-model="dayForm.date" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('manager.contestSettings.startTime') }}</label>
            <input class="form-input" type="time" v-model="dayForm.startTime" />
          </div>
        </div>
        <div v-if="dayFormError" class="error-banner">⚠️ {{ dayFormError }}</div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="dayModalOpen = false">{{ t('common.cancel') }}</button>
          <button class="btn btn-primary" :disabled="savingDay" @click="saveDay">
            <InlineSpinner v-if="savingDay" />
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
  useContestSettingsApi,
  ContestTypeEnum,
  type ContestSettingsDto,
  type ContestRoundDto,
  type ContestRoundCategoryConfigDto,
  type ContestRoundDayDto,
  type CreateCategoryConfigPayload,
} from '../composables/useContestSettingsApi'
import { extractErrorMessage } from '../utiles/error.utiles'
import InlineSpinner from './InlineSpinner.vue'

const { t } = useI18n()
const api = useContestSettingsApi()

const YOUTH_CATEGORIES = ['youth_A', 'youth_B', 'youth_C', 'youth_D']

const contestType = ref<ContestTypeEnum>(ContestTypeEnum.SOLO)
const settings = ref<ContestSettingsDto | null>(null)
const loading = ref(false)
const pageError = ref('')

const contestNameDraft = ref('')
const savingName = ref(false)

onMounted(() => {
  reload()
})

function switchContestType(type: ContestTypeEnum) {
  contestType.value = type
  reload()
}

async function reload() {
  loading.value = true
  try {
    // Empty string placeholder — only actually used the very first time
    // a contest type's settings document doesn't exist yet; the
    // returned contestName is then immediately editable below.
    const data = await api.getOrCreate(contestType.value, '')
    settings.value = data
    contestNameDraft.value = data.contestName
  } catch (e) {
    pageError.value = extractErrorMessage(e)
  } finally {
    loading.value = false
  }
}

async function saveContestName() {
  savingName.value = true
  try {
    settings.value = await api.setContestName(contestType.value, contestNameDraft.value)
  } catch (e) {
    pageError.value = extractErrorMessage(e)
  } finally {
    savingName.value = false
  }
}

// Categories not yet configured within this round — Solo never offers
// any (its single config always exists once added), Youth offers
// whichever of A/B/C/D haven't been added yet.
function availableCategories(round: ContestRoundDto): string[] {
  if (contestType.value === ContestTypeEnum.SOLO) {
    return round.categoryConfigs.length === 0 ? ['__solo__'] : []
  }
  const used = new Set(round.categoryConfigs.map(c => c.category))
  return YOUTH_CATEGORIES.filter(c => !used.has(c))
}
const youthCategoryOptions = YOUTH_CATEGORIES

// ── Round create ─────────────────────────────────────────────────────
const roundModalOpen = ref(false)
const newRoundName = ref('')
const savingRound = ref(false)
const roundFormError = ref('')

function openCreateRoundModal() {
  newRoundName.value = ''
  roundFormError.value = ''
  roundModalOpen.value = true
}

async function saveRound() {
  roundFormError.value = ''
  if (!newRoundName.value.trim()) {
    roundFormError.value = t('manager.contestSettings.validation.nameVenueRequired')
    return
  }
  savingRound.value = true
  try {
    settings.value = await api.addRound(contestType.value, newRoundName.value.trim())
    roundModalOpen.value = false
  } catch (e) {
    roundFormError.value = extractErrorMessage(e)
  } finally {
    savingRound.value = false
  }
}

async function removeRound(roundName: string) {
  if (!confirm(t('manager.contestSettings.deleteRoundConfirm'))) return
  try {
    settings.value = await api.removeRound(contestType.value, roundName)
  } catch (e) {
    pageError.value = extractErrorMessage(e)
  }
}

// ── Category config create/edit ──────────────────────────────────────
const configModalOpen = ref(false)
const configModalRoundName = ref('')
const editingConfigCategory = ref<string | null | undefined>(undefined) // undefined = creating new
const savingConfig = ref(false)
const configFormError = ref('')

function blankConfigForm(): CreateCategoryConfigPayload & { category: string } {
  return {
    category: '', venue: '', pieces: [''],
    defaultWarmUpOffsetMinutes: 20, defaultReadyOffsetMinutes: 5,
    defaultStageDurationMinutes: 10, defaultPauseEveryNPerformances: 12,
    defaultPauseDurationMinutes: 15,
  }
}
const configForm = ref(blankConfigForm())

function openCreateConfigModal(roundName: string) {
  configModalRoundName.value = roundName
  editingConfigCategory.value = undefined
  configForm.value = blankConfigForm()
  configFormError.value = ''
  configModalOpen.value = true
}

function openEditConfigModal(roundName: string, config: ContestRoundCategoryConfigDto) {
  configModalRoundName.value = roundName
  editingConfigCategory.value = config.category
  configForm.value = {
    category: config.category ?? '',
    venue: config.venue,
    pieces: [...config.pieces],
    defaultWarmUpOffsetMinutes: config.defaultWarmUpOffsetMinutes,
    defaultReadyOffsetMinutes: config.defaultReadyOffsetMinutes,
    defaultStageDurationMinutes: config.defaultStageDurationMinutes,
    defaultPauseEveryNPerformances: config.defaultPauseEveryNPerformances,
    defaultPauseDurationMinutes: config.defaultPauseDurationMinutes,
  }
  configFormError.value = ''
  configModalOpen.value = true
}

async function saveConfig() {
  configFormError.value = ''
  if (!configForm.value.venue.trim()) {
    configFormError.value = t('manager.contestSettings.validation.nameVenueRequired')
    return
  }
  if (contestType.value === ContestTypeEnum.YOUTH && editingConfigCategory.value === undefined && !configForm.value.category) {
    configFormError.value = t('manager.diplomas.bookingTypePlaceholder')
    return
  }
  const cleanPieces = configForm.value.pieces.map(p => p.trim()).filter(Boolean)
  if (cleanPieces.length === 0) {
    configFormError.value = t('manager.contestSettings.validation.pieceRequired')
    return
  }

  savingConfig.value = true
  try {
    const { category, ...fields } = configForm.value
    if (editingConfigCategory.value !== undefined) {
      settings.value = await api.updateCategoryConfig(
        contestType.value, configModalRoundName.value, editingConfigCategory.value,
        { ...fields, pieces: cleanPieces },
      )
    } else {
      const payload: CreateCategoryConfigPayload = { ...fields, pieces: cleanPieces }
      if (contestType.value === ContestTypeEnum.YOUTH) payload.category = category
      settings.value = await api.addCategoryConfig(contestType.value, configModalRoundName.value, payload)
    }
    configModalOpen.value = false
  } catch (e) {
    configFormError.value = extractErrorMessage(e)
  } finally {
    savingConfig.value = false
  }
}

async function removeCategoryConfig(roundName: string, category: string | null) {
  if (!confirm(t('manager.contestSettings.deleteConfigConfirm'))) return
  try {
    settings.value = await api.removeCategoryConfig(contestType.value, roundName, category)
  } catch (e) {
    pageError.value = extractErrorMessage(e)
  }
}

// ── Day add/edit ─────────────────────────────────────────────────────
const dayModalOpen = ref(false)
const dayModalRoundName = ref('')
const dayModalCategory = ref<string | null>(null)
const editingDayIndex = ref<number | null>(null)
const savingDay = ref(false)
const dayFormError = ref('')
const dayForm = ref<ContestRoundDayDto>({ date: '', startTime: '09:00' })

function openAddDayModal(roundName: string, category: string | null) {
  dayModalRoundName.value = roundName
  dayModalCategory.value = category
  editingDayIndex.value = null
  dayForm.value = { date: '', startTime: '09:00' }
  dayFormError.value = ''
  dayModalOpen.value = true
}

function openEditDayModal(roundName: string, category: string | null, index: number, day: ContestRoundDayDto) {
  dayModalRoundName.value = roundName
  dayModalCategory.value = category
  editingDayIndex.value = index
  dayForm.value = { ...day }
  dayFormError.value = ''
  dayModalOpen.value = true
}

async function saveDay() {
  dayFormError.value = ''
  if (!dayForm.value.date || !dayForm.value.startTime) {
    dayFormError.value = t('manager.contestSettings.validation.dayRequired')
    return
  }
  savingDay.value = true
  try {
    if (editingDayIndex.value !== null) {
      settings.value = await api.updateDay(contestType.value, dayModalRoundName.value, dayModalCategory.value, editingDayIndex.value, dayForm.value)
    } else {
      settings.value = await api.addDay(contestType.value, dayModalRoundName.value, dayModalCategory.value, dayForm.value)
    }
    dayModalOpen.value = false
  } catch (e) {
    dayFormError.value = extractErrorMessage(e)
  } finally {
    savingDay.value = false
  }
}

async function removeDay(roundName: string, category: string | null, index: number) {
  if (!confirm(t('manager.contestSettings.deleteDayConfirm'))) return
  try {
    settings.value = await api.removeDay(contestType.value, roundName, category, index)
  } catch (e) {
    pageError.value = extractErrorMessage(e)
  }
}
</script>

<style scoped>
.contest-type-toggle {
  display: flex;
  gap: .5rem;
}

.round-card {
  padding: 1.5rem;
  margin-bottom: 1.25rem;
}

.round-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.round-name {
  font-family: var(--font-display);
  font-size: 1.15rem;
  margin: 0;
}

.category-config-card {
  border: 1.5px solid var(--border);
  border-radius: 10px;
  padding: 1.1rem;
  margin-bottom: 1rem;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: .5rem;
  font-size: .95rem;
}

.config-venue {
  color: var(--muted);
  font-size: .85rem;
  margin: 0 0 .6rem;
}

.round-pieces {
  display: flex;
  flex-wrap: wrap;
  gap: .4rem;
  margin-bottom: .75rem;
}

.round-defaults {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: .82rem;
  color: var(--muted);
  font-weight: 600;
  padding-bottom: 1rem;
  border-bottom: 1.5px solid var(--border);
  margin-bottom: 1rem;
}

.round-days-section {
  margin-top: .5rem;
}

.days-title {
  font-size: .82rem;
  font-weight: 800;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: .05em;
  margin: 0;
}

.days-list {
  display: flex;
  flex-direction: column;
  gap: .5rem;
}

.day-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: .6rem .8rem;
  border: 1.5px solid var(--border);
  border-radius: 8px;
  font-size: .85rem;
}

.muted-text {
  color: var(--muted);
  font-size: .82rem;
}

.modal-wide {
  max-width: 640px;
  width: 90vw;
}
</style>