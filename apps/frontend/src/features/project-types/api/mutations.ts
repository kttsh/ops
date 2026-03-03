import type {
	CreateProjectTypeInput,
	ProjectType,
	ProjectTypeListParams,
	UpdateProjectTypeInput,
} from "@/features/project-types/types";
import { createCrudMutations } from "@/lib/api";
import {
	createProjectType,
	deleteProjectType,
	restoreProjectType,
	updateProjectType,
} from "./api-client";
import { projectTypeKeys } from "./queries";

const mutations = createCrudMutations<
	ProjectType,
	CreateProjectTypeInput,
	UpdateProjectTypeInput,
	string,
	ProjectTypeListParams
>({
	client: {
		create: createProjectType,
		update: updateProjectType,
		delete: deleteProjectType,
		restore: restoreProjectType,
		fetchList: () => { throw new Error("not used in mutations"); },
		fetchDetail: () => { throw new Error("not used in mutations"); },
	},
	queryKeys: projectTypeKeys,
});

export const {
	useCreate: useCreateProjectType,
	useUpdate: useUpdateProjectType,
	useDelete: useDeleteProjectType,
	useRestore: useRestoreProjectType,
} = mutations;
