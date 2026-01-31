import type {
  WorkType,
  WorkTypeListParams,
  CreateWorkTypeInput,
  UpdateWorkTypeInput,
  PaginatedResponse,
  SingleResponse,
  ProblemDetails,
} from '@/features/work-types/types'

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
