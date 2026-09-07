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

      <template v-if="!sent">
        <h1 class="login-heading">{{ t('auth.forgotPassword.heading') }}</h1>
        <p class="login-sub">{{ t('auth.forgotPassword.sub') }}</p>

        <div class="form-group" style="margin-bottom: 1.75rem">
          <label class="form-label">{{ t('auth.forgotPassword.email') }}</label>
          <input class="form-input" :class="{ 'has-error': fieldErrors.email }" type="email" v-model="email"
            placeholder="you@university.edu" @keydown.enter="submit" /> <span v-if="fieldErrors.email"
            class="field-error">{{ fieldErrors.email }}</span>

        </div>

        <div v-if="error" class="error-banner">⚠️ {{ error }}</div>

        <button class="btn btn-primary" style="width:100%; justify-content:center; padding:.85rem;" :disabled="loading"
          @click="submit">
          {{ loading ? t('auth.forgotPassword.submitting') : t('auth.forgotPassword.submit') }}
        </button>
      </template>

      <template v-else>
        <h1 class="login-heading">{{ t('auth.forgotPassword.success.heading') }}</h1>
        <p class="login-sub">{{ t('auth.forgotPassword.success.message') }}</p>
      </template>

      <div class="back-link">
        <router-link to="/login">{{ t('auth.forgotPassword.backToLogin') }}</router-link>
      </div>
    </div>

    <div class="login-art">
      <div class="art-blob blob1"></div>
      <div class="art-blob blob2"></div>
      <div class="art-blob blob3"></div>
      <div class="art-text">
        <p class="art-quote">
          "{{ t('auth.login.artQuote') }}"</p>
        <p class="art-rooms">{{ t('auth.login.artAttribution') }}</p>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePasswordApi } from '../composables/useSessionApi'
import { forgotPasswordSchema } from '../validation/forgotPassword.schema'
import { zodErrorsToFieldMap } from '../utiles/zod.utiles'
const { t } = useI18n()
const api = usePasswordApi()

const email = ref('')
const loading = ref(false)
const error = ref('')
const fieldErrors = ref<Record<string, string>>({})
const sent = ref(false)

async function submit() {
  error.value = ''
  fieldErrors.value = {}

  const result = forgotPasswordSchema.safeParse({ email: email.value })
  if (!result.success) {
    fieldErrors.value = zodErrorsToFieldMap(result.error, t)
    return
  }

  loading.value = true
  try {
    await api.requestReset(email.value.trim().toLowerCase())
    // Always show the same success state, regardless of whether the email
    // matched an account — the backend's toast (if any) already surfaces
    // real errors like rate limiting; we don't want to leak account existence here.
    sent.value = true
  } catch (e: any) {
    // Global axios interceptor already toasts the real backend error
    // message for this — no local banner needed here, since setting one
    // unconditionally would just duplicate that toast every time rather
    // than serve as a genuine fallback.

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

.back-link {
  margin-top: 1.75rem;
  text-align: center;
}

.back-link a {
  color: var(--navy);
  font-weight: 700;
  font-size: .85rem;
  text-decoration: none;
}

.back-link a:hover {
  text-decoration: underline;
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
