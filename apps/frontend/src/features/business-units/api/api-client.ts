import type {
	BusinessUnit,
	BusinessUnitListParams,
	CreateBusinessUnitInput,
	UpdateBusinessUnitInput,
} from "@/features/business-units/types";
import { createCrudClient } from "@/lib/api";

const client = createCrudClient<
	BusinessUnit,
	CreateBusinessUnitInput,
	UpdateBusinessUnitInput,
	string,
	BusinessUnitListParams
>({
	resourcePath: "business-units",
	paginated: true,
});

export const {
	fetchList: fetchBusinessUnits,
	fetchDetail: fetchBusinessUnit,
	create: createBusinessUnit,
	update: updateBusinessUnit,
	delete: deleteBusinessUnit,
	restore: restoreBusinessUnit,
} = client;

export { ApiError } from "@/lib/api";
