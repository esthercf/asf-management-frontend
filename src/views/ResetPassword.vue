<template>
  <div class="reset-page">
    <div class="reset-card">
      <h1 class="reset-heading">{{ t('auth.reset.heading') }}</h1>
      <p class="reset-sub">{{ t('auth.reset.sub') }}</p>

      <!-- New password with suggest button -->
      <FieldPassword name="password"
                     v-model="passwordValue"
                     :label="t('auth.reset.newPassword')">
        <template #actions>
          <Button icon="pi pi-refresh"
                  text rounded type="button"
                  @click="suggestPassword()" />
        </template>
      </FieldPassword>

      <!-- Confirm password -->
      <FieldPassword name="confirmPassword"
                     v-model="confirmPasswordValue"
                     :label="t('auth.reset.confirmPassword')" />

      <div v-if="error" class="error-banner">⚠️ {{ error }}</div>
      <div v-if="success" class="success-banner">✅ {{ success }}</div>

      <button class="btn btn-primary"
              style="width:100%; justify-content:center; padding:.85rem;"
              :disabled="loading"
              @click="resetPassword">
        {{ loading ? t('auth.reset.submitting') : t('auth.reset.submit') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { usePasswordApi } from '../composables/useSessionApi'
import { extractErrorMessage } from '../utiles/error.utiles'
import { forceBrowserInputChange, generateStrongPassword } from '../utiles/generateStrongPassword'
import FieldPassword from '../components/FieldPassword.vue'
import { i18n } from '../i18n'

const { t } = i18n.global
const passwordApi = usePasswordApi()

const passwordValue = ref('')
const confirmPasswordValue = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')

async function suggestPassword() {
  const newPass = generateStrongPassword()
  passwordValue.value = newPass
  confirmPasswordValue.value = newPass

  await nextTick()
  forceBrowserInputChange('input[name="password"]', newPass)
  forceBrowserInputChange('input[name="confirmPassword"]', newPass)
}

async function resetPassword() {
  error.value = ''
  success.value = ''

  if (!passwordValue.value || !confirmPasswordValue.value) {
    error.value = t('auth.reset.missingFileds')
    return
  }
  if (passwordValue.value !== confirmPasswordValue.value) {
    error.value = t('auth.reset.mismatch')
    return
  }

  loading.value = true
  try {
    await passwordApi.updateAuthenticated(passwordValue.value) // authenticated reset, no token
    success.value = t('auth.reset.success')
  } catch (e: any) {
    error.value = extractErrorMessage(e)
  } finally {
    loading.value = false
  }
}
</script>