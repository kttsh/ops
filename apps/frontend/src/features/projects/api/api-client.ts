import type { BusinessUnit } from "@/features/business-units/types";
import type { ProjectType } from "@/features/project-types/types";
import type {
	CreateProjectInput,
	Project,
	ProjectListParams,
	UpdateProjectInput,
} from "@/features/projects/types";
import {
	type PaginatedResponse,
	API_BASE_URL,
	createCrudClient,
	handleResponse,
} from "@/lib/api";

const client = createCrudClient<
	Project,
	CreateProjectInput,
	UpdateProjectInput,
	number,
	ProjectListParams
>({
	resourcePath: "projects",
	paginated: true,
});

export const {
	fetchList: fetchProjects,
	fetchDetail: fetchProject,
	create: createProject,
	update: updateProject,
	delete: deleteProject,
	restore: restoreProject,
} = client;

export { ApiError } from "@/lib/api";

// --- Projects 固有の Select 用フェッチ関数 ---

export async function fetchBusinessUnitsForSelect(): Promise<
	PaginatedResponse<BusinessUnit>
> {
	const searchParams = new URLSearchParams({
		"page[number]": "1",
		"page[size]": "1000",
	});
	const response = await fetch(
		`${API_BASE_URL}/business-units?${searchParams}`,
	);
	return handleResponse<PaginatedResponse<BusinessUnit>>(response);
}

export async function fetchProjectTypesForSelect(): Promise<
	PaginatedResponse<ProjectType>
> {
	const response = await fetch(`${API_BASE_URL}/project-types`);
	return handleResponse<PaginatedResponse<ProjectType>>(response);
}
