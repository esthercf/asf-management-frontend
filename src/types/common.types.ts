export interface DatatableResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  metadata: DatatableMetadata
}
export class DatatableMetadata {

  page: number | undefined;

  limit: number | undefined;

  totalElements: number | undefined;

  totalPages: number | undefined;

}