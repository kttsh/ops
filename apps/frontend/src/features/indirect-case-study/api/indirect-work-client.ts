import type {
	BulkIndirectWorkRatioInput,
	BulkMonthlyIndirectWorkLoadInput,
	CreateIndirectWorkCaseInput,
	IndirectWorkCase,
	IndirectWorkCaseListParams,
	IndirectWorkTypeRatio,
	MonthlyIndirectWorkLoad,
	UpdateIndirectWorkCaseInput,
} from "@/features/indirect-case-study/types";
import {
	type PaginatedResponse,
	type SingleResponse,
	API_BASE_URL,
	handleResponse,
} from "@/lib/api";

// ============================================================
// Indirect Work Cases
// ============================================================

export async function fetchIndirectWorkCases(
	params: IndirectWorkCaseListParams,
): Promise<PaginatedResponse<IndirectWorkCase>> {
	const searchParams = new URLSearchParams({
		"page[number]": "1",
		"page[size]": "1000",
	});
	if (params.businessUnitCode) {
		searchParams.set("filter[businessUnitCode]", params.businessUnitCode);
	}
	if (params.includeDisabled) {
		searchParams.set("filter[includeDisabled]", "true");
	}
	const response = await fetch(
		`${API_BASE_URL}/indirect-work-cases?${searchParams}`,
	);
	return handleResponse<PaginatedResponse<IndirectWorkCase>>(response);
}

export async function createIndirectWorkCase(
	input: CreateIndirectWorkCaseInput,
): Promise<SingleResponse<IndirectWorkCase>> {
	const response = await fetch(`${API_BASE_URL}/indirect-work-cases`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	return handleResponse<SingleResponse<IndirectWorkCase>>(response);
}

export async function updateIndirectWorkCase(
	id: number,
	input: UpdateIndirectWorkCaseInput,
): Promise<SingleResponse<IndirectWorkCase>> {
	const response = await fetch(`${API_BASE_URL}/indirect-work-cases/${id}`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	return handleResponse<SingleResponse<IndirectWorkCase>>(response);
}

export async function deleteIndirectWorkCase(id: number): Promise<void> {
	const response = await fetch(`${API_BASE_URL}/indirect-work-cases/${id}`, {
		method: "DELETE",
	});
	return handleResponse<void>(response);
}

export async function restoreIndirectWorkCase(
	id: number,
): Promise<SingleResponse<IndirectWorkCase>> {
	const response = await fetch(
		`${API_BASE_URL}/indirect-work-cases/${id}/actions/restore`,
		{ method: "POST" },
	);
	return handleResponse<SingleResponse<IndirectWorkCase>>(response);
}

// ============================================================
// Indirect Work Type Ratios
// ============================================================

export async function fetchIndirectWorkTypeRatios(
	caseId: number,
): Promise<PaginatedResponse<IndirectWorkTypeRatio>> {
	const searchParams = new URLSearchParams({
		"page[number]": "1",
		"page[size]": "1000",
	});
	const response = await fetch(
		`${API_BASE_URL}/indirect-work-cases/${caseId}/indirect-work-type-ratios?${searchParams}`,
	);
	return handleResponse<PaginatedResponse<IndirectWorkTypeRatio>>(response);
}

export async function bulkUpdateIndirectWorkTypeRatios(
	caseId: number,
	input: BulkIndirectWorkRatioInput,
): Promise<{ data: IndirectWorkTypeRatio[] }> {
	const response = await fetch(
		`${API_BASE_URL}/indirect-work-cases/${caseId}/indirect-work-type-ratios/bulk`,
		{
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(input),
		},
	);
	return handleResponse<{ data: IndirectWorkTypeRatio[] }>(response);
}

// ============================================================
// Monthly Indirect Work Loads
// ============================================================

export async function fetchMonthlyIndirectWorkLoads(
	caseId: number,
	businessUnitCode?: string,
): Promise<PaginatedResponse<MonthlyIndirectWorkLoad>> {
	const searchParams = new URLSearchParams({
		"page[number]": "1",
		"page[size]": "1000",
	});
	if (businessUnitCode) {
		searchParams.set("businessUnitCode", businessUnitCode);
	}
	const response = await fetch(
		`${API_BASE_URL}/indirect-work-cases/${caseId}/monthly-indirect-work-loads?${searchParams}`,
	);
	return handleResponse<PaginatedResponse<MonthlyIndirectWorkLoad>>(response);
}

export async function bulkSaveMonthlyIndirectWorkLoads(
	caseId: number,
	input: BulkMonthlyIndirectWorkLoadInput,
): Promise<{ data: MonthlyIndirectWorkLoad[] }> {
	const response = await fetch(
		`${API_BASE_URL}/indirect-work-cases/${caseId}/monthly-indirect-work-loads/bulk`,
		{
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(input),
		},
	);
	return handleResponse<{ data: MonthlyIndirectWorkLoad[] }>(response);
}
