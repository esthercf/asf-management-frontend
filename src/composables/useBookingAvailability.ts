import { computed, Ref } from 'vue'
import { AvailableRoomDto, BookingDayOption, BookingSlotOption } from '../types/booking.types'
import { useI18n } from 'vue-i18n'
/**
 * Groups a flat list of per-room availability slots into:
 *  - one entry per day, with a running count of total slots that day
 *  - for a given selected day, one entry per distinct time slot, with a
 *    running count of how many rooms offer that slot
 *
 * Shared by both StaffDashboard and UserDashboard's "new booking" wizards —
 * the day/slot selection logic is identical between the two flows. What
 * happens *after* a slot is picked differs (staff explicitly choose a room;
 * users get auto-assigned one via lockAuto to avoid race conditions) and is
 * intentionally NOT part of this composable — each dashboard keeps that
 * logic on its own.
 */
export function useBookingAvailability(
  availability: Ref<AvailableRoomDto[]>,
  selectedDay: Ref<BookingDayOption | null>,
) {
  const { locale } = useI18n()

  const availableDays = computed<BookingDayOption[]>(() => {
    const dayMap = new Map<string, BookingDayOption>()
    for (const room of availability.value) {
      for (const slot of (room.available ?? [])) {
        if (!dayMap.has(slot.date)) {
          const d = new Date(slot.date + 'T00:00:00')
          dayMap.set(slot.date, {
            iso: slot.date,
            weekday: d.toLocaleDateString(locale.value, { weekday: 'short' }),
            dayNum: slot.day,
            month: d.toLocaleDateString(locale.value, { month: 'short' }),
            slotsCount: 0,
          })
        }
        dayMap.get(slot.date)!.slotsCount++
      }
    }
    return Array.from(dayMap.values()).sort((a, b) => a.iso.localeCompare(b.iso))
  })

  const slotsForSelectedDay = computed<BookingSlotOption[]>(() => {
    if (!selectedDay.value) return []
    const slotMap = new Map<number, BookingSlotOption>()
    for (const room of availability.value) {
      for (const slot of (room.available ?? [])) {
        if (slot.date !== selectedDay.value!.iso) continue
        if (!slotMap.has(slot.startTime)) {
          slotMap.set(slot.startTime, { ...slot, roomCount: 0, key: slot.startTime })
        }
        slotMap.get(slot.startTime)!.roomCount++
      }
    }
    return Array.from(slotMap.values()).sort((a, b) => a.startTime - b.startTime)
  })

  return { availableDays, slotsForSelectedDay }
}