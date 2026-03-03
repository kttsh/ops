import { queryOptions } from "@tanstack/react-query";
import type { ChartDataParams } from "@/features/workload/types";
import { STALE_TIMES } from "@/lib/api";
import {
	fetchBusinessUnits,
	fetchCapacityScenarios,
	fetchChartColorSettings,
	fetchChartData,
	fetchChartStackOrderSettings,
	fetchChartViewProjectItems,
	fetchChartViews,
	fetchIndirectWorkCases,
	fetchProjects,
	fetchProjectTypes,
} from "./api-client";

// ============================================================
// Query Key Factory
// ============================================================

export const workloadKeys = {
	all: ["workload"] as const,
	chartData: (params: ChartDataParams) =>
		[...workloadKeys.all, "chart-data", params] as const,
	businessUnits: () => ["business-units", "all"] as const,
	capacityScenarios: () => ["capacity-scenarios", "all"] as const,
	indirectWorkCases: () => ["indirect-work-cases", "all"] as const,
	projects: (buCodes: string[]) =>
		[...workloadKeys.all, "projects", buCodes] as const,
	projectTypes: () => ["project-types", "all"] as const,
	colorSettings: (targetType?: string) =>
		[...workloadKeys.all, "color-settings", targetType] as const,
	stackOrderSettings: (targetType?: string) =>
		[...workloadKeys.all, "stack-order-settings", targetType] as const,
	chartViews: () => [...workloadKeys.all, "chart-views"] as const,
	chartViewProjectItems: (chartViewId: number) =>
		[...workloadKeys.all, "chart-view-project-items", chartViewId] as const,
};

// ============================================================
// Chart Data
// ============================================================

export function chartDataQueryOptions(params: ChartDataParams) {
	return queryOptions({
		queryKey: workloadKeys.chartData(params),
		queryFn: () => fetchChartData(params),
		staleTime: STALE_TIMES.MEDIUM,
	});
}

// ============================================================
// Master Data (長期キャッシュ)
// ============================================================

export function businessUnitsQueryOptions() {
	return queryOptions({
		queryKey: workloadKeys.businessUnits(),
		queryFn: () => fetchBusinessUnits(),
		staleTime: STALE_TIMES.LONG,
	});
}

export function capacityScenariosQueryOptions() {
	return queryOptions({
		queryKey: workloadKeys.capacityScenarios(),
		queryFn: () => fetchCapacityScenarios(),
		staleTime: STALE_TIMES.LONG,
	});
}

export function indirectWorkCasesQueryOptions() {
	return queryOptions({
		queryKey: workloadKeys.indirectWorkCases(),
		queryFn: () => fetchIndirectWorkCases(),
		staleTime: STALE_TIMES.LONG,
	});
}

export function projectsQueryOptions(buCodes: string[]) {
	return queryOptions({
		queryKey: workloadKeys.projects(buCodes),
		queryFn: () => fetchProjects({ businessUnitCodes: buCodes }),
		staleTime: STALE_TIMES.MEDIUM,
		enabled: buCodes.length > 0,
	});
}

export function projectTypesQueryOptions() {
	return queryOptions({
		queryKey: workloadKeys.projectTypes(),
		queryFn: () => fetchProjectTypes(),
		staleTime: STALE_TIMES.LONG,
	});
}

// ============================================================
// Settings Data
// ============================================================

export function colorSettingsQueryOptions(targetType?: string) {
	return queryOptions({
		queryKey: workloadKeys.colorSettings(targetType),
		queryFn: () => fetchChartColorSettings(targetType),
		staleTime: STALE_TIMES.MEDIUM,
	});
}

export function stackOrderSettingsQueryOptions(targetType?: string) {
	return queryOptions({
		queryKey: workloadKeys.stackOrderSettings(targetType),
		queryFn: () => fetchChartStackOrderSettings(targetType),
		staleTime: STALE_TIMES.MEDIUM,
	});
}

export function chartViewsQueryOptions() {
	return queryOptions({
		queryKey: workloadKeys.chartViews(),
		queryFn: () => fetchChartViews(),
		staleTime: STALE_TIMES.MEDIUM,
	});
}

export function chartViewProjectItemsQueryOptions(chartViewId: number) {
	return queryOptions({
		queryKey: workloadKeys.chartViewProjectItems(chartViewId),
		queryFn: () => fetchChartViewProjectItems(chartViewId),
		staleTime: STALE_TIMES.MEDIUM,
	});
}
