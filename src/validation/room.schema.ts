import { z } from 'zod'
import { RoomSizeEnum, BookingTypeEnum } from '../enums/booking.enum'

/**
 * Client-side validation for the room create/edit form. Mirrors the
 * backend's CreateRoomDto/UpdateRoomDto constraints (name and roomNumber
 * required, floor/comments/size/windows/bookingTypeEnum optional), plus a
 * couple of sensible product-level additions the backend doesn't itself
 * enforce (roomNumber must be a positive whole number) — real-world room
 * numbers are never negative or fractional even though the backend just
 * checks "is this a number".
 *
 * Every message is an i18n key under staff.rooms.validation.* — translate
 * with zodErrorsToFieldMap(result.error, t) at the call site.
 */
export const roomFormSchema = z.object({
  name: z.string().trim().min(1, { message: 'staff.rooms.validation.nameRequired' }),

  roomNumber: z.preprocess(
    (val) => (val === null || val === '' ? undefined : val),
    z.number({
      error: (issue) => issue.input === undefined
        ? 'staff.rooms.validation.roomNumberRequired'
        : 'staff.rooms.validation.roomNumberInvalid',
    })
      .int({ message: 'staff.rooms.validation.roomNumberInteger' })
      .positive({ message: 'staff.rooms.validation.roomNumberPositive' }),
  ),

  floor: z.preprocess(
    (val) => (val === null || val === '' ? undefined : val),
    z.number({ error: 'staff.rooms.validation.floorInvalid' })
      .int({ message: 'staff.rooms.validation.floorInteger' })
      .optional(),
  ),

  size: z.nativeEnum(RoomSizeEnum),
  comments: z.string().optional(),
  windows: z.boolean(),
  bookingTypeEnum: z.nativeEnum(BookingTypeEnum).optional(),
})

export type RoomFormValues = z.infer<typeof roomFormSchema>