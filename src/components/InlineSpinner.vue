<template>
  <span class="inline-spinner">
    <span class="spinner"></span>
    <span class="spinner-text">{{ t(messageKey ?? 'common.loading') }}</span>
  </span>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps<{
  /** Optional translation key, defaults to common.loading */
  messageKey?: string
}>()
</script>

<style scoped>
.inline-spinner {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.spinner {
  width: 1em;
  height: 1em;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner-text {
  font-size: 0.9em;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>