<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-logo">
        <div class="logo-icon">📚</div>
        <div>
          <div class="logo-name">Room Booking</div>
          <div class="logo-tagline">Andorra Sax Fest Room Booking System</div>
        </div>
      </div>

      <template v-if="!linkValid">
        <h1 class="login-heading">{{ t('auth.resetPassword.invalidLink.heading') }}</h1>
        <p class="login-sub">{{ t('auth.resetPassword.invalidLink.message') }}</p>
        <router-link to="/forgot-password" class="btn btn-primary"
          style="width:100%; justify-content:center; padding:.85rem; text-decoration:none;">
          {{ t('auth.resetPassword.invalidLink.cta') }}
        </router-link>
      </template>

      <template v-else-if="!done">
        <h1 class="login-heading">{{ t('auth.resetPassword.heading') }}</h1>
        <p class="login-sub">{{ t('auth.resetPassword.sub') }}</p>

        <div class="form-group">
          <div class="field-label-row">
            <label class="form-label">{{ t('auth.resetPassword.newPassword') }}</label>
            <button type="button" class="generate-link" @click="suggestPassword">
              {{ t('auth.resetPassword.generate') }}
            </button>
          </div>
          <div class="password-field-wrapper">
            <input class="form-input" :type="showPassword ? 'text' : 'password'" v-model="password"
              placeholder="••••••••" @keydown.enter="submit" />
            <button type="button" class="toggle-visibility" @click="showPassword = !showPassword"
              :aria-label="showPassword ? 'Hide password' : 'Show password'">
              {{ showPassword ? '🙈' : '👁' }}
            </button>
          </div>
        </div>
        <div class="form-group" style="margin-bottom: 1.75rem">
          <label class="form-label">{{ t('auth.resetPassword.confirmPassword') }}</label>
          <div class="password-field-wrapper">
            <input class="form-input" :type="showConfirmPassword ? 'text' : 'password'" v-model="confirmPassword"
              placeholder="••••••••" @keydown.enter="submit" />
            <button type="button" class="toggle-visibility" @click="showConfirmPassword = !showConfirmPassword"
              :aria-label="showConfirmPassword ? 'Hide password' : 'Show password'">
              {{ showConfirmPassword ? '🙈' : '👁' }}
            </button>
          </div>
        </div>

        <div v-if="error" class="error-banner">⚠️ {{ error }}</div>

        <button class="btn btn-primary" style="width:100%; justify-content:center; padding:.85rem;"
          :disabled="loading" @click="submit">
          {{ loading ? t('auth.resetPassword.submitting') : t('auth.resetPassword.submit') }}
        </button>
      </template>

      <template v-else>
        <h1 class="login-heading">{{ t('auth.resetPassword.success.heading') }}</h1>
        <p class="login-sub">{{ t('auth.resetPassword.success.message') }}</p>
        <router-link to="/login" class="btn btn-primary"
          style="width:100%; justify-content:center; padding:.85rem; text-decoration:none;">
          {{ t('auth.resetPassword.goToLogin') }}
        </router-link>
      </template>
    </div>

    <div class="login-art">
      <div class="art-blob blob1"></div>
      <div class="art-blob blob2"></div>
      <div class="art-blob blob3"></div>
      <div class="art-text">
        <p class="art-quote">
          "Prepare with focus, perform with brilliance."</p>
        <p class="art-rooms">Book your study room in seconds</p>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { usePasswordApi } from '../composables/useSessionApi'
import { generateStrongPassword } from '../utiles/generateStrongPassword'
const { t } = useI18n()
const route = useRoute()
const api = usePasswordApi()

const token = ref('')
const email = ref('')
const linkValid = ref(true)

const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const loading = ref(false)
const error = ref('')
const done = ref(false)

onMounted(() => {
  const rawToken = route.query.t
  const rawEmail = route.query.u
  token.value = typeof rawToken === 'string' ? rawToken : ''
  email.value = typeof rawEmail === 'string' ? rawEmail : ''

  if (!token.value || !email.value) {
    linkValid.value = false
  }
})

// Mirrors the backend's strength rule (used there for non-local environments) —
// enforced here unconditionally so users always get clear, immediate feedback.
function validatePassword(pwd: string): string {
  if (!pwd) return t('common.validation.required')
  if (pwd.length < 8) return t('common.validation.passwordTooShort')
  if (!/[A-Z]/.test(pwd)) return t('common.validation.passwordNeedsUppercase')
  if (!/[a-z]/.test(pwd)) return t('common.validation.passwordNeedsLowercase')
  if (!/\d/.test(pwd)) return t('common.validation.passwordNeedsNumber')
  if (!/[@#$!%*?&]/.test(pwd)) return t('common.validation.passwordNeedsSpecial')
  return ''
}

function suggestPassword() {
  const generated = generateStrongPassword()
  password.value = generated
  confirmPassword.value = generated
  showPassword.value = true
  showConfirmPassword.value = true
  error.value = ''
}
async function submit() {
  error.value = ''

  const strengthError = validatePassword(password.value)
  if (strengthError) {
    error.value = strengthError
    return
  }
  if (password.value !== confirmPassword.value) {
    error.value = t('common.validation.passwordMismatch')
    return
  }

  loading.value = true
  try {
    await api.updateAnonymous(email.value, token.value, password.value)
    done.value = true
  } catch (e: any) {
    // Global axios interceptor already toasts backend error messages
    // (e.g. expired/invalid token, token already used).
    error.value = e?.message ?? t('common.error')
  } finally {
    loading.value = false
  }
}
</script>
<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 480px 1fr;
}

.login-card {
  background: var(--white);
  padding: 3rem 3.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-right: 1.5px solid var(--border);
}

.login-logo {
  display: flex;
  align-items: center;
  gap: .9rem;
  margin-bottom: 3rem;
}

.login-logo .logo-icon {
  width: 46px;
  height: 46px;
  background: var(--gold-100);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
}

.logo-name {
  font-family: var(--font-display);
  font-size: 1.3rem;
}

.logo-tagline {
  font-size: .72rem;
  color: var(--muted);
  font-weight: 700;
  letter-spacing: .05em;
  text-transform: uppercase;
}

.login-heading {
  font-family: var(--font-display);
  font-size: 2.4rem;
  margin-bottom: .3rem;
}

.login-sub {
  color: var(--muted);
  font-weight: 600;
  margin-bottom: 2rem;
}

.error-banner {
  background: var(--red-light);
  border: 1.5px solid var(--red);
  color: var(--red);
  border-radius: var(--radius-sm);
  padding: .7rem 1rem;
  font-size: .85rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

/* ── Art panel ─────── */
.login-art {
  position: relative;
  background: var(--navy-deep);
  overflow: hidden;
  display: flex;
  align-items: flex-end;
  padding: 3rem;
}

.art-blob {
  position: absolute;
  border-radius: 50%;
  opacity: .55;
}

.blob1 {
  width: 420px;
  height: 420px;
  background: var(--amber);
  top: -100px;
  right: -100px;
}

.blob2 {
  width: 320px;
  height: 320px;
  background: var(--gold);
  bottom: 0px;
  left: -60px;
  opacity: .45;
}

.blob3 {
  width: 220px;
  height: 220px;
  background: var(--red);
  top: 38%;
  right: 40px;
  opacity: .5;
}

.art-text {
  position: relative;
  z-index: 1;
}

.art-quote {
  font-family: var(--font-display);
  font-size: 1.8rem;
  color: var(--white);
  font-style: italic;
  line-height: 1.3;
  max-width: 320px;
}

.art-rooms {
  margin-top: .75rem;
  font-size: .85rem;
  color: rgba(255, 255, 255, .6);
  font-weight: 700;
}

.field-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.generate-link {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: var(--navy);
  font-weight: 700;
  font-size: .75rem;
  text-transform: uppercase;
  letter-spacing: .03em;
}

.generate-link:hover {
  text-decoration: underline;
}

.password-field-wrapper {
  position: relative;
}

.password-field-wrapper .form-input {
  padding-right: 2.6rem;
}

.toggle-visibility {
  position: absolute;
  right: .5rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.05rem;
  line-height: 1;
  padding: .25rem;
  opacity: .7;
}

.toggle-visibility:hover {
  opacity: 1;
}

@media (max-width: 768px) {
  .login-page {
    grid-template-columns: 1fr;
  }

  .login-art {
    display: none;
  }

  .login-card {
    padding: 2rem 1.5rem;
  }
}
</style>