// ── Slots ──────────────────────────────────────────────────────────────────

export interface SlotDto {
  start: string   // 'HH:mm'
  end:   string   // 'HH:mm'
}

// ── Day Schedule ───────────────────────────────────────────────────────────

export interface DayScheduleDto {
  id:    string   // ObjectId serialized as string
  date:  string   // 'YYYY-MM-DD'
  year:  number
  month: number
  day:   number
  slots: SlotDto[]
}

export interface CreateDayScheduleDto {
  date:  string   // 'YYYY-MM-DD'
  slots: SlotDto[]
}
