<template>
  <div class="spinner-overlay">
    <div class="spinner"></div>
    <p class="spinner-text">{{ t(message ?? 'common.loading') }}</p>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
defineProps<{
  message?: string
}>()
</script>

<style scoped>
.spinner-overlay {
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--border);
  border-top-color: var(--navy);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner-text {
  margin-top: 1rem;
  font-size: 1rem;
  color: var(--ink);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
