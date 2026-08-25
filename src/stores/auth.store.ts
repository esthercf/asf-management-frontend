import { defineStore } from 'pinia'
import { AuthState } from '../types/session.types';
import { RoleType, ALLOWED_MANAGER_ROLES } from '../enums/roles.enum';
import { useSessionApi } from '../composables/useSessionApi';

export const useAuthStore = defineStore('auth', {
    state: (): AuthState => ({
        accessToken: localStorage.getItem('accessToken'),
        refreshToken: localStorage.getItem('refreshToken'),
        userId: localStorage.getItem('userId'),
        roles: JSON.parse(localStorage.getItem('roles') ?? '[]'),
    }),

    getters: {
        isAuthenticated: (s) => !!s.accessToken,
        isStaff: (s) => s.roles.some(r => ALLOWED_MANAGER_ROLES.includes(r)),
        // Root and Manager both get access to the Management dashboard
        // (user CRUD, and future masterclass/festival/role management
        // sections) — separate from isStaff, which is Booking's own
        // staff-dashboard access check and unrelated to this frontend's
        // actual purpose.
        isManager: (s) => s.roles.some(r => ALLOWED_MANAGER_ROLES.includes(r)),
    },

    actions: {
        setSession(session: { accessToken: string; refreshToken: string; userId: string; roles: RoleType[] }) {
            this.accessToken = session.accessToken
            this.refreshToken = session.refreshToken
            this.userId = session.userId
            this.roles = session.roles

            localStorage.setItem('accessToken', session.accessToken)
            localStorage.setItem('refreshToken', session.refreshToken)
            localStorage.setItem('userId', session.userId)
            localStorage.setItem('roles', JSON.stringify(session.roles))
        },

        clear() {
            this.accessToken = this.refreshToken = this.userId = null
            this.roles = []
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
            localStorage.removeItem('userId')
            localStorage.removeItem('roles')
        },

        async refresh() {
            const api = useSessionApi()
            try {
                // backend expects { userId, refreshToken }
                const session = await api.refresh(this.userId!, this.refreshToken!)
                this.setSession(session)
            } catch {
                this.clear()
                throw new Error('Session expired')
            }
        }
    }
})