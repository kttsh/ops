import type { ProjectTypeListParams } from "@/features/project-types/types";
import {
	createDetailQueryOptions,
	createListQueryOptions,
	createQueryKeys,
	STALE_TIMES,
} from "@/lib/api";
import { fetchProjectType, fetchProjectTypes } from "./api-client";

export const projectTypeKeys = createQueryKeys<string, ProjectTypeListParams>(
	"project-types",
);

export const projectTypesQueryOptions = createListQueryOptions({
	queryKeys: projectTypeKeys,
	fetchList: fetchProjectTypes,
	staleTime: STALE_TIMES.STANDARD,
});

export const projectTypeQueryOptions = createDetailQueryOptions({
	queryKeys: projectTypeKeys,
	fetchDetail: fetchProjectType,
	staleTime: STALE_TIMES.STANDARD,
});
