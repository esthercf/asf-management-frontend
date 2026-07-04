
import { BookingTypeEnum } from '../enums/booking.enum'
import { RoleType } from '../enums/roles.enum'
import { CountryCode, TshirtEnum, UserActiveFilter } from '../enums/user.enum'

export enum LanguageEnum {
  EN = 'EN',
  CA = 'CA',
  ES = 'ES',
  FR = 'FR',
  IT = 'IT',
  DE = 'DE',
  PT = 'PT',
  RU = 'RU',
  ZH = 'ZH',
  JA = 'JA',
  KO = 'KO',
}

export interface UserDto {
  id: string,
  firstnames: string,
  surnames: string,
  email: string,
  teacherName?: string,
  phoneNumber?: string,
  phoneCode?: string,
  language: LanguageEnum,
  active: boolean,
  countryCode: CountryCode,
  tshirtEnum?: TshirtEnum,
  roles: RoleType[],
  bookingTypeEnum: BookingTypeEnum[],
}

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
  active?: UserActiveFilter,
  bookingTypeEnum?: BookingTypeEnum,
  sortByCreationDate?: 'asc' | 'desc',
  sortByName?: 'asc' | 'desc',
}