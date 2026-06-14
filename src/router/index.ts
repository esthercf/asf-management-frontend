import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import UserDashboard from '@/views/UserDashboard.vue'
import StaffDashboard from '@/views/StaffDashboard.vue'
import LoginPage from '@/views/LoginPage.vue'

const routes: RouteRecordRaw[] = [
  { path: '/',       redirect: '/login' },
  { path: '/login',  component: LoginPage },
  { path: '/user',   component: UserDashboard },
  { path: '/staff',  component: StaffDashboard },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
