import { API_BASE_URL, ApiError, handleResponse } from '@/lib/api'
import type {
  ProjectType,
  ProjectTypeListParams,
  CreateProjectTypeInput,
  UpdateProjectTypeInput,
  PaginatedResponse,
  SingleResponse,
} from '@/features/project-types/types'

export { ApiError }

export async function fetchProjectTypes(
  params: ProjectTypeListParams,
): Promise<PaginatedResponse<ProjectType>> {
  const searchParams = new URLSearchParams()
  if (params.includeDisabled) {
    searchParams.set('filter[includeDisabled]', 'true')
  }

  const query = searchParams.toString()
  const url = query
    ? `${API_BASE_URL}/project-types?${query}`
    : `${API_BASE_URL}/project-types`
  const response = await fetch(url)
  return handleResponse<PaginatedResponse<ProjectType>>(response)
}

export async function fetchProjectType(
  code: string,
): Promise<SingleResponse<ProjectType>> {
  const response = await fetch(`${API_BASE_URL}/project-types/${encodeURIComponent(code)}`)
  return handleResponse<SingleResponse<ProjectType>>(response)
}

export async function createProjectType(
  input: CreateProjectTypeInput,
): Promise<SingleResponse<ProjectType>> {
  const response = await fetch(`${API_BASE_URL}/project-types`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return handleResponse<SingleResponse<ProjectType>>(response)
}

export async function updateProjectType(
  code: string,
  input: UpdateProjectTypeInput,
): Promise<SingleResponse<ProjectType>> {
  const response = await fetch(`${API_BASE_URL}/project-types/${encodeURIComponent(code)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return handleResponse<SingleResponse<ProjectType>>(response)
}

export async function deleteProjectType(code: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/project-types/${encodeURIComponent(code)}`, {
    method: 'DELETE',
  })
  return handleResponse<void>(response)
}

export async function restoreProjectType(
  code: string,
): Promise<SingleResponse<ProjectType>> {
  const response = await fetch(
    `${API_BASE_URL}/project-types/${encodeURIComponent(code)}/actions/restore`,
    { method: 'POST' },
  )
  return handleResponse<SingleResponse<ProjectType>>(response)
}
