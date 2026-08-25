import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

import StaffDashboard from '@/views/StaffDashboard.vue'
import ManagerDashboard from '@/views/ManagerDashboard.vue'
import LoginPage from '@/views/LoginPage.vue'
import { ALLOWED_MANAGER_ROLES } from '../enums/roles.enum'
import { useAuthStore } from '../stores/auth.store'
import ForgotPasswordPage from '@/views/ForgotPasswordPage.vue'
import ResetPasswordPage from '@/views/ResetPasswordPage.vue'

// This frontend is Management-only. Both dashboards below require the
// exact same access level (Root or Manager) — Staff cannot log in
// here at all, and neither can Contestants; both belong on the actual
// Booking frontend instead. No /user route exists here (removed
// entirely, see LoginPage.vue for the explicit rejection message).
const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/login' },
  {
    path: '/login',
    component: LoginPage,
    meta: { public: true },
  },
  {
    path: '/forgot-password',
    component: ForgotPasswordPage,
    meta: { public: true },
  },
  {
    path: '/reset-password',
    component: ResetPasswordPage,
    meta: { public: true },
  },
  {
    path: '/staff',
    component: StaffDashboard,
    meta: { requiresAuth: true, roles: ALLOWED_MANAGER_ROLES },
  },
  {
    path: '/manager',
    component: ManagerDashboard,
    meta: { requiresAuth: true, roles: ALLOWED_MANAGER_ROLES },
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

  // Both protected routes require the same access level here, so
  // there's no "send them to their OTHER dashboard" case to handle —
  // either they have it, or this app has nothing for them at all.
  const requiredRoles = to.meta.roles as string[] | undefined
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRole = auth.roles.some(r => requiredRoles.includes(r))
    if (!hasRole) {
      return { path: '/login' }
    }
  }

  return true
})

export default router