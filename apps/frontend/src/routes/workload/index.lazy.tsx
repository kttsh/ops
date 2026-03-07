import { useQuery } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	capacityScenariosQueryOptions,
	projectsQueryOptions,
} from "@/features/workload/api/queries";
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
import { CAPACITY_COLORS } from "@/lib/chart-colors";

export const Route = createLazyFileRoute("/workload/")({
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

	// 案件並び順（SidePanelSettings ↔ useChartData の橋渡し）
	const [projectOrder, setProjectOrder] = useState<number[]>([]);

	const handleProjectOrderChange = useCallback((order: number[]) => {
		setProjectOrder(order);
	}, []);

	// 間接作業色設定（SidePanelIndirect ↔ useChartData の橋渡し）
	const [indirectColors, setIndirectColors] = useState<Record<string, string>>(
		{},
	);

	const handleIndirectColorsChange = useCallback(
		(colors: Record<string, string>) => {
			setIndirectColors(colors);
		},
		[],
	);

	// 間接作業並び順（SidePanelIndirect ↔ useChartData の橋渡し）
	const [indirectOrder, setIndirectOrder] = useState<string[]>([]);

	const handleIndirectOrderChange = useCallback((order: string[]) => {
		setIndirectOrder(order);
	}, []);

	// キャパシティ表示状態（SidePanelSettings ↔ useChartData の橋渡し）
	const { data: csData } = useQuery(capacityScenariosQueryOptions());
	const capacityScenarios = csData?.data ?? [];

	const [capVisible, setCapVisible] = useState<Record<number, boolean>>({});
	const [capColors, setCapColors] = useState<Record<number, string>>({});

	// キャパシティシナリオ一覧の取得結果をもとに全シナリオをデフォルトONで初期化
	useEffect(() => {
		if (capacityScenarios.length > 0 && Object.keys(capVisible).length === 0) {
			const vis: Record<number, boolean> = {};
			const cols: Record<number, string> = {};
			capacityScenarios.forEach((cs, i) => {
				vis[cs.capacityScenarioId] = true;
				cols[cs.capacityScenarioId] =
					CAPACITY_COLORS[i % CAPACITY_COLORS.length];
			});
			setCapVisible(vis);
			setCapColors(cols);
		}
	}, [capacityScenarios, capVisible]);

	// チェックONのシナリオIDのみを抽出
	const capacityScenarioIds = useMemo(() => {
		return Object.entries(capVisible)
			.filter(([, visible]) => visible)
			.map(([id]) => Number(id));
	}, [capVisible]);

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
			capacityItems?: Array<{
				capacityScenarioId: number;
				isVisible: boolean;
				colorCode: string | null;
			}>;
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

			// キャパシティ設定の復元
			if (profile.capacityItems && profile.capacityItems.length > 0) {
				const vis: Record<number, boolean> = {};
				const cols: Record<number, string> = {};
				for (const item of profile.capacityItems) {
					vis[item.capacityScenarioId] = item.isVisible;
					if (item.colorCode) {
						cols[item.capacityScenarioId] = item.colorCode;
					}
				}
				setCapVisible(vis);
				setCapColors(cols);
			}
			// else: キャパシティ設定なし → 現在の状態を維持（後方互換）
		},
		[setPeriod, setPeriodAndBusinessUnits],
	);

	// chartDataParams に selectedProjectIds と capacityScenarioIds を含める
	const chartDataParamsWithFilters = useMemo(() => {
		if (!chartDataParams) return null;
		if (selectedProjectIds.size === 0) return null;
		const params = { ...chartDataParams };
		// 全選択時は projectIds を送信しない（全件取得と同じ）
		if (selectedProjectIds.size < allProjectIds.length) {
			params.projectIds = Array.from(selectedProjectIds);
		}
		if (capacityScenarioIds.length > 0) {
			params.capacityScenarioIds = capacityScenarioIds;
		}
		return params;
	}, [
		chartDataParams,
		selectedProjectIds,
		allProjectIds.length,
		capacityScenarioIds,
	]);

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
	} = useChartData(chartDataParamsWithFilters, {
		projectColors,
		projectOrder,
		indirectWorkTypeColors: indirectColors,
		indirectWorkTypeOrder: indirectOrder,
		capacityColors: capColors,
	});

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
					indirectContent={
						<SidePanelIndirect
							onColorsChange={handleIndirectColorsChange}
							onOrderChange={handleIndirectOrderChange}
						/>
					}
					settingsContent={
						<SidePanelSettings
							from={filters.from}
							months={filters.months}
							businessUnitCodes={filters.bu}
							selectedProjectIds={selectedProjectIds}
							onPeriodChange={setPeriod}
							onProjectColorsChange={handleProjectColorsChange}
							onProjectOrderChange={handleProjectOrderChange}
							capVisible={capVisible}
							capColors={capColors}
							onCapVisibleChange={setCapVisible}
							onCapColorsChange={setCapColors}
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
						<div className="grid grid-cols-1 gap-6 p-6">
							{showChart && <SkeletonChart />}
							{showTable && <SkeletonTable />}
						</div>
					)}

					{/* データ表示 */}
					{hasBusinessUnits && !isError && !isLoading && (
						<div
							className={
								filters.view === "both"
									? "grid grid-cols-1 gap-6 p-6"
									: "flex flex-col gap-6 p-6 h-full"
							}
						>
							{/* チャート + 凡例カード */}
							{showChart && (
								<div
									className={
										filters.view === "chart"
											? "rounded-3xl bg-card border border-border shadow-sm p-6 flex-1 flex flex-col"
											: "rounded-3xl bg-card border border-border shadow-sm p-6"
									}
								>
									<div
										className={
											filters.view === "chart" ? "flex flex-1" : "flex"
										}
									>
										<div className="flex-1">
											<WorkloadChart
												data={chartData}
												seriesConfig={seriesConfig}
												activeMonth={activeMonth}
												dispatch={legendDispatch}
												isFetching={isFetching}
												fullHeight={filters.view === "chart"}
											/>
										</div>
										<LegendPanel
											data={currentLegendData}
											isPinned={isPinned}
											dispatch={legendDispatch}
											seriesConfig={seriesConfig}
										/>
									</div>
								</div>
							)}

							{/* テーブルカード */}
							{showTable && (
								<div className="rounded-3xl bg-card border border-border shadow-sm p-6 overflow-hidden">
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
	);
}
