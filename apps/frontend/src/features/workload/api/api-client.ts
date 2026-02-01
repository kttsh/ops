import { API_BASE_URL, handleResponse } from '@/lib/api'
import type {
  PaginatedResponse,
  SingleResponse,
} from '@/lib/api'
import type {
  ChartDataResponse,
  ChartDataParams,
  BusinessUnit,
  ProjectType,
  CapacityScenario,
  IndirectWorkCase,
  Project,
  ChartColorSetting,
  ChartColorSettingInput,
  ChartStackOrderSetting,
  ChartStackOrderSettingInput,
  ChartView,
  CreateChartViewInput,
  UpdateChartViewInput,
} from '@/features/workload/types'

// ============================================================
// Chart Data
// ============================================================

export async function fetchChartData(
  params: ChartDataParams,
): Promise<SingleResponse<ChartDataResponse>> {
  const searchParams = new URLSearchParams({
    businessUnitCodes: params.businessUnitCodes.join(','),
    startYearMonth: params.startYearMonth,
    endYearMonth: params.endYearMonth,
  })
  if (params.capacityScenarioIds?.length) {
    searchParams.set('capacityScenarioIds', params.capacityScenarioIds.join(','))
  }
  if (params.indirectWorkCaseIds?.length) {
    searchParams.set('indirectWorkCaseIds', params.indirectWorkCaseIds.join(','))
  }
  if (params.projectIds?.length) {
    searchParams.set('projectIds', params.projectIds.join(','))
  }
  if (params.chartViewId) {
    searchParams.set('chartViewId', String(params.chartViewId))
  }

  const response = await fetch(`${API_BASE_URL}/chart-data?${searchParams}`)
  return handleResponse<SingleResponse<ChartDataResponse>>(response)
}

// ============================================================
// Master Data
// ============================================================

export async function fetchBusinessUnits(): Promise<PaginatedResponse<BusinessUnit>> {
  const searchParams = new URLSearchParams({
    'page[number]': '1',
    'page[size]': '1000',
  })
  const response = await fetch(`${API_BASE_URL}/business-units?${searchParams}`)
  return handleResponse<PaginatedResponse<BusinessUnit>>(response)
}

export async function fetchCapacityScenarios(): Promise<PaginatedResponse<CapacityScenario>> {
  const searchParams = new URLSearchParams({
    'page[number]': '1',
    'page[size]': '1000',
  })
  const response = await fetch(`${API_BASE_URL}/capacity-scenarios?${searchParams}`)
  return handleResponse<PaginatedResponse<CapacityScenario>>(response)
}

export async function fetchIndirectWorkCases(): Promise<PaginatedResponse<IndirectWorkCase>> {
  const searchParams = new URLSearchParams({
    'page[number]': '1',
    'page[size]': '1000',
  })
  const response = await fetch(`${API_BASE_URL}/indirect-work-cases?${searchParams}`)
  return handleResponse<PaginatedResponse<IndirectWorkCase>>(response)
}

export async function fetchProjects(params?: {
  businessUnitCodes?: string[]
}): Promise<PaginatedResponse<Project>> {
  const searchParams = new URLSearchParams({
    'page[number]': '1',
    'page[size]': '1000',
  })
  if (params?.businessUnitCodes?.length) {
    searchParams.set('filter[businessUnitCodes]', params.businessUnitCodes.join(','))
  }
  const response = await fetch(`${API_BASE_URL}/projects?${searchParams}`)
  return handleResponse<PaginatedResponse<Project>>(response)
}

export async function fetchProjectTypes(): Promise<PaginatedResponse<ProjectType>> {
  const searchParams = new URLSearchParams({
    'page[number]': '1',
    'page[size]': '1000',
  })
  const response = await fetch(`${API_BASE_URL}/project-types?${searchParams}`)
  return handleResponse<PaginatedResponse<ProjectType>>(response)
}

// ============================================================
// Chart Color Settings
// ============================================================

export async function fetchChartColorSettings(
  targetType?: string,
): Promise<PaginatedResponse<ChartColorSetting>> {
  const searchParams = new URLSearchParams({
    'page[number]': '1',
    'page[size]': '1000',
  })
  if (targetType) {
    searchParams.set('filter[targetType]', targetType)
  }
  const response = await fetch(`${API_BASE_URL}/chart-color-settings?${searchParams}`)
  return handleResponse<PaginatedResponse<ChartColorSetting>>(response)
}

export async function bulkUpsertChartColorSettings(
  items: ChartColorSettingInput[],
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/chart-color-settings/bulk`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  })
  return handleResponse<void>(response)
}

// ============================================================
// Chart Stack Order Settings
// ============================================================

export async function fetchChartStackOrderSettings(
  targetType?: string,
): Promise<PaginatedResponse<ChartStackOrderSetting>> {
  const searchParams = new URLSearchParams({
    'page[number]': '1',
    'page[size]': '1000',
  })
  if (targetType) {
    searchParams.set('filter[targetType]', targetType)
  }
  const response = await fetch(`${API_BASE_URL}/chart-stack-order-settings?${searchParams}`)
  return handleResponse<PaginatedResponse<ChartStackOrderSetting>>(response)
}

export async function bulkUpsertChartStackOrderSettings(
  items: ChartStackOrderSettingInput[],
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/chart-stack-order-settings/bulk`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  })
  return handleResponse<void>(response)
}

// ============================================================
// Chart Views (Profiles)
// ============================================================

export async function fetchChartViews(): Promise<PaginatedResponse<ChartView>> {
  const searchParams = new URLSearchParams({
    'page[number]': '1',
    'page[size]': '1000',
  })
  const response = await fetch(`${API_BASE_URL}/chart-views?${searchParams}`)
  return handleResponse<PaginatedResponse<ChartView>>(response)
}

export async function createChartView(
  input: CreateChartViewInput,
): Promise<SingleResponse<ChartView>> {
  const response = await fetch(`${API_BASE_URL}/chart-views`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return handleResponse<SingleResponse<ChartView>>(response)
}

export async function updateChartView(
  id: number,
  input: UpdateChartViewInput,
): Promise<SingleResponse<ChartView>> {
  const response = await fetch(`${API_BASE_URL}/chart-views/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  return handleResponse<SingleResponse<ChartView>>(response)
}

export async function deleteChartView(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/chart-views/${id}`, {
    method: 'DELETE',
  })
  return handleResponse<void>(response)
}
