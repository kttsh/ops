import type {
	BusinessUnit,
	BusinessUnitListParams,
	CreateBusinessUnitInput,
	UpdateBusinessUnitInput,
} from "@/features/business-units/types";
import { createCrudMutations } from "@/lib/api";
import {
	createBusinessUnit,
	deleteBusinessUnit,
	restoreBusinessUnit,
	updateBusinessUnit,
} from "./api-client";
import { businessUnitKeys } from "./queries";

const mutations = createCrudMutations<
	BusinessUnit,
	CreateBusinessUnitInput,
	UpdateBusinessUnitInput,
	string,
	BusinessUnitListParams
>({
	client: {
		create: createBusinessUnit,
		update: updateBusinessUnit,
		delete: deleteBusinessUnit,
		restore: restoreBusinessUnit,
		fetchList: () => { throw new Error("not used in mutations"); },
		fetchDetail: () => { throw new Error("not used in mutations"); },
	},
	queryKeys: businessUnitKeys,
});

export const {
	useCreate: useCreateBusinessUnit,
	useUpdate: useUpdateBusinessUnit,
	useDelete: useDeleteBusinessUnit,
	useRestore: useRestoreBusinessUnit,
} = mutations;
