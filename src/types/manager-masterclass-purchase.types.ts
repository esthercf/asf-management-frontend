import { TshirtEnum } from "../enums/user.enum"

export enum PurchaseStatusEnum {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  CANCELLED = 'cancelled',
}
export interface MasterclassPurchaseDto {
  _id: string
  studentId?: string
  studentRawName: string
  studentEmail: string
  activityId?: string
  teacherRawName?: string
  teacherEmail?: string
  date?: string
  hour?: number
  minutes?: number
  status: PurchaseStatusEnum
  purchasedAt: string
  price?: number
  currency?: string
  orderReference?: string
  comments?: string
  tshirtEnum: TshirtEnum | undefined
}

export interface CreateMasterclassPurchaseDto {
  studentRawName: string
  studentEmail: string
  activityId?: string
  teacherRawName?: string
  teacherEmail?: string
  date?: string
  hour?: number
  minutes?: number
  status?: PurchaseStatusEnum
  purchasedAt?: string
  price?: number
  currency?: string
  orderReference?: string
  comments?: string
  tshirtEnum?: TshirtEnum
}

export interface UpdateMasterclassPurchaseDto {
  activityId?: string
  status?: PurchaseStatusEnum
  price?: number
  currency?: string
  comments?: string
}

export interface GetMasterclassPurchasesFilterDto {
  studentId?: string
  activityId?: string
  status?: PurchaseStatusEnum
  unassignedOnly?: boolean
  page?: number
  limit?: number
}