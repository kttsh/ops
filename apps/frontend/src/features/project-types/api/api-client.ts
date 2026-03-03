import type {
	CreateProjectTypeInput,
	ProjectType,
	ProjectTypeListParams,
	UpdateProjectTypeInput,
} from "@/features/project-types/types";
import { createCrudClient } from "@/lib/api";

const client = createCrudClient<
	ProjectType,
	CreateProjectTypeInput,
	UpdateProjectTypeInput,
	string,
	ProjectTypeListParams
>({
	resourcePath: "project-types",
});

export const {
	fetchList: fetchProjectTypes,
	fetchDetail: fetchProjectType,
	create: createProjectType,
	update: updateProjectType,
	delete: deleteProjectType,
	restore: restoreProjectType,
} = client;

export { ApiError } from "@/lib/api";
