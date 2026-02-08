import { queryOptions } from "@tanstack/react-query";
import type { BusinessUnitListParams } from "@/features/business-units/types";
import { fetchBusinessUnit, fetchBusinessUnits } from "./api-client";

export const businessUnitKeys = {
	all: ["business-units"] as const,
	lists: () => [...businessUnitKeys.all, "list"] as const,
	list: (params: BusinessUnitListParams) =>
		[...businessUnitKeys.lists(), params] as const,
	details: () => [...businessUnitKeys.all, "detail"] as const,
	detail: (code: string) => [...businessUnitKeys.details(), code] as const,
};

export function businessUnitsQueryOptions(params: BusinessUnitListParams) {
	return queryOptions({
		queryKey: businessUnitKeys.list(params),
		queryFn: () => fetchBusinessUnits(params),
		staleTime: 2 * 60 * 1000,
	});
}

export function businessUnitQueryOptions(code: string) {
	return queryOptions({
		queryKey: businessUnitKeys.detail(code),
		queryFn: () => fetchBusinessUnit(code),
		staleTime: 2 * 60 * 1000,
	});
}
