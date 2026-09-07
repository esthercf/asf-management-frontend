<template>
  <div class="page-header">
    <h1>{{ t('manager.diplomas.title') }}</h1>
    <p class="subtitle">{{ t('manager.diplomas.subtitle') }}</p>
  </div>

  <div v-if="pageError" class="error-banner"
    style="margin-bottom:1.5rem; display:flex; align-items:center; justify-content:space-between; gap:1rem;">
    <span>⚠️ {{ pageError }}</span>
    <button class="btn btn-secondary btn-sm" @click="pageError = ''">✕</button>
  </div>

  <div class="form-group" style="max-width:320px;">
    <label class="form-label">{{ t('manager.diplomas.template') }}</label>
    <select class="form-input" v-model="templateKey">
      <option value="" disabled>{{ t('manager.diplomas.templatePlaceholder') }}</option>
      <option v-for="tpl in templates" :key="tpl.key" :value="tpl.key">{{ tpl.label }}</option>
    </select>
  </div>

  <!-- ── Solo / Youth (student-based) — hidden entirely once the
       Masterclass template is picked, since that flow uses a
       different data model (Activities, not Students directly). ── -->
  <template v-if="templateKey !== 'masterclass'">
    <!-- By booking type (bulk) -->
    <div class="card gen-card">
      <h2 class="section-title">{{ t('manager.diplomas.byTypeTitle') }}</h2>
      <p class="gen-desc">{{ t('manager.diplomas.byTypeDesc') }}</p>
      <div class="form-group" style="max-width:320px;">
        <label class="form-label">{{ t('manager.diplomas.bookingType') }}</label>
        <select class="form-input" v-model="selectedBookingType">
          <option value="" disabled>{{ t('manager.diplomas.bookingTypePlaceholder') }}</option>
          <option v-for="bt in bookingTypeOptions" :key="bt" :value="bt">{{ bt }}</option>
        </select>
      </div>
      <button class="btn btn-primary" :disabled="!templateKey || !selectedBookingType || generatingByType"
        @click="generateByType">
        <InlineSpinner v-if="generatingByType" />
        <span v-else>📦 {{ t('manager.diplomas.generateByType') }}</span>
      </button>
    </div>

    <!-- Single student -->
    <div class="card gen-card">
      <h2 class="section-title">{{ t('manager.diplomas.singleTitle') }}</h2>
      <p class="gen-desc">{{ t('manager.diplomas.singleDesc') }}</p>
      <div class="search-wrap">
        <input class="form-input" v-model="userQuery" :placeholder="t('manager.users.searchPlaceholder')"
          @input="onUserQueryChange" @focus="showResults = true" @blur="onBlur" />
        <div v-if="showResults && userResults.length > 0" class="results-dropdown">
          <button v-for="u in userResults" :key="u.id" type="button" class="result-row"
            @mousedown.prevent="pickUser(u)">
            {{ u.firstnames }} {{ u.surnames }} — {{ u.email }}
          </button>
        </div>
      </div>
      <div v-if="pickedUser" class="selected-chip" style="margin-top:.75rem;">
        <span>{{ pickedUser.firstnames }} {{ pickedUser.surnames }}</span>
        <button class="clear-btn" type="button" @click="pickedUser = null">✕</button>
      </div>
      <button class="btn btn-primary" style="margin-top:.75rem;"
        :disabled="!templateKey || !pickedUser || generatingSingle" @click="generateSingle">
        <InlineSpinner v-if="generatingSingle" />
        <span v-else>📄 {{ t('manager.diplomas.generateSingle') }}</span>
      </button>
    </div>

    <!-- Multiple, hand-picked students -->
    <div class="card gen-card">
      <h2 class="section-title">{{ t('manager.diplomas.multiTitle') }}</h2>
      <p class="gen-desc">{{ t('manager.diplomas.multiDesc') }}</p>
      <div class="search-wrap">
        <input class="form-input" v-model="multiQuery" :placeholder="t('manager.users.searchPlaceholder')"
          @input="onMultiQueryChange" @focus="showMultiResults = true" @blur="onMultiBlur" />
        <div v-if="showMultiResults && multiResults.length > 0" class="results-dropdown">
          <button v-for="u in multiResults" :key="u.id" type="button" class="result-row"
            @mousedown.prevent="addMultiUser(u)">
            {{ u.firstnames }} {{ u.surnames }} — {{ u.email }}
          </button>
        </div>
      </div>
      <div v-if="multiUsers.length > 0" class="batch-list">
        <div v-for="u in multiUsers" :key="u.id" class="selected-chip">
          <span>{{ u.firstnames }} {{ u.surnames }}</span>
          <button class="clear-btn" type="button" @click="removeMultiUser(u.id)">✕</button>
        </div>
      </div>
      <button class="btn btn-primary" style="margin-top:.75rem;"
        :disabled="!templateKey || multiUsers.length === 0 || generatingMulti" @click="generateMulti">
        <InlineSpinner v-if="generatingMulti" />
        <span v-else>📦 {{ t('manager.diplomas.generateMulti') }} ({{ multiUsers.length }})</span>
      </button>
    </div>
  </template>

  <!-- ── Masterclass (Activity-based) — only shown once that template
       is picked, since it selects by masterclass session rather than
       by student directly. ── -->
  <template v-else>
    <div class="card gen-card">
      <h2 class="section-title">{{ t('manager.diplomas.masterclassTitle') }}</h2>
      <p class="gen-desc">{{ t('manager.diplomas.masterclassDesc') }}</p>

      <div class="form-group">
        <label class="form-label">{{ t('manager.diplomas.searchByTeacher') }}</label>
        <input class="form-input" v-model="activityTeacherFilter" :placeholder="t('manager.diplomas.teacherPlaceholder')"
          @input="debouncedActivitySearch" />
      </div>

      <div v-if="loadingActivities" class="empty-state">
        <div class="empty-icon">⏳</div>
        <p>{{ t('common.loading') }}</p>
      </div>
      <div v-else-if="activityResults.length > 0" class="activity-results">
        <label v-for="a in activityResults" :key="a._id" class="activity-row">
          <input type="checkbox" :value="a._id" v-model="selectedActivityIds" />
          <div class="activity-row-info">
            <div class="activity-row-main">
              <strong>{{ a.studentFullName ?? t('manager.diplomas.noStudentLinked') }}</strong>
              — {{ a.teacherRawName }}
            </div>
            <div class="activity-row-meta">
              {{ a.date }} · {{ formatHM(a.hour, a.minutes) }} · {{ t('room.title') }} #{{ a.roomNumber }}
              <span v-if="a.diplomaText"> · {{ a.diplomaText }}</span>
            </div>
          </div>
        </label>
      </div>
      <div v-else-if="activityTeacherFilter" class="empty-state">
        <div class="empty-icon">🔍</div>
        <p>{{ t('manager.diplomas.noActivitiesFound') }}</p>
      </div>

      <button class="btn btn-primary" style="margin-top:1rem;"
        :disabled="selectedActivityIds.length === 0 || generatingActivities" @click="generateActivities">
        <InlineSpinner v-if="generatingActivities" />
        <span v-else>📦 {{ t('manager.diplomas.generateMulti') }} ({{ selectedActivityIds.length }})</span>
      </button>
    </div>
  </template>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { client } from '../services/http.client'
import { useDiplomaApi, type DiplomaTemplateDto } from '../composables/useDiplomaApi'
import { useManagerUserApi } from '../composables/useManagerUserApi'
import { useManagerActivityApi } from '../composables/useManagerActivityApi'
import { extractErrorMessage } from '../utiles/error.utiles'
import { BookingTypeEnum } from '../enums/booking.enum'
import InlineSpinner from './InlineSpinner.vue'
import type { ManagerUserBaseDto } from '../types/manager-user.types'
import { ActivityTypeEnum, type ActivityDto } from '../types/manager-activity.types'

const { t } = useI18n()
const diplomaApi = useDiplomaApi()
const userApi = useManagerUserApi()
const activityApi = useManagerActivityApi()

const bookingTypeOptions = Object.values(BookingTypeEnum)
const templates = ref<DiplomaTemplateDto[]>([])
const templateKey = ref('')
const pageError = ref('')

onMounted(async () => {
  try {
    templates.value = await diplomaApi.getTemplates()
  } catch (e) {
    pageError.value = extractErrorMessage(e)
  }
})

async function downloadFile(url: string, options: RequestInit, fallbackFilename: string) {
  // options.body is passed in already JSON.stringify()'d by each caller
  // (matching the existing convention from ManagerScheduleGenerationView.vue).
  // axios only auto-sets Content-Type: application/json when handed a
  // plain object as `data` — a pre-stringified string doesn't trigger
  // that, so the backend's body parser was silently receiving an
  // unparsed/empty body. Explicitly setting the header here fixes it
  // without needing to change every call site's body: JSON.stringify(...).
  const response = await client.request({
    url,
    method: options.method as any,
    data: options.body,
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
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

async function searchUsers(query: string): Promise<ManagerUserBaseDto[]> {
  if (query.trim().length < 2) return []
  const data = await userApi.getUsers({ page: 1, limit: 10, textFilter: query.trim() })
  return (data?.data ?? []).map(u => ({ id: u.id, email: u.email, firstnames: u.firstnames, surnames: u.surnames }))
}

// ── By booking type (bulk, e.g. everyone tagged "solo") ─────────────────
const selectedBookingType = ref<BookingTypeEnum | ''>('')
const generatingByType = ref(false)

async function generateByType() {
  if (!selectedBookingType.value) return
  generatingByType.value = true
  pageError.value = ''
  try {
    // Pull every Contestant with this exact tag (paginated at 200,
    // matching the same cap used elsewhere in this app for "get
    // everyone" style requests) before handing the ids to the batch
    // generation endpoint.
    const data = await userApi.getUsers({
      page: 1,
      limit: 200,
      roleType: undefined,
      bookingTypeEnum: [selectedBookingType.value],
    })
    const studentIds = (data?.data ?? []).map(u => u.id)
    if (studentIds.length === 0) {
      pageError.value = t('manager.diplomas.noMatchingStudents')
      return
    }
    await downloadFile(
      '/diplomas/generate/batch',
      { method: 'POST', body: JSON.stringify({ templateKey: templateKey.value, studentIds }) as any },
      'diplomas.zip',
    )
  } catch (e) {
    pageError.value = extractErrorMessage(e)
  } finally {
    generatingByType.value = false
  }
}

// ── Single student ────────────────────────────────────────────────────
const userQuery = ref('')
const userResults = ref<ManagerUserBaseDto[]>([])
const showResults = ref(false)
const pickedUser = ref<ManagerUserBaseDto | null>(null)
const generatingSingle = ref(false)
let userDebounce: ReturnType<typeof setTimeout> | undefined

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

async function generateSingle() {
  if (!pickedUser.value) return
  generatingSingle.value = true
  pageError.value = ''
  try {
    await downloadFile(
      `/diplomas/generate/${templateKey.value}/${pickedUser.value.id}`,
      { method: 'POST' },
      `${pickedUser.value.firstnames}-diploma.pptx`,
    )
  } catch (e) {
    pageError.value = extractErrorMessage(e)
  } finally {
    generatingSingle.value = false
  }
}

// ── Multiple, hand-picked students ───────────────────────────────────────
const multiQuery = ref('')
const multiResults = ref<ManagerUserBaseDto[]>([])
const showMultiResults = ref(false)
const multiUsers = ref<ManagerUserBaseDto[]>([])
const generatingMulti = ref(false)
let multiDebounce: ReturnType<typeof setTimeout> | undefined

function onMultiQueryChange() {
  if (multiDebounce) clearTimeout(multiDebounce)
  multiDebounce = setTimeout(async () => {
    multiResults.value = await searchUsers(multiQuery.value).catch(() => [])
  }, 300)
}

function addMultiUser(u: ManagerUserBaseDto) {
  if (!multiUsers.value.some(existing => existing.id === u.id)) {
    multiUsers.value.push(u)
  }
  showMultiResults.value = false
  multiQuery.value = ''
}

function removeMultiUser(id: string) {
  multiUsers.value = multiUsers.value.filter(u => u.id !== id)
}

function onMultiBlur() {
  setTimeout(() => { showMultiResults.value = false }, 100)
}

async function generateMulti() {
  generatingMulti.value = true
  pageError.value = ''
  try {
    await downloadFile(
      '/diplomas/generate/batch',
      {
        method: 'POST',
        body: JSON.stringify({ templateKey: templateKey.value, studentIds: multiUsers.value.map(u => u.id) }) as any,
      },
      'diplomas.zip',
    )
  } catch (e) {
    pageError.value = extractErrorMessage(e)
  } finally {
    generatingMulti.value = false
  }
}

// ── Masterclass (Activity-based) ──────────────────────────────────────
const activityTeacherFilter = ref('')
const activityResults = ref<ActivityDto[]>([])
const selectedActivityIds = ref<string[]>([])
const loadingActivities = ref(false)
const generatingActivities = ref(false)
let activityDebounce: ReturnType<typeof setTimeout> | undefined

function debouncedActivitySearch() {
  if (activityDebounce) clearTimeout(activityDebounce)
  activityDebounce = setTimeout(searchActivities, 300)
}

async function searchActivities() {
  if (!activityTeacherFilter.value.trim()) {
    activityResults.value = []
    return
  }
  loadingActivities.value = true
  try {
    // limit: 1000 — deliberately not the endpoint's own default of 20;
    // a manager browsing one teacher's full masterclass roster needs to
    // see everyone, not just the first page.
    const data = await activityApi.getFiltered({
      teacherName: activityTeacherFilter.value.trim(),
      type: ActivityTypeEnum.MASTERCLASS,
      page: 1,
      limit: 1000,
    })
    activityResults.value = data?.data ?? []
  } catch (e) {
    pageError.value = extractErrorMessage(e)
  } finally {
    loadingActivities.value = false
  }
}

function formatHM(hour: number, minutes: number): string {
  return `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

async function generateActivities() {
  if (selectedActivityIds.value.length === 0) return
  generatingActivities.value = true
  pageError.value = ''
  try {
    await downloadFile(
      '/diplomas/generate-activity/batch',
      {
        method: 'POST',
        body: JSON.stringify({ templateKey: templateKey.value, activityIds: selectedActivityIds.value }) as any,
      },
      'masterclass-diplomas.zip',
    )
  } catch (e) {
    pageError.value = extractErrorMessage(e)
  } finally {
    generatingActivities.value = false
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

.activity-results {
  margin-top: 1rem;
  border: 1.5px solid var(--border);
  border-radius: 8px;
  max-height: 340px;
  overflow-y: auto;
}

.activity-row {
  display: flex;
  align-items: flex-start;
  gap: .75rem;
  padding: .75rem 1rem;
  border-bottom: 1.5px solid var(--warm-100, var(--border));
  cursor: pointer;
}

.activity-row:last-child {
  border-bottom: none;
}

.activity-row:hover {
  background: var(--warm-50, var(--gold-50, #fdf8ee));
}

.activity-row input {
  width: auto;
  margin-top: .2rem;
}

.activity-row-main {
  font-size: .9rem;
}

.activity-row-meta {
  font-size: .78rem;
  color: var(--muted);
  margin-top: .15rem;
}
</style>