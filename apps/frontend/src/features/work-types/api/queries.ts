import type { WorkType, WorkTypeListParams } from "@/features/work-types/types";
import {
	createQueryKeys,
	createListQueryOptions,
	createDetailQueryOptions,
	STALE_TIMES,
} from "@/lib/api";
import { fetchWorkType, fetchWorkTypes } from "./api-client";

export const workTypeKeys = createQueryKeys<string, WorkTypeListParams>("work-types");

export const workTypesQueryOptions = createListQueryOptions<WorkType, WorkTypeListParams>({
	queryKeys: workTypeKeys,
	fetchList: fetchWorkTypes,
	staleTime: STALE_TIMES.STANDARD,
});

export const workTypeQueryOptions = createDetailQueryOptions<WorkType, string>({
	queryKeys: workTypeKeys,
	fetchDetail: fetchWorkType,
	staleTime: STALE_TIMES.STANDARD,
});
