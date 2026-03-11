import { useQuery } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	projectsQueryOptions,
	stackOrderSettingsQueryOptions,
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
import type { BulkUpsertProjectItemInput } from "@/features/workload/types";
import {
	hasNonDefaultCaseSelection,
	initializeCaseSelection,
	syncCaseSelectionWithProjects,
} from "@/features/workload/utils/case-selection";

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
	const projects = useMemo(
		() => projectsData?.data ?? [],
		[projectsData?.data],
	);
	const allProjectIds = useMemo(
		() => projects.map((p) => p.projectId),
		[projects],
	);

	const [selectedProjectIds, setSelectedProjectIds] = useState<Set<number>>(
		() => new Set(),
	);

	// ケース選択状態（projectId → projectCaseId）
	const [selectedCaseIds, setSelectedCaseIds] = useState<Map<number, number>>(
		() => new Map(),
	);

	// BU変更時・案件一覧取得時に全案件を選択状態にし、デフォルトケースで初期化
	useEffect(() => {
		if (allProjectIds.length > 0) {
			const newIds = new Set(allProjectIds);
			setSelectedProjectIds(newIds);
			setSelectedCaseIds(initializeCaseSelection(projects, newIds));
		} else {
			setSelectedProjectIds(new Set());
			setSelectedCaseIds(new Map());
		}
	}, [allProjectIds, projects]);

	const handleProjectSelectionChange = useCallback(
		(ids: Set<number>) => {
			setSelectedProjectIds(ids);
			setSelectedCaseIds((prev) =>
				syncCaseSelectionWithProjects(prev, ids, projects),
			);
		},
		[projects],
	);

	const handleCaseChange = useCallback(
		(projectId: number, projectCaseId: number) => {
			setSelectedCaseIds((prev) => {
				const next = new Map(prev);
				next.set(projectId, projectCaseId);
				return next;
			});
		},
		[],
	);

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

	// 保存済み間接作業積み上げ順をロード
	const { data: stackOrderData } = useQuery(
		stackOrderSettingsQueryOptions("indirect_work_type"),
	);

	const savedIndirectOrder = useMemo(() => {
		if (!stackOrderData?.data || stackOrderData.data.length === 0)
			return undefined;
		return [...stackOrderData.data]
			.sort((a, b) => a.stackOrder - b.stackOrder)
			.map((s) => s.targetCode);
	}, [stackOrderData?.data]);

	// 保存済み順序で indirectOrder を初期化（一度だけ）
	useEffect(() => {
		if (
			savedIndirectOrder &&
			savedIndirectOrder.length > 0 &&
			indirectOrder.length === 0
		) {
			setIndirectOrder(savedIndirectOrder);
		}
	}, [savedIndirectOrder, indirectOrder.length]);

	// キャパシティライン表示状態（SidePanelSettings ↔ useChartData の橋渡し）
	// デフォルト全 OFF（capLineVisible に存在しないキーは false として扱う）
	const [capLineVisible, setCapLineVisible] = useState<Record<string, boolean>>(
		{},
	);
	const [capLineColors, setCapLineColors] = useState<Record<string, string>>(
		{},
	);

	// プロファイル適用（後方互換：旧キャパシティ設定は無視しデフォルト全OFFにフォールバック）
	const handleProfileApply = useCallback(
		(profile: {
			chartViewId: number;
			startYearMonth: string;
			endYearMonth: string;
			projectItems: BulkUpsertProjectItemInput[];
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

			// キャパシティライン設定はプロファイルから復元しない（デフォルト全 OFF 維持）
			// 旧形式（capacity_scenario_id 単独キー）のプロファイルとの後方互換を確保
		},
		[setPeriod, setPeriodAndBusinessUnits],
	);

	// chartDataParams に selectedProjectIds, projectCaseIds を含める
	const chartDataParamsWithFilters = useMemo(() => {
		if (!chartDataParams) return null;
		if (selectedProjectIds.size === 0) return null;
		const params = { ...chartDataParams };
		// 全選択時は projectIds を送信しない（全件取得と同じ）
		if (selectedProjectIds.size < allProjectIds.length) {
			params.projectIds = Array.from(selectedProjectIds);
		}
		// 全デフォルト時は projectCaseIds を省略（既存最適化クエリを使用）
		if (hasNonDefaultCaseSelection(selectedCaseIds, projects)) {
			params.projectCaseIds = Array.from(selectedCaseIds.values());
		}
		return params;
	}, [
		chartDataParams,
		selectedProjectIds,
		allProjectIds.length,
		selectedCaseIds,
		projects,
	]);

	const {
		chartData,
		seriesConfig,
		legendDataByMonth,
		latestMonth,
		rawResponse,
		availableCapacityLines,
		isLoading,
		isFetching,
		isError,
		refetch,
	} = useChartData(chartDataParamsWithFilters, {
		projectColors,
		projectOrder,
		indirectWorkTypeColors: indirectColors,
		indirectWorkTypeOrder: indirectOrder,
		capLineVisible,
		capLineColors,
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
							selectedCaseIds={selectedCaseIds}
							onCaseChange={handleCaseChange}
						/>
					}
					indirectContent={
						<SidePanelIndirect
							initialOrder={savedIndirectOrder}
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
							availableCapacityLines={availableCapacityLines}
							capLineVisible={capLineVisible}
							capLineColors={capLineColors}
							onCapLineVisibleChange={setCapLineVisible}
							onCapLineColorsChange={setCapLineColors}
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
