import { client } from '../services/http.client'
import { DatatableResult } from '../types/common.types'
import type {
  MasterclassPurchaseDto,
  CreateMasterclassPurchaseDto,
  UpdateMasterclassPurchaseDto,
  GetMasterclassPurchasesFilterDto,
} from '../types/manager-masterclass-purchase.types'

export function useManagerMasterclassPurchaseApi() {
  function getFiltered(filters: GetMasterclassPurchasesFilterDto = {}): Promise<DatatableResult<MasterclassPurchaseDto>> {
    const q = new URLSearchParams()
    if (filters.studentId) q.set('studentId', filters.studentId)
    if (filters.activityId) q.set('activityId', filters.activityId)
    if (filters.status) q.set('status', filters.status)
    if (filters.unassignedOnly) q.set('unassignedOnly', 'true')
    q.set('page', String(filters.page ?? 1))
    q.set('limit', String(filters.limit ?? 20))
    return client.get<DatatableResult<MasterclassPurchaseDto>>(`/masterclass-purchases?${q}`).then(r => r.data)
  }

  function create(dto: CreateMasterclassPurchaseDto): Promise<MasterclassPurchaseDto> {
    return client.post<MasterclassPurchaseDto>('/masterclass-purchases', dto).then(r => r.data)
  }

  function update(id: string, dto: UpdateMasterclassPurchaseDto): Promise<MasterclassPurchaseDto> {
    return client.patch<MasterclassPurchaseDto>(`/masterclass-purchases/${id}`, dto).then(r => r.data)
  }

  function remove(id: string): Promise<void> {
    return client.delete(`/masterclass-purchases/${id}`).then(r => r.data)
  }

  return { getFiltered, create, update, remove }
}