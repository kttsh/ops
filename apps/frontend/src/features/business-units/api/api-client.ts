import { API_BASE_URL, ApiError, handleResponse } from '@/lib/api'
import type {
  BusinessUnit,
  BusinessUnitListParams,
  CreateBusinessUnitInput,
  UpdateBusinessUnitInput,
  PaginatedResponse,
  SingleResponse,
} from '@/features/business-units/types'

export { ApiError }

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
