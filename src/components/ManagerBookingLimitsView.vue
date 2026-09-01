<template>
    <div class="page-header">
        <h1>{{ t('manager.bookingLimits.title') }}</h1>
        <p class="subtitle">{{ t('manager.bookingLimits.subtitle') }}</p>
    </div>

    <div v-if="pageError" class="error-banner"
        style="margin-bottom:1.5rem; display:flex; align-items:center; justify-content:space-between; gap:1rem;">
        <span>⚠️ {{ pageError }}</span>
        <button class="btn btn-secondary btn-sm" @click="pageError = ''">✕</button>
    </div>

    <div v-if="loading" class="empty-state">
        <div class="empty-icon">⏳</div>
        <p>{{ t('common.loading') }}</p>
    </div>

    <template v-else-if="config">
        <!-- ── Flags ── -->
        <div class="card flags-card">
            <h2 class="section-title" style="margin-bottom:1rem;">{{ t('manager.bookingLimits.flagsTitle') }}</h2>
            <div class="flags-grid">
                <label v-for="flagName in flagNames" :key="flagName" class="flag-row">
                    <input type="checkbox" :checked="config.flags[flagName].value" :disabled="togglingFlag === flagName"
                        @change="onToggleFlag(flagName, ($event.target as HTMLInputElement).checked)" />
                    {{ t(`manager.bookingLimits.flags.${flagName}`) }}
                    <InlineSpinner v-if="togglingFlag === flagName" />
                </label>
            </div>
        </div>

        <!-- ── Rules ── -->
        <div class="section-row" style="margin-top:1.5rem;">
            <h2 class="section-title">{{ t('manager.bookingLimits.rulesTitle') }}</h2>
            <button class="btn btn-primary" @click="openCreateRule">+ {{ t('manager.bookingLimits.addRule') }}</button>
        </div>
        <p class="rules-hint">{{ t('manager.bookingLimits.rulesHint') }}</p>

        <div class="card" style="overflow:hidden;">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>{{ t('manager.bookingLimits.columns.name') }}</th>
                        <th>{{ t('manager.bookingLimits.columns.minutes') }}</th>
                        <th>{{ t('manager.bookingLimits.columns.priority') }}</th>
                        <th>{{ t('manager.bookingLimits.columns.active') }}</th>
                        <th>{{ t('manager.users.columns.actions') }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="rule in sortedRules" :key="rule._id">
                        <td><strong>{{ rule.name }}</strong></td>
                        <td>{{ rule.maxMinutesPerDay }}</td>
                        <td>{{ rule.priority }}</td>
                        <td>
                            <span class="badge" :class="rule.active ? 'badge-green' : 'badge-coral'">
                                {{ rule.active ? t('manager.users.active') : t('manager.users.inactive') }}
                            </span>
                        </td>
                        <td>
                            <div style="display:flex; gap:.5rem;">
                                <button class="btn btn-secondary btn-sm" @click="openEditRule(rule)">{{ t('common.edit')
                                    }}</button>
                                <button class="btn btn-danger btn-sm" @click="removeRule(rule)">{{ t('common.delete')
                                    }}</button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
            <div v-if="config.rules.length === 0" class="empty-state">
                <div class="empty-icon">⚖️</div>
                <p>{{ t('manager.bookingLimits.empty') }}</p>
            </div>
        </div>
    </template>

    <!-- Create/Edit Rule Modal -->
    <Teleport to="body">
        <div v-if="ruleModal" class="modal-overlay" @click.self="ruleModal = false">
            <div class="modal modal-wide">
                <h2 class="modal-title">{{ editingRule ? t('manager.bookingLimits.editRule') :
                    t('manager.bookingLimits.createRule') }}</h2>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">{{ t('manager.bookingLimits.columns.name') }}</label>
                        <input class="form-input" v-model="form.name" />
                    </div>
                    <div class="form-group">
                        <label class="form-label">{{ t('manager.bookingLimits.columns.minutes') }}</label>
                        <input class="form-input" type="number" min="0" v-model.number="form.maxMinutesPerDay" />
                    </div>
                    <div class="form-group">
                        <label class="form-label">{{ t('manager.bookingLimits.columns.priority') }}</label>
                        <input class="form-input" type="number" v-model.number="form.priority" />
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label" style="display:flex; align-items:center; gap:.5rem;">
                        <input type="checkbox" v-model="form.active" style="width:auto;" />
                        {{ t('manager.bookingLimits.columns.active') }}
                    </label>
                </div>

                <div class="form-group">
                    <label class="form-label">{{ t('manager.bookingLimits.allOf') }}</label>
                    <div class="checkbox-grid">
                        <label v-for="bt in bookingTypeOptions" :key="bt" class="checkbox-row">
                            <input type="checkbox" :value="bt" v-model="form.allOfBookingTypes" />
                            {{ bt }}
                        </label>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label" style="display:flex; align-items:center; gap:.5rem;">
                        <input type="checkbox" v-model="form.exactMatch" style="width:auto;" />
                        {{ t('manager.bookingLimits.exactMatch') }}
                    </label>
                    <span class="field-hint">{{ t('manager.bookingLimits.exactMatchHint') }}</span>
                </div>

                <div class="form-group">
                    <label class="form-label">{{ t('manager.bookingLimits.anyOf') }}</label>
                    <div class="checkbox-grid">
                        <label v-for="bt in bookingTypeOptions" :key="bt" class="checkbox-row">
                            <input type="checkbox" :value="bt" v-model="form.anyOfBookingTypes" />
                            {{ bt }}
                        </label>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">{{ t('manager.bookingLimits.noneOf') }}</label>
                    <div class="checkbox-grid">
                        <label v-for="bt in bookingTypeOptions" :key="bt" class="checkbox-row">
                            <input type="checkbox" :value="bt" v-model="form.noneOfBookingTypes" />
                            {{ bt }}
                        </label>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">{{ t('manager.bookingLimits.requiredFlags') }}</label>
                    <div class="checkbox-grid">
                        <label v-for="flagName in flagNames" :key="flagName" class="checkbox-row">
                            <input type="checkbox" :value="flagName" v-model="form.requiredFlags" />
                            {{ t(`manager.bookingLimits.flags.${flagName}`) }}
                        </label>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">{{ t('manager.bookingLimits.forbiddenFlags') }}</label>
                    <div class="checkbox-grid">
                        <label v-for="flagName in flagNames" :key="flagName" class="checkbox-row">
                            <input type="checkbox" :value="flagName" v-model="form.forbiddenFlags" />
                            {{ t(`manager.bookingLimits.flags.${flagName}`) }}
                        </label>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">{{ t('manager.bookingLimits.comments') }}</label>
                    <input class="form-input" v-model="form.comments" />
                </div>

                <div v-if="formError" class="error-banner">⚠️ {{ formError }}</div>

                <div class="modal-footer">
                    <button class="btn btn-secondary" @click="ruleModal = false">{{ t('common.cancel') }}</button>
                    <button class="btn btn-primary" :disabled="saving" @click="saveRule">
                        <InlineSpinner v-if="saving" />
                        <span v-else>{{ t('common.save') }}</span>
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBookingLimitApi, type BookingLimitConfiguration, type BookingLimitFlags, type BookingLimitRule } from '../composables/useBookingLimitApi'
import { extractErrorMessage } from '../utiles/error.utiles'
import { BookingTypeEnum } from '../enums/booking.enum'
import InlineSpinner from './InlineSpinner.vue'

const { t } = useI18n()
const api = useBookingLimitApi()

const bookingTypeOptions = Object.values(BookingTypeEnum)
const flagNames: (keyof BookingLimitFlags)[] = ['youthCheckinDone', 'soloCheckinDone', 'firstRoundDone', 'secondRoundDone', 'youthDone']

const config = ref<BookingLimitConfiguration | null>(null)
const loading = ref(false)
const pageError = ref('')

onMounted(() => {
    reload()
})

async function reload() {
    loading.value = true
    try {
        config.value = await api.get()
    } catch (e) {
        pageError.value = extractErrorMessage(e)
    } finally {
        loading.value = false
    }
}

// Highest priority first, so the list visually matches evaluation order.
const sortedRules = computed(() => [...(config.value?.rules ?? [])].sort((a, b) => b.priority - a.priority))

// ── Flags ──────────────────────────────────────────────────────────────
const togglingFlag = ref<keyof BookingLimitFlags | null>(null)

async function onToggleFlag(flagName: keyof BookingLimitFlags, value: boolean) {
    togglingFlag.value = flagName
    try {
        config.value = await api.setFlag(flagName, value)
    } catch (e) {
        pageError.value = extractErrorMessage(e)
    } finally {
        togglingFlag.value = null
    }
}

// ── Create/Edit rule ───────────────────────────────────────────────────
const ruleModal = ref(false)
const editingRule = ref<BookingLimitRule | null>(null)
const saving = ref(false)
const formError = ref('')

function blankForm(): BookingLimitRule {
    return {
        name: '', maxMinutesPerDay: 120, priority: 0, active: true,
        allOfBookingTypes: [], anyOfBookingTypes: [], noneOfBookingTypes: [],
        exactMatch: false, requiredFlags: [], forbiddenFlags: [], comments: '',
    }
}

const form = ref<BookingLimitRule>(blankForm())

function openCreateRule() {
    editingRule.value = null
    form.value = blankForm()
    formError.value = ''
    ruleModal.value = true
}

function openEditRule(rule: BookingLimitRule) {
    editingRule.value = rule
    form.value = { ...rule }
    formError.value = ''
    ruleModal.value = true
}

async function saveRule() {
    if (!config.value) return
    if (!form.value.name.trim()) {
        formError.value = t('manager.bookingLimits.validation.nameRequired')
        return
    }
    formError.value = ''
    saving.value = true
    try {
        const otherRules = config.value.rules.filter(r => r._id !== editingRule.value?._id)
        const nextRules = [...otherRules, form.value]
        config.value = await api.setRules(nextRules)
        ruleModal.value = false
    } catch (e) {
        formError.value = extractErrorMessage(e)
    } finally {
        saving.value = false
    }
}

async function removeRule(rule: BookingLimitRule) {
    if (!config.value || !confirm(t('manager.bookingLimits.deleteConfirm'))) return
    pageError.value = ''
    try {
        const nextRules = config.value.rules.filter(r => r._id !== rule._id)
        config.value = await api.setRules(nextRules)
    } catch (e) {
        pageError.value = extractErrorMessage(e)
    }
}
</script>

<style scoped>
.modal-wide {
    max-width: 720px;
    width: 90vw;
}

.flags-card {
    padding: 1.5rem;
    margin-bottom: 1.5rem;
}

.flags-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: .75rem;
}

.flag-row {
    display: flex;
    align-items: center;
    gap: .6rem;
    font-size: .9rem;
    font-weight: 600;
    cursor: pointer;
}

.flag-row input {
    width: auto;
}

.rules-hint {
    color: var(--muted);
    font-size: .85rem;
    margin-bottom: 1rem;
}

.checkbox-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: .6rem;
    margin-top: .4rem;
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

.field-hint {
    font-size: .78rem;
    color: var(--muted);
    display: block;
    margin-top: .3rem;
}
</style>