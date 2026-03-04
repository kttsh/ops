import type { BusinessUnitListParams } from "@/features/business-units/types";
import {
	createDetailQueryOptions,
	createListQueryOptions,
	createQueryKeys,
	STALE_TIMES,
} from "@/lib/api";
import { fetchBusinessUnit, fetchBusinessUnits } from "./api-client";

export const businessUnitKeys = createQueryKeys<string, BusinessUnitListParams>(
	"business-units",
);

export const businessUnitsQueryOptions = createListQueryOptions({
	queryKeys: businessUnitKeys,
	fetchList: fetchBusinessUnits,
	staleTime: STALE_TIMES.STANDARD,
});

export const businessUnitQueryOptions = createDetailQueryOptions({
	queryKeys: businessUnitKeys,
	fetchDetail: fetchBusinessUnit,
	staleTime: STALE_TIMES.STANDARD,
});
