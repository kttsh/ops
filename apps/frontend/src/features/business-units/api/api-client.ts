import type {
  BusinessUnit,
  BusinessUnitListParams,
  CreateBusinessUnitInput,
  UpdateBusinessUnitInput,
  PaginatedResponse,
  SingleResponse,
  ProblemDetails,
} from '@/features/business-units/types'

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

export async function fetchBusinessUnits(
  params: BusinessUnitListParams,
): Promise<PaginatedResponse<BusinessUnit>> {
  const searchParams = new URLSearchParams({
    'page[number]': String(params.page),
    'page[size]': String(params.pageSize),
  })
  if (params.includeDisabled) {
    searchParams.set('filter[includeDisabled]', 'true')
  }

  const response = await fetch(`${API_BASE_URL}/business-units?${searchParams}`)
  return handleResponse<PaginatedResponse<BusinessUnit>>(response)
}

export async function fetchBusinessUnit(
  code: string,
): Promise<SingleResponse<BusinessUnit>> {
  const response = await fetch(`${API_BASE_URL}/business-units/${encodeURIComponent(code)}`)
  return handleResponse<SingleResponse<BusinessUnit>>(response)
}

export async function createBusinessUnit(
  input: CreateBusinessUnitInput,
): Promise<SingleResponse<BusinessUnit>> {
  const response = await fetch(`${API_BASE_URL}/business-units`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return handleResponse<SingleResponse<BusinessUnit>>(response)
}

export async function updateBusinessUnit(
  code: string,
  input: UpdateBusinessUnitInput,
): Promise<SingleResponse<BusinessUnit>> {
  const response = await fetch(`${API_BASE_URL}/business-units/${encodeURIComponent(code)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return handleResponse<SingleResponse<BusinessUnit>>(response)
}

export async function deleteBusinessUnit(code: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/business-units/${encodeURIComponent(code)}`, {
    method: 'DELETE',
  })
  return handleResponse<void>(response)
}

export async function restoreBusinessUnit(
  code: string,
): Promise<SingleResponse<BusinessUnit>> {
  const response = await fetch(
    `${API_BASE_URL}/business-units/${encodeURIComponent(code)}/actions/restore`,
    { method: 'POST' },
  )
  return handleResponse<SingleResponse<BusinessUnit>>(response)
}
