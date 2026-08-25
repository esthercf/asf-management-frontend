import { defineStore } from 'pinia'
import { BookingTypeEnum } from '../enums/booking.enum'
import { UserProfileState } from '../types/user.types'



export const useUserProfileStore = defineStore('userProfile', {
  state: (): UserProfileState => ({
    profile: null,
    loading: false,
  }),

  getters: {
    /**
     * True if the user has any bookingTypeEnum tag other than ALL.
     * ALL means no special access — it's the default everyone has.
     * Backend enforces the real check; this is just for showing/hiding the nav item.
     */
    hasSpecialAccess: (s): boolean => {
      if (!s.profile?.bookingTypeEnum?.length) return false
      return s.profile.bookingTypeEnum.some((bt: BookingTypeEnum) => bt !== BookingTypeEnum.ALL)
    },

    fullName: (s): string => {
      if (!s.profile) return ''
      return `${s.profile.firstnames} ${s.profile.surnames}`.trim()
    },

    initials: (s): string => {
      if (!s.profile) return '?'
      return (
        (s.profile.firstnames[0] ?? '') +
        (s.profile.surnames[0] ?? '')
      ).toUpperCase()
    },
  },

  actions: {
    async fetch(userId: string) {
      // Avoid re-fetching if we already have this user's profile
      if (this.profile?.id === userId) return

      this.loading = true
      try {
        // Import here to avoid circular dependency between stores and composables
        const { useManagerUserApi } = await import('../composables/useManagerUserApi')
        const userApi = useManagerUserApi()
        // getUser(id), NOT getMe() — Management's backend has no
        // /users/me endpoint at all (confirmed directly from
        // user.controller.ts). Unlike Booking, Management's GET
        // /users/:id has no permission restriction (the
        // @RequirePermission line is commented out in the real
        // controller), so any authenticated user can fetch their own
        // record this way without needing a separate "me" endpoint.
        this.profile = await userApi.getUser(userId)
      } catch {
        this.profile = null
      } finally {
        this.loading = false
      }
    },

    clear() {
      this.profile = null
      this.loading = false
    },
  },
})