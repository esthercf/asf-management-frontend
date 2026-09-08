export enum ActivityTypeEnum {
  MASTERCLASS = 'masterclass',
  WORKSHOP = 'workshop',
  OTHER = 'other',
  REHEARSAL = 'rehearsal',
}

/**
 * Matches Management's real activity.dto.ts exactly.
 */
export interface ActivityDto {
  _id: string
  type: ActivityTypeEnum
  teacherId?: string
  teacherRawName: string
  teacherEmail?: string | null
  date: string
  startTime: number
  endTime: number
  hour: number
  minutes: number
  year: number
  month: number
  day: number
  roomId?: string
  roomNumber: number
  comments?: string | null
  internalComments?: string | null
  _createdAt: string
  _createdBy?: string
  _updatedAt?: string | null
  studentEmail?: string
  studentId?: string
  folderCode?: string,
  diplomaText?: string,
  studentFullName?: string | null
  userIds?: string[]
  users?: { id: string; firstnames: string; surnames: string; email: string }[]
}

export interface CreateActivityDto {
  type: ActivityTypeEnum
  teacherRawName: string
  teacherEmail?: string
  date: string
  hour: number
  minutes: number
  durationMinutes?: number // defaults to 45 on the backend if omitted
  roomId?: string
  comments?: string
  internalComments?: string
  studentEmail?: string
  studentId?: string
  folderCode?: string
  diplomaText?: string
  userIds?: string[]
}

export interface UpdateActivityDto {
  date?: string
  hour?: number
  minutes?: number
  durationMinutes?: number
  roomId?: string
  comments?: string
  internalComments?: string
  studentEmail?: string
  studentId?: string
  folderCode?: string,
  diplomaText?: string,
  userIds?: string[]
}

export interface GetActivitiesFilterDto {
  teacherEmail?: string
  teacherName?: string
  type?: ActivityTypeEnum
  roomNumber?: number
  studentEmail?: string
  fromDate?: string
  toDate?: string
  page?: number
  limit?: number
  userIds?: string[]
}