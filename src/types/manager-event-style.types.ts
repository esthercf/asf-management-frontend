/**
 * Matches Management's real event-style.dto.ts exactly.
 */
export interface EventStyleDto {
  _id: string
  name: string
  fillColorHex: string // 6-digit hex, no leading '#'
  fontColorHex?: string
  bold: boolean
  _createdAt: string
  _updatedAt?: string | null
  isDefaultForActivities?: boolean
}

export interface CreateEventStyleDto {
  name: string
  fillColorHex: string
  fontColorHex?: string
  bold?: boolean
}

export interface UpdateEventStyleDto {
  name?: string
  fillColorHex?: string
  fontColorHex?: string
  bold?: boolean
}