
import { defineStore } from 'pinia'
import { useBookingApi } from '../composables/useBookingApi'
import { AuthState } from '../types/session.types';

export const useAuthStore = defineStore('auth', {
    state: (): AuthState => ({
        accessToken: localStorage.getItem('accessToken'),
        refreshToken: localStorage.getItem('refreshToken'),
        userId: localStorage.getItem('userId'),
        roles: JSON.parse(localStorage.getItem('roles') ?? '[]'),
    }),

    getters: {
        isAuthenticated: (s) => !!s.accessToken,
        isStaff: (s) => s.roles.some(r =>
            ['root', 'manager', 'staff', 'admin'].includes(r.toLowerCase())
        ),
    },

    actions: {
        setSession(session: { accessToken: string; refreshToken: string; userId: string; roles: string[] }) {
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
            const api = useBookingApi()
            try {
                const session = await api.refresh(this.accessToken!, this.refreshToken!)
                this.setSession(session)
            } catch {
                this.clear()
                throw new Error('Session expired')
            }
        }
    }
})