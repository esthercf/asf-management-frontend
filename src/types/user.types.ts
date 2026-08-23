
import { BookingTypeEnum } from '../enums/booking.enum'
import { RoleType } from '../enums/roles.enum'
import { CountryCode, FilterActiveEnum, LanguageEnum, SortEnum, TshirtEnum } from '../enums/user.enum'

interface UserBaseDto {
  id: string
  email: string
  firstnames: string
  surnames: string
}

export interface UserDto {
  id: string,
  firstnames: string,
  surnames: string,
  email: string,
  teacherName?: string,
  folderCode?: string,
  phoneNumber?: string,
  phoneCode?: string,
  language: LanguageEnum,
  active: boolean,
  countryCode: CountryCode,
  tshirtEnum?: TshirtEnum,
  roles: RoleType[],
  bookingTypeEnum: BookingTypeEnum[],
}

/**Esther: This is not in use 23-08-2027. We keep the code just in case business logic changes necessities. */
export interface UpdateUserDto {
  firstnames?: string,
  surnames?: string,
  phoneNumber?: string,
  phoneCode?: string,
  language?: LanguageEnum,
  countryCode?: CountryCode,
  tshirtEnum?: TshirtEnum,
  bookingTypeEnum?: BookingTypeEnum[],
}

export interface UpdateUserActiveDto {
  active: boolean,
  showPassword: boolean,
}

export interface GetUsersParams {
  page?: number,
  limit?: number,
  textFilter?: string,
  folderCode?: string;
  roleType?: RoleType,
  active?: FilterActiveEnum,
  bookingTypeEnum?: BookingTypeEnum,
  sortByCreationDate?: SortEnum,
  sortByName?: SortEnum,
}

export interface UserProfileState {
  profile: UserDto | null
  loading: boolean
}