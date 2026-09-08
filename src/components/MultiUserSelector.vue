<template>
  <div class="multi-user-selector">
    <label v-if="label" class="form-label">{{ label }}</label>

    <div class="user-checkbox-grid">
      <label v-for="u in options" :key="u.id" class="user-checkbox-row">
        <input type="checkbox" :value="u.id" :checked="modelValue.includes(u.id)" @change="onToggle(u.id)" />
        {{ u.firstnames }} {{ u.surnames }} ({{ u.email }})
      </label>
      <p v-if="options.length === 0" class="muted-text">{{ t('common.noResults') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UserBaseDto } from '../types/booking.types';
import { useI18n } from 'vue-i18n';

const { t } = useI18n()

const props = defineProps<{
  modelValue: string[]
  options: UserBaseDto[]
  label?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [string[]]
}>()

function onToggle(id: string) {
  const next = props.modelValue.includes(id)
    ? props.modelValue.filter(existing => existing !== id)
    : [...props.modelValue, id]
  emit('update:modelValue', next)
}
</script>

<style scoped>
.user-checkbox-grid {
  display: flex;
  flex-direction: column;
  gap: .5rem;
  max-height: 220px;
  overflow-y: auto;
  border: 1.5px solid var(--border);
  border-radius: 8px;
  padding: .75rem;
}

.user-checkbox-row {
  display: flex;
  align-items: center;
  gap: .5rem;
  font-size: .85rem;
  font-weight: 600;
  cursor: pointer;
}

.user-checkbox-row input {
  width: auto;
}

.muted-text {
  color: var(--muted);
  font-size: .82rem;
}
</style>