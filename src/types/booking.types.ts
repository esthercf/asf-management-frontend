// ── Rooms ──────────────────────────────────────────────────────────────────

import { BookingTypeEnum, RoomSizeEnum, UsageEnum } from "../enums/booking.enum"

export interface RoomDto {
  id: string,        // ObjectId serialized as string
  name: string,
  roomNumber: number,
  comments?: string,
  floor?: number,
  windows?: boolean,
  size?: RoomSizeEnum,
  active: boolean,
  _bookings?: BookingDto[],
  _createdAt?: string,
  bookingTypeEnum?: BookingTypeEnum,
}

export interface CreateRoomDto {
  name: string,
  roomNumber: number,
  comments?: string,
  floor?: number,
  size?: RoomSizeEnum,
  windows?: boolean,
  bookingTypeEnum?: BookingTypeEnum,
}

export interface UpdateRoomDto {
  name?: string,
  roomNumber?: number,
  comments?: string,
  floor?: number,
  windows?: boolean,
  size?: RoomSizeEnum,
  active?: boolean,
  bookingTypeEnum?: BookingTypeEnum,
}

export interface GetRoomsParams {
  page?: number,
  limit?: number,
  textFilter?: string,
  bookingTypeEnum?: BookingTypeEnum,
}

// ── Bookings ───────────────────────────────────────────────────────────────

export interface BookingDto {
  id: string,
  userId?: string,
  roomId: string,
  date: string,           // 'YYYY-MM-DD'
  startTime: number,      // minutes since midnight
  endTime: number,
  day: number,
  month: number,
  year: number,
  hour: number,
  minutes: number,
  usage: UsageEnum,
  user?: UserBaseDto,
  name: string,           // room name (denormalized)
  roomNumber: number,     // room number (denormalized)
  _createdAt?: string,
  bookingTypeEnum?: BookingTypeEnum,
}

export interface CreateBookingDto {
  roomId: string,
  date: string,           // ISO date e.g. '2025-09-08T12:00:00.000Z'
  hour: number,
  minutes: number,
  usage?: UsageEnum,
  userId?: string,
  bookingTypeEnum?: BookingTypeEnum,
}

export interface GetBookingsParams {
  page?: number,
  limit?: number,
  userId?: string,
  roomId?: string,
  day?: number,
  month?: number,
  textFilter?: string,
  bookingTypeEnum?: BookingTypeEnum,
  noUserId?: boolean,
  toCome?:boolean

}


// ── Availability ───────────────────────────────────────────────────────────

export interface AvailableRoomDto {
  id: string,
  name: string,
  roomNumber: number,
  comments?: string,
  floor?: number,
  windows?: boolean,
  size?: RoomSizeEnum,
  active: boolean,
  available: AvailableBookingDto[]
}
export interface AvailableBookingDto {
  roomId: string,
  roomName: string,
  date: string,           // 'YYYY-MM-DD'
  startTime: number,
  endTime: number,
  day: number,
  month: number,
  year: number,
  hour: number,
  minutes: number,
}

// ── Slot locking ───────────────────────────────────────────────────────────

export interface LockSlotDto {
  roomId: string,
  date: string,        // 'YYYY-MM-DD'
  startTime: number,        // minutes since midnight
}

export interface LockSlotResponseDto {
  expiresInSeconds: number,
}


export interface UserBaseDto {
  id: string,
  email: string,
  firstnames: string,
  surnames: string,
}

export interface GetAvailabilityParams {
  roomId?: string,
  page?: number,
  limit?: number,
}

// ── New Booking flow ──────────────────────────────────
export interface DayOption {
  iso: string,
  weekday: string,
  dayNum: number,
  month: string,
  slotsCount: number,
}

export interface SlotOption extends AvailableBookingDto {
  roomCount: number,
  key: number,
}



export interface BookingDayOption {
  iso: string
  weekday: string
  dayNum: number
  month: string
  slotsCount: number
}

export interface BookingSlotOption extends AvailableBookingDto {
  roomCount: number
  key: number
}
