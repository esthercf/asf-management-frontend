import { RoleType } from '../enums/roles.enum'
import { BookingTypeEnum } from '../enums/booking.enum'
import { CountryCode, GenderEnum, LanguageEnum, TshirtEnum, SortEnum, FilterActiveEnum } from '../enums/user.enum'
import { UserRehearsalInfo } from './user.types'

/**
 * Matches Management's real AddressDto/NewAddressDto exactly — free-text
 * fields, no validation beyond optional/string on the backend side.
 */
export interface AddressDto {
  address: string | null
  country: string | null
  locality: string | null
  zipCode?: string | null
}

/**
 * Matches Management's real UserDto (dto/user.dto.ts) field for field.
 * Confirmed directly against the backend source — do not add/remove
 * fields without re-checking that file, since a mismatch here could
 * silently drop or mishandle real user data.
 */
export interface ManagerUserDto {
  id: string
  email: string
  firstnames: string
  surnames: string
  address: AddressDto | null
  phoneNumber?: string
  gdpr: boolean | null
  active: boolean
  countryCode: CountryCode
  language: LanguageEnum
  phoneCode?: string
  birthdate?: string // ISO date string over the wire
  gender?: GenderEnum
  tshirtEnum?: TshirtEnum
  folderCode?: string
  roles: RoleType[]
  bookingTypeEnum: BookingTypeEnum[]
  rehearsal?: UserRehearsalInfo
}

/**
 * Matches Management's real NewUserDto exactly. Note: `role` is
 * singular here (not `roles`) — this is how the backend's create
 * endpoint actually takes it, confirmed from user.controller.ts and
 * dto/user.dto.ts directly. Several fields are REQUIRED on create
 * (countryCode, phoneCode, birthdate, gender, tshirtEnum, gdpr) even
 * though they become optional later via UpdateUserDto.
 */
export interface CreateManagerUserDto {
  firstnames: string
  surnames: string
  email: string
  address?: { address?: string | null; country?: string | null; locality?: string | null; zipCode?: string | null } | null
  phoneNumber?: string | null
  gdpr: boolean
  role?: RoleType
  language?: LanguageEnum
  countryCode: CountryCode
  phoneCode: string
  birthdate: string // ISO date string
  gender: GenderEnum
  tshirtEnum: TshirtEnum
  folderCode?: string
  bookingTypeEnum: BookingTypeEnum[]
}

/**
 * Matches Management's real UpdateUserDto exactly. Deliberately no
 * `email` (immutable after creation) and no `role`/`roles` field at
 * all — role changes have no live backend endpoint currently (see
 * RoleController, both its methods are commented out). Every field
 * here is optional, matching PATCH semantics (only send what changed).
 */
export interface UpdateManagerUserDto {
  firstnames?: string
  surnames?: string
  address?: { address?: string | null; country?: string | null; locality?: string | null; zipCode?: string | null }
  phoneNumber?: string
  language?: LanguageEnum
  countryCode?: CountryCode
  phoneCode?: string
  birthdate?: string
  gender?: GenderEnum
  tshirtEnum?: TshirtEnum
  folderCode?: string
  bookingTypeEnum?: BookingTypeEnum[]
}

export interface UpdateManagerUserActiveDto {
  active: boolean
  showPassword: boolean
}

/**
 * Matches Management's real GetParams (models/filters.query.ts).
 */
export interface GetManagerUsersParams {
  page?: number
  limit?: number
  textFilter?: string
  roleType?: RoleType[]
  bookingTypeEnum?: BookingTypeEnum[]
  bookingTypeEnumExact?: BookingTypeEnum[]
  countryCode?: CountryCode[]
  active?: FilterActiveEnum
  sortByCreationDate?: SortEnum
  sortByName?: SortEnum
}

export interface ManagerUserBaseDto {
  id: string
  email: string
  firstnames: string
  surnames: string
  folderCode?: string
}