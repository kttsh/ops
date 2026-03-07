import type {
	CreateStandardEffortMasterInput,
	StandardEffortMasterDetail,
	StandardEffortMasterListParams,
	UpdateStandardEffortMasterInput,
} from "@/features/standard-effort-masters/types";
import { createCrudMutations } from "@/lib/api";
import {
	createStandardEffortMaster,
	deleteStandardEffortMaster,
	restoreStandardEffortMaster,
	updateStandardEffortMaster,
} from "./api-client";
import { standardEffortMasterKeys } from "./queries";

const mutations = createCrudMutations<
	StandardEffortMasterDetail,
	CreateStandardEffortMasterInput,
	UpdateStandardEffortMasterInput,
	number,
	StandardEffortMasterListParams
>({
	client: {
		create: createStandardEffortMaster,
		update: updateStandardEffortMaster,
		delete: deleteStandardEffortMaster,
		restore: restoreStandardEffortMaster,
		fetchList: () => {
			throw new Error("not used in mutations");
		},
		fetchDetail: () => {
			throw new Error("not used in mutations");
		},
	},
	queryKeys: standardEffortMasterKeys,
});

export const {
	useCreate: useCreateStandardEffortMaster,
	useUpdate: useUpdateStandardEffortMaster,
	useDelete: useDeleteStandardEffortMaster,
	useRestore: useRestoreStandardEffortMaster,
} = mutations;
