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

        <h3 class="section-title" style="font-size:.9rem; margin-top:1rem;">{{ t('manager.users.addressSection') }}</h3>
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
import { useManagerUserApi } from '../composables/useManagerUserApi'
import { extractErrorMessage } from '../utiles/error.utiles'
import InlineSpinner from './InlineSpinner.vue'
import { RoleType } from '../enums/roles.enum'
import { BookingTypeEnum } from '../enums/booking.enum'
import { CountryCode, GenderEnum, LanguageEnum, TshirtEnum, FilterActiveEnum } from '../enums/user.enum'
import type { ManagerUserDto } from '../types/manager-user.types'

const { t } = useI18n()
const userApi = useManagerUserApi()

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
  userModal.value = true
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
      if (idx !== -1) users.value[idx] = updated
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
</style>