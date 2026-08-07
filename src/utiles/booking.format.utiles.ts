import { RoomSizeEnum } from '../enums/booking.enum'
import { BookingDto } from '../types/booking.types'

/**
 * Shared, pure formatting/derivation helpers used by both StaffDashboard and
 * UserDashboard. Extracted here to avoid the two views drifting out of sync
 * (they previously had byte-for-byte duplicate copies of each of these).
 */

/** Minutes-since-midnight -> "HH:MM". */
export function formatMinutes(mins: number | undefined | null): string {
  if (mins == null) return ''
  return `${Math.floor(mins / 60).toString().padStart(2, '0')}:${(mins % 60).toString().padStart(2, '0')}`
}

/** True once a booking's end time has passed. */
export function isPastBooking(booking: BookingDto): boolean {
  const d = new Date(booking.date + 'T00:00:00')
  d.setMinutes(booking.endTime)
  return d < new Date()
}

const SIZE_EMOJIS: Record<RoomSizeEnum, string> = {
  [RoomSizeEnum.SMALL]: '🟢',
  [RoomSizeEnum.MEDIUM]: '🔵',
  [RoomSizeEnum.BIG]: '🟣',
  [RoomSizeEnum.BNAIG]: '🏠',
}

export function sizeEmoji(size: RoomSizeEnum | undefined): string {
  return size ? (SIZE_EMOJIS[size] ?? '🏠') : '🏠'
}