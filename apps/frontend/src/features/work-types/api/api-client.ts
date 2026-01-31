import { API_BASE_URL, ApiError, handleResponse } from '@/lib/api'
import type {
  WorkType,
  WorkTypeListParams,
  CreateWorkTypeInput,
  UpdateWorkTypeInput,
  PaginatedResponse,
  SingleResponse,
} from '@/features/work-types/types'

export { ApiError }

export async function fetchWorkTypes(
  params: WorkTypeListParams,
): Promise<PaginatedResponse<WorkType>> {
  const searchParams = new URLSearchParams()
  if (params.includeDisabled) {
    searchParams.set('filter[includeDisabled]', 'true')
  }

  const query = searchParams.toString()
  const url = `${API_BASE_URL}/work-types${query ? `?${query}` : ''}`
  const response = await fetch(url)
  return handleResponse<PaginatedResponse<WorkType>>(response)
}

export async function fetchWorkType(
  code: string,
): Promise<SingleResponse<WorkType>> {
  const response = await fetch(`${API_BASE_URL}/work-types/${encodeURIComponent(code)}`)
  return handleResponse<SingleResponse<WorkType>>(response)
}

export async function createWorkType(
  input: CreateWorkTypeInput,
): Promise<SingleResponse<WorkType>> {
  const response = await fetch(`${API_BASE_URL}/work-types`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return handleResponse<SingleResponse<WorkType>>(response)
}

export async function updateWorkType(
  code: string,
  input: UpdateWorkTypeInput,
): Promise<SingleResponse<WorkType>> {
  const response = await fetch(`${API_BASE_URL}/work-types/${encodeURIComponent(code)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return handleResponse<SingleResponse<WorkType>>(response)
}

export async function deleteWorkType(code: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/work-types/${encodeURIComponent(code)}`, {
    method: 'DELETE',
  })
  return handleResponse<void>(response)
}

export async function restoreWorkType(
  code: string,
): Promise<SingleResponse<WorkType>> {
  const response = await fetch(
    `${API_BASE_URL}/work-types/${encodeURIComponent(code)}/actions/restore`,
    { method: 'POST' },
  )
  return handleResponse<SingleResponse<WorkType>>(response)
}
