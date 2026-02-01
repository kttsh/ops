import type { BusinessUnit } from "@/features/business-units/types";
import type { ProjectType } from "@/features/project-types/types";
import type {
	CreateProjectInput,
	PaginatedResponse,
	Project,
	ProjectListParams,
	SingleResponse,
	UpdateProjectInput,
} from "@/features/projects/types";
import { API_BASE_URL, ApiError, handleResponse } from "@/lib/api";

export { ApiError };

export async function fetchProjects(
	params: ProjectListParams,
): Promise<PaginatedResponse<Project>> {
	const searchParams = new URLSearchParams({
		"page[number]": String(params.page),
		"page[size]": String(params.pageSize),
	});
	if (params.includeDisabled) {
		searchParams.set("filter[includeDisabled]", "true");
	}

	const response = await fetch(`${API_BASE_URL}/projects?${searchParams}`);
	return handleResponse<PaginatedResponse<Project>>(response);
}

export async function fetchProject(
	id: number,
): Promise<SingleResponse<Project>> {
	const response = await fetch(`${API_BASE_URL}/projects/${id}`);
	return handleResponse<SingleResponse<Project>>(response);
}

export async function createProject(
	input: CreateProjectInput,
): Promise<SingleResponse<Project>> {
	const response = await fetch(`${API_BASE_URL}/projects`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	return handleResponse<SingleResponse<Project>>(response);
}

export async function updateProject(
	id: number,
	input: UpdateProjectInput,
): Promise<SingleResponse<Project>> {
	const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	return handleResponse<SingleResponse<Project>>(response);
}

export async function deleteProject(id: number): Promise<void> {
	const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
		method: "DELETE",
	});
	return handleResponse<void>(response);
}

export async function restoreProject(
	id: number,
): Promise<SingleResponse<Project>> {
	const response = await fetch(
		`${API_BASE_URL}/projects/${id}/actions/restore`,
		{ method: "POST" },
	);
	return handleResponse<SingleResponse<Project>>(response);
}

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
