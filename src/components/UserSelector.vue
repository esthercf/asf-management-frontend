<template>
  <div class="user-selector">
    <label v-if="label" class="form-label">{{ label }}</label>

    <!-- Selected user chip -->
    <div v-if="selectedUser" class="selected-chip">
      <div class="avatar avatar-sage" style="width:28px; height:28px; font-size:.7rem;">
        {{ initials }}
      </div>
      <div class="selected-info">
        <div class="selected-name">{{ selectedUser.firstnames }} {{ selectedUser.surnames }}</div>
        <div class="selected-email">{{ selectedUser.email }}</div>
      </div>
      <button class="clear-btn" type="button" @click="clearSelection" :aria-label="t('common.cancel')">✕</button>
    </div>

    <!-- Search input -->
    <div v-else class="search-wrap">
      <input
        class="form-input"
        type="text"
        v-model="query"
        :placeholder="placeholder ?? t('booking.fields.room')"
        @focus="showResults = true"
        @blur="onBlur"
      />
      <div v-if="showResults && (loading || results.length > 0 || query.length >= MIN_CHARS)" class="results-dropdown">
        <div v-if="loading" class="result-row result-loading">{{ t('common.loading') }}</div>
        <template v-else>
          <button
            v-for="u in results"
            :key="u.id"
            type="button"
            class="result-row"
            @mousedown.prevent="selectUser(u)"
          >
            <div class="avatar avatar-sage" style="width:26px; height:26px; font-size:.65rem;">
              {{ (u.firstnames[0] ?? '') + (u.surnames[0] ?? '') }}
            </div>
            <div class="result-info">
              <div class="result-name">{{ u.firstnames }} {{ u.surnames }}</div>
              <div class="result-email">{{ u.email }}</div>
            </div>
          </button>
          <div v-if="!loading && results.length === 0 && query.length >= MIN_CHARS" class="result-row result-empty">
            {{ t('common.search') }}: {{ t('room.empty') }}
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBookingApi } from '../composables/useBookingApi';
import { UserDto } from '../types/user.types';

const props = defineProps<{
  modelValue?: UserDto | null
  label?:      string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [UserDto | null]
}>()

const { t } = useI18n()
const api = useBookingApi()

const MIN_CHARS = 2
const DEBOUNCE_MS = 300

const query        = ref('')
const results       = ref<UserDto[]>([])
const loading       = ref(false)
const showResults   = ref(false)
const selectedUser  = ref<UserDto | null>(props.modelValue ?? null)

let debounceTimer: ReturnType<typeof setTimeout> | undefined

watch(query, (value) => {
  if (debounceTimer) clearTimeout(debounceTimer)

  if (value.trim().length < MIN_CHARS) {
    results.value = []
    return
  }

  debounceTimer = setTimeout(async () => {
    loading.value = true
    try {
      const data = await api.getUsers({ page: 1, limit: 10, textFilter: value.trim() })
      results.value = data?.data ?? []
    } catch {
      results.value = []
    } finally {
      loading.value = false
    }
  }, DEBOUNCE_MS)
})

function selectUser(user: UserDto) {
  selectedUser.value = user
  query.value = ''
  results.value = []
  showResults.value = false
  emit('update:modelValue', user)
}

function clearSelection() {
  selectedUser.value = null
  emit('update:modelValue', null)
}

function onBlur() {
  // small delay so a click on a result row (mousedown) registers before blur hides the dropdown
  setTimeout(() => { showResults.value = false }, 100)
}

const initials = computed(() => {
  if (!selectedUser.value) return ''
  return ((selectedUser.value.firstnames[0] ?? '') + (selectedUser.value.surnames[0] ?? '')).toUpperCase()
})
</script>

<style scoped>
.user-selector { position: relative; }

.search-wrap { position: relative; }

.results-dropdown {
  position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 50;
  background: var(--white); border: 1.5px solid var(--border); border-radius: var(--radius-md, 8px);
  box-shadow: var(--shadow-md, 0 4px 16px rgba(0,0,0,.1));
  max-height: 260px; overflow-y: auto;
}

.result-row {
  display: flex; align-items: center; gap: .6rem;
  width: 100%; padding: .6rem .8rem; border: none; background: none;
  cursor: pointer; text-align: left; font-family: var(--font-body);
  transition: background .12s ease;
}
.result-row:hover { background: var(--gold-100, #f6efe0); }
.result-loading, .result-empty {
  cursor: default; color: var(--muted); font-size: .82rem; font-weight: 600;
}
.result-loading:hover, .result-empty:hover { background: none; }

.result-info { display: flex; flex-direction: column; gap: .1rem; min-width: 0; }
.result-name  { font-weight: 700; font-size: .85rem; color: var(--ink); }
.result-email { font-size: .75rem; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.selected-chip {
  display: flex; align-items: center; gap: .6rem;
  border: 1.5px solid var(--border); border-radius: var(--radius-md, 8px);
  padding: .55rem .8rem;
}
.selected-info { flex: 1; min-width: 0; }
.selected-name  { font-weight: 700; font-size: .85rem; color: var(--ink); }
.selected-email { font-size: .75rem; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.clear-btn {
  border: none; background: none; cursor: pointer;
  color: var(--muted); font-size: .9rem; font-weight: 700;
  padding: .2rem .4rem; border-radius: 4px; transition: var(--transition);
}
.clear-btn:hover { background: var(--red-light, #fee); color: var(--red, #c00); }
</style>