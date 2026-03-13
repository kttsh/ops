import { queryOptions } from "@tanstack/react-query";
import type { StandardEffortMasterListParams } from "@/features/standard-effort-masters/types";
import {
	type SelectOption,
	createDetailQueryOptions,
	createListQueryOptions,
	createQueryKeys,
	STALE_TIMES,
} from "@/lib/api";
import {
	fetchBusinessUnitsForSelect,
	fetchProjectTypesForSelect,
	fetchStandardEffortMaster,
	fetchStandardEffortMasters,
} from "./api-client";

export const standardEffortMasterKeys = createQueryKeys<
	number,
	StandardEffortMasterListParams
>("standard-effort-masters");

export const standardEffortMastersQueryOptions = createListQueryOptions({
	queryKeys: standardEffortMasterKeys,
	fetchList: fetchStandardEffortMasters,
	staleTime: STALE_TIMES.LONG,
});

export const standardEffortMasterQueryOptions = createDetailQueryOptions({
	queryKeys: standardEffortMasterKeys,
	fetchDetail: fetchStandardEffortMaster,
	staleTime: STALE_TIMES.LONG,
});

// --- BU/PT Select 用 queryOptions ---

export function businessUnitsForSelectQueryOptions() {
	return queryOptions({
		queryKey: ["business-units", "select"] as const,
		queryFn: () => fetchBusinessUnitsForSelect(),
		select: (data): SelectOption[] =>
			data.data.map((bu) => ({
				value: bu.businessUnitCode,
				label: bu.name,
			})),
		staleTime: STALE_TIMES.MEDIUM,
	});
}

export function projectTypesForSelectQueryOptions() {
	return queryOptions({
		queryKey: ["project-types", "select"] as const,
		queryFn: () => fetchProjectTypesForSelect(),
		select: (data): SelectOption[] =>
			data.data.map((pt) => ({
				value: pt.projectTypeCode,
				label: pt.name,
			})),
		staleTime: STALE_TIMES.MEDIUM,
	});
}
