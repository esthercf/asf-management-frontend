<template>
    <div class="page-header">
        <h1>{{ t('manager.daySchedules.title') }}</h1>
        <p class="subtitle">{{ t('manager.daySchedules.subtitle') }}</p>
    </div>

    <div v-if="pageError" class="error-banner"
        style="margin-bottom:1.5rem; display:flex; align-items:center; justify-content:space-between; gap:1rem;">
        <span>⚠️ {{ pageError }}</span>
        <button class="btn btn-secondary btn-sm" @click="pageError = ''">✕</button>
    </div>

    <div class="section-row">
        <button class="btn btn-primary" @click="openCreateModal">+ {{ t('manager.daySchedules.create') }}</button>
    </div>

    <div v-if="loading" class="empty-state">
        <div class="empty-icon">⏳</div>
        <p>{{ t('common.loading') }}</p>
    </div>

    <div v-else class="card" style="overflow:hidden;">
        <table class="data-table">
            <thead>
                <tr>
                    <th>{{ t('manager.daySchedules.columns.date') }}</th>
                    <th>{{ t('manager.daySchedules.columns.slots') }}</th>
                    <th>{{ t('manager.daySchedules.columns.status') }}</th>
                    <th>{{ t('manager.daySchedules.columns.actions') }}</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="d in days" :key="d.id" :class="{ 'row-inactive': !isActive(d) }">
                    <td><strong>{{ d.date }}</strong></td>
                    <td>
                        <span v-for="(s, i) in d.slots" :key="i" class="badge badge-lav slot-tag">{{ s.start }}–{{ s.end
                            }}</span>
                    </td>
                    <td>
                        <span class="badge" :class="isActive(d) ? 'badge-green' : 'badge-coral'">
                            {{ isActive(d) ? t('manager.daySchedules.active') : t('manager.daySchedules.inactive') }}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-secondary btn-sm" style="margin-right:.4rem;" @click="openEditModal(d)">
                            {{ t('common.edit') }}
                        </button>
                        <button class="btn btn-sm" :class="isActive(d) ? 'btn-danger' : 'btn-primary'"
                            :disabled="togglingId === d.id" @click="toggle(d)">
                            <InlineSpinner v-if="togglingId === d.id" />
                            <span v-else>{{ isActive(d) ? t('manager.daySchedules.deactivate') :
                                t('manager.daySchedules.activate') }}</span>
                        </button>
                        <button class="btn btn-danger btn-sm" style="margin-left:.4rem;" :disabled="deletingId === d.id"
                            @click="remove(d)">
                            <InlineSpinner v-if="deletingId === d.id" />
                            <span v-else>{{ t('common.delete') }}</span>
                        </button>
                    </td>
                </tr>
            </tbody>
        </table>
        <div v-if="days.length === 0" class="empty-state">
            <div class="empty-icon">📅</div>
            <p>{{ t('manager.daySchedules.empty') }}</p>
        </div>
    </div>

    <Teleport to="body">
        <div v-if="modalOpen" class="modal-overlay" @click.self="modalOpen = false">
            <div class="modal">
                <h2 class="modal-title">{{ editingId ? t('manager.daySchedules.edit') : t('manager.daySchedules.create')
                    }}</h2>

                <div class="form-group">
                    <label class="form-label">{{ t('manager.daySchedules.columns.date') }}</label>
                    <input class="form-input" :class="{ 'has-error': fieldErrors.date }" type="date" v-model="form.date"
                        :disabled="!!editingId" :title="editingId ? t('manager.daySchedules.dateImmutableHint') : ''" />
                    <span v-if="fieldErrors.date" class="field-error">{{ fieldErrors.date }}</span>
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">{{ t('manager.daySchedules.columns.slots') }}</label>
                <div v-for="(slot, i) in form.slots" :key="i" style="margin-bottom:.5rem;">
                    <div style="display:flex; gap:.5rem; align-items:center;">
                        <input class="form-input" :class="{ 'has-error': fieldErrors[`slots.${i}.start`] }" type="time"
                            v-model="slot.start" />
                        <span>–</span>
                        <input class="form-input" :class="{ 'has-error': fieldErrors[`slots.${i}.end`] }" type="time"
                            v-model="slot.end" />
                        <button class="btn btn-danger btn-sm" :disabled="form.slots.length === 1"
                            @click="form.slots.splice(i, 1)">✕</button>
                    </div>
                    <span v-if="fieldErrors[`slots.${i}.start`] || fieldErrors[`slots.${i}.end`]" class="field-error">
                        {{ fieldErrors[`slots.${i}.start`] || fieldErrors[`slots.${i}.end`] }}
                    </span>
                </div>
                <button class="btn btn-secondary btn-sm" @click="form.slots.push({ start: '', end: '' })">
                    + {{ t('manager.daySchedules.addSlot') }}
                </button>
            </div>

            <div v-if="formError" class="error-banner">⚠️ {{ formError }}</div>

            <div class="modal-footer">
                <button class="btn btn-secondary" @click="modalOpen = false">{{ t('common.cancel') }}</button>
                <button class="btn btn-primary" :disabled="saving" @click="saveDay">
                    <InlineSpinner v-if="saving" />
                    <span v-else>{{ t('common.save') }}</span>
                </button>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDayScheduleApi, type DayScheduleDto } from '../composables/useDayScheduleApi'
import { extractErrorMessage } from '../utiles/error.utiles'
import InlineSpinner from './InlineSpinner.vue'
import { zodErrorsToFieldMap } from '../utiles/zod.utiles'
import { dayScheduleFormSchema } from '../validation/daySchedule.schema'
import { useModalScrollLock } from '../composables/useModalScrollLock'

const { t } = useI18n()
const api = useDayScheduleApi()

const days = ref<DayScheduleDto[]>([])
const loading = ref(false)
const pageError = ref('')
const togglingId = ref<string | null>(null)
const deletingId = ref<string | null>(null)

const modalOpen = ref(false)
const editingId = ref<string | null>(null)
const saving = ref(false)
const formError = ref('')
const form = ref<{ date: string; slots: { start: string; end: string }[] }>({
    date: '',
    slots: [{ start: '', end: '' }],
})

// ── Field messages of the zod validation ──
// Keys are 'date', 'slots.0.start', 'slots.1.end'… (one per input)
const fieldErrors = ref<Record<string, string>>({})
// Once a message is showing, re-check on every change so it goes away as soon as the field is fixed.
// (Registered BEFORE the watcher below, so that opening the window ends with a clean slate.)
watch(form, () => {
    if (Object.keys(fieldErrors.value).length === 0) return
    const result = dayScheduleFormSchema.safeParse(form.value)
    fieldErrors.value = result.success ? {} : zodErrorsToFieldMap(result.error, t)
}, { deep: true })

watch(modalOpen, () => {
    fieldErrors.value = {}
})

// The page behind the open window must not scroll
useModalScrollLock(modalOpen)

function openCreateModal() {
    editingId.value = null
    form.value = { date: '', slots: [{ start: '', end: '' }] }
    formError.value = ''
    modalOpen.value = true
}

function openEditModal(d: DayScheduleDto) {
    editingId.value = d.id
    form.value = { date: d.date, slots: d.slots.map(s => ({ start: s.start, end: s.end })) }
    formError.value = ''
    modalOpen.value = true
}

async function saveDay() {
    formError.value = ''
    const result = dayScheduleFormSchema.safeParse(form.value)
    if (!result.success) {
        fieldErrors.value = zodErrorsToFieldMap(result.error, t)
        return
    }
    fieldErrors.value = {}
    const data = result.data // the validated copy of the form
    saving.value = true
    try {
        if (editingId.value) {
            await api.updateDayScheduleSlots(editingId.value, data.slots)
        } else {
            await api.createDaySchedule({ date: data.date, slots: data.slots })
        }
        modalOpen.value = false
        await load()
    } catch (e) {
        formError.value = extractErrorMessage(e)
    } finally {
        saving.value = false
    }
}

async function remove(d: DayScheduleDto) {
    if (!confirm(t('manager.daySchedules.deleteConfirm', { date: d.date }))) return
    deletingId.value = d.id
    try {
        await api.deleteDaySchedule(d.id)
        days.value = days.value.filter(x => x.id !== d.id)
    } catch (e) {
        pageError.value = extractErrorMessage(e)
    } finally {
        deletingId.value = null
    }
}

// Days created before the active field existed come back without it;
// the backend treats a missing value as active, so the UI does too.
function isActive(d: DayScheduleDto): boolean {
    return d.active !== false
}

onMounted(load)

async function load() {
    loading.value = true
    try {
        const data = await api.getDaySchedules()
        days.value = [...data].sort((a, b) => a.date.localeCompare(b.date))
    } catch (e) {
        pageError.value = extractErrorMessage(e)
    } finally {
        loading.value = false
    }
}

async function toggle(d: DayScheduleDto) {
    const next = !isActive(d)
    togglingId.value = d.id
    try {
        await api.setDayScheduleActive(d.id, next)
        d.active = next
    } catch (e) {
        pageError.value = extractErrorMessage(e)
    } finally {
        togglingId.value = null
    }
}
</script>

<style scoped>
.row-inactive td {
    opacity: .55;
}

.slot-tag {
    font-size: .68rem;
    padding: .15rem .5rem;
    margin-right: .3rem;
}
</style>