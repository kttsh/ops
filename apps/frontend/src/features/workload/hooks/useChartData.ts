import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { chartDataQueryOptions } from "@/features/workload/api/queries";
import type {
	AreaSeriesConfig,
	ChartDataParams,
	ChartDataResponse,
	ChartSeriesConfig,
	LegendMonthData,
	LineSeriesConfig,
	MonthlyDataPoint,
} from "@/features/workload/types";
import {
	CAPACITY_COLORS,
	INDIRECT_COLORS,
	PROJECT_TYPE_COLORS,
	UNCLASSIFIED_COLOR,
} from "@/lib/chart-colors";

export interface UseChartDataReturn {
	chartData: MonthlyDataPoint[];
	seriesConfig: ChartSeriesConfig;
	legendDataByMonth: Map<string, LegendMonthData>;
	latestMonth: string | null;
	rawResponse: ChartDataResponse | undefined;
	isLoading: boolean;
	isFetching: boolean;
	isError: boolean;
	error: Error | null;
	refetch: () => void;
}

interface UseChartDataOptions {
	projectColors?: Record<number, string>;
	projectOrder?: number[];
	indirectWorkTypeColors?: Record<string, string>;
	indirectWorkTypeOrder?: string[];
}

/**
 * 案件シリーズを projectOrder に基づいてソートする。
 * 間接作業シリーズ（type: "indirect"）の位置は維持し、案件シリーズのみを並び替える。
 */
export function sortAreasByProjectOrder(
	areas: AreaSeriesConfig[],
	projectOrder: number[] | undefined,
): AreaSeriesConfig[] {
	if (!projectOrder || projectOrder.length === 0) {
		// projectOrder 未指定 or 空の場合は元の順序を維持
		// ただし空配列の場合も元順序維持（全て indexOf === -1 になるため）
		if (!projectOrder) return areas;
	}

	const indirectAreas = areas.filter((a) => a.type === "indirect");
	const projectAreas = [...areas.filter((a) => a.type === "project")];

	const orderMap = new Map(projectOrder.map((id, idx) => [id, idx]));

	projectAreas.sort((a, b) => {
		const idA = parseInt(a.dataKey.replace("project_", ""), 10);
		const idB = parseInt(b.dataKey.replace("project_", ""), 10);
		const orderA = orderMap.get(idA) ?? Number.MAX_SAFE_INTEGER;
		const orderB = orderMap.get(idB) ?? Number.MAX_SAFE_INTEGER;
		return orderA - orderB;
	});

	return [...indirectAreas, ...projectAreas];
}

/**
 * 凡例パネル用の案件リストを projectOrder に基づいてソートする。
 */
export function sortLegendProjectsByOrder<T extends { projectId: number }>(
	projects: T[],
	projectOrder: number[] | undefined,
): T[] {
	if (!projectOrder) return projects;

	const orderMap = new Map(projectOrder.map((id, idx) => [id, idx]));
	return [...projects].sort((a, b) => {
		const orderA = orderMap.get(a.projectId) ?? Number.MAX_SAFE_INTEGER;
		const orderB = orderMap.get(b.projectId) ?? Number.MAX_SAFE_INTEGER;
		return orderA - orderB;
	});
}

/**
 * 間接作業シリーズを indirectWorkTypeOrder に基づいてソートする。
 * 案件シリーズ（type: "project"）の位置は維持し、間接作業シリーズのみを並び替える。
 * 未分類シリーズ（indirect_wt_unclassified）は常に間接シリーズの末尾に配置。
 */
export function sortAreasByIndirectOrder(
	areas: AreaSeriesConfig[],
	indirectWorkTypeOrder: string[] | undefined,
): AreaSeriesConfig[] {
	if (!indirectWorkTypeOrder) return areas;

	const projectAreas = areas.filter((a) => a.type === "project");
	const indirectAreas = areas.filter((a) => a.type === "indirect");

	const unclassified = indirectAreas.filter(
		(a) => a.dataKey === "indirect_wt_unclassified",
	);
	const classified = indirectAreas.filter(
		(a) => a.dataKey !== "indirect_wt_unclassified",
	);

	const orderMap = new Map(
		indirectWorkTypeOrder.map((code, idx) => [code, idx]),
	);

	classified.sort((a, b) => {
		const codeA = a.dataKey.replace("indirect_wt_", "");
		const codeB = b.dataKey.replace("indirect_wt_", "");
		const orderA = orderMap.get(codeA) ?? Number.MAX_SAFE_INTEGER;
		const orderB = orderMap.get(codeB) ?? Number.MAX_SAFE_INTEGER;
		return orderA - orderB;
	});

	return [...classified, ...unclassified, ...projectAreas];
}

/**
 * 凡例パネル用の間接作業リストを indirectWorkTypeOrder に基づいてソートする。
 * 未分類（workTypeCode === "unclassified"）は常に末尾に配置。
 */
export function sortLegendIndirectByOrder<
	T extends { workTypeCode: string },
>(
	indirectWorkTypes: T[],
	indirectWorkTypeOrder: string[] | undefined,
): T[] {
	if (!indirectWorkTypeOrder) return indirectWorkTypes;

	const unclassified = indirectWorkTypes.filter(
		(i) => i.workTypeCode === "unclassified",
	);
	const classified = indirectWorkTypes.filter(
		(i) => i.workTypeCode !== "unclassified",
	);

	const orderMap = new Map(
		indirectWorkTypeOrder
			.filter((code) => code !== "unclassified")
			.map((code, idx) => [code, idx]),
	);

	classified.sort((a, b) => {
		const orderA = orderMap.get(a.workTypeCode) ?? Number.MAX_SAFE_INTEGER;
		const orderB = orderMap.get(b.workTypeCode) ?? Number.MAX_SAFE_INTEGER;
		return orderA - orderB;
	});

	return [...classified, ...unclassified];
}

export function useChartData(
	params: ChartDataParams | null,
	options: UseChartDataOptions = {},
): UseChartDataReturn {
	const query = useQuery({
		...chartDataQueryOptions(params!),
		enabled: params !== null,
	});

	const rawResponse = query.data?.data;

	const {
		projectColors,
		projectOrder,
		indirectWorkTypeColors,
		indirectWorkTypeOrder,
	} = options;

	const { chartData, seriesConfig, legendDataByMonth, latestMonth } =
		useMemo(() => {
			if (!rawResponse) {
				return {
					chartData: [] as MonthlyDataPoint[],
					seriesConfig: { areas: [], lines: [] } as ChartSeriesConfig,
					legendDataByMonth: new Map<string, LegendMonthData>(),
					latestMonth: null,
				};
			}

			// 期間内の全月を生成
			const months = generateMonthRange(
				rawResponse.period.startYearMonth,
				rawResponse.period.endYearMonth,
			);

			// 全間接作業から workTypeCode を収集（重複排除・順序保持）
			const workTypeMap = new Map<string, string>();
			for (const iw of rawResponse.indirectWorkLoads) {
				for (const m of iw.monthly) {
					for (const bd of m.breakdown) {
						if (!workTypeMap.has(bd.workTypeCode)) {
							workTypeMap.set(bd.workTypeCode, bd.workTypeName);
						}
					}
				}
			}

			// breakdownCoverage < 1.0 の月があるかチェック（未分類エリアが必要か判定）
			let hasUnclassified = false;
			for (const iw of rawResponse.indirectWorkLoads) {
				for (const m of iw.monthly) {
					if (m.manhour > 0 && m.breakdownCoverage < 1.0) {
						hasUnclassified = true;
						break;
					}
				}
				if (hasUnclassified) break;
			}

			// シリーズ設定を構築
			const areas: AreaSeriesConfig[] = [];
			const lines: LineSeriesConfig[] = [];

			// 間接作業エリアシリーズ（下層）— workType 単位
			let wtIdx = 0;
			for (const [workTypeCode, workTypeName] of workTypeMap) {
				const key = `indirect_wt_${workTypeCode}`;
				const color =
					indirectWorkTypeColors?.[workTypeCode] ??
					INDIRECT_COLORS[wtIdx % INDIRECT_COLORS.length];
				areas.push({
					dataKey: key,
					stackId: "workload",
					fill: color,
					stroke: color,
					fillOpacity: 0.7,
					name: workTypeName,
					type: "indirect",
				});
				wtIdx++;
			}

			// 未分類エリア（breakdownCoverage < 1.0 の場合のみ）
			if (hasUnclassified) {
				areas.push({
					dataKey: "indirect_wt_unclassified",
					stackId: "workload",
					fill: UNCLASSIFIED_COLOR,
					stroke: UNCLASSIFIED_COLOR,
					fillOpacity: 0.5,
					name: "未分類",
					type: "indirect",
				});
			}

			// 案件エリアシリーズ（上層）
			rawResponse.projectLoads.forEach((pl, idx) => {
				const key = `project_${pl.projectId}`;
				const color =
					projectColors?.[pl.projectId] ??
					PROJECT_TYPE_COLORS[idx % PROJECT_TYPE_COLORS.length];
				areas.push({
					dataKey: key,
					stackId: "workload",
					fill: color,
					stroke: color,
					fillOpacity: 0.8,
					name: pl.projectName,
					type: "project",
				});
			});

			// キャパシティラインシリーズ
			rawResponse.capacities.forEach((cap, idx) => {
				const key = `capacity_${cap.capacityScenarioId}`;
				lines.push({
					dataKey: key,
					stroke: CAPACITY_COLORS[idx % CAPACITY_COLORS.length],
					strokeDasharray: "5 5",
					name: cap.scenarioName,
				});
			});

			// 月別データポイントを構築
			const dataPoints: MonthlyDataPoint[] = months.map((ym) => {
				const point: MonthlyDataPoint = {
					month: `${ym.slice(0, 4)}/${ym.slice(4, 6)}`,
					yearMonth: ym,
				};

				// 間接作業 — workType 単位で合算
				const wtTotals = new Map<string, number>();
				let totalBreakdownManhour = 0;
				let totalIndirectManhour = 0;

				for (const iw of rawResponse.indirectWorkLoads) {
					const monthData = iw.monthly.find((m) => m.yearMonth === ym);
					if (!monthData) continue;
					totalIndirectManhour += monthData.manhour;
					for (const bd of monthData.breakdown) {
						wtTotals.set(
							bd.workTypeCode,
							(wtTotals.get(bd.workTypeCode) ?? 0) + bd.manhour,
						);
						totalBreakdownManhour += bd.manhour;
					}
				}

				for (const workTypeCode of workTypeMap.keys()) {
					point[`indirect_wt_${workTypeCode}`] =
						wtTotals.get(workTypeCode) ?? 0;
				}

				// 未分類分
				if (hasUnclassified) {
					const unclassifiedManhour = Math.max(
						0,
						totalIndirectManhour - totalBreakdownManhour,
					);
					point.indirect_wt_unclassified = unclassifiedManhour;
				}

				// 案件
				for (const pl of rawResponse.projectLoads) {
					const key = `project_${pl.projectId}`;
					const monthData = pl.monthly.find((m) => m.yearMonth === ym);
					point[key] = monthData?.manhour ?? 0;
				}

				// キャパシティ
				for (const cap of rawResponse.capacities) {
					const key = `capacity_${cap.capacityScenarioId}`;
					const monthData = cap.monthly.find((m) => m.yearMonth === ym);
					point[key] = monthData?.capacity ?? 0;
				}

				return point;
			});

			// 凡例パネル用データ
			const legendMap = new Map<string, LegendMonthData>();
			for (const ym of months) {
				const projects = rawResponse.projectLoads.map((pl) => {
					const monthData = pl.monthly.find((m) => m.yearMonth === ym);
					return {
						projectId: pl.projectId,
						name: pl.projectName,
						manhour: monthData?.manhour ?? 0,
					};
				});

				// 間接作業 workType 別凡例データ
				const wtLegendMap = new Map<
					string,
					{ workTypeName: string; manhour: number }
				>();
				let totalIndirectManhour = 0;
				let totalBreakdownManhour = 0;

				for (const iw of rawResponse.indirectWorkLoads) {
					const monthData = iw.monthly.find((m) => m.yearMonth === ym);
					if (!monthData) continue;
					totalIndirectManhour += monthData.manhour;
					for (const bd of monthData.breakdown) {
						const existing = wtLegendMap.get(bd.workTypeCode);
						if (existing) {
							existing.manhour += bd.manhour;
						} else {
							wtLegendMap.set(bd.workTypeCode, {
								workTypeName: bd.workTypeName,
								manhour: bd.manhour,
							});
						}
						totalBreakdownManhour += bd.manhour;
					}
				}

				const indirectWorkTypes = Array.from(wtLegendMap.entries()).map(
					([code, v]) => ({
						workTypeCode: code,
						workTypeName: v.workTypeName,
						manhour: v.manhour,
					}),
				);

				// 未分類分を追加
				if (hasUnclassified) {
					const unclassifiedManhour = Math.max(
						0,
						totalIndirectManhour - totalBreakdownManhour,
					);
					if (unclassifiedManhour > 0) {
						indirectWorkTypes.push({
							workTypeCode: "unclassified",
							workTypeName: "未分類",
							manhour: unclassifiedManhour,
						});
					}
				}

				const capacities = rawResponse.capacities.map((cap) => {
					const monthData = cap.monthly.find((m) => m.yearMonth === ym);
					return {
						scenarioId: cap.capacityScenarioId,
						scenarioName: cap.scenarioName,
						capacity: monthData?.capacity ?? 0,
					};
				});

				const totalManhour =
					projects.reduce((sum, p) => sum + p.manhour, 0) +
					totalIndirectManhour;
				const totalCapacity =
					capacities.length > 0
						? Math.max(...capacities.map((c) => c.capacity))
						: 0;

				legendMap.set(ym, {
					yearMonth: ym,
					month: `${ym.slice(0, 4)}/${ym.slice(4, 6)}`,
					projects,
					indirectWorkTypes,
					capacities,
					totalManhour,
					totalCapacity,
				});
			}

			// projectOrder / indirectWorkTypeOrder に基づいてシリーズをソート
			const projectSorted = sortAreasByProjectOrder(areas, projectOrder);
			const sortedAreas = sortAreasByIndirectOrder(
				projectSorted,
				indirectWorkTypeOrder,
			);

			// legendMap の projects / indirectWorkTypes も同一順序でソート
			if (projectOrder && projectOrder.length > 0) {
				for (const [, monthData] of legendMap) {
					monthData.projects = sortLegendProjectsByOrder(
						monthData.projects,
						projectOrder,
					);
				}
			}
			if (indirectWorkTypeOrder && indirectWorkTypeOrder.length > 0) {
				for (const [, monthData] of legendMap) {
					monthData.indirectWorkTypes = sortLegendIndirectByOrder(
						monthData.indirectWorkTypes,
						indirectWorkTypeOrder,
					);
				}
			}

			const latest = months.length > 0 ? months[months.length - 1] : null;

			return {
				chartData: dataPoints,
				seriesConfig: { areas: sortedAreas, lines },
				legendDataByMonth: legendMap,
				latestMonth: latest,
			};
		}, [
			rawResponse,
			projectColors,
			projectOrder,
			indirectWorkTypeColors,
			indirectWorkTypeOrder,
		]);

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
	};
}

function generateMonthRange(start: string, end: string): string[] {
	const months: string[] = [];
	let year = parseInt(start.slice(0, 4), 10);
	let month = parseInt(start.slice(4, 6), 10);
	const endYear = parseInt(end.slice(0, 4), 10);
	const endMonth = parseInt(end.slice(4, 6), 10);

	while (year < endYear || (year === endYear && month <= endMonth)) {
		months.push(`${year}${String(month).padStart(2, "0")}`);
		month++;
		if (month > 12) {
			month = 1;
			year++;
		}
	}
	return months;
}
