export enum FestivalEventTypeEnum {
  CONTEST = 'contest',
  CONCERT = 'concert',
  WORKSHOP = 'workshop',
  CONFERENCE = 'conference',
  MASTERCLASS = 'masterclass',
  BREAK = 'break',
  OTHER = 'other',
}

/**
 * Matches Management's real festival-event.dto.ts exactly.
 */
export interface FestivalEventDto {
  _id: string
  eventType: FestivalEventTypeEnum
  label: string
  date: string // 'YYYY-MM-DD'
  year: number
  month: number
  day: number
  startTime: number // minutes since midnight
  endTime: number
  hour: number
  minutes: number
  location?: string
  appliesTo: string[]
  styleId?: string
  _createdAt: string
  _updatedAt?: string | null
}

export interface CreateFestivalEventDto {
  eventType: FestivalEventTypeEnum
  label: string
  date: string
  hour: number
  minutes: number
  endHour: number
  endMinutes: number
  location?: string
  appliesTo: string[]
  styleId?: string
}

export interface UpdateFestivalEventDto {
  eventType?: FestivalEventTypeEnum
  label?: string
  date?: string
  hour?: number
  minutes?: number
  endHour?: number
  endMinutes?: number
  location?: string
  appliesTo?: string[]
  styleId?: string
}

export interface GetFestivalEventsFilterDto {
  date?: string
  eventType?: FestivalEventTypeEnum
  appliesTo?: string
  location?: string
}