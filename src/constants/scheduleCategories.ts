import { BookingTypeEnum } from '../enums/booking.enum'

/**
 * The categories a festival event can apply to ("Applies To") and a schedule can be generated for.
 * Same list, same spelling as the backend (src/festival-events/schedule-categories.ts).
 * Their names are under common.scheduleCategories.<value>.
 */
export const SCHEDULE_CATEGORIES: BookingTypeEnum[] = [
  BookingTypeEnum.ALL,
  BookingTypeEnum.SOLO,
  BookingTypeEnum.YOUTH_A,
  BookingTypeEnum.YOUTH_B,
  BookingTypeEnum.YOUTH_C,
  BookingTypeEnum.YOUTH_D,
  BookingTypeEnum.MASTER_CLASS,
  BookingTypeEnum.FIRST_ROUND_FINALIST,
  BookingTypeEnum.SECOND_ROUND_FINALIST,
  BookingTypeEnum.PIANIST,
]