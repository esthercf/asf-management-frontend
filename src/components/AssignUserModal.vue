<template>
    <Teleport to="body">
        <div v-if="modelValue" class="modal-overlay" @click.self="close">
            <div class="modal">
                <h2 class="modal-title">{{ t('staff.bookings.assignUser') }}</h2>
                <p class="modal-sub">{{ t('staff.bookings.assignUserHint') }}</p>

                <!-- Mode tabs -->
                <div class="mode-tabs">
                    <button class="mode-tab" :class="{ active: mode === 'search' }" @click="mode = 'search'">
                        {{ t('staff.bookings.searchByNameEmail') }}
                    </button>
                    <button class="mode-tab" :class="{ active: mode === 'folder' }" @click="mode = 'folder'">
                        {{ t('staff.bookings.searchByFolderCode') }}
                    </button>
                </div>

                <!-- Mode: name/email search -->
                <div v-if="mode === 'search'" class="form-group">
                    <label class="form-label">{{ t('staff.bookings.searchByNameEmail') }}</label>
                    <div class="search-wrap">
                        <input class="form-input" type="text" v-model="query"
                            :placeholder="t('staff.users.searchPlaceholder')" @focus="showResults = true"
                            @blur="onBlur" />
                        <div v-if="showResults && (loading || results.length > 0 || query.length >= MIN_CHARS)"
                            class="results-dropdown">
                            <div v-if="loading" class="result-row result-loading">{{ t('common.loading') }}</div>
                            <template v-else>
                                <button v-for="u in results" :key="u.id" type="button" class="result-row"
                                    @mousedown.prevent="pick(u)">
                                    <div class="avatar avatar-sage" style="width:26px; height:26px; font-size:.65rem;">
                                        {{ (u.firstnames[0] ?? '') + (u.surnames[0] ?? '') }}
                                    </div>
                                    <div class="result-info">
                                        <div class="result-name">{{ u.firstnames }} {{ u.surnames }}</div>
                                        <div class="result-email">{{ u.email }}</div>
                                    </div>
                                </button>
                                <div v-if="!loading && results.length === 0 && query.length >= MIN_CHARS"
                                    class="result-row result-empty">
                                    {{ t('staff.users.empty') }}
                                </div>
                            </template>
                        </div>
                    </div>
                </div>

                <!-- Mode: folder code -->
                <div v-else class="form-group">
                    <label class="form-label">{{ t('staff.bookings.folderCode') }}</label>
                    <div style="display:flex; gap:.6rem;">
                        <input class="form-input" type="text" v-model="folderCode"
                            :placeholder="t('staff.bookings.folderCodePlaceholder')"
                            @keydown.enter="searchByFolderCode" />
                        <button class="btn btn-secondary" :disabled="folderLoading" @click="searchByFolderCode">
                            {{ folderLoading ? t('common.loading') : t('common.search') }}
                        </button>
                    </div>
                    <div v-if="folderSearched && !folderLoading" class="folder-result">
                        <div v-if="folderUser" class="result-row result-static" @click="pick(folderUser)">
                            <div class="avatar avatar-sage" style="width:26px; height:26px; font-size:.65rem;">
                                {{ (folderUser.firstnames[0] ?? '') + (folderUser.surnames[0] ?? '') }}
                            </div>
                            <div class="result-info">
                                <div class="result-name">{{ folderUser.firstnames }} {{ folderUser.surnames }}</div>
                                <div class="result-email">{{ folderUser.email }}</div>
                            </div>
                        </div>
                        <div v-else class="result-row result-empty">{{ t('staff.users.empty') }}</div>
                    </div>
                </div>

                <!-- Currently selected -->
                <div v-if="picked" class="selected-chip" style="margin-top:1rem;">
                    <div class="avatar avatar-sage" style="width:28px; height:28px; font-size:.7rem;">
                        {{ (picked.firstnames[0] ?? '') + (picked.surnames[0] ?? '') }}
                    </div>
                    <div class="selected-info">
                        <div class="selected-name">{{ picked.firstnames }} {{ picked.surnames }}</div>
                        <div class="selected-email">{{ picked.email }}</div>
                    </div>
                    <button class="clear-btn" type="button" @click="picked = null">✕</button>
                </div>

                <div v-if="error" class="error-banner">⚠️ {{ error }}</div>

                <div class="modal-footer">
                    <button class="btn btn-secondary" @click="close">{{ t('common.cancel') }}</button>
                    <button class="btn btn-primary" :disabled="!picked || saving" @click="confirm">
                        {{ saving ? t('common.loading') : t('staff.bookings.assign') }} →
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBookingApi } from '../composables/useBookingApi';
import { extractErrorMessage } from '../utiles/error.utiles';
import type { UserDto } from '../types/user.types';
import { useUserApi } from '../composables/useUserApi';

const props = defineProps<{
    modelValue: boolean
    bookingId: string | null
}>()

const emit = defineEmits<{
    'update:modelValue': [boolean]
    assigned: [UserDto]
}>()

const { t } = useI18n()
const api = useBookingApi()
const usersApi = useUserApi()

const MIN_CHARS = 2
const DEBOUNCE_MS = 300

const mode = ref<'search' | 'folder'>('search')

// search mode state
const query = ref('')
const results = ref<UserDto[]>([])
const loading = ref(false)
const showResults = ref(false)
let debounceTimer: ReturnType<typeof setTimeout> | undefined

// folder mode state
const folderCode = ref('')
const folderUser = ref<UserDto | null>(null)
const folderLoading = ref(false)
const folderSearched = ref(false)

const picked = ref<UserDto | null>(null)
const saving = ref(false)
const error = ref('')

watch(() => props.modelValue, (open) => {
    if (open) {
        mode.value = 'search'
        query.value = ''
        results.value = []
        folderCode.value = ''
        folderUser.value = null
        folderSearched.value = false
        picked.value = null
        error.value = ''
    }
})

watch(query, (value) => {
    if (debounceTimer) clearTimeout(debounceTimer)
    if (value.trim().length < MIN_CHARS) {
        results.value = []
        return
    }
    debounceTimer = setTimeout(async () => {
        loading.value = true
        try {
            const data = await usersApi.getUsers({ page: 1, limit: 10, textFilter: value.trim() })
            results.value = data?.data ?? []
        } catch {
            results.value = []
        } finally {
            loading.value = false
        }
    }, DEBOUNCE_MS)
})

async function searchByFolderCode() {
    if (!folderCode.value.trim()) return
    folderLoading.value = true
    folderSearched.value = false
    try {
        const data = await usersApi.getUsers({ page: 1, limit: 1, folderCode: folderCode.value.trim() })
        folderUser.value = data?.data?.[0] ?? null
    } catch {
        folderUser.value = null
    } finally {
        folderLoading.value = false
        folderSearched.value = true
    }
}

function pick(u: UserDto) {
    picked.value = u
    showResults.value = false
}

function onBlur() {
    setTimeout(() => { showResults.value = false }, 100)
}

function close() {
    emit('update:modelValue', false)
}

async function confirm() {
    if (!picked.value || !props.bookingId) return
    saving.value = true
    error.value = ''
    try {
        await api.assignBookingUser(props.bookingId, picked.value.id)
        emit('assigned', picked.value)
        close()
    } catch (e) {
        error.value = extractErrorMessage(e)
    } finally {
        saving.value = false
    }
}
</script>

<style scoped>
.modal-sub {
    font-size: .85rem;
    color: var(--muted);
    margin-top: -.5rem;
    margin-bottom: 1rem;
}

.mode-tabs {
    display: flex;
    gap: .5rem;
    margin-bottom: 1.25rem;
    border-bottom: 1.5px solid var(--border);
}

.mode-tab {
    border: none;
    background: none;
    cursor: pointer;
    padding: .6rem .9rem;
    font-weight: 700;
    font-size: .82rem;
    color: var(--muted);
    border-bottom: 2px solid transparent;
    transition: var(--transition);
}

.mode-tab.active {
    color: var(--navy);
    border-bottom-color: var(--navy);
}

.mode-tab:hover:not(.active) {
    color: var(--ink);
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
    border-radius: var(--radius-md, 8px);
    box-shadow: var(--shadow-md, 0 4px 16px rgba(0, 0, 0, .1));
    max-height: 220px;
    overflow-y: auto;
}

.result-row {
    display: flex;
    align-items: center;
    gap: .6rem;
    width: 100%;
    padding: .6rem .8rem;
    border: none;
    background: none;
    cursor: pointer;
    text-align: left;
    font-family: var(--font-body);
    transition: background .12s ease;
}

.result-row:hover {
    background: var(--gold-100, #f6efe0);
}

.result-static {
    border: 1.5px solid var(--border);
    border-radius: var(--radius-md, 8px);
    margin-top: .6rem;
}

.result-loading,
.result-empty {
    cursor: default;
    color: var(--muted);
    font-size: .82rem;
    font-weight: 600;
}

.result-loading:hover,
.result-empty:hover {
    background: none;
}

.result-info {
    display: flex;
    flex-direction: column;
    gap: .1rem;
    min-width: 0;
}

.result-name {
    font-weight: 700;
    font-size: .85rem;
    color: var(--ink);
}

.result-email {
    font-size: .75rem;
    color: var(--muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.selected-chip {
    display: flex;
    align-items: center;
    gap: .6rem;
    border: 1.5px solid var(--gold, #e8b84b);
    background: var(--gold-50, #fdf8ee);
    border-radius: var(--radius-md, 8px);
    padding: .55rem .8rem;
}

.selected-info {
    flex: 1;
    min-width: 0;
}

.selected-name {
    font-weight: 700;
    font-size: .85rem;
    color: var(--ink);
}

.selected-email {
    font-size: .75rem;
    color: var(--muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.clear-btn {
    border: none;
    background: none;
    cursor: pointer;
    color: var(--muted);
    font-size: .9rem;
    font-weight: 700;
    padding: .2rem .4rem;
    border-radius: 4px;
}

.clear-btn:hover {
    background: var(--red-light, #fee);
    color: var(--red, #c00);
}
</style>