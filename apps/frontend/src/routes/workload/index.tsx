import { useState, useCallback, useEffect, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { workloadSearchSchema } from '@/features/workload'
import { useWorkloadFilters } from '@/features/workload/hooks/useWorkloadFilters'
import { useChartData } from '@/features/workload/hooks/useChartData'
import { useLegendState } from '@/features/workload/hooks/useLegendState'
import { useTableData } from '@/features/workload/hooks/useTableData'
import { useQuery } from '@tanstack/react-query'
import { projectsQueryOptions } from '@/features/workload/api/queries'
import { WorkloadChart } from '@/features/workload/components/WorkloadChart'
import { LegendPanel } from '@/features/workload/components/LegendPanel'
import { SidePanel } from '@/features/workload/components/SidePanel'
import { SidePanelProjects } from '@/features/workload/components/SidePanelProjects'
import { SidePanelIndirect } from '@/features/workload/components/SidePanelIndirect'
import { SidePanelSettings } from '@/features/workload/components/SidePanelSettings'
import { BusinessUnitSelector } from '@/features/workload/components/BusinessUnitSelector'
import { ViewToggle } from '@/features/workload/components/ViewToggle'
import { WorkloadDataTable } from '@/features/workload/components/WorkloadDataTable'
import {
  SkeletonChart,
  SkeletonTable,
  BuEmptyState,
  ErrorState,
} from '@/features/workload/components/FeedbackStates'

export const Route = createFileRoute('/workload/')({
  validateSearch: workloadSearchSchema,
  component: WorkloadPage,
})

function WorkloadPage() {
  const {
    filters,
    setBusinessUnits,
    setPeriod,
    setViewMode,
    setSidePanelTab,
    hasBusinessUnits,
    chartDataParams,
  } = useWorkloadFilters()

  // 案件一覧を取得（selectedProjectIds の初期化に使用）
  const { data: projectsData } = useQuery(projectsQueryOptions(filters.bu))
  const allProjectIds = useMemo(
    () => projectsData?.data?.map((p) => p.projectId) ?? [],
    [projectsData?.data],
  )

  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<number>>(
    () => new Set(),
  )

  // BU変更時・案件一覧取得時に全案件を選択状態にする
  useEffect(() => {
    if (allProjectIds.length > 0) {
      setSelectedProjectIds(new Set(allProjectIds))
    } else {
      setSelectedProjectIds(new Set())
    }
  }, [allProjectIds])

  const handleProjectSelectionChange = useCallback((ids: Set<number>) => {
    setSelectedProjectIds(ids)
  }, [])

  // 案件色設定（SidePanelSettings ↔ useChartData の橋渡し）
  const [projectColors, setProjectColors] = useState<Record<number, string>>({})

  const handleProjectColorsChange = useCallback(
    (colors: Record<number, string>) => {
      setProjectColors(colors)
    },
    [],
  )

  // プロファイル適用
  const handleProfileApply = useCallback(
    (profile: {
      chartViewId: number
      startYearMonth: string
      endYearMonth: string
    }) => {
      // startYearMonth と endYearMonth から months を計算
      const startY = parseInt(profile.startYearMonth.slice(0, 4), 10)
      const startM = parseInt(profile.startYearMonth.slice(4, 6), 10)
      const endY = parseInt(profile.endYearMonth.slice(0, 4), 10)
      const endM = parseInt(profile.endYearMonth.slice(4, 6), 10)
      const months = (endY - startY) * 12 + (endM - startM) + 1
      setPeriod(profile.startYearMonth, months)
    },
    [setPeriod],
  )

  // chartDataParams に selectedProjectIds を含める
  const chartDataParamsWithProjects = useMemo(() => {
    if (!chartDataParams) return null
    if (selectedProjectIds.size === 0) return null
    // 全選択時は projectIds を送信しない（全件取得と同じ）
    if (selectedProjectIds.size === allProjectIds.length) return chartDataParams
    return {
      ...chartDataParams,
      projectIds: Array.from(selectedProjectIds),
    }
  }, [chartDataParams, selectedProjectIds, allProjectIds.length])

  const {
    chartData,
    seriesConfig,
    legendDataByMonth,
    latestMonth,
    rawResponse,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useChartData(chartDataParamsWithProjects, { projectColors })

  const { dispatch: legendDispatch, activeMonth, isPinned } =
    useLegendState(latestMonth)

  const tableData = useTableData(rawResponse)

  const showChart = filters.view === 'chart' || filters.view === 'both'
  const showTable = filters.view === 'table' || filters.view === 'both'

  const currentLegendData = activeMonth
    ? legendDataByMonth.get(activeMonth)
    : undefined

  return (
    <div className="flex h-full flex-col">
      {/* ヘッダーバー */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <h1 className="text-lg font-semibold">山積ダッシュボード</h1>
        <ViewToggle value={filters.view} onChange={setViewMode} />
      </div>

      {/* BU選択 */}
      <div className="border-b border-border px-4 py-3">
        <BusinessUnitSelector
          selectedCodes={filters.bu}
          onChange={setBusinessUnits}
        />
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 overflow-hidden">
        <SidePanel
          tab={filters.tab}
          onTabChange={setSidePanelTab}
          projectsContent={
            <SidePanelProjects
              businessUnitCodes={filters.bu}
              selectedProjectIds={selectedProjectIds}
              onSelectionChange={handleProjectSelectionChange}
            />
          }
          indirectContent={<SidePanelIndirect />}
          settingsContent={
            <SidePanelSettings
              from={filters.from}
              months={filters.months}
              businessUnitCodes={filters.bu}
              onPeriodChange={setPeriod}
              onProjectColorsChange={handleProjectColorsChange}
              onProfileApply={handleProfileApply}
            />
          }
        >
          {/* BU未選択 */}
          {!hasBusinessUnits && (
            <div className="p-6">
              <BuEmptyState />
            </div>
          )}

          {/* エラー状態 */}
          {hasBusinessUnits && isError && (
            <div className="p-6">
              <ErrorState onRetry={refetch} />
            </div>
          )}

          {/* ローディング状態 */}
          {hasBusinessUnits && !isError && isLoading && (
            <div className="space-y-6 p-6">
              {showChart && <SkeletonChart />}
              {showTable && <SkeletonTable />}
            </div>
          )}

          {/* データ表示 */}
          {hasBusinessUnits && !isError && !isLoading && (
            <div className="flex h-full flex-col">
              {/* チャート + 凡例 */}
              {showChart && (
                <div className="flex border-b border-border">
                  <div className="flex-1 p-4">
                    <WorkloadChart
                      data={chartData}
                      seriesConfig={seriesConfig}
                      activeMonth={activeMonth}
                      dispatch={legendDispatch}
                      isFetching={isFetching}
                    />
                  </div>
                  <LegendPanel
                    data={currentLegendData}
                    isPinned={isPinned}
                    dispatch={legendDispatch}
                    seriesConfig={seriesConfig}
                  />
                </div>
              )}

              {/* テーブル */}
              {showTable && (
                <div className="flex-1 overflow-hidden p-4">
                  <WorkloadDataTable
                    rows={tableData.rows}
                    filteredRows={tableData.filteredRows}
                    selectedYear={tableData.selectedYear}
                    availableYears={tableData.availableYears}
                    onYearChange={tableData.setSelectedYear}
                    searchText={tableData.searchText}
                    onSearchChange={tableData.setSearchText}
                    rowTypeFilter={tableData.rowTypeFilter}
                    onRowTypeFilterChange={tableData.setRowTypeFilter}
                  />
                </div>
              )}
            </div>
          )}
        </SidePanel>
      </div>
    </div>
  )
}
