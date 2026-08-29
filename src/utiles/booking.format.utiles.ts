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

/**
 * Matches BookingService.deleteBooking()'s exact server-side rule: a
 * booking can't be canceled once it's already passed, OR once it's
 * within 15 minutes of starting. Deliberately separate from
 * isPastBooking() — that one means "has this ended" (used for the
 * "Past" badge), this one means "is cancellation still allowed", a
 * stricter and earlier cutoff.
 */
export function canCancelBooking(booking: BookingDto, cutoffMinutes = 15): boolean {
  const bookingStart = new Date(booking.date + 'T00:00:00')
  bookingStart.setMinutes(booking.startTime)
  const cutoff = new Date(bookingStart.getTime() - cutoffMinutes * 60 * 1000)
  return new Date() < cutoff
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