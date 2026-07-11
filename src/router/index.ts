import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

import UserDashboard from '@/views/UserDashboard.vue'
import StaffDashboard from '@/views/StaffDashboard.vue'
import LoginPage from '@/views/LoginPage.vue'
import { STAFF_ROLES } from '../enums/roles.enum'
import { useAuthStore } from '../stores/auth.store'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/login' },
  {
    path: '/login',
    component: LoginPage,
    meta: { public: true },
  },
  {
    path: '/user',
    component: UserDashboard,
    meta: { requiresAuth: true, roles: [] }, // any authenticated user
  },
  {
    path: '/staff',
    component: StaffDashboard,
    meta: { requiresAuth: true, roles: STAFF_ROLES },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  // Public routes — always accessible
  if (to.meta.public) return true

  // Not authenticated — redirect to login
  if (!auth.isAuthenticated) {
    return { path: '/login' }
  }

  // Route requires specific roles — check them
  const requiredRoles = to.meta.roles as string[] | undefined
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRole = auth.roles.some(r => requiredRoles.includes(r))
    if (!hasRole) {
      // Authenticated but wrong role — send to their correct dashboard
      return auth.isStaff ? { path: '/staff' } : { path: '/user' }
    }
  }

  return true
})

export default router