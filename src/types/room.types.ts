// src/types/room.types.ts

import { BookingTypeEnum, RoomSizeEnum } from "../enums/booking.enum"
import { SortEnum } from "../enums/user.enum"
import { AvailableBookingDto, BookingDto } from "./booking.types"

export interface RoomDto {
  id: string              // ObjectId serialized as string
  name: string
  roomNumber: number
  comments?: string
  floor?: number
  windows?: boolean
  size?: RoomSizeEnum
  active: boolean
  _bookings?: BookingDto[]
  _createdAt?: string
}

export interface CreateRoomDto {
  name: string
  roomNumber: number
  comments?: string
  floor?: number
  size?: RoomSizeEnum
  windows?: boolean
}

export interface UpdateRoomDto {
  name?: string
  roomNumber?: number
  comments?: string
  floor?: number
  windows?: boolean
  size?: RoomSizeEnum
  active?: boolean
}

export interface GetRoomsParams {
  page?: number
  limit?: number
  textFilter?: string
  sortByName?: SortEnum
}

export interface AvailableRoomDto {
  id: string
  name: string
  roomNumber: number
  comments?: string
  floor?: number
  windows?: boolean
  size?: RoomSizeEnum
  active: boolean
  available: AvailableBookingDto[]
}


export interface RoomFormState {
  name: string
  roomNumber: number | null
  floor: number | null
  size: RoomSizeEnum
  comments: string
  windows: boolean
  bookingTypeEnum: BookingTypeEnum | undefined
}