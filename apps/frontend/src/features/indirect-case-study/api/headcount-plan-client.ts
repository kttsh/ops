import { API_BASE_URL, handleResponse } from '@/lib/api'
import type {
  HeadcountPlanCase,
  MonthlyHeadcountPlan,
  HeadcountPlanCaseListParams,
  CreateHeadcountPlanCaseInput,
  UpdateHeadcountPlanCaseInput,
  BulkMonthlyHeadcountInput,
  PaginatedResponse,
  SingleResponse,
} from '@/features/indirect-case-study/types'

// ============================================================
// Headcount Plan Cases
// ============================================================

export async function fetchHeadcountPlanCases(
  params: HeadcountPlanCaseListParams,
): Promise<PaginatedResponse<HeadcountPlanCase>> {
  const searchParams = new URLSearchParams({
    'page[number]': '1',
    'page[size]': '1000',
  })
  if (params.businessUnitCode) {
    searchParams.set('filter[businessUnitCode]', params.businessUnitCode)
  }
  if (params.includeDisabled) {
    searchParams.set('filter[includeDisabled]', 'true')
  }
  const response = await fetch(`${API_BASE_URL}/headcount-plan-cases?${searchParams}`)
  return handleResponse<PaginatedResponse<HeadcountPlanCase>>(response)
}

export async function createHeadcountPlanCase(
  input: CreateHeadcountPlanCaseInput,
): Promise<SingleResponse<HeadcountPlanCase>> {
  const response = await fetch(`${API_BASE_URL}/headcount-plan-cases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return handleResponse<SingleResponse<HeadcountPlanCase>>(response)
}

export async function updateHeadcountPlanCase(
  id: number,
  input: UpdateHeadcountPlanCaseInput,
): Promise<SingleResponse<HeadcountPlanCase>> {
  const response = await fetch(`${API_BASE_URL}/headcount-plan-cases/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return handleResponse<SingleResponse<HeadcountPlanCase>>(response)
}

export async function deleteHeadcountPlanCase(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/headcount-plan-cases/${id}`, {
    method: 'DELETE',
  })
  return handleResponse<void>(response)
}

export async function restoreHeadcountPlanCase(
  id: number,
): Promise<SingleResponse<HeadcountPlanCase>> {
  const response = await fetch(
    `${API_BASE_URL}/headcount-plan-cases/${id}/actions/restore`,
    { method: 'POST' },
  )
  return handleResponse<SingleResponse<HeadcountPlanCase>>(response)
}

// ============================================================
// Monthly Headcount Plans
// ============================================================

export async function fetchMonthlyHeadcountPlans(
  caseId: number,
  businessUnitCode: string,
): Promise<PaginatedResponse<MonthlyHeadcountPlan>> {
  const searchParams = new URLSearchParams({
    'page[number]': '1',
    'page[size]': '1000',
    businessUnitCode,
  })
  const response = await fetch(
    `${API_BASE_URL}/headcount-plan-cases/${caseId}/monthly-headcount-plans?${searchParams}`,
  )
  return handleResponse<PaginatedResponse<MonthlyHeadcountPlan>>(response)
}

export async function bulkUpdateMonthlyHeadcountPlans(
  caseId: number,
  input: BulkMonthlyHeadcountInput,
): Promise<{ data: MonthlyHeadcountPlan[] }> {
  const response = await fetch(
    `${API_BASE_URL}/headcount-plan-cases/${caseId}/monthly-headcount-plans/bulk`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
  )
  return handleResponse<{ data: MonthlyHeadcountPlan[] }>(response)
}
