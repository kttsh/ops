import type {
	BulkProjectLoadInput,
	CreateProjectCaseInput,
	ProjectCase,
	ProjectCaseListParams,
	ProjectLoad,
	StandardEffortMaster,
	StandardEffortMasterDetail,
	StandardEffortMasterListParams,
	UpdateProjectCaseInput,
} from "@/features/case-study/types";
import type { PaginatedResponse, SingleResponse } from "@/lib/api";
import { API_BASE_URL, handleResponse } from "@/lib/api";

export { ApiError } from "@/lib/api";

// ============================================================
// ProjectCase
// ============================================================

export async function fetchProjectCases(
	projectId: number,
	params?: ProjectCaseListParams,
): Promise<PaginatedResponse<ProjectCase>> {
	const searchParams = new URLSearchParams({
		"page[number]": String(params?.page ?? 1),
		"page[size]": String(params?.pageSize ?? 20),
		"filter[includeDisabled]": String(params?.includeDisabled ?? false),
	});
	const response = await fetch(
		`${API_BASE_URL}/projects/${projectId}/project-cases?${searchParams}`,
	);
	return handleResponse<PaginatedResponse<ProjectCase>>(response);
}

export async function fetchProjectCase(
	projectId: number,
	projectCaseId: number,
): Promise<SingleResponse<ProjectCase>> {
	const response = await fetch(
		`${API_BASE_URL}/projects/${projectId}/project-cases/${projectCaseId}`,
	);
	return handleResponse<SingleResponse<ProjectCase>>(response);
}

export async function createProjectCase(
	projectId: number,
	input: CreateProjectCaseInput,
): Promise<SingleResponse<ProjectCase>> {
	const response = await fetch(
		`${API_BASE_URL}/projects/${projectId}/project-cases`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(input),
		},
	);
	return handleResponse<SingleResponse<ProjectCase>>(response);
}

export async function updateProjectCase(
	projectId: number,
	projectCaseId: number,
	input: UpdateProjectCaseInput,
): Promise<SingleResponse<ProjectCase>> {
	const response = await fetch(
		`${API_BASE_URL}/projects/${projectId}/project-cases/${projectCaseId}`,
		{
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(input),
		},
	);
	return handleResponse<SingleResponse<ProjectCase>>(response);
}

export async function deleteProjectCase(
	projectId: number,
	projectCaseId: number,
): Promise<void> {
	const response = await fetch(
		`${API_BASE_URL}/projects/${projectId}/project-cases/${projectCaseId}`,
		{ method: "DELETE" },
	);
	return handleResponse<void>(response);
}

export async function restoreProjectCase(
	projectId: number,
	projectCaseId: number,
): Promise<SingleResponse<ProjectCase>> {
	const response = await fetch(
		`${API_BASE_URL}/projects/${projectId}/project-cases/${projectCaseId}/actions/restore`,
		{ method: "POST" },
	);
	return handleResponse<SingleResponse<ProjectCase>>(response);
}

// ============================================================
// ProjectLoad
// ============================================================

export async function fetchProjectLoads(
	projectCaseId: number,
): Promise<{ data: ProjectLoad[] }> {
	const response = await fetch(
		`${API_BASE_URL}/project-cases/${projectCaseId}/project-loads`,
	);
	return handleResponse<{ data: ProjectLoad[] }>(response);
}

export async function bulkUpsertProjectLoads(
	projectCaseId: number,
	input: BulkProjectLoadInput,
): Promise<{ data: ProjectLoad[] }> {
	const response = await fetch(
		`${API_BASE_URL}/project-cases/${projectCaseId}/project-loads/bulk`,
		{
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(input),
		},
	);
	return handleResponse<{ data: ProjectLoad[] }>(response);
}

// ============================================================
// StandardEffortMaster
// ============================================================

export async function fetchStandardEffortMasters(
	params?: StandardEffortMasterListParams,
): Promise<PaginatedResponse<StandardEffortMaster>> {
	const searchParams = new URLSearchParams({
		"page[number]": String(params?.page ?? 1),
		"page[size]": String(params?.pageSize ?? 1000),
		"filter[includeDisabled]": String(params?.includeDisabled ?? false),
	});
	if (params?.businessUnitCode) {
		searchParams.set("filter[businessUnitCode]", params.businessUnitCode);
	}
	if (params?.projectTypeCode) {
		searchParams.set("filter[projectTypeCode]", params.projectTypeCode);
	}
	const response = await fetch(
		`${API_BASE_URL}/standard-effort-masters?${searchParams}`,
	);
	return handleResponse<PaginatedResponse<StandardEffortMaster>>(response);
}

export async function fetchStandardEffortMaster(
	id: number,
): Promise<SingleResponse<StandardEffortMasterDetail>> {
	const response = await fetch(`${API_BASE_URL}/standard-effort-masters/${id}`);
	return handleResponse<SingleResponse<StandardEffortMasterDetail>>(response);
}
