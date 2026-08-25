<template>
  <div class="page-header">
    <h1>{{ t('manager.scheduleGen.title') }}</h1>
    <p class="subtitle">{{ t('manager.scheduleGen.subtitle') }}</p>
  </div>

  <div v-if="pageError" class="error-banner"
    style="margin-bottom:1.5rem; display:flex; align-items:center; justify-content:space-between; gap:1rem;">
    <span>⚠️ {{ pageError }}</span>
    <button class="btn btn-secondary btn-sm" @click="pageError = ''">✕</button>
  </div>

  <div class="form-group" style="max-width:320px;">
    <label class="form-label">{{ t('manager.scheduleGen.category') }}</label>
    <input class="form-input" v-model="category" :placeholder="t('manager.scheduleGen.categoryPlaceholder')" />
    <span class="field-hint">{{ t('manager.scheduleGen.categoryHint') }}</span>
  </div>

  <!-- Blank / category-wide preview -->
  <div class="card gen-card">
    <h2 class="section-title">{{ t('manager.scheduleGen.blankTitle') }}</h2>
    <p class="gen-desc">{{ t('manager.scheduleGen.blankDesc') }}</p>
    <button class="btn btn-primary" :disabled="!category || generatingBlank" @click="generateBlank">
      <InlineSpinner v-if="generatingBlank" />
      <span v-else>📄 {{ t('manager.scheduleGen.generateBlank') }}</span>
    </button>
  </div>

  <!-- Single user -->
  <div class="card gen-card">
    <h2 class="section-title">{{ t('manager.scheduleGen.userTitle') }}</h2>
    <p class="gen-desc">{{ t('manager.scheduleGen.userDesc') }}</p>
    <div class="search-wrap">
      <input class="form-input" v-model="userQuery" :placeholder="t('manager.users.searchPlaceholder')"
        @input="onUserQueryChange" @focus="showResults = true" @blur="onBlur" />
      <div v-if="showResults && userResults.length > 0" class="results-dropdown">
        <button v-for="u in userResults" :key="u.id" type="button" class="result-row" @mousedown.prevent="pickUser(u)">
          {{ u.firstnames }} {{ u.surnames }} — {{ u.email }}
        </button>
      </div>
    </div>
    <div v-if="pickedUser" class="selected-chip" style="margin-top:.75rem;">
      <span>{{ pickedUser.firstnames }} {{ pickedUser.surnames }}</span>
      <button class="clear-btn" type="button" @click="pickedUser = null">✕</button>
    </div>
    <button class="btn btn-primary" style="margin-top:.75rem;" :disabled="!category || !pickedUser || generatingUser"
      @click="generateForUser">
      <InlineSpinner v-if="generatingUser" />
      <span v-else>📄 {{ t('manager.scheduleGen.generateForUser') }}</span>
    </button>
  </div>

  <!-- Batch -->
  <div class="card gen-card">
    <h2 class="section-title">{{ t('manager.scheduleGen.batchTitle') }}</h2>
    <p class="gen-desc">{{ t('manager.scheduleGen.batchDesc') }}</p>
    <div class="search-wrap">
      <input class="form-input" v-model="batchQuery" :placeholder="t('manager.users.searchPlaceholder')"
        @input="onBatchQueryChange" @focus="showBatchResults = true" @blur="onBatchBlur" />
      <div v-if="showBatchResults && batchResults.length > 0" class="results-dropdown">
        <button v-for="u in batchResults" :key="u.id" type="button" class="result-row" @mousedown.prevent="addBatchUser(u)">
          {{ u.firstnames }} {{ u.surnames }} — {{ u.email }}
        </button>
      </div>
    </div>
    <div v-if="batchUsers.length > 0" class="batch-list">
      <div v-for="u in batchUsers" :key="u.id" class="selected-chip">
        <span>{{ u.firstnames }} {{ u.surnames }}</span>
        <button class="clear-btn" type="button" @click="removeBatchUser(u.id)">✕</button>
      </div>
    </div>
    <button class="btn btn-primary" style="margin-top:.75rem;" :disabled="!category || batchUsers.length === 0 || generatingBatch"
      @click="generateBatch">
      <InlineSpinner v-if="generatingBatch" />
      <span v-else>📦 {{ t('manager.scheduleGen.generateBatch') }} ({{ batchUsers.length }})</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { client } from '../services/http.client'
import { useManagerUserApi } from '../composables/useManagerUserApi'
import { extractErrorMessage } from '../utiles/error.utiles'
import InlineSpinner from './InlineSpinner.vue'
import type { ManagerUserBaseDto } from '../types/manager-user.types'

const { t } = useI18n()
const userApi = useManagerUserApi()

const category = ref('')
const pageError = ref('')

/**
 * Triggers a file-download response from an endpoint that returns a raw
 * binary stream (StreamableFile on the backend) — axios needs
 * responseType: 'blob' for this, which the shared `client` doesn't set
 * by default for normal JSON calls, so this bypasses it with a direct
 * fetch-like blob request instead.
 */
async function downloadFile(url: string, options: RequestInit, fallbackFilename: string) {
  const response = await client.request({
    url,
    method: options.method as any,
    data: options.body,
    responseType: 'blob',
  })
  const blob = response.data as Blob
  const disposition = response.headers['content-disposition'] as string | undefined
  const match = disposition?.match(/filename="?([^"]+)"?/)
  const filename = match?.[1] ?? fallbackFilename

  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

// ── Blank ──────────────────────────────────────────────────────────────
const generatingBlank = ref(false)

async function generateBlank() {
  generatingBlank.value = true
  pageError.value = ''
  try {
    await downloadFile(
      `/schedule/generate/blank?category=${encodeURIComponent(category.value)}`,
      { method: 'GET' },
      `${category.value}-blank-schedule.xlsx`,
    )
  } catch (e) {
    pageError.value = extractErrorMessage(e)
  } finally {
    generatingBlank.value = false
  }
}

// ── Single user ────────────────────────────────────────────────────────
const userQuery = ref('')
const userResults = ref<ManagerUserBaseDto[]>([])
const showResults = ref(false)
const pickedUser = ref<ManagerUserBaseDto | null>(null)
const generatingUser = ref(false)
let userDebounce: ReturnType<typeof setTimeout> | undefined

async function searchUsers(query: string): Promise<ManagerUserBaseDto[]> {
  if (query.trim().length < 2) return []
  const data = await userApi.getUsers({ page: 1, limit: 10, textFilter: query.trim() })
  return (data?.data ?? []).map(u => ({ id: u.id, email: u.email, firstnames: u.firstnames, surnames: u.surnames }))
}

function onUserQueryChange() {
  if (userDebounce) clearTimeout(userDebounce)
  userDebounce = setTimeout(async () => {
    userResults.value = await searchUsers(userQuery.value).catch(() => [])
  }, 300)
}

function pickUser(u: ManagerUserBaseDto) {
  pickedUser.value = u
  showResults.value = false
  userQuery.value = ''
}

function onBlur() {
  setTimeout(() => { showResults.value = false }, 100)
}

async function generateForUser() {
  if (!pickedUser.value) return
  generatingUser.value = true
  pageError.value = ''
  try {
    await downloadFile(
      `/schedule/generate/user/${pickedUser.value.id}?category=${encodeURIComponent(category.value)}`,
      { method: 'GET' },
      `${pickedUser.value.firstnames}-schedule.xlsx`,
    )
  } catch (e) {
    pageError.value = extractErrorMessage(e)
  } finally {
    generatingUser.value = false
  }
}

// ── Batch ──────────────────────────────────────────────────────────────
const batchQuery = ref('')
const batchResults = ref<ManagerUserBaseDto[]>([])
const showBatchResults = ref(false)
const batchUsers = ref<ManagerUserBaseDto[]>([])
const generatingBatch = ref(false)
let batchDebounce: ReturnType<typeof setTimeout> | undefined

function onBatchQueryChange() {
  if (batchDebounce) clearTimeout(batchDebounce)
  batchDebounce = setTimeout(async () => {
    batchResults.value = await searchUsers(batchQuery.value).catch(() => [])
  }, 300)
}

function addBatchUser(u: ManagerUserBaseDto) {
  if (!batchUsers.value.some(existing => existing.id === u.id)) {
    batchUsers.value.push(u)
  }
  showBatchResults.value = false
  batchQuery.value = ''
}

function removeBatchUser(id: string) {
  batchUsers.value = batchUsers.value.filter(u => u.id !== id)
}

function onBatchBlur() {
  setTimeout(() => { showBatchResults.value = false }, 100)
}

async function generateBatch() {
  generatingBatch.value = true
  pageError.value = ''
  try {
    await downloadFile(
      '/schedule/generate/batch',
      {
        method: 'POST',
        body: JSON.stringify({ userIds: batchUsers.value.map(u => u.id), category: category.value }) as any,
      },
      'schedules.zip',
    )
  } catch (e) {
    pageError.value = extractErrorMessage(e)
  } finally {
    generatingBatch.value = false
  }
}
</script>

<style scoped>
.gen-card {
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  max-width: 560px;
}

.gen-desc {
  color: var(--muted);
  font-size: .88rem;
  margin: .5rem 0 1rem;
}

.field-hint {
  font-size: .78rem;
  color: var(--muted);
  display: block;
  margin-top: .3rem;
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
  margin-right: .5rem;
  margin-bottom: .5rem;
}

.batch-list {
  margin-top: .75rem;
  display: flex;
  flex-wrap: wrap;
}

.clear-btn {
  border: none;
  background: none;
  cursor: pointer;
  color: var(--muted);
  font-weight: 700;
}
</style>