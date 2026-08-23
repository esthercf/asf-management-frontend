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
        <input class="form-input" :class="{ 'has-error': fieldErrors.email }" type="email" v-model="email"
          placeholder="you@university.edu" @keydown.enter="login" />
        <span v-if="fieldErrors.email" class="field-error">{{ fieldErrors.email }}</span>

      </div>
      <div class="form-group" style="margin-bottom: .6rem">
        <label class="form-label">Password</label>
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
          {{ t('auth.login.submit') }} →
        </template>
      </button>

    </div>

    <div class="login-art">
      <div class="art-blob blob1"></div>
      <div class="art-blob blob2"></div>
      <div class="art-blob blob3"></div>
      <a :href="promoHref" target="_blank" rel="noopener sponsored" class="promo-card">
        <div class="promo-slides">
          <div v-for="(slide, i) in promoSlides" :key="i" class="promo-slide" :class="{ active: i === activeSlide }"
            :style="{ backgroundImage: `url(${slide.image})` }" />
          <div class="promo-scrim"></div>
        </div>

        <div class="promo-content">
          <span class="promo-eyebrow">Sponsored</span>
          <div class="promo-brand">
            <img :src="promoLogo" alt="" class="promo-logo" />
            <span class="promo-wordmark">{{ promoTitle }}</span>
          </div>
          <p class="promo-text">{{ promoSlides[activeSlide].text }}</p>
          <span class="promo-link">{{ promoLinkText }}</span>

          <div class="promo-dots" @click.prevent>
            <button v-for="(slide, i) in promoSlides" :key="i" class="promo-dot" :class="{ active: i === activeSlide }"
              :aria-label="`Show slide ${i + 1}`" @click="activeSlide = i" />
          </div>
        </div>
      </a>
      <div class="art-text">
        <p class="art-quote">
          "Prepare with focus, perform with brilliance."</p>
        <p class="art-rooms">Book your study room in seconds</p>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">

import { onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../stores/auth.store';
import { useUserProfileStore } from '../stores/user-profile.store';
import { loginSchema } from '../validation/login.schema';
import { zodErrorsToFieldMap } from '../utiles/zod.utiles';
import { useSessionApi } from '../composables/useSessionApi';
import InlineSpinner from '../components/InlineSpinner.vue';

const { t } = useI18n()
const promoSlides = [
  {
    image: 'https://adlibitumclass.com/storage/homepage_images/home-en-1201.jpg',
    text: 'Video masterclasses from the world\'s top saxophonists.',
  },
  {
    image: 'https://adlibitumclass.com/storage/teachers_middle/kbSUTyLxuja3JCO8KG99qmekyrRlhwyaxd8xEncX.jpg',
    text: 'Featuring David Salleras — and more names you already know.',
  },
  {
    image: 'https://adlibitumclass.com/storage/teachers/ZMQJBagJezIfZ9BjLsGLzlrrWvg4yatSrKc5TfW7.jpg',
    text: 'Watch, learn, and revisit lessons anytime.',
  },
  {
    image: 'https://adlibitumclass.com/storage/teachers/tRaLZMruycGBnKsxxOLpLiyGBNytB5ez3Jxjh1Sf.jpg',
    text: 'Capions and subtitles in 25 languages',
  },
  {
    image: 'https://adlibitumclass.com/storage/teachers/DnKZvVz2bYsrQiWs6cB2teUu5BcIKsQxHJ4Gxdtl.jpg',
    text: 'Choose your membership from 18€',
  },
  {
    image: 'https://adlibitumclass.com/storage/homepage_teachers/X8UL29maJAf4xPoj9grSlCHjgmrLs2XTaw7qQvpL.jpg',
    text: 'Average of 20 lessons per teacher',
  },
]


const promoTitle = 'AdlibitumClass'
const promoLinkText = 'Explore AdlibitumClass →'
const promoHref = 'https://adlibitumclass.com/'
const promoLogo = 'https://adlibitumclass.com/img/AD-logo-letters-200.png'

const activeSlide = ref(0)
let promoTimer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!prefersReducedMotion && promoSlides.length > 1) {
    promoTimer = setInterval(() => {
      activeSlide.value = (activeSlide.value + 1) % promoSlides.length
    }, 5000)
  }
})

onUnmounted(() => {
  if (promoTimer) clearInterval(promoTimer)
})
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

    // Fetch full user profile so we know bookingTypeEnum, etc.
    await userProfile.fetch(session.userId)

    router.push(auth.isStaff ? '/staff' : '/user')
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

.promo-card {
  position: absolute;
  top: 3rem;
  left: 3rem;
  right: 3rem;
  height: 480px;
  z-index: 1;
  border-radius: var(--radius-md);
  border-left: 4px solid var(--amber);
  overflow: hidden;
  text-decoration: none;
  display: block;
  box-shadow: 0 24px 60px rgba(0, 0, 0, .4);
  transition: transform .2s ease;
}

.promo-content {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 2.2rem 2.4rem;
}

.promo-eyebrow {
  display: block;
  font-size: .72rem;
  font-weight: 700;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: var(--amber);
  margin-bottom: .9rem;
}

.promo-brand {
  display: flex;
  align-items: center;
  gap: .7rem;
  margin-bottom: .8rem;
}

.promo-logo {
  height: 30px;
  width: auto;
  flex-shrink: 0;
  filter: brightness(0) invert(1);
}

.promo-wordmark {
  font-family: var(--font-display);
  font-size: 1.5rem;
  color: var(--white);
}

.promo-text {
  font-size: 1rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, .88);
  margin-bottom: 1.3rem;
  min-height: 3em;
  max-width: 85%;
}

.promo-link {
  font-size: .9rem;
  font-weight: 700;
  color: var(--amber);
}

.promo-dots {
  display: flex;
  gap: .5rem;
  margin-top: 1.3rem;
}

.promo-slides {
  position: absolute;
  inset: 0;
}

.promo-slide {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  opacity: 0;
  transition: opacity 1s ease;
}

.promo-slide.active {
  opacity: 1;
}

.promo-scrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(8, 16, 28, .25) 0%, rgba(8, 16, 28, .55) 55%, rgba(8, 16, 28, .92) 100%);
}

.promo-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, .35);
  cursor: pointer;
  padding: 0;
  transition: background .2s ease, transform .2s ease;
}

.promo-dot.active {
  background: var(--amber);
  transform: scale(1.4);
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

@media (max-width: 900px) {
  .promo-card {
    height: 360px;
  }
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