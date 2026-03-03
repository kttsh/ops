import type {
	CreateWorkTypeInput,
	UpdateWorkTypeInput,
	WorkType,
	WorkTypeListParams,
} from "@/features/work-types/types";
import { createCrudClient } from "@/lib/api";

const client = createCrudClient<
	WorkType,
	CreateWorkTypeInput,
	UpdateWorkTypeInput,
	string,
	WorkTypeListParams
>({
	resourcePath: "work-types",
});

export const {
	fetchList: fetchWorkTypes,
	fetchDetail: fetchWorkType,
	create: createWorkType,
	update: updateWorkType,
	delete: deleteWorkType,
	restore: restoreWorkType,
} = client;

export { ApiError } from "@/lib/api";
