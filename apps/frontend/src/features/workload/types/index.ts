import { z } from 'zod'

// --- 共通型を共有レイヤーから re-export ---
export type {
  PaginatedResponse,
  SingleResponse,
  ProblemDetails,
  SelectOption,
} from '@/lib/api'

// ============================================================
// API レスポンス型（バックエンド ChartDataResponse と対応）
// ============================================================

export type ProjectDetail = {
  projectId: number
  projectName: string
  monthly: Array<{ yearMonth: string; manhour: number }>
}

export type ProjectLoadAggregation = {
  projectTypeCode: string | null
  projectTypeName: string | null
  monthly: Array<{ yearMonth: string; manhour: number }>
  projects: ProjectDetail[]
}

export type IndirectWorkTypeBreakdown = {
  workTypeCode: string
  workTypeName: string
  manhour: number
}

export type IndirectWorkLoadMonthly = {
  yearMonth: string
  manhour: number
  source: 'calculated' | 'manual'
  breakdown: IndirectWorkTypeBreakdown[]
  breakdownCoverage: number
}

export type IndirectWorkLoadAggregation = {
  indirectWorkCaseId: number
  caseName: string
  businessUnitCode: string
  monthly: IndirectWorkLoadMonthly[]
}

export type CapacityAggregation = {
  capacityScenarioId: number
  scenarioName: string
  monthly: Array<{ yearMonth: string; capacity: number }>
}

export type ChartDataResponse = {
  projectLoads: ProjectLoadAggregation[]
  indirectWorkLoads: IndirectWorkLoadAggregation[]
  capacities: CapacityAggregation[]
  period: { startYearMonth: string; endYearMonth: string }
  businessUnitCodes: string[]
}

// ============================================================
// マスタデータ型
// ============================================================

export type BusinessUnit = {
  businessUnitCode: string
  name: string
  displayOrder: number
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

export type ProjectType = {
  projectTypeCode: string
  name: string
  displayOrder: number
  color: string | null
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

export type CapacityScenario = {
  capacityScenarioId: number
  scenarioName: string
  isPrimary: boolean
  description: string | null
  hoursPerPerson: number
  createdAt: string
  updatedAt: string
}

export type IndirectWorkCase = {
  indirectWorkCaseId: number
  caseName: string
  businessUnitCode: string
  createdAt: string
  updatedAt: string
}

export type Project = {
  projectId: number
  projectCode: string
  name: string
  businessUnitCode: string
  businessUnitName: string
  projectTypeCode: string | null
  projectTypeName: string | null
  startYearMonth: string
  totalManhour: number
  status: string
  durationMonths: number | null
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

// ============================================================
// 設定型
// ============================================================

export type ChartColorSetting = {
  chartColorSettingId: number
  targetType: string
  targetCode: string
  color: string
  createdAt: string
  updatedAt: string
}

export type ChartColorSettingInput = {
  targetType: string
  targetCode: string
  color: string
}

export type ChartStackOrderSetting = {
  chartStackOrderSettingId: number
  targetType: string
  targetCode: string
  displayOrder: number
  isVisible: boolean
  createdAt: string
  updatedAt: string
}

export type ChartStackOrderSettingInput = {
  targetType: string
  targetCode: string
  displayOrder: number
  isVisible: boolean
}

export type ChartView = {
  chartViewId: number
  viewName: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export type CreateChartViewInput = {
  viewName: string
  chartType: string
  startYearMonth: string
  endYearMonth: string
  description?: string | null
}

export type UpdateChartViewInput = {
  viewName?: string
  description?: string | null
}

// ============================================================
// チャート描画用型
// ============================================================

export type AreaSeriesConfig = {
  dataKey: string
  stackId: string
  fill: string
  stroke: string
  fillOpacity: number
  name: string
  type: 'project' | 'indirect'
}

export type LineSeriesConfig = {
  dataKey: string
  stroke: string
  strokeDasharray: string
  name: string
}

export type ChartSeriesConfig = {
  areas: AreaSeriesConfig[]
  lines: LineSeriesConfig[]
}

export type MonthlyDataPoint = {
  month: string // "YYYY/MM" 表示用
  yearMonth: string // "YYYYMM" 内部キー
  [seriesKey: string]: string | number
}

// ============================================================
// 凡例パネル用型
// ============================================================

export type LegendMonthData = {
  yearMonth: string
  month: string
  projectTypes: Array<{
    code: string | null
    name: string | null
    manhour: number
    projects?: Array<{ name: string; manhour: number }>
  }>
  indirectWorks: Array<{
    caseId: number
    caseName: string
    manhour: number
  }>
  capacities: Array<{
    scenarioId: number
    scenarioName: string
    capacity: number
  }>
  totalManhour: number
  totalCapacity: number
}

// ============================================================
// テーブル用型
// ============================================================

export type TableRowType = 'capacity' | 'indirect' | 'project' | 'projectDetail'

export type TableRow = {
  id: string
  rowType: TableRowType
  name: string
  businessUnitCode?: string
  projectTypeCode?: string | null
  projectTypeName?: string | null
  total: number
  monthly: Record<string, number> // key: "YYYY_MM", value: manhour
  subRows?: TableRow[]
  parentId?: string
}

// ============================================================
// API パラメータ型
// ============================================================

export type ChartDataParams = {
  businessUnitCodes: string[]
  startYearMonth: string
  endYearMonth: string
  projectIds?: number[]
  capacityScenarioIds?: number[]
  indirectWorkCaseIds?: number[]
  chartViewId?: number
}

// ============================================================
// 凡例パネル状態型
// ============================================================

export type LegendMode = 'initial' | 'hovering' | 'pinned'

export type LegendState = {
  mode: LegendMode
  activeMonth: string | null
  pinnedMonth: string | null
  expandedTypeCode: string | null
}

export type LegendAction =
  | { type: 'HOVER'; yearMonth: string }
  | { type: 'HOVER_LEAVE' }
  | { type: 'CLICK'; yearMonth: string }
  | { type: 'UNPIN' }
  | { type: 'TOGGLE_DRILLDOWN'; typeCode: string }

// ============================================================
// URL Search Params スキーマ
// ============================================================

export const workloadSearchSchema = z.object({
  bu: z.array(z.string()).catch([]).default([]),
  from: z
    .string()
    .regex(/^\d{6}$/)
    .optional()
    .catch(undefined),
  months: z.number().int().min(1).max(60).catch(36).default(36),
  view: z.enum(['chart', 'table', 'both']).catch('both').default('both'),
  tab: z
    .enum(['projects', 'indirect', 'settings'])
    .catch('projects')
    .default('projects'),
})

export type WorkloadSearchParams = z.infer<typeof workloadSearchSchema>
