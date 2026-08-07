import { useI18n } from 'vue-i18n'
import { BookingTypeEnum, RoomSizeEnum, UsageEnum } from '../enums/booking.enum'

/**
 * Shared i18n-backed label helpers used by both StaffDashboard and
 * UserDashboard. A composable (not a plain util) because it needs useI18n().
 */
export function useBookingLabels() {
  const { t } = useI18n()

  function bookingTypeLabel(bt: BookingTypeEnum): string {
    return t(`staff.users.bookingTypes.${bt}`)
  }

  function usageLabel(usage: UsageEnum): string {
    return t(`booking.usage.${usage}`)
  }

  function sizeLabel(size: RoomSizeEnum): string {
    const labels: Record<RoomSizeEnum, string> = {
      [RoomSizeEnum.SMALL]: 'Small',
      [RoomSizeEnum.MEDIUM]: 'Medium',
      [RoomSizeEnum.BIG]: 'Big',
      [RoomSizeEnum.BNAIG]: 'N/A',
    }
    return labels[size]
  }

  return { bookingTypeLabel, usageLabel, sizeLabel }
}