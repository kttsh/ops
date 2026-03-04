import type {
	CreateWorkTypeInput,
	UpdateWorkTypeInput,
	WorkType,
	WorkTypeListParams,
} from "@/features/work-types/types";
import { createCrudMutations } from "@/lib/api";
import {
	createWorkType,
	deleteWorkType,
	restoreWorkType,
	updateWorkType,
} from "./api-client";
import { workTypeKeys } from "./queries";

const mutations = createCrudMutations<
	WorkType,
	CreateWorkTypeInput,
	UpdateWorkTypeInput,
	string,
	WorkTypeListParams
>({
	client: {
		create: createWorkType,
		update: updateWorkType,
		delete: deleteWorkType,
		restore: restoreWorkType,
		fetchList: () => {
			throw new Error("not used in mutations");
		},
		fetchDetail: () => {
			throw new Error("not used in mutations");
		},
	},
	queryKeys: workTypeKeys,
});

export const {
	useCreate: useCreateWorkType,
	useUpdate: useUpdateWorkType,
	useDelete: useDeleteWorkType,
	useRestore: useRestoreWorkType,
} = mutations;
