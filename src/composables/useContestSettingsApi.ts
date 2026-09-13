import { client } from '../services/http.client'

export enum ContestTypeEnum {
  YOUTH = 'youth',
  SOLO = 'solo',
}

export interface ContestRoundDayDto {
  date: string   // 'YYYY-MM-DD'
  startTime: string  // 'HH:MM'
}

export interface ContestRoundCategoryConfigDto {
  category: string | null   // null for Solo; one of BookingTypeEnum's YOUTH_A-D for Youth
  venue: string
  pieces: string[]
  defaultWarmUpOffsetMinutes: number
  defaultReadyOffsetMinutes: number
  defaultStageDurationMinutes: number
  defaultPauseEveryNPerformances: number
  defaultPauseDurationMinutes: number
  days: ContestRoundDayDto[]
}

export interface ContestRoundDto {
  name: string
  categoryConfigs: ContestRoundCategoryConfigDto[]
}

export interface ContestSettingsDto {
  id: string
  contestType: ContestTypeEnum
  contestName: string
  rounds: ContestRoundDto[]
}

export interface CreateCategoryConfigPayload {
  category?: string   // omitted entirely for Solo
  venue: string
  pieces: string[]
  defaultWarmUpOffsetMinutes: number
  defaultReadyOffsetMinutes: number
  defaultStageDurationMinutes: number
  defaultPauseEveryNPerformances: number
  defaultPauseDurationMinutes: number
}

export type UpdateCategoryConfigPayload = Partial<Omit<CreateCategoryConfigPayload, 'category'>>

/**
 * Matches Management's real contest-settings.controller.ts endpoints
 * exactly. category is passed as a query param throughout — omitted
 * entirely means Solo's single, category:null config; a real
 * BookingTypeEnum value (e.g. 'youth_A') targets that specific Youth
 * sub-category's own config.
 */
export function useContestSettingsApi() {
  function categoryQuery(category?: string | null): string {
    return category ? `?category=${encodeURIComponent(category)}` : ''
  }

  function getOrCreate(contestType: ContestTypeEnum, contestName: string): Promise<ContestSettingsDto> {
    const q = new URLSearchParams({ contestName })
    return client.get<ContestSettingsDto>(`/contest-settings/${contestType}?${q}`).then(r => r.data)
  }

  function setContestName(contestType: ContestTypeEnum, contestName: string): Promise<ContestSettingsDto> {
    return client.patch<ContestSettingsDto>(`/contest-settings/${contestType}/name`, { contestName }).then(r => r.data)
  }

  function addRound(contestType: ContestTypeEnum, name: string): Promise<ContestSettingsDto> {
    return client.post<ContestSettingsDto>(`/contest-settings/${contestType}/rounds`, { name }).then(r => r.data)
  }

  function removeRound(contestType: ContestTypeEnum, roundName: string): Promise<ContestSettingsDto> {
    return client.delete<ContestSettingsDto>(`/contest-settings/${contestType}/rounds/${encodeURIComponent(roundName)}`).then(r => r.data)
  }

  function addCategoryConfig(contestType: ContestTypeEnum, roundName: string, config: CreateCategoryConfigPayload): Promise<ContestSettingsDto> {
    return client.post<ContestSettingsDto>(`/contest-settings/${contestType}/rounds/${encodeURIComponent(roundName)}/categories`, config).then(r => r.data)
  }

  function removeCategoryConfig(contestType: ContestTypeEnum, roundName: string, category?: string | null): Promise<ContestSettingsDto> {
    return client.delete<ContestSettingsDto>(`/contest-settings/${contestType}/rounds/${encodeURIComponent(roundName)}/categories${categoryQuery(category)}`).then(r => r.data)
  }

  function updateCategoryConfig(contestType: ContestTypeEnum, roundName: string, category: string | null, fields: UpdateCategoryConfigPayload): Promise<ContestSettingsDto> {
    return client.patch<ContestSettingsDto>(`/contest-settings/${contestType}/rounds/${encodeURIComponent(roundName)}/categories${categoryQuery(category)}`, fields).then(r => r.data)
  }

  function addDay(contestType: ContestTypeEnum, roundName: string, category: string | null, day: ContestRoundDayDto): Promise<ContestSettingsDto> {
    return client.post<ContestSettingsDto>(`/contest-settings/${contestType}/rounds/${encodeURIComponent(roundName)}/categories/days${categoryQuery(category)}`, day).then(r => r.data)
  }

  function updateDay(contestType: ContestTypeEnum, roundName: string, category: string | null, dayIndex: number, fields: Partial<ContestRoundDayDto>): Promise<ContestSettingsDto> {
    return client.patch<ContestSettingsDto>(`/contest-settings/${contestType}/rounds/${encodeURIComponent(roundName)}/categories/days/${dayIndex}${categoryQuery(category)}`, fields).then(r => r.data)
  }

  function removeDay(contestType: ContestTypeEnum, roundName: string, category: string | null, dayIndex: number): Promise<ContestSettingsDto> {
    return client.delete<ContestSettingsDto>(`/contest-settings/${contestType}/rounds/${encodeURIComponent(roundName)}/categories/days/${dayIndex}${categoryQuery(category)}`).then(r => r.data)
  }

  return {
    getOrCreate, setContestName, addRound, removeRound,
    addCategoryConfig, removeCategoryConfig, updateCategoryConfig,
    addDay, updateDay, removeDay,
  }
}