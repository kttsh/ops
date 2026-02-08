import { queryOptions } from "@tanstack/react-query";
import type {
	ProjectListParams,
	SelectOption,
} from "@/features/projects/types";
import {
	fetchBusinessUnitsForSelect,
	fetchProject,
	fetchProjects,
	fetchProjectTypesForSelect,
} from "./api-client";

export const projectKeys = {
	all: ["projects"] as const,
	lists: () => [...projectKeys.all, "list"] as const,
	list: (params: ProjectListParams) =>
		[...projectKeys.lists(), params] as const,
	details: () => [...projectKeys.all, "detail"] as const,
	detail: (id: number) => [...projectKeys.details(), id] as const,
};

export function projectsQueryOptions(params: ProjectListParams) {
	return queryOptions({
		queryKey: projectKeys.list(params),
		queryFn: () => fetchProjects(params),
		staleTime: 60 * 1000,
	});
}

export function projectQueryOptions(id: number) {
	return queryOptions({
		queryKey: projectKeys.detail(id),
		queryFn: () => fetchProject(id),
		staleTime: 60 * 1000,
	});
}

export function businessUnitsForSelectQueryOptions() {
	return queryOptions({
		queryKey: ["business-units", "select"] as const,
		queryFn: () => fetchBusinessUnitsForSelect(),
		select: (data): SelectOption[] =>
			data.data.map((bu) => ({
				value: bu.businessUnitCode,
				label: bu.name,
			})),
		staleTime: 5 * 60 * 1000,
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
		staleTime: 5 * 60 * 1000,
	});
}
