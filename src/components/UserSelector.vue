<template>
  <div class="user-selector">
    <label v-if="label" class="form-label">{{ label }}</label>

    <select class="form-input" :value="modelValue" @change="onChange">
      <option v-for="u in options" :key="u.id" :value="u.id">
        {{ u.firstnames }} {{ u.surnames }} ({{ u.email }})
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { UserBaseDto } from '../types/booking.types';


const props = defineProps<{
  modelValue: string | null
  options: UserBaseDto[]
  label?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [string | null]
}>()

function onChange(event: Event) {
  const target = event.target as HTMLSelectElement | null
  if (target) {
    emit('update:modelValue', target.value)
  }
}
</script>
