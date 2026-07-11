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

      <h1 class="login-heading">Welcome back<span class="accent">.</span></h1>
      <p class="login-sub">Sign in to your account.</p>

      <div class="form-group">
        <label class="form-label">Email</label>
        <input class="form-input" type="email" v-model="email" placeholder="you@university.edu" @keydown.enter="login" />
      </div>
      <div class="form-group" style="margin-bottom: 1.75rem">
        <label class="form-label">Password</label>
        <input class="form-input" type="password" v-model="password" placeholder="••••••••" @keydown.enter="login" />
      </div>

      <div v-if="error" class="error-banner">⚠️ {{ error }}</div>

      <button class="btn btn-primary" style="width:100%; justify-content:center; padding:.85rem;" :disabled="loading" @click="login">
        {{ loading ? 'Signing in…' : 'Sign in →' }}
      </button>
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

import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../stores/auth.store';
import { useUserProfileStore } from '../stores/user-profile.store';
import { useSessionApi } from '../composables/useSessionApi';

const { t }       = useI18n()
const router      = useRouter()
const api         = useSessionApi()
const auth        = useAuthStore()
const userProfile = useUserProfileStore()

const email    = ref('')
const password = ref('')
const loading  = ref(false)
const error    = ref('')

async function login() {
  error.value = ''
  if (!email.value || !password.value) {
    error.value = t('auth.login.error.empty')
    return
  }
  loading.value = true
  try {
    const session = await api.login(email.value, password.value)
    auth.setSession(session)

    // Fetch full user profile so we know bookingTypeEnum, etc.
    await userProfile.fetch(session.userId)

    router.push(auth.isStaff ? '/staff' : '/user')
  } catch (e: any) {
    error.value = e.message ?? t('auth.login.error.failed')
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
  display: flex; align-items: center; gap: .9rem; margin-bottom: 3rem;
}
.login-logo .logo-icon {
  width: 46px; height: 46px;
  background: var(--gold-100);
  border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.4rem;
}
.logo-name { font-family: var(--font-display); font-size: 1.3rem; }
.logo-tagline { font-size: .72rem; color: var(--muted); font-weight: 700; letter-spacing: .05em; text-transform: uppercase; }

.login-heading { font-family: var(--font-display); font-size: 2.4rem; margin-bottom: .3rem; }
.accent { color: var(--amber); }
.login-sub { color: var(--muted); font-weight: 600; margin-bottom: 2rem; }

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
.art-blob { position: absolute; border-radius: 50%; opacity: .55; }
.blob1 { width: 420px; height: 420px; background: var(--amber); top: -100px; right: -100px; }
.blob2 { width: 320px; height: 320px; background: var(--gold);  bottom: 0px;  left: -60px;  opacity: .45; }
.blob3 { width: 220px; height: 220px; background: var(--red);   top: 38%; right: 40px;    opacity: .5; }
.art-text { position: relative; z-index: 1; }
.art-quote { font-family: var(--font-display); font-size: 1.8rem; color: var(--white); font-style: italic; line-height: 1.3; max-width: 320px; }
.art-rooms { margin-top: .75rem; font-size: .85rem; color: rgba(255,255,255,.6); font-weight: 700; }

@media (max-width: 768px) {
  .login-page { grid-template-columns: 1fr; }
  .login-art { display: none; }
  .login-card { padding: 2rem 1.5rem; }
}
</style>
