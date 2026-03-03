import { queryOptions } from "@tanstack/react-query";
import type {
	CapacityScenarioListParams,
	HeadcountPlanCaseListParams,
	IndirectWorkCaseListParams,
} from "@/features/indirect-case-study/types";
import { STALE_TIMES } from "@/lib/api";
import {
	fetchCapacityScenarios,
	fetchMonthlyCapacities,
} from "./capacity-scenario-client";
import {
	fetchHeadcountPlanCases,
	fetchMonthlyHeadcountPlans,
} from "./headcount-plan-client";
import {
	fetchIndirectWorkCases,
	fetchIndirectWorkTypeRatios,
	fetchMonthlyIndirectWorkLoads,
} from "./indirect-work-client";

// ============================================================
// Query Key Factory
// ============================================================

export const indirectCaseStudyKeys = {
	all: ["indirect-case-study"] as const,

	// Headcount Plan Cases
	headcountPlanCases: () =>
		[...indirectCaseStudyKeys.all, "headcount-plan-cases"] as const,
	headcountPlanCaseList: (params: HeadcountPlanCaseListParams) =>
		[...indirectCaseStudyKeys.headcountPlanCases(), "list", params] as const,
	monthlyHeadcountPlans: (caseId: number, bu: string) =>
		[
			...indirectCaseStudyKeys.headcountPlanCases(),
			caseId,
			"monthly",
			bu,
		] as const,

	// Capacity Scenarios
	capacityScenarios: () =>
		[...indirectCaseStudyKeys.all, "capacity-scenarios"] as const,
	capacityScenarioList: (params: CapacityScenarioListParams) =>
		[...indirectCaseStudyKeys.capacityScenarios(), "list", params] as const,
	monthlyCapacities: (scenarioId: number, bu?: string) =>
		[
			...indirectCaseStudyKeys.capacityScenarios(),
			scenarioId,
			"monthly",
			bu,
		] as const,

	// Indirect Work Cases
	indirectWorkCases: () =>
		[...indirectCaseStudyKeys.all, "indirect-work-cases"] as const,
	indirectWorkCaseList: (params: IndirectWorkCaseListParams) =>
		[...indirectCaseStudyKeys.indirectWorkCases(), "list", params] as const,
	indirectWorkTypeRatios: (caseId: number) =>
		[...indirectCaseStudyKeys.indirectWorkCases(), caseId, "ratios"] as const,
	monthlyIndirectWorkLoads: (caseId: number, bu?: string) =>
		[
			...indirectCaseStudyKeys.indirectWorkCases(),
			caseId,
			"monthly-loads",
			bu,
		] as const,

	// Master data
	businessUnits: () => ["business-units", "all"] as const,
	workTypes: () => ["work-types", "all"] as const,
};

// ============================================================
// Headcount Plan Cases
// ============================================================

export function headcountPlanCasesQueryOptions(
	params: HeadcountPlanCaseListParams,
) {
	return queryOptions({
		queryKey: indirectCaseStudyKeys.headcountPlanCaseList(params),
		queryFn: () => fetchHeadcountPlanCases(params),
		staleTime: STALE_TIMES.MEDIUM,
	});
}

export function monthlyHeadcountPlansQueryOptions(
	caseId: number,
	businessUnitCode: string,
) {
	return queryOptions({
		queryKey: indirectCaseStudyKeys.monthlyHeadcountPlans(
			caseId,
			businessUnitCode,
		),
		queryFn: () => fetchMonthlyHeadcountPlans(caseId, businessUnitCode),
		staleTime: STALE_TIMES.MEDIUM,
		enabled: caseId > 0 && businessUnitCode.length > 0,
	});
}

// ============================================================
// Capacity Scenarios
// ============================================================

export function capacityScenariosQueryOptions(
	params: CapacityScenarioListParams,
) {
	return queryOptions({
		queryKey: indirectCaseStudyKeys.capacityScenarioList(params),
		queryFn: () => fetchCapacityScenarios(params),
		staleTime: STALE_TIMES.MEDIUM,
	});
}

export function monthlyCapacitiesQueryOptions(
	scenarioId: number,
	businessUnitCode?: string,
) {
	return queryOptions({
		queryKey: indirectCaseStudyKeys.monthlyCapacities(
			scenarioId,
			businessUnitCode,
		),
		queryFn: () => fetchMonthlyCapacities(scenarioId, businessUnitCode),
		staleTime: STALE_TIMES.MEDIUM,
		enabled: scenarioId > 0,
	});
}

// ============================================================
// Indirect Work Cases
// ============================================================

export function indirectWorkCasesQueryOptions(
	params: IndirectWorkCaseListParams,
) {
	return queryOptions({
		queryKey: indirectCaseStudyKeys.indirectWorkCaseList(params),
		queryFn: () => fetchIndirectWorkCases(params),
		staleTime: STALE_TIMES.MEDIUM,
	});
}

export function indirectWorkTypeRatiosQueryOptions(caseId: number) {
	return queryOptions({
		queryKey: indirectCaseStudyKeys.indirectWorkTypeRatios(caseId),
		queryFn: () => fetchIndirectWorkTypeRatios(caseId),
		staleTime: STALE_TIMES.MEDIUM,
		enabled: caseId > 0,
	});
}

export function monthlyIndirectWorkLoadsQueryOptions(
	caseId: number,
	businessUnitCode?: string,
) {
	return queryOptions({
		queryKey: indirectCaseStudyKeys.monthlyIndirectWorkLoads(
			caseId,
			businessUnitCode,
		),
		queryFn: () => fetchMonthlyIndirectWorkLoads(caseId, businessUnitCode),
		staleTime: STALE_TIMES.MEDIUM,
		enabled: caseId > 0,
	});
}
