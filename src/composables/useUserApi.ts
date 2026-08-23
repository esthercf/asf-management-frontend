
import { client } from '../services/http.client'
import { UserBaseDto } from '../types/booking.types'
import { DatatableResult } from '../types/common.types'
import type { UserDto, GetUsersParams, UpdateUserDto, UpdateUserActiveDto } from '../types/user.types'


export function useUserApi() {


  function getUsers(params: GetUsersParams = {}): Promise<DatatableResult<UserDto>> {
    const { page = 1, limit = 50, textFilter, roleType, active, bookingTypeEnum, folderCode, sortByCreationDate, sortByName } = params
    const q = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (textFilter) q.set('textFilter', textFilter)
    if (roleType) q.set('roleType', roleType)
    if (active) q.set('active', active)
    if (bookingTypeEnum) q.set('bookingTypeEnum', bookingTypeEnum)
    if (folderCode) q.set('folderCode', folderCode)
    if (sortByCreationDate) q.set('sortByCreationDate', sortByCreationDate)
    if (sortByName) q.set('sortByName', sortByName)
    return client.get<DatatableResult<UserDto>>(`/users?${q}`).then(r => r.data)
  }

  function getUserSelectorOptions(): Promise<UserBaseDto[]> {
    return client.get<UserBaseDto[]>('/users/selector').then(r => r.data)
  }


  function getUser(id: string): Promise<UserDto> {
    return client.get<UserDto>(`/users/${id}`).then(r => r.data)
  }

  function updateUser(id: string, dto: UpdateUserDto): Promise<UserDto> {
    return client.patch<UserDto>(`/users/${id}`, dto).then(r => r.data)
  }

  function updateUserActiveByEmail(email: string, active: boolean): Promise<string> {
    const dto: UpdateUserActiveDto = { active, showPassword: false }
    return client.put<string>(`/users/active/byEmail/${encodeURIComponent(email)}`, dto).then(r => r.data)
  }

  /**
     * Returns the currently logged-in user's own record — a regular
     * (non-staff) user calling getUser(id) for their own id would be
     * rejected, since that endpoint is staff-only. This is the separate,
     * any-authenticated-user endpoint for "my own info".
     */
  function getMe(): Promise<UserDto> {
    return client.get<UserDto>('/users/me').then(r => r.data)
  }

  return {
    getUsers, getUser, updateUser, updateUserActiveByEmail, getUserSelectorOptions, getMe
  }
}