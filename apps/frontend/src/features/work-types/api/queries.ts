import { queryOptions } from "@tanstack/react-query";
import type { WorkTypeListParams } from "@/features/work-types/types";
import { fetchWorkType, fetchWorkTypes } from "./api-client";

export const workTypeKeys = {
	all: ["work-types"] as const,
	lists: () => [...workTypeKeys.all, "list"] as const,
	list: (params: WorkTypeListParams) =>
		[...workTypeKeys.lists(), params] as const,
	details: () => [...workTypeKeys.all, "detail"] as const,
	detail: (code: string) => [...workTypeKeys.details(), code] as const,
};

export function workTypesQueryOptions(params: WorkTypeListParams) {
	return queryOptions({
		queryKey: workTypeKeys.list(params),
		queryFn: () => fetchWorkTypes(params),
	});
}

export function workTypeQueryOptions(code: string) {
	return queryOptions({
		queryKey: workTypeKeys.detail(code),
		queryFn: () => fetchWorkType(code),
	});
}
