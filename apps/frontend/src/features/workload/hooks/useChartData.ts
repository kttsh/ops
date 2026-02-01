import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { chartDataQueryOptions } from '@/features/workload/api/queries'
import type {
  ChartDataParams,
  ChartDataResponse,
  MonthlyDataPoint,
  ChartSeriesConfig,
  AreaSeriesConfig,
  LineSeriesConfig,
  LegendMonthData,
} from '@/features/workload/types'

// --- デフォルトカラーパレット ---

const PROJECT_TYPE_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
]

const INDIRECT_COLORS = [
  '#6b7280', '#9ca3af', '#4b5563', '#d1d5db', '#374151',
  '#a3a3a3', '#737373', '#525252',
]

const CAPACITY_COLORS = [
  '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd',
]

export interface UseChartDataReturn {
  chartData: MonthlyDataPoint[]
  seriesConfig: ChartSeriesConfig
  legendDataByMonth: Map<string, LegendMonthData>
  latestMonth: string | null
  rawResponse: ChartDataResponse | undefined
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  error: Error | null
  refetch: () => void
}

export function useChartData(params: ChartDataParams | null): UseChartDataReturn {
  const query = useQuery({
    ...chartDataQueryOptions(params!),
    enabled: params !== null,
  })

  const rawResponse = query.data?.data

  const { chartData, seriesConfig, legendDataByMonth, latestMonth } = useMemo(() => {
    if (!rawResponse) {
      return {
        chartData: [] as MonthlyDataPoint[],
        seriesConfig: { areas: [], lines: [] } as ChartSeriesConfig,
        legendDataByMonth: new Map<string, LegendMonthData>(),
        latestMonth: null,
      }
    }

    // 期間内の全月を生成
    const months = generateMonthRange(rawResponse.period.startYearMonth, rawResponse.period.endYearMonth)

    // シリーズ設定を構築
    const areas: AreaSeriesConfig[] = []
    const lines: LineSeriesConfig[] = []

    // 間接作業エリアシリーズ（下層）
    rawResponse.indirectWorkLoads.forEach((iw, idx) => {
      const key = `indirect_${iw.indirectWorkCaseId}`
      areas.push({
        dataKey: key,
        stackId: 'workload',
        fill: INDIRECT_COLORS[idx % INDIRECT_COLORS.length],
        stroke: INDIRECT_COLORS[idx % INDIRECT_COLORS.length],
        fillOpacity: 0.7,
        name: iw.caseName,
        type: 'indirect',
      })
    })

    // 案件エリアシリーズ（上層）
    rawResponse.projectLoads.forEach((pl, idx) => {
      const key = `project_${pl.projectId}`
      areas.push({
        dataKey: key,
        stackId: 'workload',
        fill: PROJECT_TYPE_COLORS[idx % PROJECT_TYPE_COLORS.length],
        stroke: PROJECT_TYPE_COLORS[idx % PROJECT_TYPE_COLORS.length],
        fillOpacity: 0.8,
        name: pl.projectName,
        type: 'project',
      })
    })

    // キャパシティラインシリーズ
    rawResponse.capacities.forEach((cap, idx) => {
      const key = `capacity_${cap.capacityScenarioId}`
      lines.push({
        dataKey: key,
        stroke: CAPACITY_COLORS[idx % CAPACITY_COLORS.length],
        strokeDasharray: '5 5',
        name: cap.scenarioName,
      })
    })

    // 月別データポイントを構築
    const dataPoints: MonthlyDataPoint[] = months.map((ym) => {
      const point: MonthlyDataPoint = {
        month: `${ym.slice(0, 4)}/${ym.slice(4, 6)}`,
        yearMonth: ym,
      }

      // 間接作業
      for (const iw of rawResponse.indirectWorkLoads) {
        const key = `indirect_${iw.indirectWorkCaseId}`
        const monthData = iw.monthly.find((m) => m.yearMonth === ym)
        point[key] = monthData?.manhour ?? 0
      }

      // 案件
      for (const pl of rawResponse.projectLoads) {
        const key = `project_${pl.projectId}`
        const monthData = pl.monthly.find((m) => m.yearMonth === ym)
        point[key] = monthData?.manhour ?? 0
      }

      // キャパシティ
      for (const cap of rawResponse.capacities) {
        const key = `capacity_${cap.capacityScenarioId}`
        const monthData = cap.monthly.find((m) => m.yearMonth === ym)
        point[key] = monthData?.capacity ?? 0
      }

      return point
    })

    // 凡例パネル用データ
    const legendMap = new Map<string, LegendMonthData>()
    for (const ym of months) {
      const projects = rawResponse.projectLoads.map((pl) => {
        const monthData = pl.monthly.find((m) => m.yearMonth === ym)
        return {
          projectId: pl.projectId,
          name: pl.projectName,
          manhour: monthData?.manhour ?? 0,
        }
      })

      const indirectWorks = rawResponse.indirectWorkLoads.map((iw) => {
        const monthData = iw.monthly.find((m) => m.yearMonth === ym)
        return {
          caseId: iw.indirectWorkCaseId,
          caseName: iw.caseName,
          manhour: monthData?.manhour ?? 0,
        }
      })

      const capacities = rawResponse.capacities.map((cap) => {
        const monthData = cap.monthly.find((m) => m.yearMonth === ym)
        return {
          scenarioId: cap.capacityScenarioId,
          scenarioName: cap.scenarioName,
          capacity: monthData?.capacity ?? 0,
        }
      })

      const totalManhour =
        projects.reduce((sum, p) => sum + p.manhour, 0) +
        indirectWorks.reduce((sum, iw) => sum + iw.manhour, 0)
      const totalCapacity = capacities.length > 0 ? Math.max(...capacities.map((c) => c.capacity)) : 0

      legendMap.set(ym, {
        yearMonth: ym,
        month: `${ym.slice(0, 4)}/${ym.slice(4, 6)}`,
        projects,
        indirectWorks,
        capacities,
        totalManhour,
        totalCapacity,
      })
    }

    const latest = months.length > 0 ? months[months.length - 1] : null

    return {
      chartData: dataPoints,
      seriesConfig: { areas, lines },
      legendDataByMonth: legendMap,
      latestMonth: latest,
    }
  }, [rawResponse])

  return {
    chartData,
    seriesConfig,
    legendDataByMonth,
    latestMonth,
    rawResponse,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}

function generateMonthRange(start: string, end: string): string[] {
  const months: string[] = []
  let year = parseInt(start.slice(0, 4), 10)
  let month = parseInt(start.slice(4, 6), 10)
  const endYear = parseInt(end.slice(0, 4), 10)
  const endMonth = parseInt(end.slice(4, 6), 10)

  while (year < endYear || (year === endYear && month <= endMonth)) {
    months.push(`${year}${String(month).padStart(2, '0')}`)
    month++
    if (month > 12) {
      month = 1
      year++
    }
  }
  return months
}
