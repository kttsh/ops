import { queryOptions } from "@tanstack/react-query";
import type {
	ProjectListParams,
	SelectOption,
} from "@/features/projects/types";
import {
	createDetailQueryOptions,
	createListQueryOptions,
	createQueryKeys,
	STALE_TIMES,
} from "@/lib/api";
import {
	fetchBusinessUnitsForSelect,
	fetchProject,
	fetchProjects,
	fetchProjectTypesForSelect,
} from "./api-client";

export const projectKeys = createQueryKeys<number, ProjectListParams>(
	"projects",
);

export const projectsQueryOptions = createListQueryOptions({
	queryKeys: projectKeys,
	fetchList: fetchProjects,
	staleTime: STALE_TIMES.SHORT,
});

export const projectQueryOptions = createDetailQueryOptions({
	queryKeys: projectKeys,
	fetchDetail: fetchProject,
	staleTime: STALE_TIMES.SHORT,
});

// --- Projects 固有の Select 用 queryOptions ---

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
