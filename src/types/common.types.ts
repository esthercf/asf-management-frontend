export interface DatatableResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
}