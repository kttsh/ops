import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { workloadSearchSchema } from "@/features/workload";
import { projectsQueryOptions } from "@/features/workload/api/queries";
import { BusinessUnitSelector } from "@/features/workload/components/BusinessUnitSelector";
import {
	BuEmptyState,
	ErrorState,
	SkeletonChart,
	SkeletonTable,
} from "@/features/workload/components/FeedbackStates";
import { LegendPanel } from "@/features/workload/components/LegendPanel";
import { SidePanel } from "@/features/workload/components/SidePanel";
import { SidePanelIndirect } from "@/features/workload/components/SidePanelIndirect";
import { SidePanelProjects } from "@/features/workload/components/SidePanelProjects";
import { SidePanelSettings } from "@/features/workload/components/SidePanelSettings";
import { ViewToggle } from "@/features/workload/components/ViewToggle";
import { WorkloadChart } from "@/features/workload/components/WorkloadChart";
import { WorkloadDataTable } from "@/features/workload/components/WorkloadDataTable";
import { useChartData } from "@/features/workload/hooks/useChartData";
import { useLegendState } from "@/features/workload/hooks/useLegendState";
import { useTableData } from "@/features/workload/hooks/useTableData";
import { useWorkloadFilters } from "@/features/workload/hooks/useWorkloadFilters";
import { Card } from "@/components/ui/card"; // Assuming Card component exists or use div

export const Route = createFileRoute("/workload/")({
	validateSearch: workloadSearchSchema,
	component: WorkloadPage,
});

function WorkloadPage() {
	const {
		filters,
		setBusinessUnits,
		setPeriod,
		setPeriodAndBusinessUnits,
		setViewMode,
		setSidePanelTab,
		hasBusinessUnits,
		chartDataParams,
	} = useWorkloadFilters();

	// 案件一覧を取得（selectedProjectIds の初期化に使用）
	const { data: projectsData } = useQuery(projectsQueryOptions(filters.bu));
	const allProjectIds = useMemo(
		() => projectsData?.data?.map((p) => p.projectId) ?? [],
		[projectsData?.data],
	);

	const [selectedProjectIds, setSelectedProjectIds] = useState<Set<number>>(
		() => new Set(),
	);

	// BU変更時・案件一覧取得時に全案件を選択状態にする
	useEffect(() => {
		if (allProjectIds.length > 0) {
			setSelectedProjectIds(new Set(allProjectIds));
		} else {
			setSelectedProjectIds(new Set());
		}
	}, [allProjectIds]);

	const handleProjectSelectionChange = useCallback((ids: Set<number>) => {
		setSelectedProjectIds(ids);
	}, []);

	// 案件色設定（SidePanelSettings ↔ useChartData の橋渡し）
	const [projectColors, setProjectColors] = useState<Record<number, string>>(
		{},
	);

	const handleProjectColorsChange = useCallback(
		(colors: Record<number, string>) => {
			setProjectColors(colors);
		},
		[],
	);

	// プロファイル適用
	const handleProfileApply = useCallback(
		(profile: {
			chartViewId: number;
			startYearMonth: string;
			endYearMonth: string;
			projectItems: Array<{
				projectId: number;
				projectCaseId: number | null;
				displayOrder: number;
				isVisible: boolean;
				color: string | null;
			}>;
			businessUnitCodes: string[] | null;
		}) => {
			// startYearMonth と endYearMonth から months を計算
			const startY = parseInt(profile.startYearMonth.slice(0, 4), 10);
			const startM = parseInt(profile.startYearMonth.slice(4, 6), 10);
			const endY = parseInt(profile.endYearMonth.slice(0, 4), 10);
			const endM = parseInt(profile.endYearMonth.slice(4, 6), 10);
			const months = (endY - startY) * 12 + (endM - startM) + 1;
			// BU 復元と期間復元を1回の URL 更新で一括実行
			if (profile.businessUnitCodes !== null) {
				setPeriodAndBusinessUnits(
					profile.startYearMonth,
					months,
					profile.businessUnitCodes,
				);
			} else {
				setPeriod(profile.startYearMonth, months);
			}
		},
		[setPeriod, setPeriodAndBusinessUnits],
	);

	// chartDataParams に selectedProjectIds を含める
	const chartDataParamsWithProjects = useMemo(() => {
		if (!chartDataParams) return null;
		if (selectedProjectIds.size === 0) return null;
		// 全選択時は projectIds を送信しない（全件取得と同じ）
		if (selectedProjectIds.size === allProjectIds.length)
			return chartDataParams;
		return {
			...chartDataParams,
			projectIds: Array.from(selectedProjectIds),
		};
	}, [chartDataParams, selectedProjectIds, allProjectIds.length]);

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
	} = useChartData(chartDataParamsWithProjects, { projectColors });

	const {
		dispatch: legendDispatch,
		activeMonth,
		isPinned,
	} = useLegendState(latestMonth);

	const tableData = useTableData(rawResponse);

	const showChart = filters.view === "chart" || filters.view === "both";
	const showTable = filters.view === "table" || filters.view === "both";

	const currentLegendData = activeMonth
		? legendDataByMonth.get(activeMonth)
		: undefined;

	return (
		<div className="flex h-full flex-col gap-6">
			{/* ヘッダーセクション */}
			<div className="flex items-center justify-between">
				<div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">山積ダッシュボード</h1>
                    <p className="text-sm text-muted-foreground mt-1">Workload visualization and analysis</p>
                </div>
				<ViewToggle value={filters.view} onChange={setViewMode} />
			</div>

            {/* メインカード */}
			<div className="flex-1 overflow-hidden rounded-3xl border border-border bg-card shadow-sm flex flex-col">
                 {/* フィルターエリア */}
			    <div className="border-b border-border bg-muted px-6 py-4">
				    <BusinessUnitSelector
					    selectedCodes={filters.bu}
					    onChange={setBusinessUnits}
				    />
			    </div>

			    {/* コンテンツエリア */}
			    <div className="flex-1 overflow-hidden relative bg-card">
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
							    selectedProjectIds={selectedProjectIds}
							    onPeriodChange={setPeriod}
							    onProjectColorsChange={handleProjectColorsChange}
							    onProfileApply={handleProfileApply}
						    />
					    }
				    >
					    {/* BU未選択 */}
					    {!hasBusinessUnits && (
						    <div className="p-8 flex items-center justify-center h-full">
							    <BuEmptyState />
						    </div>
					    )}

					    {/* エラー状態 */}
					    {hasBusinessUnits && isError && (
						    <div className="p-8 flex items-center justify-center h-full">
							    <ErrorState onRetry={refetch} />
						    </div>
					    )}

					    {/* ローディング状態 */}
					    {hasBusinessUnits && !isError && isLoading && (
						    <div className="space-y-6 p-8">
							    {showChart && <SkeletonChart />}
							    {showTable && <SkeletonTable />}
						    </div>
					    )}

					    {/* データ表示 */}
					    {hasBusinessUnits && !isError && !isLoading && (
						    <div className="flex h-full flex-col bg-card">
							    {/* チャート + 凡例 */}
							    {showChart && (
								    <div className="flex flex-col border-b border-border lg:flex-row h-[60%] lg:h-[55%]">
									    <div className="flex-1 p-6 overflow-hidden bg-card">
										    <WorkloadChart
											    data={chartData}
											    seriesConfig={seriesConfig}
											    activeMonth={activeMonth}
											    dispatch={legendDispatch}
											    isFetching={isFetching}
										    />
									    </div>
                                        <div className="border-t lg:border-t-0 lg:border-l border-border bg-card w-full lg:w-80 overflow-y-auto">
									        <LegendPanel
										        data={currentLegendData}
										        isPinned={isPinned}
										        dispatch={legendDispatch}
										        seriesConfig={seriesConfig}
									        />
                                        </div>
								    </div>
							    )}

							    {/* テーブル */}
							    {showTable && (
								    <div className="flex-1 overflow-hidden p-6 bg-card">
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
		</div>
	);
}
