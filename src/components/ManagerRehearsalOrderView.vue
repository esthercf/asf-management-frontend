<template>
    <div class="page-header">
        <h1>{{ t('manager.rehearsalOrder.title') }}</h1>
        <p class="subtitle">{{ t('manager.rehearsalOrder.subtitle') }}</p>
    </div>

    <div v-if="pageError" class="error-banner"
        style="margin-bottom:1.5rem; display:flex; align-items:center; justify-content:space-between; gap:1rem;">
        <span>⚠️ {{ pageError }}</span>
        <button class="btn btn-secondary btn-sm" @click="pageError = ''">✕</button>
    </div>
    <div v-if="infoMessage" class="card" style="padding:.75rem 1rem; margin-bottom:1rem;">
        {{ infoMessage }}
        <button class="btn btn-secondary btn-sm" style="margin-left:1rem;" @click="infoMessage = ''">✕</button>
    </div>

    <!-- Which board: contest, round and (Youth) category -->
    <div class="section-row">
        <div class="contest-type-toggle">
            <button class="btn" :class="contestType === ContestTypeEnum.SOLO ? 'btn-primary' : 'btn-secondary'"
                @click="switchContestType(ContestTypeEnum.SOLO)">{{ t('manager.rehearsalOrder.solo') }}</button>
            <button class="btn" :class="contestType === ContestTypeEnum.YOUTH ? 'btn-primary' : 'btn-secondary'"
                @click="switchContestType(ContestTypeEnum.YOUTH)">{{ t('manager.rehearsalOrder.youth') }}</button>
        </div>

        <select class="form-input filter-select" v-model="selectedRoundName" @change="onScopeChange">
            <option value="" disabled>{{ t('manager.rehearsalOrder.selectRound') }}</option>
            <option v-for="r in rounds" :key="r.name" :value="r.name">{{ r.name }}</option>
        </select>

        <select v-if="contestType === ContestTypeEnum.YOUTH" class="form-input filter-select" v-model="selectedCategory"
            @change="onScopeChange">
            <option value="" disabled>{{ t('manager.rehearsalOrder.selectCategory') }}</option>
            <option v-for="c in categoriesOfRound" :key="c" :value="c">{{ t(`common.scheduleCategories.${c}`) }}
            </option>
        </select>

        <!-- The rehearsals Excel (any categories); a board then takes them with "Fill from imported rehearsals" -->
        <button class="btn btn-secondary" :disabled="importing" @click="fileInput?.click()"
            :title="t('manager.rehearsalOrder.importHint')">
            <InlineSpinner v-if="importing" />
            <span v-else>📄 {{ t('manager.rehearsalOrder.importExcel') }}</span>
        </button>
        <input ref="fileInput" type="file" accept=".xlsx" style="display:none;" @change="onFileSelected" />
    </div>

    <div v-if="importResult" class="card" style="padding:1rem 1.25rem; margin-bottom:1rem;">
        <p><strong>{{ importResult.message }}</strong></p>
        <ul v-if="importResult.errors.length > 0" class="import-errors">
            <li v-for="err in importResult.errors" :key="err.row">
                {{ t('manager.rehearsalOrder.importRow', { row: err.row }) }}: {{ err.reason }}
            </li>
        </ul>
        <p class="muted-text">{{ t('manager.rehearsalOrder.importNext') }}</p>
        <button class="btn btn-secondary btn-sm" @click="importResult = null">{{ t('common.close') }}</button>
    </div>

    <div v-if="!scopeReady" class="empty-state">
        <div class="empty-icon">🎹</div>
        <p>{{ t('manager.rehearsalOrder.selectScopeFirst') }}</p>
    </div>

    <template v-else>
        <!-- The two ways to start (or start again) the board, and its settings -->
        <div class="section-row" style="margin-bottom:1rem;">
            <button class="btn btn-primary" :disabled="!!busy" @click="startFrom('performance')">
                <InlineSpinner v-if="busy === 'performance'" />
                <span v-else>🎯 {{ t('manager.rehearsalOrder.generateFromPerformance') }}</span>
            </button>
            <button class="btn btn-secondary" :disabled="!!busy" @click="startFrom('rehearsals')">
                <InlineSpinner v-if="busy === 'rehearsals'" />
                <span v-else>📥 {{ t('manager.rehearsalOrder.fillFromRehearsals') }}</span>
            </button>
            <button class="btn btn-secondary" :disabled="!view" @click="toggleSettings">
                ⚙ {{ t('manager.rehearsalOrder.settings') }}
            </button>
            <button class="btn btn-secondary" :disabled="!view || checkingCollisions" @click="checkCollisions">
                <InlineSpinner v-if="checkingCollisions" />
                <span v-else>⚠ {{ t('manager.rehearsalOrder.checkCollisions') }}</span>
            </button>
            <button class="btn btn-secondary" @click="openExport">📄 {{ t('manager.rehearsalOrder.exportList')
                }}</button>
        </div>

        <!-- Collision report (information only: nothing is blocked) -->
        <div v-if="collisions" class="card" style="padding:1rem 1.25rem; margin-bottom:1rem;">
            <p v-if="collisions.length === 0"><strong>✅ {{ t('manager.rehearsalOrder.noCollisions') }}</strong></p>
            <template v-else>
                <p><strong>⚠ {{ t('manager.rehearsalOrder.collisionsFound', { count: collisions.length }) }}</strong>
                </p>
                <ul class="import-errors">
                    <li v-for="(c, i) in collisions" :key="i">
                        <strong>{{ c.studentFullName }}</strong> · {{ c.date }} ·
                        {{ t('manager.rehearsalOrder.collisionRehearsal') }} {{ c.rehearsal }} ↔
                        <strong>{{ t(`manager.rehearsalOrder.collisionKinds.${c.otherKind}`) }}</strong>
                        <span v-if="c.otherLabel"> ({{ c.otherLabel }})</span> {{ c.other }}
                    </li>
                </ul>
            </template>
            <button class="btn btn-secondary btn-sm" @click="collisions = null">{{ t('common.close') }}</button>
        </div>

        <!-- The board's settings -->
        <div v-if="settingsOpen" class="card" style="padding:1rem 1.25rem; margin-bottom:1rem;">
            <h3 class="section-title" style="font-size:.95rem;">{{ t('manager.rehearsalOrder.daysTitle') }}</h3>
            <div v-for="(day, i) in settingsForm.days" :key="i"
                style="display:flex; gap:.5rem; align-items:flex-start; margin-bottom:.4rem;">
                <div>
                    <input class="form-input" :class="{ 'has-error': settingsErrors[`days.${i}.date`] }" type="date"
                        v-model="day.date" />
                    <span v-if="settingsErrors[`days.${i}.date`]" class="field-error">{{
                        settingsErrors[`days.${i}.date`] }}</span>
                </div>
                <div>
                    <input class="form-input" :class="{ 'has-error': settingsErrors[`days.${i}.startTime`] }"
                        type="time" v-model="day.startTime" />
                    <span v-if="settingsErrors[`days.${i}.startTime`]" class="field-error">{{
                        settingsErrors[`days.${i}.startTime`] }}</span>
                </div>
                <button class="btn btn-danger btn-sm" @click="settingsForm.days.splice(i, 1)">✕</button>
            </div>
            <button class="btn btn-secondary btn-sm" @click="settingsForm.days.push({ date: '', startTime: '15:00' })">
                + {{ t('manager.rehearsalOrder.addDay') }}
            </button>

            <div class="form-row" style="margin-top:1rem;">
                <div class="form-group">
                    <label class="form-label">{{ t('manager.rehearsalOrder.slotMinutes') }}</label>
                    <input class="form-input" :class="{ 'has-error': settingsErrors.defaultSlotMinutes }" type="number"
                        min="1" v-model.number="settingsForm.defaultSlotMinutes" />
                    <span v-if="settingsErrors.defaultSlotMinutes" class="field-error">{{
                        settingsErrors.defaultSlotMinutes }}</span>
                </div>
                <div class="form-group">
                    <label class="form-label">{{ t('manager.rehearsalOrder.pauseMinutes') }}</label>
                    <input class="form-input" :class="{ 'has-error': settingsErrors.defaultPauseMinutes }" type="number"
                        min="1" v-model.number="settingsForm.defaultPauseMinutes" />
                    <span v-if="settingsErrors.defaultPauseMinutes" class="field-error">{{
                        settingsErrors.defaultPauseMinutes
                        }}</span>
                </div>
                <div class="form-group">
                    <label class="form-label">{{ t('manager.rehearsalOrder.defaultRoom') }}</label>
                    <input class="form-input" :class="{ 'has-error': settingsErrors.defaultRoomNumber }" type="number"
                        min="1" v-model.number="settingsForm.defaultRoomNumber" />
                    <span v-if="settingsErrors.defaultRoomNumber" class="field-error">{{
                        settingsErrors.defaultRoomNumber }}</span>
                </div>
            </div>

            <div class="modal-footer">
                <button class="btn btn-secondary" @click="settingsOpen = false">{{ t('common.cancel') }}</button>
                <button class="btn btn-primary" :disabled="savingSettings" @click="saveSettings">
                    <InlineSpinner v-if="savingSettings" />
                    <span v-else>{{ t('common.save') }}</span>
                </button>
            </div>
        </div>

        <div v-if="loading" class="empty-state">
            <div class="empty-icon">⏳</div>
            <p>{{ t('common.loading') }}</p>
        </div>

        <template v-else-if="view">
            <p v-if="view.board.days.length === 0" class="muted-text">{{ t('manager.rehearsalOrder.noDaysHint') }}</p>

            <div class="board">
                <!-- Rows not placed on a day yet -->
                <div class="board-column">
                    <div class="board-column-header">
                        <h3>{{ t('manager.rehearsalOrder.unplacedTitle') }}</h3>
                        <span class="badge badge-lav">{{ unplacedRows.length }}</span>
                    </div>
                    <VueDraggable v-model="unplacedRows" class="board-list" :data-day-index="'null'"
                        group="rehearsal-order" item-key="id" @end="onDragEnd">
                        <div v-for="row in unplacedRows" :key="row.id" class="entry-card"
                            :class="{ 'entry-pause': isPause(row) }" @click="openRow(row)">
                            <template v-if="!isPause(row)">
                                <strong>{{ row.studentFullName || '—' }}</strong>
                                <div class="muted-text">🎹 {{ row.accompanistFullName || '—' }} · {{ row.durationMinutes
                                    }}'</div>
                            </template>
                            <template v-else>{{ pauseText(row) }}</template>
                        </div>
                    </VueDraggable>
                </div>

                <!-- One column per rehearsal day -->
                <div v-for="(day, dayIdx) in view.days" :key="day.date" class="board-column">
                    <div class="board-column-header">
                        <h3>{{ shortDayLabel(day.date, locale) }} · {{ day.startTime }}</h3>
                        <span v-if="isDayValidated(dayIdx)" class="badge badge-green badge-sm">
                            {{ t('manager.rehearsalOrder.validated') }}
                        </span>
                    </div>
                    <div class="board-column-actions">
                        <button class="btn btn-secondary btn-sm"
                            :disabled="isDayValidated(dayIdx) || dayBusy === dayIdx" @click="addPause(dayIdx)">+ {{
                                t('manager.rehearsalOrder.addPause') }}</button>
                        <button v-if="!isDayValidated(dayIdx)" class="btn btn-primary btn-sm"
                            :disabled="(dayRows[dayIdx]?.length ?? 0) === 0 || dayBusy === dayIdx"
                            @click="validateDay(dayIdx)">
                            <InlineSpinner v-if="dayBusy === dayIdx" />
                            <span v-else>✓ {{ t('manager.rehearsalOrder.validate') }}</span>
                        </button>
                        <button v-else class="btn btn-secondary btn-sm" :disabled="dayBusy === dayIdx"
                            @click="unvalidateDay(dayIdx)">
                            <InlineSpinner v-if="dayBusy === dayIdx" />
                            <span v-else>🔓 {{ t('manager.rehearsalOrder.unvalidate') }}</span>
                        </button>
                    </div>
                    <VueDraggable v-model="dayRows[dayIdx]" class="board-list" :data-day-index="String(dayIdx)"
                        group="rehearsal-order" :disabled="isDayValidated(dayIdx)" item-key="id" @end="onDragEnd">
                        <div v-for="row in dayRows[dayIdx]" :key="row.id" class="entry-card"
                            :class="{ 'entry-pause': isPause(row) }" @click="openRow(row)">
                            <template v-if="!isPause(row)">
                                <div class="entry-time">{{ row.startTime }}–{{ row.endTime }}</div>
                                <strong>{{ row.studentFullName || '—' }}</strong>
                                <div class="muted-text">
                                    🎹 {{ row.accompanistFullName || '—' }}<span v-if="row.roomNumber"> · #{{
                                        row.roomNumber }}</span>
                                </div>
                            </template>
                            <template v-else>{{ row.startTime }} · {{ pauseText(row) }}</template>
                        </div>
                    </VueDraggable>
                </div>
            </div>
        </template>
    </template>

    <!-- The details of one row (student or pause) -->
    <Teleport to="body">
        <div v-if="rowModalOpen" class="modal-overlay" @click.self="rowModalOpen = false">
            <div class="modal">
                <h2 class="modal-title">
                    {{ rowForm.isPause ? t('manager.rehearsalOrder.pauseTitle') : (editingRow?.studentFullName || '—')
                    }}
                </h2>
                <p v-if="rowReadOnly" class="muted-text">{{ t('manager.rehearsalOrder.readOnlyHint') }}</p>

                <fieldset :disabled="rowReadOnly" style="border:none; padding:0; margin:0;">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">{{ t('manager.rehearsalOrder.minutes') }}</label>
                            <input class="form-input" :class="{ 'has-error': rowErrors.durationMinutes }" type="number"
                                min="1" v-model.number="rowForm.durationMinutes" />
                            <span v-if="rowErrors.durationMinutes" class="field-error">{{ rowErrors.durationMinutes
                                }}</span>
                        </div>
                        <div v-if="!rowForm.isPause" class="form-group">
                            <label class="form-label">{{ t('manager.rehearsalOrder.room') }}</label>
                            <input class="form-input" :class="{ 'has-error': rowErrors.roomNumber }" type="number"
                                min="1" v-model.number="rowForm.roomNumber" />
                            <span v-if="rowErrors.roomNumber" class="field-error">{{ rowErrors.roomNumber }}</span>
                        </div>
                    </div>

                    <template v-if="!rowForm.isPause">
                        <div class="form-group">
                            <label class="form-label">{{ t('manager.rehearsalOrder.pianist') }}</label>
                            <label class="radio-row"><input type="radio" value="none" v-model="rowForm.pianistChoice" />
                                {{ t('manager.rehearsalOrder.pianistNone') }}</label>
                            <label class="radio-row"><input type="radio" value="user" v-model="rowForm.pianistChoice" />
                                {{ t('manager.rehearsalOrder.pianistUser') }}</label>
                            <select v-if="rowForm.pianistChoice === 'user'" class="form-input"
                                :class="{ 'has-error': rowErrors.accompanistId }" v-model="rowForm.accompanistId">
                                <option value="">{{ t('manager.rehearsalOrder.pianistUserPlaceholder') }}</option>
                                <option v-for="p in pianists" :key="p._id" :value="p._id">{{ p.firstnames }} {{
                                    p.surnames }}</option>
                            </select>
                            <span v-if="rowErrors.accompanistId" class="field-error">{{ rowErrors.accompanistId
                                }}</span>
                            <label class="radio-row"><input type="radio" value="name" v-model="rowForm.pianistChoice" />
                                {{ t('manager.rehearsalOrder.pianistName') }}</label>
                            <input v-if="rowForm.pianistChoice === 'name'" class="form-input"
                                :class="{ 'has-error': rowErrors.accompanistName }" v-model="rowForm.accompanistName"
                                maxlength="100" />
                            <span v-if="rowErrors.accompanistName" class="field-error">{{ rowErrors.accompanistName
                                }}</span>
                        </div>

                        <div class="form-group">
                            <label class="form-label">{{ t('manager.rehearsalOrder.piece') }}</label>
                            <input class="form-input" :class="{ 'has-error': rowErrors.piece }" v-model="rowForm.piece"
                                maxlength="200" :placeholder="t('manager.rehearsalOrder.piecePlaceholder')" />
                            <span v-if="rowErrors.piece" class="field-error">{{ rowErrors.piece }}</span>
                        </div>
                    </template>

                    <div v-else class="form-group">
                        <label class="form-label">{{ t('manager.rehearsalOrder.pauseLabel') }}</label>
                        <input class="form-input" :class="{ 'has-error': rowErrors.label }" v-model="rowForm.label"
                            maxlength="60" :placeholder="t('manager.rehearsalOrder.pause')" />
                        <span v-if="rowErrors.label" class="field-error">{{ rowErrors.label }}</span>
                    </div>
                </fieldset>

                <div v-if="rowError" class="error-banner">⚠️ {{ rowError }}</div>
                <div class="modal-footer">
                    <button v-if="!rowReadOnly" class="btn btn-danger" :disabled="savingRow" @click="deleteRow">
                        {{ t('common.delete') }}
                    </button>
                    <div style="flex:1"></div>
                    <button class="btn btn-secondary" @click="rowModalOpen = false">{{ t('common.cancel') }}</button>
                    <button v-if="!rowReadOnly" class="btn btn-primary" :disabled="savingRow" @click="saveRow">
                        <InlineSpinner v-if="savingRow" />
                        <span v-else>{{ t('common.save') }}</span>
                    </button>
                </div>
            </div>
        </div>
    </Teleport>

    <!-- Export the rehearsal list (Excel) -->
    <Teleport to="body">
        <div v-if="exportOpen" class="modal-overlay" @click.self="exportOpen = false">
            <div class="modal">
                <h2 class="modal-title">{{ t('manager.rehearsalOrder.exportTitle') }}</h2>

                <div v-if="contestType === ContestTypeEnum.YOUTH" class="form-group">
                    <label class="form-label">{{ t('manager.rehearsalOrder.exportCategories') }}</label>
                    <span v-if="exportErrors.categories" class="field-error">{{ exportErrors.categories }}</span>
                    <div style="display:flex; flex-wrap:wrap; gap:.4rem 1.2rem;">
                        <label v-for="c in categoriesOfRound" :key="c" class="radio-row">
                            <input type="checkbox" :value="c" v-model="exportForm.categories" />
                            {{ t(`common.scheduleCategories.${c}`) }}
                        </label>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">{{ t('manager.rehearsalOrder.exportPlace') }}</label>
                    <select class="form-input" v-model="exportForm.placeChoice">
                        <option value="">{{ t('manager.rehearsalOrder.exportNone') }}</option>
                        <option v-for="v in roundVenues" :key="v" :value="v">{{ v }}</option>
                        <option value="__other__">{{ t('manager.rehearsalOrder.exportOther') }}</option>
                    </select>
                    <input v-if="exportForm.placeChoice === '__other__'" class="form-input" style="margin-top:.4rem;"
                        :class="{ 'has-error': exportErrors.placeOther }" v-model="exportForm.placeOther"
                        maxlength="150" />
                    <span v-if="exportErrors.placeOther" class="field-error">{{ exportErrors.placeOther }}</span>
                </div>

                <div v-for="c in exportForm.categories" :key="c" class="form-group">
                    <label class="form-label">
                        {{ t('manager.rehearsalOrder.exportPiece') }}<template v-if="c"> · {{
                            t(`common.scheduleCategories.${c}`) }}</template>
                    </label>
                    <select class="form-input" v-model="exportForm.pieceChoice[c]">
                        <option value="">{{ t('manager.rehearsalOrder.exportNone') }}</option>
                        <option v-for="p in piecesOf(c)" :key="p" :value="p">{{ p }}</option>
                        <option value="__other__">{{ t('manager.rehearsalOrder.exportOther') }}</option>
                    </select>
                    <input v-if="exportForm.pieceChoice[c] === '__other__'" class="form-input" style="margin-top:.4rem;"
                        :class="{ 'has-error': exportErrors[`pieceOther.${c}`] }" v-model="exportForm.pieceOther[c]"
                        maxlength="200" />
                    <span v-if="exportErrors[`pieceOther.${c}`]" class="field-error">{{ exportErrors[`pieceOther.${c}`]
                    }}</span>
                </div>

                <div v-if="exportError" class="error-banner">⚠️ {{ exportError }}</div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" @click="exportOpen = false">{{ t('common.cancel') }}</button>
                    <button class="btn btn-primary" :disabled="exporting" @click="doExport">
                        <InlineSpinner v-if="exporting" />
                        <span v-else>📄 {{ t('manager.rehearsalOrder.exportDownload') }}</span>
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { VueDraggable } from 'vue-draggable-plus'
import InlineSpinner from './InlineSpinner.vue'
import { extractErrorMessage } from '../utiles/error.utiles'
import { zodErrorsToFieldMap } from '../utiles/zod.utiles'
import { boardSettingsSchema, rowFormSchema, exportFormSchema } from '../validation/rehearsalOrder.schema'
import { useModalScrollLock } from '../composables/useModalScrollLock'
import { useContestSettingsApi, ContestTypeEnum, type ContestRoundDto, type PianistDto } from '../composables/useContestSettingsApi'
import type { OrderScope } from '../composables/usePerformanceOrderApi'
import { useUserRehearsalApi, type ImportUserRehearsalsResult } from '../composables/useUserRehearsalApi'
import {
    useRehearsalOrderApi, RehearsalOrderRowTypeEnum, RehearsalOrderStatusEnum,
    type RehearsalBoardViewDto, type RehearsalOrderEntryDto, type RehearsalCollisionDto,
} from '../composables/useRehearsalOrderApi'
import { shortDayLabel } from '../utiles/date-label'

const { t, locale } = useI18n()
const api = useRehearsalOrderApi()
const settingsApi = useContestSettingsApi()

const pageError = ref('')
const infoMessage = ref('')

// ── Which board ────────────────────────────────────────────────────────
const contestType = ref<ContestTypeEnum>(ContestTypeEnum.SOLO)
const rounds = ref<ContestRoundDto[]>([])
const selectedRoundName = ref('')
const selectedCategory = ref('')

/** The last round and category chosen in each contest, so switching back returns to the same board */
const lastChoice: Record<string, { round: string; category: string }> = {}

async function switchContestType(type: ContestTypeEnum) {
    if (type === contestType.value) return
    lastChoice[contestType.value] = { round: selectedRoundName.value, category: selectedCategory.value }

    contestType.value = type
    view.value = null
    settingsOpen.value = false
    collisions.value = null
    await loadRounds()

    // Back to this contest's last board, if its round still exists
    const previous = lastChoice[type]
    const roundStillThere = !!previous && rounds.value.some(r => r.name === previous.round)
    selectedRoundName.value = roundStillThere ? previous!.round : ''
    selectedCategory.value = roundStillThere ? previous!.category : ''
    if (scopeReady.value) await loadBoard()
}

async function loadRounds() {
    try {
        const settings = await settingsApi.getOrCreate(contestType.value, '')
        rounds.value = settings.rounds
    } catch (e) {
        pageError.value = extractErrorMessage(e)
    }
}

/** The categories configured in the chosen round (Youth) */
const categoriesOfRound = computed(() => {
    const round = rounds.value.find(r => r.name === selectedRoundName.value)
    return round?.categoryConfigs.map(c => c.category).filter((c): c is string => !!c) ?? []
})

const scopeReady = computed(() =>
    !!selectedRoundName.value && (contestType.value === ContestTypeEnum.SOLO || !!selectedCategory.value))

const scope = computed<OrderScope>(() => ({
    contestType: contestType.value,
    round: selectedRoundName.value,
    category: contestType.value === ContestTypeEnum.YOUTH ? selectedCategory.value : null,
}))

function onScopeChange() {
    settingsOpen.value = false
    collisions.value = null
    if (scopeReady.value) loadBoard()
}

// ── The board ──────────────────────────────────────────────────────────
const view = ref<RehearsalBoardViewDto | null>(null)
const loading = ref(false)

async function loadBoard() {
    loading.value = true
    pageError.value = ''
    try {
        view.value = await api.getBoardView(scope.value)
        // The draggable lists work on their own copies, refreshed from the server after every change
        unplacedRows.value = [...view.value.unplaced]
        dayRows.value = view.value.days.map(d => [...d.rows])
    } catch (e) {
        pageError.value = extractErrorMessage(e)
    } finally {
        loading.value = false
    }
}

// ── The columns and drag & drop (same logic as Performance Order) ──
const unplacedRows = ref<RehearsalOrderEntryDto[]>([])
const dayRows = ref<RehearsalOrderEntryDto[][]>([])

const isPause = (row: RehearsalOrderEntryDto) => row.rowType === RehearsalOrderRowTypeEnum.PAUSE
/** A pause's text: its label, or "PAUSE 10'" */
const pauseText = (row: RehearsalOrderEntryDto) => `${row.label || t('manager.rehearsalOrder.pause')} · ${row.durationMinutes}'`

/** A day is locked once its rows are validated */
function isDayValidated(dayIdx: number): boolean {
    const rows = dayRows.value[dayIdx]
    return !!rows && rows.length > 0 && rows.every(r => r.status === RehearsalOrderStatusEnum.VALIDATED)
}

/** After a drop: tell the server where the row went, then reload (it re-times the days) */
async function onDragEnd(evt: { to: HTMLElement; newIndex?: number }) {
    if (evt.newIndex === undefined) return
    const attr = evt.to.dataset.dayIndex
    const targetDayIndex = attr === 'null' ? null : Number(attr)
    const targetList = targetDayIndex === null ? unplacedRows.value : dayRows.value[targetDayIndex]
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

// ── The board's settings ──
const settingsOpen = ref(false)
const savingSettings = ref(false)
const settingsErrors = ref<Record<string, string>>({})
const settingsForm = ref({
    days: [] as { date: string; startTime: string }[],
    defaultSlotMinutes: 15 as number | '',
    defaultPauseMinutes: 10 as number | '',
    defaultRoomNumber: '' as number | '',
})

function toggleSettings() {
    if (!view.value) return
    if (!settingsOpen.value) {
        const b = view.value.board
        settingsForm.value = {
            days: b.days.map(d => ({ ...d })),
            defaultSlotMinutes: b.defaultSlotMinutes,
            defaultPauseMinutes: b.defaultPauseMinutes,
            defaultRoomNumber: b.defaultRoomNumber ?? '',
        }
        settingsErrors.value = {}
    }
    settingsOpen.value = !settingsOpen.value
}

async function saveSettings() {
    const result = boardSettingsSchema.safeParse(settingsForm.value)
    if (!result.success) {
        settingsErrors.value = zodErrorsToFieldMap(result.error, t)
        return
    }
    settingsErrors.value = {}
    const s = result.data
    savingSettings.value = true
    pageError.value = ''
    try {
        await api.updateBoard(scope.value, {
            days: s.days,
            defaultSlotMinutes: s.defaultSlotMinutes,
            defaultPauseMinutes: s.defaultPauseMinutes,
            defaultRoomNumber: s.defaultRoomNumber,
        })
        settingsOpen.value = false
        await loadBoard()
    } catch (e) {
        pageError.value = extractErrorMessage(e)
    } finally {
        savingSettings.value = false
    }
}

// Once a message is showing, re-check on every change so it goes away as soon as the field is fixed
watch(settingsForm, () => {
    if (Object.keys(settingsErrors.value).length === 0) return
    const result = boardSettingsSchema.safeParse(settingsForm.value)
    settingsErrors.value = result.success ? {} : zodErrorsToFieldMap(result.error, t)
}, { deep: true })

// ── The details window of one row ──
const pianists = ref<PianistDto[]>([])
const rowModalOpen = ref(false)
const editingRow = ref<RehearsalOrderEntryDto | null>(null)
const rowReadOnly = ref(false) // a validated day can't be changed
const savingRow = ref(false)
const rowError = ref('')
const rowErrors = ref<Record<string, string>>({})
const rowForm = ref({
    isPause: false,
    durationMinutes: 15 as number | '',
    pianistChoice: 'none' as 'none' | 'user' | 'name',
    accompanistId: '',
    accompanistName: '',
    roomNumber: '' as number | '',
    piece: '',
    label: '',
})

async function openRow(row: RehearsalOrderEntryDto) {
    editingRow.value = row
    rowReadOnly.value = row.status === RehearsalOrderStatusEnum.VALIDATED
    rowForm.value = {
        isPause: isPause(row),
        durationMinutes: row.durationMinutes,
        pianistChoice: row.accompanistId ? 'user' : row.accompanistName ? 'name' : 'none',
        accompanistId: row.accompanistId ?? '',
        accompanistName: row.accompanistName ?? '',
        roomNumber: row.roomNumber ?? '',
        piece: row.piece ?? '',
        label: row.label ?? '',
    }
    rowErrors.value = {}
    rowError.value = ''
    rowModalOpen.value = true
    if (pianists.value.length === 0) {
        try {
            pianists.value = await settingsApi.getPianists()
        } catch (e) {
            rowError.value = extractErrorMessage(e)
        }
    }
}

async function saveRow() {
    const row = editingRow.value
    if (!row) return
    const result = rowFormSchema.safeParse(rowForm.value)
    if (!result.success) {
        rowErrors.value = zodErrorsToFieldMap(result.error, t)
        return
    }
    rowErrors.value = {}
    const f = result.data
    savingRow.value = true
    rowError.value = ''
    try {
        await api.updateEntry(row.id, f.isPause
            ? { durationMinutes: f.durationMinutes, label: f.label || null }
            : {
                durationMinutes: f.durationMinutes,
                roomNumber: f.roomNumber,
                piece: f.piece || null,
                // The pianist: a user, a typed name, or none (both null)
                ...(f.pianistChoice === 'user'
                    ? { accompanistId: f.accompanistId }
                    : f.pianistChoice === 'name'
                        ? { accompanistName: f.accompanistName }
                        : { accompanistId: null, accompanistName: null }),
            })
        rowModalOpen.value = false
        await loadBoard()
    } catch (e) {
        rowError.value = extractErrorMessage(e)
    } finally {
        savingRow.value = false
    }
}

async function deleteRow() {
    const row = editingRow.value
    if (!row || !confirm(t('manager.rehearsalOrder.deleteConfirm'))) return
    savingRow.value = true
    try {
        await api.removeEntry(row.id)
        rowModalOpen.value = false
        await loadBoard()
    } catch (e) {
        rowError.value = extractErrorMessage(e)
    } finally {
        savingRow.value = false
    }
}

watch(rowForm, () => {
    if (Object.keys(rowErrors.value).length === 0) return
    const result = rowFormSchema.safeParse(rowForm.value)
    rowErrors.value = result.success ? {} : zodErrorsToFieldMap(result.error, t)
}, { deep: true })

// ── Export the rehearsal list (Excel) ──
// Category keys: the Youth category, or '' for Solo (its round has one config, with no category)
const exportOpen = ref(false)
const exporting = ref(false)
const exportError = ref('')
const exportErrors = ref<Record<string, string>>({})
const exportForm = ref({
    categories: [] as string[],
    placeChoice: '', // '' = none, a venue, or '__other__'
    placeOther: '',
    pieceChoice: {} as Record<string, string>, // per category: '' = none, a piece, or '__other__'
    pieceOther: {} as Record<string, string>,
})

const currentRound = computed(() => rounds.value.find(r => r.name === selectedRoundName.value))
/** The round's venues (each one once), to choose the place from */
const roundVenues = computed(() => [...new Set((currentRound.value?.categoryConfigs ?? []).map(c => c.venue).filter(Boolean))])
/** The pieces configured for one category of the round */
function piecesOf(categoryKey: string): string[] {
    return currentRound.value?.categoryConfigs.find(c => (c.category ?? '') === categoryKey)?.pieces ?? []
}

function openExport() {
    exportForm.value = {
        categories: contestType.value === ContestTypeEnum.YOUTH ? [selectedCategory.value] : [''],
        placeChoice: roundVenues.value[0] ?? '',
        placeOther: '',
        pieceChoice: {},
        pieceOther: {},
    }
    exportErrors.value = {}
    exportError.value = ''
    exportOpen.value = true
}

async function doExport() {
    const f = exportForm.value
    const result = exportFormSchema.safeParse({ categories: f.categories, placeOther: f.placeOther, pieceOther: f.pieceOther })
    if (!result.success) {
        exportErrors.value = zodErrorsToFieldMap(result.error, t)
        return
    }
    exportErrors.value = {}
    const pieceOf = (c: string) => (f.pieceChoice[c] === '__other__' ? (f.pieceOther[c] ?? '').trim() : f.pieceChoice[c] ?? '')
    exporting.value = true
    exportError.value = ''
    try {
        await api.exportList({
            contestType: contestType.value,
            round: selectedRoundName.value,
            categories: f.categories.map(c => ({ category: c || null, piece: pieceOf(c) || undefined })),
            place: (f.placeChoice === '__other__' ? f.placeOther.trim() : f.placeChoice) || undefined,
        })
        exportOpen.value = false
    } catch (e) {
        exportError.value = extractErrorMessage(e)
    } finally {
        exporting.value = false
    }
}

// The page behind a window (row details or export) must not scroll
useModalScrollLock(rowModalOpen, exportOpen)


// ── Per-day actions: add a pause, validate (writes the students' rehearsals), unvalidate ──
const dayBusy = ref<number | null>(null)

async function runOnDay(dayIdx: number, action: () => Promise<void>) {
    dayBusy.value = dayIdx
    pageError.value = ''
    try {
        await action()
        await loadBoard()
    } catch (e) {
        pageError.value = extractErrorMessage(e)
    } finally {
        dayBusy.value = null
    }
}

function addPause(dayIdx: number) {
    return runOnDay(dayIdx, () => api.insertPause(scope.value, dayIdx))
}

function validateDay(dayIdx: number) {
    if (!confirm(t('manager.rehearsalOrder.validateConfirm'))) return
    return runOnDay(dayIdx, async () => {
        const { written } = await api.validateDay(scope.value, dayIdx)
        infoMessage.value = t('manager.rehearsalOrder.validatedInfo', { count: written })
    })
}

function unvalidateDay(dayIdx: number) {
    return runOnDay(dayIdx, () => api.unvalidateDay(scope.value, dayIdx))
}

// ── The rehearsals Excel import (moved here from the old Rehearsals screen) ──
const userRehearsalApi = useUserRehearsalApi()
const fileInput = ref<HTMLInputElement | null>(null)
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
        importResult.value = await userRehearsalApi.importFromExcel(file)
    } catch (e) {
        pageError.value = extractErrorMessage(e)
    } finally {
        importing.value = false
        input.value = '' // allow choosing the same file again
    }
}
// ── Collision check: rehearsals overlapping a performance, masterclass, activity or other rehearsal ──
const collisions = ref<RehearsalCollisionDto[] | null>(null)
const checkingCollisions = ref(false)

async function checkCollisions() {
    checkingCollisions.value = true
    pageError.value = ''
    try {
        collisions.value = await api.getCollisions(scope.value)
    } catch (e) {
        pageError.value = extractErrorMessage(e)
    } finally {
        checkingCollisions.value = false
    }
}

// ── Starting the board: from the performance order, or from imported rehearsals ──
const busy = ref<'' | 'performance' | 'rehearsals'>('')

async function startFrom(source: 'performance' | 'rehearsals') {
    if (!confirm(t('manager.rehearsalOrder.startConfirm'))) return
    busy.value = source
    pageError.value = ''
    infoMessage.value = ''
    try {
        const { count } = source === 'performance'
            ? await api.generateFromPerformance(scope.value)
            : await api.fillFromRehearsals(scope.value)
        infoMessage.value = t('manager.rehearsalOrder.started', { count })
        await loadBoard()
    } catch (e) {
        pageError.value = extractErrorMessage(e)
    } finally {
        busy.value = ''
    }
}

loadRounds()
</script>

<style scoped>
.filter-select {
    max-width: 220px;
}

.contest-type-toggle {
    display: flex;
    gap: .4rem;
}

.muted-text {
    color: var(--muted);
    font-size: .8rem;
}

.board {
    display: flex;
    gap: 1rem;
    overflow-x: auto;
    align-items: flex-start;
    margin-top: 1rem;
}

.board-column {
    background: var(--white);
    border: 1.5px solid var(--border);
    border-radius: 10px;
    min-width: 270px;
    max-width: 270px;
    flex-shrink: 0;
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

.board-column-actions {
    display: flex;
    gap: .4rem;
    padding: 0 1rem .75rem;
    border-bottom: 1.5px solid var(--border);
    flex-wrap: wrap;
}

.badge-sm {
    font-size: .65rem;
    padding: .1rem .45rem;
}

.board-list {
    display: flex;
    flex-direction: column;
    gap: .5rem;
    padding: .75rem;
    min-height: 80px;
    /* an empty day can still receive a drop */
}

.entry-card {
    background: var(--white);
    border: 1.5px solid var(--border);
    border-left: 4px solid var(--navy, #1a2b4a);
    border-radius: 8px;
    padding: .55rem .7rem;
    cursor: grab;
    font-size: .82rem;
}

.entry-card:active {
    cursor: grabbing;
}

.entry-pause {
    background: var(--gold-50, #fdf8ee);
    border: 1.5px dashed var(--gold, #e8b84b);
    text-align: center;
}

.entry-time {
    font-weight: 700;
    font-size: .78rem;
    color: var(--muted);
}

.radio-row {
    display: flex;
    align-items: center;
    gap: .5rem;
    font-size: .85rem;
    cursor: pointer;
    margin: .3rem 0;
}

.radio-row input {
    width: auto;
}

.import-errors {
    margin: .75rem 0;
    padding-left: 1.25rem;
    font-size: .85rem;
    color: var(--red, #c00);
}
</style>