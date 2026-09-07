import { client } from '../services/http.client'

export interface DiplomaTemplateDto {
  key: string
  label: string
  fileName: string
}

export function useDiplomaApi() {
  function getTemplates(): Promise<DiplomaTemplateDto[]> {
    return client.get<DiplomaTemplateDto[]>('/diplomas/templates').then(r => r.data)
  }

  return { getTemplates }
}