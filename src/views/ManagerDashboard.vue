<template>
  <div class="page">
    <aside class="sidebar">
      <a href="https://www.andorrasaxfest.com/" target="_blank" rel="noopener" class="sidebar-logo"
        :title="t('common.visitOfficialSite')">
        <img :src="logoUrl" alt="Andorra Sax Fest" class="sidebar-logo-image" />
        <div>
          <div class="logo-text">SaxFest</div>
          <div class="logo-sub">{{ t('manager.panel') }}</div>
        </div>
      </a>

      <span class="nav-section-label">{{ t('manager.manage') }}</span>
      <div class="nav-item" :class="{ active: view === 'users' }" @click="view = 'users'">
        <span class="nav-icon">👥</span> {{ t('manager.nav.users') }}
      </div>
      <div class="nav-item" :class="{ active: view === 'festivalEvents' }" @click="view = 'festivalEvents'">
        <span class="nav-icon">📅</span> {{ t('manager.nav.festivalEvents') }}
      </div>
      <div class="nav-item" :class="{ active: view === 'eventStyles' }" @click="view = 'eventStyles'">
        <span class="nav-icon">🎨</span> {{ t('manager.nav.eventStyles') }}
      </div>
      <div class="nav-item" :class="{ active: view === 'activities' }" @click="view = 'activities'">
        <span class="nav-icon">🎓</span> {{ t('manager.nav.activities') }}
      </div>
      <div class="nav-item" :class="{ active: view === 'purchases' }" @click="view = 'purchases'">
        <span class="nav-icon">🎫</span> {{ t('manager.nav.purchases') }}
      </div>
      <div class="nav-item" :class="{ active: view === 'scheduleGen' }" @click="view = 'scheduleGen'">
        <span class="nav-icon">📄</span> {{ t('manager.nav.scheduleGen') }}
      </div>
      <div class="nav-item" :class="{ active: view === 'bookingLimits' }" @click="view = 'bookingLimits'">
        <span class="nav-icon">⚖️</span> {{ t('manager.nav.bookingLimits') }}
      </div>
      <span class="nav-section-label">{{ t('manager.nav.bookingSection') }}</span>
      <div class="nav-item" @click="router.push('/staff')">
        <span class="nav-icon">🏠</span> {{ t('manager.nav.bookingOversight') }}
      </div>

      <!-- Future sections: masterclass purchases, role management —
           not built yet, left out deliberately rather than added as
           non-functional stubs. -->

      <div class="sidebar-footer">
        <button class="btn btn-secondary btn-sm" style="width:100%; justify-content:center;" @click="logout">
          {{ t('auth.logout') }}
        </button>
      </div>
    </aside>

    <main class="main">
      <ManagerUsersView v-if="view === 'users'" />
      <ManagerFestivalEventsView v-if="view === 'festivalEvents'" />
      <ManagerEventStylesView v-if="view === 'eventStyles'" />
      <ManagerActivitiesView v-if="view === 'activities'" />
      <ManagerMasterclassPurchasesView v-if="view === 'purchases'" />
      <ManagerScheduleGenerationView v-if="view === 'scheduleGen'" />
      <ManagerBookingLimitsView v-if="view === 'bookingLimits'" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'
import { useSessionApi } from '../composables/useSessionApi'
import ManagerUsersView from '../components/ManagerUsersView.vue'
import ManagerFestivalEventsView from '../components/ManagerFestivalEventsView.vue'
import ManagerEventStylesView from '../components/ManagerEventStylesView.vue'
import ManagerActivitiesView from '../components/ManagerActivitiesView.vue'
import ManagerMasterclassPurchasesView from '../components/ManagerMasterclassPurchasesView.vue'
import ManagerScheduleGenerationView from '../components/ManagerScheduleGenerationView.vue'
import ManagerBookingLimitsView from '../components/ManagerBookingLimitsView.vue'
import logoUrl from '../assets/logo.jpg'

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const sessionApi = useSessionApi()

type ViewName = 'users' | 'festivalEvents' | 'eventStyles' | 'activities' | 'scheduleGen' | 'bookingLimits' | 'purchases'
const view = ref<ViewName>('users')

async function logout() {
  try { await sessionApi.logout() } finally {
    auth.clear()
    router.push('/login')
  }
}
</script>