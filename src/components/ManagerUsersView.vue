<template>
  <div class="page-header">
    <h1>{{ t('manager.users.title') }}</h1>
    <p class="subtitle">{{ t('manager.users.subtitle') }}</p>
  </div>

  <div v-if="pageError" class="error-banner"
    style="margin-bottom:1.5rem; display:flex; align-items:center; justify-content:space-between; gap:1rem;">
    <span>⚠️ {{ pageError }}</span>
    <button class="btn btn-secondary btn-sm" @click="pageError = ''">✕</button>
  </div>

  <div class="section-row">
    <div class="search-bar">
      <span class="search-icon">🔍</span>
      <input :placeholder="t('manager.users.searchPlaceholder')" v-model="textFilter" @input="debouncedReload" />
    </div>

    <select class="form-input filter-select" v-model="activeFilter" @change="reload">
      <option :value="undefined">{{ t('manager.users.filters.allStatus') }}</option>
      <option :value="FilterActiveEnum.Active">{{ t('manager.users.filters.active') }}</option>
      <option :value="FilterActiveEnum.Inactive">{{ t('manager.users.filters.inactive') }}</option>
    </select>

    <select class="form-input filter-select" v-model="roleFilter" @change="reload">
      <option :value="undefined">{{ t('manager.users.filters.allRoles') }}</option>
      <option v-for="role in roleOptions" :key="role" :value="role">{{ role }}</option>
    </select>

    <select class="form-input filter-select" v-model="countryFilter" @change="reload">
      <option :value="undefined">{{ t('manager.users.filters.allCountries') }}</option>
      <option v-for="c in countryOptions" :key="c" :value="c">{{ c }}</option>
    </select>

    <button class="btn btn-primary" @click="openCreateModal">+ {{ t('manager.users.create') }}</button>

    <button class="btn btn-secondary" :disabled="importingUsers" @click="userFileInput?.click()">
      <InlineSpinner v-if="importingUsers" />
      <span v-else>📥 {{ t('manager.users.importUsers') }}</span>
    </button>
    <input ref="userFileInput" type="file" accept=".xlsx" style="display:none;" @change="onUserFileSelected" />
    <label class="checkbox-row" style="white-space:nowrap;">
      <input type="checkbox" v-model="sendWelcomeEmail" style="width:auto;" />
      {{ t('manager.users.sendWelcomeEmail') }}
    </label>


    <button class="btn btn-secondary" @click="showBookingTypeFilters = !showBookingTypeFilters">
      {{ showBookingTypeFilters ? t('manager.users.filters.hideBookingTypeFilters') :
        t('manager.users.filters.moreFilters') }}
    </button>
  </div>

  <div v-if="showBookingTypeFilters" class="filter-panels-row">
    <div class="filter-panel">
      <span class="filter-panel-label">{{ t('manager.users.filters.bookingTypeAny') }}</span>
      <div class="checkbox-grid">
        <label v-for="bt in bookingTypeOptions" :key="bt" class="checkbox-row">
          <input type="checkbox" :value="bt" v-model="bookingTypeFilter" @change="reload" />
          {{ bt }}
        </label>
      </div>
    </div>
    <div class="filter-panel">
      <span class="filter-panel-label">{{ t('manager.users.filters.bookingTypeExact') }}</span>
      <div class="checkbox-grid">
        <label v-for="bt in bookingTypeOptions" :key="bt" class="checkbox-row">
          <input type="checkbox" :value="bt" v-model="bookingTypeExactFilter" @change="reload" />
          {{ bt }}
        </label>
      </div>
    </div>
  </div>

  <div v-if="userImportResult" class="card import-result-card">
    <p><strong>{{ userImportResult.message }}</strong></p>
    <ul v-if="userImportResult.errors.length > 0" class="import-errors">
      <li v-for="err in userImportResult.errors" :key="err.rowNumber">
        {{ t('manager.festivalEvents.importRowError', { row: err.rowNumber }) }}: {{ err.message }}
      </li>
    </ul>
    <button class="btn btn-secondary btn-sm" @click="userImportResult = null">{{ t('common.close') }}</button>
  </div>
  <div v-if="loading" class="empty-state">
    <div class="empty-icon">⏳</div>
    <p>{{ t('common.loading') }}</p>
  </div>

  <div v-else class="card users-table-card">
    <div class="table-scroll">
      <table class="data-table">
        <thead>
          <tr>
            <th>{{ t('manager.users.columns.name') }}</th>
            <th>{{ t('manager.users.columns.email') }}</th>
            <th>{{ t('manager.users.columns.folderCode') }}</th>
            <th>{{ t('manager.users.columns.country') }}</th>
            <th>{{ t('manager.users.columns.roles') }}</th>
            <th>{{ t('manager.users.columns.status') }}</th>
            <th>{{ t('manager.users.columns.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id" class="clickable-row" @click="openEditModal(u)">
            <td>
              <div style="display:flex; align-items:center; gap:.6rem;">
                <div class="avatar avatar-sage" style="width:28px; height:28px; font-size:.7rem;">
                  {{ (u.firstnames[0] ?? '') + (u.surnames[0] ?? '') }}
                </div>
                <strong>{{ u.firstnames }} {{ u.surnames }}</strong>
              </div>
            </td>
            <td>{{ u.email }}</td>
            <td>{{ u.folderCode ?? '—' }}</td>
            <td>{{ u.countryCode }}</td>
            <td>
              <span v-for="r in u.roles" :key="r" class="badge badge-lav bt-tag">{{ r }}</span>
            </td>
            <td>
              <span class="badge" :class="u.active ? 'badge-green' : 'badge-coral'">
                {{ u.active ? t('manager.users.active') : t('manager.users.inactive') }}
              </span>
            </td>
            <td @click.stop>
              <button class="btn btn-sm" :class="u.active ? 'btn-danger' : 'btn-primary'"
                :disabled="togglingUserId === u.id" @click="toggleActive(u)">
                <InlineSpinner v-if="togglingUserId === u.id" />
                <span v-else>{{ u.active ? t('manager.users.deactivate') : t('manager.users.activate') }}</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="users.length === 0" class="empty-state">
        <div class="empty-icon">👤</div>
        <p>{{ t('manager.users.empty') }}</p>
      </div>
    </div>
  </div>

  <div v-if="totalPages > 1" class="pagination-row">
    <button class="btn btn-secondary btn-sm" :disabled="page <= 1" @click="goToPage(page - 1)">←</button>
    <span class="pagination-label">{{ page }} / {{ totalPages }}</span>
    <button class="btn btn-secondary btn-sm" :disabled="page >= totalPages" @click="goToPage(page + 1)"></button>
  </div>

  <!-- Create/Edit User Modal -->
  <Teleport to="body">
    <div v-if="userModal" class="modal-overlay" @click.self="userModal = false">
      <div class="modal modal-wide">
        <h2 class="modal-title">{{ editingUser ? t('manager.users.editTitle') : t('manager.users.createTitle') }}</h2>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">{{ t('manager.users.firstnames') }}</label>
            <input class="form-input" v-model="form.firstnames" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('manager.users.surnames') }}</label>
            <input class="form-input" v-model="form.surnames" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">{{ t('manager.users.columns.email') }}</label>
            <input class="form-input" v-model="form.email" type="email" :disabled="!!editingUser"
              :title="editingUser ? t('manager.users.emailImmutableHint') : ''" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('manager.users.folderCode') }}</label>
            <input class="form-input" v-model="form.folderCode" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">{{ t('manager.users.phoneCode') }}</label>
            <input class="form-input" v-model="form.phoneCode" placeholder="+34" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('manager.users.columns.phone') }}</label>
            <input class="form-input" v-model="form.phoneNumber" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">{{ t('manager.users.columns.country') }}</label>
            <select class="form-input" v-model="form.countryCode">
              <option v-for="c in countryOptions" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('manager.users.columns.language') }}</label>
            <select class="form-input" v-model="form.language">
              <option v-for="l in languageOptions" :key="l" :value="l">{{ l }}</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">{{ t('manager.users.birthdate') }}</label>
            <input class="form-input" type="date" v-model="form.birthdate" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('manager.users.gender') }}</label>
            <select class="form-input" v-model="form.gender">
              <option v-for="g in genderOptions" :key="g" :value="g">{{ g }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('manager.users.columns.tshirt') }}</label>
            <select class="form-input" v-model="form.tshirtEnum">
              <option v-for="s in tshirtOptions" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
        </div>

        <!-- Role: create-only, matches backend (no live way to change it afterward) -->
        <div v-if="!editingUser" class="form-group">
          <label class="form-label">{{ t('manager.users.role') }}</label>
          <select class="form-input" v-model="form.role">
            <option v-for="r in roleOptions" :key="r" :value="r">{{ r }}</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">{{ t('manager.users.columns.bookingType') }}</label>
          <div class="checkbox-grid">
            <label v-for="bt in bookingTypeOptions" :key="bt" class="checkbox-row">
              <input type="checkbox" :value="bt" v-model="form.bookingTypeEnum" />
              {{ bt }}
            </label>
          </div>
        </div>

        <h3 class="section-title" style="font-size:.9rem; margin-top:1rem;">{{ t('manager.users.addressSection') }}
        </h3>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">{{ t('manager.users.address') }}</label>
            <input class="form-input" v-model="form.addressLine" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('manager.users.locality') }}</label>
            <input class="form-input" v-model="form.locality" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">{{ t('manager.users.addressCountry') }}</label>
            <input class="form-input" v-model="form.addressCountry" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('manager.users.zipCode') }}</label>
            <input class="form-input" v-model="form.zipCode" />
          </div>
        </div>

        <div v-if="!editingUser" class="form-group">
          <label class="form-label" style="display:flex; align-items:center; gap:.5rem;">
            <input type="checkbox" v-model="form.gdpr" style="width:auto;" />
            {{ t('manager.users.gdprConsent') }}
          </label>
        </div>

        <div v-if="editingUser" class="rehearsal-section">
          <h3 class="section-title" style="font-size:.9rem;">{{ t('manager.users.rehearsal.title') }}</h3>

          <div v-if="editingUser.rehearsals.length > 0" class="rehearsal-list">
            <div v-for="r in editingUser.rehearsals" :key="r.category" class="rehearsal-list-row">
              <div>
                <strong>{{ r.category }}</strong>
                — {{ r.artistFullName || '—' }} · #{{ r.roomNumber }} · {{ t('manager.rehearsals.columns.day') }}
                {{ r.day }} · {{ r.startTime }}–{{ r.endTime }}
              </div>
              <div style="display:flex; gap:.4rem;">
                <button class="btn btn-secondary btn-sm" @click="startEditRehearsal(r)">{{ t('common.edit') }}</button>
                <button class="btn btn-danger btn-sm" :disabled="savingRehearsal" @click="removeRehearsal(r.category)">
                  {{ t('common.delete') }}
                </button>
              </div>
            </div>
          </div>
          <p v-else class="muted-text" style="margin-bottom:.75rem;">{{ t('manager.rehearsals.empty') }}</p>

          <button v-if="!rehearsalFormOpen" class="btn btn-secondary btn-sm" @click="startAddRehearsal">
            + {{ t('manager.rehearsals.create') }}
          </button>

          <div v-if="rehearsalFormOpen" class="rehearsal-form">
            <div class="form-group">
              <label class="form-label">{{ t('manager.diplomas.bookingType') }}</label>
              <select class="form-input" v-model="rehearsalForm.category" :disabled="!!editingRehearsalCategory">
                <option value="" disabled>{{ t('manager.diplomas.bookingTypePlaceholder') }}</option>
                <option v-for="bt in availableRehearsalCategories" :key="bt" :value="bt">{{ bt }}</option>
              </select>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">{{ t('manager.users.rehearsal.artistEmail') }}</label>
                <input class="form-input" v-model="rehearsalForm.artistEmail" type="email" />
              </div>
              <div class="form-group">
                <label class="form-label">{{ t('manager.users.rehearsal.artistFullName') }}</label>
                <input class="form-input" v-model="rehearsalForm.artistFullName" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">{{ t('manager.users.rehearsal.room') }}</label>
                <input class="form-input" type="number" v-model.number="rehearsalForm.roomNumber" />
              </div>
              <div class="form-group">
                <label class="form-label">{{ t('manager.users.rehearsal.day') }}</label>
                <input class="form-input" type="number" v-model.number="rehearsalForm.day" />
              </div>
              <div class="form-group">
                <label class="form-label">{{ t('manager.users.rehearsal.startTime') }}</label>
                <input class="form-input" type="time" v-model="rehearsalForm.startTime" />
              </div>
              <div class="form-group">
                <label class="form-label">{{ t('manager.users.rehearsal.endTime') }}</label>
                <input class="form-input" type="time" v-model="rehearsalForm.endTime" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">{{ t('manager.users.rehearsal.comments') }}</label>
              <input class="form-input" v-model="rehearsalForm.comments" />
            </div>
            <div v-if="rehearsalFormError" class="error-banner">⚠️ {{ rehearsalFormError }}</div>
            <div class="rehearsal-form-actions">
              <button class="btn btn-secondary btn-sm" :disabled="savingRehearsal" @click="rehearsalFormOpen = false">
                {{ t('common.cancel') }}
              </button>
              <div style="flex:1"></div>
              <button class="btn btn-primary btn-sm" :disabled="savingRehearsal" @click="saveRehearsal">
                <InlineSpinner v-if="savingRehearsal" />
                <span v-else>{{ t('manager.users.rehearsal.save') }}</span>
              </button>
            </div>
          </div>
        </div>

        <div v-if="formError" class="error-banner">⚠️ {{ formError }}</div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="userModal = false">{{ t('common.cancel') }}</button>
          <button class="btn btn-primary" :disabled="saving" @click="saveUser">
            <InlineSpinner v-if="saving" />
            <span v-else>{{ editingUser ? t('common.save') : t('manager.users.create') }}</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ImportUsersResult, useManagerUserApi } from '../composables/useManagerUserApi'
import { extractErrorMessage } from '../utiles/error.utiles'
import InlineSpinner from './InlineSpinner.vue'
import { RoleType } from '../enums/roles.enum'
import { BookingTypeEnum } from '../enums/booking.enum'
import { CountryCode, GenderEnum, LanguageEnum, TshirtEnum, FilterActiveEnum } from '../enums/user.enum'
import type { ManagerUserDto } from '../types/manager-user.types'
import { useUserRehearsalApi, type ImportUserRehearsalsResult } from '../composables/useUserRehearsalApi'
const { t } = useI18n()
const userApi = useManagerUserApi()
const userRehearsalApi = useUserRehearsalApi()

// ── User import ────────────────────────────────────────────────────────
const userFileInput = ref<HTMLInputElement | null>(null)
const importingUsers = ref(false)
const userImportResult = ref<ImportUsersResult | null>(null)
const sendWelcomeEmail = ref(false)

async function onUserFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  importingUsers.value = true
  userImportResult.value = null
  pageError.value = ''
  try {
    userImportResult.value = await userApi.importFromExcel(file, sendWelcomeEmail.value)
    await reload()
  } catch (e) {
    pageError.value = extractErrorMessage(e)
  } finally {
    importingUsers.value = false
    input.value = ''
  }
}

const roleOptions = Object.values(RoleType)
const bookingTypeOptions = Object.values(BookingTypeEnum)
const countryOptions = Object.values(CountryCode)
const genderOptions = Object.values(GenderEnum)
const tshirtOptions = Object.values(TshirtEnum)
const languageOptions = Object.values(LanguageEnum)

const users = ref<ManagerUserDto[]>([])
const loading = ref(false)
const pageError = ref('')

const page = ref(1)
const limit = 20
const totalPages = ref(1)
const textFilter = ref('')
const activeFilter = ref<FilterActiveEnum | undefined>(undefined)
const roleFilter = ref<RoleType | undefined>(undefined)
const countryFilter = ref<CountryCode | undefined>(undefined)
const bookingTypeFilter = ref<BookingTypeEnum[]>([])
const bookingTypeExactFilter = ref<BookingTypeEnum[]>([])
const showBookingTypeFilters = ref(false)
onMounted(() => {
  reload()
})

async function reload() {
  loading.value = true
  try {
    const data = await userApi.getUsers({
      page: page.value,
      limit,
      textFilter: textFilter.value || undefined,
      active: activeFilter.value,
      roleType: roleFilter.value ? [roleFilter.value] : undefined,
      countryCode: countryFilter.value ? [countryFilter.value] : undefined,
      bookingTypeEnum: bookingTypeFilter.value.length > 0 ? bookingTypeFilter.value : undefined,
      bookingTypeEnumExact: bookingTypeExactFilter.value.length > 0 ? bookingTypeExactFilter.value : undefined,
    })
    users.value = data?.data ?? []
    totalPages.value = data?.metadata?.totalPages ?? 1
  } catch (e) {
    pageError.value = extractErrorMessage(e)
  } finally {
    loading.value = false
  }
}

let debounceTimer: ReturnType<typeof setTimeout> | undefined
function debouncedReload() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    page.value = 1
    reload()
  }, 350)
}

function goToPage(p: number) {
  page.value = p
  reload()
}

// ── Activate/deactivate ────────────────────────────────────────────────
const togglingUserId = ref<string | null>(null)

async function toggleActive(u: ManagerUserDto) {
  const nextActive = !u.active
  togglingUserId.value = u.id
  try {
    await userApi.updateUserActiveByEmail(u.email, nextActive)
    u.active = nextActive
  } catch (e) {
    pageError.value = extractErrorMessage(e)
  } finally {
    togglingUserId.value = null
  }
}

// ── Create/Edit modal ──────────────────────────────────────────────────
const userModal = ref(false)
const editingUser = ref<ManagerUserDto | null>(null)
const saving = ref(false)
const formError = ref('')

interface FormState {
  firstnames: string
  surnames: string
  email: string
  folderCode: string
  phoneCode: string
  phoneNumber: string
  countryCode: CountryCode
  language: LanguageEnum
  birthdate: string
  gender: GenderEnum
  tshirtEnum: TshirtEnum
  role: RoleType
  bookingTypeEnum: BookingTypeEnum[]
  addressLine: string
  locality: string
  addressCountry: string
  zipCode: string
  gdpr: boolean
}

function blankForm(): FormState {
  return {
    firstnames: '', surnames: '', email: '', folderCode: '',
    phoneCode: '', phoneNumber: '',
    countryCode: CountryCode.AD, language: LanguageEnum.English,
    birthdate: '', gender: GenderEnum.OTHER, tshirtEnum: TshirtEnum.M,
    role: RoleType.Contestant, bookingTypeEnum: [],
    addressLine: '', locality: '', addressCountry: '', zipCode: '',
    gdpr: false,
  }
}

const form = ref<FormState>(blankForm())

function openCreateModal() {
  editingUser.value = null
  form.value = blankForm()
  formError.value = ''
  userModal.value = true
}

function openEditModal(u: ManagerUserDto) {
  editingUser.value = u
  form.value = {
    firstnames: u.firstnames,
    surnames: u.surnames,
    email: u.email,
    folderCode: u.folderCode ?? '',
    phoneCode: u.phoneCode ?? '',
    phoneNumber: u.phoneNumber ?? '',
    countryCode: u.countryCode,
    language: u.language,
    birthdate: u.birthdate ? u.birthdate.substring(0, 10) : '',
    gender: u.gender ?? GenderEnum.OTHER,
    tshirtEnum: u.tshirtEnum ?? TshirtEnum.M,
    role: u.roles[0] ?? RoleType.Contestant,
    bookingTypeEnum: [...(u.bookingTypeEnum ?? [])],
    addressLine: u.address?.address ?? '',
    locality: u.address?.locality ?? '',
    addressCountry: u.address?.country ?? '',
    zipCode: u.address?.zipCode ?? '',
    gdpr: u.gdpr ?? false,
  }
  formError.value = ''
  rehearsalFormOpen.value = false
  editingRehearsalCategory.value = null
  rehearsalFormError.value = ''
  userModal.value = true

}
// ── Rehearsal edit (a student can now have several — one per category) ──
import { computed } from 'vue'
import { UserRehearsalInfo } from '../types/user.types'

const savingRehearsal = ref(false)
const rehearsalFormError = ref('')
const rehearsalFormOpen = ref(false)
// null while adding a new one; set to the category being edited when
// editing an existing row (locks the category dropdown, since category
// is part of the record's identity and can't be changed in place).
const editingRehearsalCategory = ref<BookingTypeEnum | null>(null)

function blankRehearsalForm() {
  return {
    category: '' as BookingTypeEnum | '',
    artistEmail: '',
    artistFullName: '',
    roomNumber: undefined as number | undefined,
    day: undefined as number | undefined,
    startTime: '',
    endTime: '',
    comments: '',
  }
}
const rehearsalForm = ref(blankRehearsalForm())

// Only categories the user actually holds, and that don't already have
// a rehearsal — a rehearsal's category isn't a free choice, it has to
// correspond to one of this student's own BookingTypeEnum tags.
const availableRehearsalCategories = computed(() => {
  const existing = new Set((editingUser.value?.rehearsals ?? []).map(r => r.category))
  return (editingUser.value?.bookingTypeEnum ?? []).filter(bt => !existing.has(bt))
})

function startAddRehearsal() {
  editingRehearsalCategory.value = null
  rehearsalForm.value = blankRehearsalForm()
  rehearsalFormError.value = ''
  rehearsalFormOpen.value = true
}

function startEditRehearsal(r: UserRehearsalInfo) {
  editingRehearsalCategory.value = r.category
  rehearsalForm.value = {
    category: r.category,
    artistEmail: r.artistEmail ?? '',
    artistFullName: r.artistFullName ?? '',
    roomNumber: r.roomNumber,
    day: r.day,
    startTime: r.startTime,
    endTime: r.endTime,
    comments: r.comments ?? '',
  }
  rehearsalFormError.value = ''
  rehearsalFormOpen.value = true
}

async function saveRehearsal() {
  const user = editingUser.value
  if (!user) return
  if (!rehearsalForm.value.category) {
    rehearsalFormError.value = t('manager.rehearsals.validation.studentRequired')
    return
  }
  if (rehearsalForm.value.roomNumber === undefined || rehearsalForm.value.day === undefined || !rehearsalForm.value.startTime || !rehearsalForm.value.endTime) {
    rehearsalFormError.value = t('manager.users.rehearsal.validation.required')
    return
  }
  rehearsalFormError.value = ''
  savingRehearsal.value = true
  try {
    const payload = {
      artistEmail: rehearsalForm.value.artistEmail || undefined,
      artistFullName: rehearsalForm.value.artistFullName || undefined,
      roomNumber: rehearsalForm.value.roomNumber,
      day: rehearsalForm.value.day,
      startTime: rehearsalForm.value.startTime,
      endTime: rehearsalForm.value.endTime,
      comments: rehearsalForm.value.comments || undefined,
    }
    const category = rehearsalForm.value.category as BookingTypeEnum

    if (editingRehearsalCategory.value) {
      await userRehearsalApi.updateRehearsal(user.id, category, payload)
    } else {
      await userRehearsalApi.createRehearsal(user.id, category, payload)
    }

    // Keep the local list in sync so re-opening this modal shows the
    // fresh data without a full page reload.
    const savedInfo: UserRehearsalInfo = { category, ...payload, artistEmail: payload.artistEmail ?? '', artistFullName: payload.artistFullName ?? '' }
    const others = user.rehearsals.filter(r => r.category !== category)
    user.rehearsals = [...others, savedInfo]
    const idx = users.value.findIndex(u => u.id === user.id)
    if (idx !== -1) users.value[idx].rehearsals = user.rehearsals

    rehearsalFormOpen.value = false
  } catch (e) {
    rehearsalFormError.value = extractErrorMessage(e)
  } finally {
    savingRehearsal.value = false
  }
}

async function removeRehearsal(category: BookingTypeEnum) {
  const user = editingUser.value
  if (!user || !confirm(t('manager.rehearsals.deleteConfirm'))) return
  savingRehearsal.value = true
  try {
    await userRehearsalApi.deleteRehearsal(user.id, category)
    user.rehearsals = user.rehearsals.filter(r => r.category !== category)
    const idx = users.value.findIndex(u => u.id === user.id)
    if (idx !== -1) users.value[idx].rehearsals = user.rehearsals
  } catch (e) {
    pageError.value = extractErrorMessage(e)
  } finally {
    savingRehearsal.value = false
  }
}



async function saveUser() {
  formError.value = ''
  saving.value = true
  try {
    const addressPayload = (form.value.addressLine || form.value.locality || form.value.addressCountry || form.value.zipCode)
      ? {
        address: form.value.addressLine || null,
        locality: form.value.locality || null,
        country: form.value.addressCountry || null,
        zipCode: form.value.zipCode || null,
      }
      : undefined

    if (editingUser.value) {
      const updated = await userApi.updateUser(editingUser.value.id, {
        firstnames: form.value.firstnames,
        surnames: form.value.surnames,
        folderCode: form.value.folderCode || undefined,
        phoneCode: form.value.phoneCode || undefined,
        phoneNumber: form.value.phoneNumber || undefined,
        countryCode: form.value.countryCode,
        language: form.value.language,
        birthdate: form.value.birthdate || undefined,
        gender: form.value.gender,
        tshirtEnum: form.value.tshirtEnum,
        bookingTypeEnum: form.value.bookingTypeEnum,
        address: addressPayload,
      })
      const idx = users.value.findIndex(u => u.id === editingUser.value!.id)
      // PATCH /users/:id has no concept of rehearsals at all (separate
      // collection/endpoints) — its response never includes that field,
      // so a plain overwrite here would silently wipe out whatever
      // rehearsal data the earlier create/update calls (or the
      // original page load) had already set locally.
      if (idx !== -1) users.value[idx] = { ...updated, rehearsals: users.value[idx].rehearsals }

    } else {
      await userApi.createUser({
        firstnames: form.value.firstnames,
        surnames: form.value.surnames,
        email: form.value.email,
        folderCode: form.value.folderCode || undefined,
        phoneCode: form.value.phoneCode,
        phoneNumber: form.value.phoneNumber || undefined,
        countryCode: form.value.countryCode,
        language: form.value.language,
        birthdate: form.value.birthdate,
        gender: form.value.gender,
        tshirtEnum: form.value.tshirtEnum,
        role: form.value.role,
        bookingTypeEnum: form.value.bookingTypeEnum,
        address: addressPayload,
        gdpr: form.value.gdpr,
      })
      await reload()
    }
    userModal.value = false
  } catch (e) {
    formError.value = extractErrorMessage(e)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.modal-wide {
  max-width: 720px;
  width: 90vw;
}

.clickable-row {
  cursor: pointer;
}

.clickable-row:hover {
  background: var(--sage-light, rgba(0, 0, 0, 0.03));
}

.users-table-card {
  overflow: visible;
}

.table-scroll {
  overflow-x: auto;
}

.filter-select {
  max-width: 200px;
}

.bt-tag {
  font-size: .68rem;
  padding: .15rem .5rem;
  margin-right: .3rem;
}

.pagination-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.25rem;
}

.pagination-label {
  font-size: .82rem;
  font-weight: 700;
  color: var(--muted);
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

.rehearsal-section {
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1.5px solid var(--border);
}

.rehearsal-form-actions {
  display: flex;
  align-items: center;
  gap: .6rem;
  margin-top: .5rem;
}

.rehearsal-list {
  display: flex;
  flex-direction: column;
  gap: .5rem;
  margin-bottom: .75rem;
}

.rehearsal-list-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: .6rem .8rem;
  border: 1.5px solid var(--border);
  border-radius: 8px;
  font-size: .85rem;
}

.rehearsal-form {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1.5px dashed var(--border);
}

.import-result-card {
  padding: 1rem 1.25rem;
  margin-bottom: 1.25rem;
}

.import-errors {
  margin: .75rem 0;
  padding-left: 1.25rem;
  font-size: .85rem;
  color: var(--red, #c00);
}

.filter-panels-row {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
}

.filter-panel {
  min-width: 220px;
}

.filter-panel-label {
  display: block;
  font-size: .75rem;
  font-weight: 800;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: .05em;
  margin-bottom: .5rem;
}
</style>