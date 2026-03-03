import type { ProjectType, ProjectTypeListParams } from "@/features/project-types/types";
import {
	createQueryKeys,
	createListQueryOptions,
	createDetailQueryOptions,
	STALE_TIMES,
} from "@/lib/api";
import { fetchProjectType, fetchProjectTypes } from "./api-client";

export const projectTypeKeys = createQueryKeys<string, ProjectTypeListParams>("project-types");

export const projectTypesQueryOptions = createListQueryOptions<ProjectType, ProjectTypeListParams>({
	queryKeys: projectTypeKeys,
	fetchList: fetchProjectTypes,
	staleTime: STALE_TIMES.STANDARD,
});

export const projectTypeQueryOptions = createDetailQueryOptions<ProjectType, string>({
	queryKeys: projectTypeKeys,
	fetchDetail: fetchProjectType,
	staleTime: STALE_TIMES.STANDARD,
});
