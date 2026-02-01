import { queryOptions } from "@tanstack/react-query";
import type { ChartDataParams } from "@/features/workload/types";
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
		staleTime: 5 * 60 * 1000, // 5分
	});
}

// ============================================================
// Master Data (長期キャッシュ)
// ============================================================

export function businessUnitsQueryOptions() {
	return queryOptions({
		queryKey: workloadKeys.businessUnits(),
		queryFn: () => fetchBusinessUnits(),
		staleTime: 30 * 60 * 1000, // 30分
	});
}

export function capacityScenariosQueryOptions() {
	return queryOptions({
		queryKey: workloadKeys.capacityScenarios(),
		queryFn: () => fetchCapacityScenarios(),
		staleTime: 30 * 60 * 1000,
	});
}

export function indirectWorkCasesQueryOptions() {
	return queryOptions({
		queryKey: workloadKeys.indirectWorkCases(),
		queryFn: () => fetchIndirectWorkCases(),
		staleTime: 30 * 60 * 1000,
	});
}

export function projectsQueryOptions(buCodes: string[]) {
	return queryOptions({
		queryKey: workloadKeys.projects(buCodes),
		queryFn: () => fetchProjects({ businessUnitCodes: buCodes }),
		staleTime: 5 * 60 * 1000,
		enabled: buCodes.length > 0,
	});
}

export function projectTypesQueryOptions() {
	return queryOptions({
		queryKey: workloadKeys.projectTypes(),
		queryFn: () => fetchProjectTypes(),
		staleTime: 30 * 60 * 1000,
	});
}

// ============================================================
// Settings Data
// ============================================================

export function colorSettingsQueryOptions(targetType?: string) {
	return queryOptions({
		queryKey: workloadKeys.colorSettings(targetType),
		queryFn: () => fetchChartColorSettings(targetType),
		staleTime: 5 * 60 * 1000,
	});
}

export function stackOrderSettingsQueryOptions(targetType?: string) {
	return queryOptions({
		queryKey: workloadKeys.stackOrderSettings(targetType),
		queryFn: () => fetchChartStackOrderSettings(targetType),
		staleTime: 5 * 60 * 1000,
	});
}

export function chartViewsQueryOptions() {
	return queryOptions({
		queryKey: workloadKeys.chartViews(),
		queryFn: () => fetchChartViews(),
		staleTime: 5 * 60 * 1000,
	});
}

export function chartViewProjectItemsQueryOptions(chartViewId: number) {
	return queryOptions({
		queryKey: workloadKeys.chartViewProjectItems(chartViewId),
		queryFn: () => fetchChartViewProjectItems(chartViewId),
		staleTime: 5 * 60 * 1000,
	});
}
