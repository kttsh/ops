import type {
  ProjectType,
  ProjectTypeListParams,
  CreateProjectTypeInput,
  UpdateProjectTypeInput,
  PaginatedResponse,
  SingleResponse,
  ProblemDetails,
} from '@/features/project-types/types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export class ApiError extends Error {
  readonly problemDetails: ProblemDetails

  constructor(problemDetails: ProblemDetails) {
    super(problemDetails.detail)
    this.name = 'ApiError'
    this.problemDetails = problemDetails
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const problemDetails: ProblemDetails = await response.json()
    throw new ApiError(problemDetails)
  }
  if (response.status === 204) {
    return undefined as T
  }
  return response.json() as Promise<T>
}

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
