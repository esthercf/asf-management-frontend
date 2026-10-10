import { client } from '../services/http.client'

export interface DayScheduleSlot {
  start: string // 'HH:mm'
  end: string   // 'HH:mm'
}

export interface DayScheduleDto {
  id: string
  date: string // 'YYYY-MM-DD'
  year: number
  month: number
  day: number
  slots: DayScheduleSlot[]
  active: boolean
}
export interface CreateDaySchedulePayload {
  date: string // 'YYYY-MM-DD'
  slots: DayScheduleSlot[]
}

export function useDayScheduleApi() {
  function updateDayScheduleSlots(id: string, slots: DayScheduleSlot[]): Promise<DayScheduleDto> {
    return client.patch<DayScheduleDto>(`/day-schedules/${id}/slots`, { slots }).then(r => r.data)
  }

  function deleteDaySchedule(id: string): Promise<void> {
    return client.delete(`/day-schedules/${id}`).then(r => r.data)
  }

  function createDaySchedule(payload: CreateDaySchedulePayload): Promise<DayScheduleDto> {
    return client.post<DayScheduleDto>('/day-schedules', payload).then(r => r.data)
  }

  function getDaySchedules(): Promise<DayScheduleDto[]> {
    return client.get<DayScheduleDto[]>('/day-schedules').then(r => r.data)
  }

  function setDayScheduleActive(id: string, active: boolean): Promise<void> {
    return client.patch(`/day-schedules/${id}/active`, { active }).then(r => r.data)
  }

  return { getDaySchedules, setDayScheduleActive, createDaySchedule, updateDayScheduleSlots, deleteDaySchedule }
}