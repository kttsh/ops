import type { WorkTypeListParams } from "@/features/work-types/types";
import {
	createDetailQueryOptions,
	createListQueryOptions,
	createQueryKeys,
	STALE_TIMES,
} from "@/lib/api";
import { fetchWorkType, fetchWorkTypes } from "./api-client";

export const workTypeKeys = createQueryKeys<string, WorkTypeListParams>(
	"work-types",
);

export const workTypesQueryOptions = createListQueryOptions({
	queryKeys: workTypeKeys,
	fetchList: fetchWorkTypes,
	staleTime: STALE_TIMES.STANDARD,
});

export const workTypeQueryOptions = createDetailQueryOptions({
	queryKeys: workTypeKeys,
	fetchDetail: fetchWorkType,
	staleTime: STALE_TIMES.STANDARD,
});
