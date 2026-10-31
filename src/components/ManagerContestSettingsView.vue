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
          <input class="form-input" :class="{ 'has-error': nameError }" v-model="contestNameDraft" />
          <button class="btn btn-secondary" :disabled="savingName || contestNameDraft === settings.contestName"
            @click="saveContestName">
            <InlineSpinner v-if="savingName" />
            <span v-else>{{ t('common.save') }}</span>
          </button>
        </div>
        <span v-if="nameError" class="field-error">{{ nameError }}</span>
      </div>

      <div class="form-group">
        <label class="form-label">{{ t('manager.contestSettings.collisionMargin') }}</label>
        <div style="display:flex; gap:.6rem;">
          <input class="form-input" :class="{ 'has-error': marginError }" type="number" min="0" max="240"
            v-model.number="marginDraft" style="max-width:120px;" />
          <button class="btn btn-secondary" :disabled="savingMargin || marginDraft === settings.collisionMarginMinutes"
            @click="saveCollisionMargin">
            <InlineSpinner v-if="savingMargin" />
            <span v-else>{{ t('common.save') }}</span>
          </button>
        </div>
        <span v-if="marginError" class="field-error">{{ marginError }}</span>
        <span class="field-hint">{{ t('manager.contestSettings.collisionMarginHint') }}</span>
      </div>
    </div>

    <div class="section-row">
      <h2 class="section-title">{{ t('manager.contestSettings.roundsTitle') }}</h2>
      <button class="btn btn-primary" @click="openCreateRoundModal">+ {{ t('manager.contestSettings.addRound')
      }}</button>
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
            <button class="btn btn-secondary btn-sm" @click="openEditConfigModal(round.name, config)">{{
              t('common.edit') }}</button>
            <button class="btn btn-danger btn-sm" @click="removeCategoryConfig(round.name, config.category)">{{
              t('common.delete') }}</button>
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
              <span><strong>{{ t('manager.contestSettings.day') }} {{ idx + 1 }}</strong> — {{ day.date }} @ {{
                day.startTime }}</span>
              <div style="display:flex; gap:.4rem;">
                <button class="btn btn-secondary btn-sm"
                  @click="openEditDayModal(round.name, config.category, idx, day)">{{ t('common.edit') }}</button>
                <button class="btn btn-danger btn-sm" @click="removeDay(round.name, config.category, idx)">{{
                  t('common.delete') }}</button>
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
          <input class="form-input" :class="{ 'has-error': roundFieldErrors.name }" v-model="newRoundName" />
          <span v-if="roundFieldErrors.name" class="field-error">{{ roundFieldErrors.name }}</span>
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
        <h2 class="modal-title">{{ editingConfigCategory !== undefined ? t('manager.contestSettings.editCategoryConfig')
          :
          t('manager.contestSettings.addCategoryConfig') }}</h2>

        <div v-if="contestType === ContestTypeEnum.YOUTH" class="form-group">
          <label class="form-label">{{ t('manager.diplomas.bookingType') }}</label>
          <select class="form-input" :class="{ 'has-error': configFieldErrors.category }" v-model="configForm.category"
            :disabled="editingConfigCategory !== undefined">
            <option value="" disabled>{{ t('manager.diplomas.bookingTypePlaceholder') }}</option>
            <option v-for="c in youthCategoryOptions" :key="c" :value="c">{{ c }}</option>
          </select>
          <span v-if="configFieldErrors.category" class="field-error">{{ configFieldErrors.category }}</span>
        </div>

        <div class="form-group">
          <label class="form-label">{{ t('manager.contestSettings.venue') }}</label>
          <input class="form-input" :class="{ 'has-error': configFieldErrors.venue }" v-model="configForm.venue" />
          <span v-if="configFieldErrors.venue" class="field-error">{{ configFieldErrors.venue }}</span>
        </div>

        <div class="form-group">
          <label class="form-label">{{ t('manager.contestSettings.pieces') }}</label>
          <div v-for="(piece, i) in configForm.pieces" :key="i" style="display:flex; gap:.5rem; margin-bottom:.5rem;">
            <input class="form-input" v-model="configForm.pieces[i]" />
            <button class="btn btn-danger btn-sm" @click="configForm.pieces.splice(i, 1)">✕</button>
          </div>
          <span v-if="configFieldErrors.pieces" class="field-error" style="margin:-.25rem 0 .5rem;">{{
            configFieldErrors.pieces }}</span>
          <button class="btn btn-secondary btn-sm" @click="configForm.pieces.push('')">
            + {{ t('manager.contestSettings.addPiece') }}
          </button>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">{{ t('manager.contestSettings.warmUp') }}</label>
            <input class="form-input" :class="{ 'has-error': configFieldErrors.defaultWarmUpOffsetMinutes }"
              type="number" min="0" v-model.number="configForm.defaultWarmUpOffsetMinutes" />
            <span v-if="configFieldErrors.defaultWarmUpOffsetMinutes" class="field-error">{{
              configFieldErrors.defaultWarmUpOffsetMinutes }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('manager.contestSettings.ready') }}</label>
            <input class="form-input" :class="{ 'has-error': configFieldErrors.defaultReadyOffsetMinutes }"
              type="number" min="0" v-model.number="configForm.defaultReadyOffsetMinutes" />
            <span v-if="configFieldErrors.defaultReadyOffsetMinutes" class="field-error">{{
              configFieldErrors.defaultReadyOffsetMinutes }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('manager.contestSettings.stage') }}</label>
            <input class="form-input" :class="{ 'has-error': configFieldErrors.defaultStageDurationMinutes }"
              type="number" min="1" v-model.number="configForm.defaultStageDurationMinutes" />
            <span v-if="configFieldErrors.defaultStageDurationMinutes" class="field-error">{{
              configFieldErrors.defaultStageDurationMinutes }}</span>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">{{ t('manager.contestSettings.pauseEvery') }}</label>
            <input class="form-input" :class="{ 'has-error': configFieldErrors.defaultPauseEveryNPerformances }"
              type="number" min="1" v-model.number="configForm.defaultPauseEveryNPerformances" />
            <span v-if="configFieldErrors.defaultPauseEveryNPerformances" class="field-error">{{
              configFieldErrors.defaultPauseEveryNPerformances }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('manager.contestSettings.pauseDuration') }}</label>
            <input class="form-input" :class="{ 'has-error': configFieldErrors.defaultPauseDurationMinutes }"
              type="number" min="0" v-model.number="configForm.defaultPauseDurationMinutes" />
            <span v-if="configFieldErrors.defaultPauseDurationMinutes" class="field-error">{{
              configFieldErrors.defaultPauseDurationMinutes }}</span>
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
        <h2 class="modal-title">{{ editingDayIndex !== null ? t('manager.contestSettings.editDay') :
          t('manager.contestSettings.addDay') }}</h2>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">{{ t('manager.contestSettings.date') }}</label>
            <input class="form-input" :class="{ 'has-error': dayFieldErrors.date }" type="date"
              v-model="dayForm.date" />
            <span v-if="dayFieldErrors.date" class="field-error">{{ dayFieldErrors.date }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('manager.contestSettings.startTime') }}</label>
            <input class="form-input" :class="{ 'has-error': dayFieldErrors.startTime }" type="time"
              v-model="dayForm.startTime" />
            <span v-if="dayFieldErrors.startTime" class="field-error">{{ dayFieldErrors.startTime }}</span>
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('manager.contestSettings.endTime') }}</label>
            <input class="form-input" :class="{ 'has-error': dayFieldErrors.endTime }" type="time"
              v-model="dayForm.endTime" />
            <span v-if="dayFieldErrors.endTime" class="field-error">{{ dayFieldErrors.endTime }}</span>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">{{ t('manager.contestSettings.morningAccompanist') }}</label>
            <select class="form-input" v-model="dayForm.morningAccompanistId">
              <option value="">{{ t('manager.contestSettings.noAccompanist') }}</option>
              <option v-for="p in pianists" :key="p._id" :value="p._id">{{ p.firstnames }} {{ p.surnames }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('manager.contestSettings.afternoonAccompanist') }}</label>
            <select class="form-input" v-model="dayForm.afternoonAccompanistId">
              <option value="">{{ t('manager.contestSettings.noAccompanist') }}</option>
              <option v-for="p in pianists" :key="p._id" :value="p._id">{{ p.firstnames }} {{ p.surnames }}</option>
            </select>
          </div>
        </div>
        <p class="muted-text">{{ t('manager.contestSettings.accompanistHint') }}</p>
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
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  useContestSettingsApi,
  ContestTypeEnum,
  type ContestSettingsDto,
  type ContestRoundDto,
  type ContestRoundCategoryConfigDto,
  type ContestRoundDayDto,
  type CreateCategoryConfigPayload,
  type PianistDto,
} from '../composables/useContestSettingsApi'
import { extractErrorMessage } from '../utiles/error.utiles'
import { zodErrorsToFieldMap } from '../utiles/zod.utiles'
import { contestNameSchema, collisionMarginSchema, roundFormSchema, categoryConfigSchema, contestDaySchema } from '../validation/contestSettings.schema'
import InlineSpinner from './InlineSpinner.vue'
import { useModalScrollLock } from '../composables/useModalScrollLock'

const { t } = useI18n()
const api = useContestSettingsApi()

const YOUTH_CATEGORIES = ['youth_A', 'youth_B', 'youth_C', 'youth_D']

const contestType = ref<ContestTypeEnum>(ContestTypeEnum.SOLO)
const settings = ref<ContestSettingsDto | null>(null)
const loading = ref(false)
const pageError = ref('')

const contestNameDraft = ref('')
const savingName = ref(false)

// Collision margin: minutes before warm-up that count as busy (saved like the contest name)
const marginDraft = ref<number | ''>(30)
const savingMargin = ref(false)
const marginError = ref('')


const pianists = ref<PianistDto[]>([])

onMounted(async () => {
  await reload()
  try {
    pianists.value = await api.getPianists()
  } catch (e) {
    pageError.value = extractErrorMessage(e)
  }
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
    marginDraft.value = data.collisionMarginMinutes
    marginError.value = ''
  } catch (e) {
    pageError.value = extractErrorMessage(e)
  } finally {
    loading.value = false
  }
}

async function saveCollisionMargin() {
  const result = collisionMarginSchema.safeParse({ collisionMarginMinutes: marginDraft.value })
  if (!result.success) {
    marginError.value = zodErrorsToFieldMap(result.error, t).collisionMarginMinutes ?? ''
    return
  }
  marginError.value = ''
  savingMargin.value = true
  try {
    settings.value = await api.setCollisionMargin(contestType.value, result.data.collisionMarginMinutes)
  } catch (e) {
    pageError.value = extractErrorMessage(e)
  } finally {
    savingMargin.value = false
  }
}

watch(marginDraft, () => {
  if (!marginError.value) return
  const result = collisionMarginSchema.safeParse({ collisionMarginMinutes: marginDraft.value })
  marginError.value = result.success ? '' : zodErrorsToFieldMap(result.error, t).collisionMarginMinutes ?? ''
})

async function saveContestName() {
  const result = contestNameSchema.safeParse({ contestName: contestNameDraft.value })
  if (!result.success) {
    nameError.value = zodErrorsToFieldMap(result.error, t).contestName ?? ''
    return
  }
  nameError.value = ''
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
  const result = roundFormSchema(settings.value?.rounds.map(r => r.name) ?? []).safeParse({ name: newRoundName.value })
  if (!result.success) {
    roundFieldErrors.value = zodErrorsToFieldMap(result.error, t)
    return
  }
  roundFieldErrors.value = {}
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
  const result = categoryConfigSchema({
    requireCategory: contestType.value === ContestTypeEnum.YOUTH && editingConfigCategory.value === undefined,
  }).safeParse(configForm.value)
  if (!result.success) {
    configFieldErrors.value = zodErrorsToFieldMap(result.error, t)
    return
  }
  configFieldErrors.value = {}
  const cleanPieces = configForm.value.pieces.map(p => p.trim()).filter(Boolean)

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
const dayForm = ref<ContestRoundDayDto>({ date: '', startTime: '09:00', endTime: '', morningAccompanistId: '', afternoonAccompanistId: '' })

function openAddDayModal(roundName: string, category: string | null) {
  dayModalRoundName.value = roundName
  dayModalCategory.value = category
  editingDayIndex.value = null
  dayForm.value = { date: '', startTime: '09:00', endTime: '', morningAccompanistId: '', afternoonAccompanistId: '' }
  dayFormError.value = ''
  dayModalOpen.value = true
}

function openEditDayModal(roundName: string, category: string | null, index: number, day: ContestRoundDayDto) {
  dayModalRoundName.value = roundName
  dayModalCategory.value = category
  editingDayIndex.value = index
  dayForm.value = {
    date: day.date,
    startTime: day.startTime,
    endTime: day.endTime ?? '',
    morningAccompanistId: day.morningAccompanistId ?? '',
    afternoonAccompanistId: day.afternoonAccompanistId ?? '',
  }
  dayFormError.value = ''
  dayModalOpen.value = true
}
async function saveDay() {
  dayFormError.value = ''
  const result = contestDaySchema.safeParse(dayForm.value)
  if (!result.success) {
    dayFieldErrors.value = zodErrorsToFieldMap(result.error, t)
    return
  }
  dayFieldErrors.value = {}

  savingDay.value = true
  try {
    const payload: ContestRoundDayDto = {
      date: dayForm.value.date,
      startTime: dayForm.value.startTime,
      endTime: dayForm.value.endTime || undefined,
      morningAccompanistId: dayForm.value.morningAccompanistId || undefined,
      afternoonAccompanistId: dayForm.value.afternoonAccompanistId || undefined,
    }
    if (editingDayIndex.value !== null) {
      settings.value = await api.updateDay(contestType.value, dayModalRoundName.value, dayModalCategory.value, editingDayIndex.value, payload)
    } else {
      settings.value = await api.addDay(contestType.value, dayModalRoundName.value, dayModalCategory.value, payload)
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

useModalScrollLock(roundModalOpen, configModalOpen, dayModalOpen)

// ── Field messages of the zod validation ──
const nameError = ref('')
const roundFieldErrors = ref<Record<string, string>>({})
const configFieldErrors = ref<Record<string, string>>({})
const dayFieldErrors = ref<Record<string, string>>({})
// Once a message is showing, re-check on every change so it goes away as soon as the field is fixed.
// (These are registered BEFORE the "window opened" watchers below, so that opening a window ends with a clean slate.)
watch(contestNameDraft, () => {
  if (!nameError.value) return
  const result = contestNameSchema.safeParse({ contestName: contestNameDraft.value })
  nameError.value = result.success ? '' : zodErrorsToFieldMap(result.error, t).contestName ?? ''
})
watch(newRoundName, () => {
  if (Object.keys(roundFieldErrors.value).length === 0) return
  const result = roundFormSchema(settings.value?.rounds.map(r => r.name) ?? []).safeParse({ name: newRoundName.value })
  roundFieldErrors.value = result.success ? {} : zodErrorsToFieldMap(result.error, t)
})
watch(configForm, () => {
  if (Object.keys(configFieldErrors.value).length === 0) return
  const result = categoryConfigSchema({
    requireCategory: contestType.value === ContestTypeEnum.YOUTH && editingConfigCategory.value === undefined,
  }).safeParse(configForm.value)
  configFieldErrors.value = result.success ? {} : zodErrorsToFieldMap(result.error, t)
}, { deep: true })
watch(dayForm, () => {
  if (Object.keys(dayFieldErrors.value).length === 0) return
  const result = contestDaySchema.safeParse(dayForm.value)
  dayFieldErrors.value = result.success ? {} : zodErrorsToFieldMap(result.error, t)
}, { deep: true })
watch(roundModalOpen, () => { roundFieldErrors.value = {} })
watch(configModalOpen, () => { configFieldErrors.value = {} })
watch(dayModalOpen, () => { dayFieldErrors.value = {} })
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