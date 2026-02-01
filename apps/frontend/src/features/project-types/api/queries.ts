import { queryOptions } from "@tanstack/react-query";
import type { ProjectTypeListParams } from "@/features/project-types/types";
import { fetchProjectType, fetchProjectTypes } from "./api-client";

export const projectTypeKeys = {
	all: ["project-types"] as const,
	lists: () => [...projectTypeKeys.all, "list"] as const,
	list: (params: ProjectTypeListParams) =>
		[...projectTypeKeys.lists(), params] as const,
	details: () => [...projectTypeKeys.all, "detail"] as const,
	detail: (code: string) => [...projectTypeKeys.details(), code] as const,
};

export function projectTypesQueryOptions(params: ProjectTypeListParams) {
	return queryOptions({
		queryKey: projectTypeKeys.list(params),
		queryFn: () => fetchProjectTypes(params),
	});
}

export function projectTypeQueryOptions(code: string) {
	return queryOptions({
		queryKey: projectTypeKeys.detail(code),
		queryFn: () => fetchProjectType(code),
	});
}
