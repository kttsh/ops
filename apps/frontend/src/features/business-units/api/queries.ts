import type { BusinessUnit, BusinessUnitListParams } from "@/features/business-units/types";
import {
	createQueryKeys,
	createListQueryOptions,
	createDetailQueryOptions,
	STALE_TIMES,
} from "@/lib/api";
import { fetchBusinessUnit, fetchBusinessUnits } from "./api-client";

export const businessUnitKeys = createQueryKeys<string, BusinessUnitListParams>("business-units");

export const businessUnitsQueryOptions = createListQueryOptions<BusinessUnit, BusinessUnitListParams>({
	queryKeys: businessUnitKeys,
	fetchList: fetchBusinessUnits,
	staleTime: STALE_TIMES.STANDARD,
});

export const businessUnitQueryOptions = createDetailQueryOptions<BusinessUnit, string>({
	queryKeys: businessUnitKeys,
	fetchDetail: fetchBusinessUnit,
	staleTime: STALE_TIMES.STANDARD,
});
