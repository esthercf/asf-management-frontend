import { client } from '../services/http.client'
import { DatatableResult } from '../types/common.types'
import type {
  ManagerUserDto,
  ManagerUserBaseDto,
  CreateManagerUserDto,
  UpdateManagerUserDto,
  UpdateManagerUserActiveDto,
  GetManagerUsersParams,
} from '../types/manager-user.types'

/**
 * Matches Management's real user.controller.ts endpoints exactly.
 * Deliberately separate from useUserApi.ts (Booking's composable) —
 * different backend, different UserDto shape (this one carries address,
 * gdpr, phoneNumber, etc.), different auth token. Not interchangeable.
 */
export interface ImportUsersResult {
  message: string
  total: number
  succeeded: number
  errors: { row: number; reason: string }[]
}



export interface ImportFolderCodesResult {
  message: string
  total: number
  updated: number
  unchanged: number
  skipped: number
  failed: number
  /** rows where a DIFFERENT code was replaced: worth a second look, in case of a typo */
  replaced: { row: number; email: string; from: string; to: string }[]
  errors: { row: number; reason: string }[]
}
export interface CountItem { key: string | null; count: number }

export interface CategoryStatistics {
  /** null = all contestants together */
  bookingType: string | null
  total: number
  gender: CountItem[]
  /** age in completed years on the reference date; null = unknown */
  age: { age: number | null; count: number }[]
  country: CountItem[]
  teacher: CountItem[]
}

export interface UserStatistics {
  referenceDate: string
  festivalDayKnown: boolean
  total: number
  categories: CategoryStatistics[]
}


export function useManagerUserApi() {

  function getUsers(params: GetManagerUsersParams = {}): Promise<DatatableResult<ManagerUserDto>> {
    const { page = 1, limit = 50, textFilter, roleType, active, bookingTypeEnum, bookingTypeEnumExact, countryCode, sortByCreationDate, sortByName } = params
    const q = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (textFilter) q.set('textFilter', textFilter)
    if (active) q.set('active', active)
    if (sortByCreationDate) q.set('sortByCreationDate', sortByCreationDate)
    if (sortByName) q.set('sortByName', sortByName)
    // Arrays: append each value as a repeated param, matching what the
    // backend's @Transform(toArray) now correctly accepts either way.
    roleType?.forEach(r => q.append('roleType', r))
    bookingTypeEnum?.forEach(bt => q.append('bookingTypeEnum', bt))
    bookingTypeEnumExact?.forEach(bt => q.append('bookingTypeEnumExact', bt))
    countryCode?.forEach(c => q.append('countryCode', c))
    return client.get<DatatableResult<ManagerUserDto>>(`/users?${q}`).then(r => r.data)
  }

  /** Counts of the contestants per category, for the overview page (no personal data). */
  function getUserStatistics(): Promise<UserStatistics> {
    return client.get<UserStatistics>('/users/statistics').then(r => r.data)
  }

  /** Country codes that at least one user has (for the country filter of the list). */
  function getUserCountries(): Promise<string[]> {
    return client.get<string[]>('/users/countries').then(r => r.data)
  }

  function getUserSelectorOptions(): Promise<ManagerUserBaseDto[]> {
    return client.get<ManagerUserBaseDto[]>('/users/selector').then(r => r.data)
  }

  function getUser(id: string): Promise<ManagerUserDto> {
    return client.get<ManagerUserDto>(`/users/${id}`).then(r => r.data)
  }

  function createUser(dto: CreateManagerUserDto): Promise<ManagerUserDto> {
    return client.post<ManagerUserDto>('/users', dto).then(r => r.data)
  }

  function updateUser(id: string, dto: UpdateManagerUserDto): Promise<ManagerUserDto> {
    return client.patch<ManagerUserDto>(`/users/${id}`, dto).then(r => r.data)
  }

  function updateUserActiveByEmail(email: string, active: boolean): Promise<string> {
    const dto: UpdateManagerUserActiveDto = { active, showPassword: false }
    return client.put<string>(`/users/active/byEmail/${encodeURIComponent(email)}`, dto).then(r => r.data)
  }

  /** Sets or corrects the folder codes of existing users from an "email | folderCode" Excel file. */
  function importFolderCodes(file: File): Promise<ImportFolderCodesResult> {
    const formData = new FormData()
    formData.append('file', file)
    return client.post<ImportFolderCodesResult>('/users/import/folder-codes', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  }

  function importFromExcel(file: File, sendEmail: boolean): Promise<ImportUsersResult> {
    const formData = new FormData()
    formData.append('file', file)
    const q = new URLSearchParams({ sendEmail: String(sendEmail) })
    return client.post<ImportUsersResult>(`/users/import?${q}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  }

  return {
    getUsers, getUserSelectorOptions, getUser, createUser, updateUser, updateUserActiveByEmail, importFromExcel, getUserCountries, importFolderCodes, getUserStatistics
  }
}
