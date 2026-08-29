<template>
  <div class="login-page">
    <div class="login-card">
      <a href="https://www.andorrasaxfest.com/" target="_blank" rel="noopener" class="login-logo"
        :title="t('common.visitOfficialSite')">
        <img :src="logoUrl" alt="Andorra Sax Fest" class="logo-image" />
        <div>
          <div class="logo-name">{{ t('manager.panel') }}</div>
          <div class="logo-tagline">{{ t('manager.loginTagline') }}</div>
        </div>
      </a>

      <h1 class="login-heading">{{ t('auth.login.heading') }}</h1>
      <p class="login-sub">{{ t('auth.login.sub') }}</p>

      <div class="form-group">
        <label class="form-label">{{ t('auth.login.email') }}</label>
        <input class="form-input" :class="{ 'has-error': fieldErrors.email }" type="email" v-model="email"
          placeholder="you@university.edu" @keydown.enter="login" />
        <span v-if="fieldErrors.email" class="field-error">{{ fieldErrors.email }}</span>

      </div>
      <div class="form-group" style="margin-bottom: .6rem">
        <label class="form-label">{{ t('auth.login.password') }}</label>
        <div class="password-input-wrap">
          <input class="form-input" :class="{ 'has-error': fieldErrors.password }"
            :type="showPassword ? 'text' : 'password'" v-model="password" placeholder="••••••••"
            @keydown.enter="login" />
          <button type="button" class="password-toggle" :aria-label="showPassword ? 'Hide password' : 'Show password'"
            @click="showPassword = !showPassword">
            {{ showPassword ? '🙈' : '👁' }}
          </button>
        </div>
        <span v-if="fieldErrors.password" class="field-error">{{ fieldErrors.password }}</span>
      </div>
      <div class="forgot-link">
        <router-link to="/forgot-password">{{ t('auth.login.forgot') }}</router-link>
      </div>
      <div v-if="error" class="error-banner">⚠️ {{ error }}</div>

      <button class="btn btn-primary" style="width:100%; justify-content:center; padding:.85rem;" :disabled="loading"
        @click="login">
        <InlineSpinner v-if="loading" />
        <template v-else>
          {{ t('auth.login.submit') }}
        </template>
      </button>

    </div>

    <div class="login-art">
      <div class="art-logo-wrap">
        <img :src="logoWordmarkUrl" alt="Andorra Sax Fest XIV" class="art-logo" />
      </div>
      <div class="art-text">
        <p class="art-quote">
          "{{ t('auth.login.artQuote') }}"</p>
        <p class="art-rooms">{{ t('auth.login.artAttribution') }}</p>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">

import { ref } from 'vue';
import { useRouter } from 'vue-router';
import logoUrl from '../assets/logo.jpg';
import logoWordmarkUrl from '../assets/Andorra-SaxFest-2027.png';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../stores/auth.store';
import { useUserProfileStore } from '../stores/user-profile.store';
import { loginSchema } from '../validation/login.schema';
import { zodErrorsToFieldMap } from '../utiles/zod.utiles';
import { useSessionApi } from '../composables/useSessionApi';
import InlineSpinner from '../components/InlineSpinner.vue';

const { t } = useI18n()

const router = useRouter()
const api = useSessionApi()
const auth = useAuthStore()
const userProfile = useUserProfileStore()
const fieldErrors = ref<Record<string, string>>({})
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')


async function login() {
  error.value = ''
  fieldErrors.value = {}

  const result = loginSchema.safeParse({ email: email.value, password: password.value })
  if (!result.success) {
    fieldErrors.value = zodErrorsToFieldMap(result.error, t)
    return
  }

  loading.value = true
  try {
    const session = await api.login(email.value, password.value)
    auth.setSession(session)

    // This frontend is Management-only — Staff, Contestants, and any
    // other role have nothing to do here at all (both /staff and
    // /manager require the same Root/Manager access). Reject clearly
    // rather than sending them to a dashboard they can't actually use.
    if (!auth.isManager) {
      await api.logout().catch(() => { })
      auth.clear()
      error.value = t('auth.login.error.noAccess')
      return
    }

    // Fetch full user profile so we know bookingTypeEnum, etc.
    await userProfile.fetch(session.userId)

    router.push('/manager')
  } catch (e: any) {
    const code = e?.response?.data?.code
    // Use i18n error code if available, otherwise fall back
    error.value = code && t(`errors.${code}`)
      ? t(`errors.${code}`)
      : t('auth.login.error.failed')
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
  transition: var(--transition);
}

.login-logo:hover {
  opacity: .85;
}

.login-logo .logo-image {
  width: 52px;
  height: 52px;
  object-fit: cover;
  border-radius: var(--radius-md);
  flex-shrink: 0;
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

.accent {
  color: var(--amber);
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

/* Centered logo, large, with a light backdrop so the black wordmark
   stays visible against this panel's dark background — same reasoning
   as the earlier promo-slide watermark, just applied to the whole
   panel now that the promo card itself is gone. */
.art-logo-wrap {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-width: 60%;
}

.art-logo {
  display: block;
  width: 80%;
  max-width: 480px;
  height: auto;
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

.password-input-wrap {
  position: relative;
}

.password-input-wrap .form-input {
  padding-right: 2.6rem;
}

.password-toggle {
  position: absolute;
  right: .6rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  line-height: 1;
  padding: .2rem;
  opacity: .7;
}

.password-toggle:hover {
  opacity: 1;
}

.forgot-link {
  text-align: right;
  margin-bottom: 1.5rem;
}

.forgot-link a {
  color: var(--navy);
  font-weight: 700;
  font-size: .8rem;
  text-decoration: none;
}

.forgot-link a:hover {
  text-decoration: underline;
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