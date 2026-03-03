import type {
	CreateProjectInput,
	Project,
	ProjectListParams,
	UpdateProjectInput,
} from "@/features/projects/types";
import { createCrudMutations } from "@/lib/api";
import {
	createProject,
	deleteProject,
	restoreProject,
	updateProject,
} from "./api-client";
import { projectKeys } from "./queries";

const mutations = createCrudMutations<
	Project,
	CreateProjectInput,
	UpdateProjectInput,
	number,
	ProjectListParams
>({
	client: {
		create: createProject,
		update: updateProject,
		delete: deleteProject,
		restore: restoreProject,
		fetchList: () => { throw new Error("not used in mutations"); },
		fetchDetail: () => { throw new Error("not used in mutations"); },
	},
	queryKeys: projectKeys,
});

export const {
	useCreate: useCreateProject,
	useUpdate: useUpdateProject,
	useDelete: useDeleteProject,
	useRestore: useRestoreProject,
} = mutations;
