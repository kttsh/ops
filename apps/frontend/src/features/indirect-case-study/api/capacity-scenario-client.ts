import type {
	CalculateCapacityParams,
	CalculateCapacityResult,
	CapacityScenario,
	CapacityScenarioListParams,
	CreateCapacityScenarioInput,
	MonthlyCapacity,
	UpdateCapacityScenarioInput,
} from "@/features/indirect-case-study/types";
import {
	API_BASE_URL,
	handleResponse,
	type PaginatedResponse,
	type SingleResponse,
} from "@/lib/api";

// ============================================================
// Capacity Scenarios
// ============================================================

export async function fetchCapacityScenarios(
	params: CapacityScenarioListParams,
): Promise<PaginatedResponse<CapacityScenario>> {
	const searchParams = new URLSearchParams({
		"page[number]": "1",
		"page[size]": "1000",
	});
	if (params.includeDisabled) {
		searchParams.set("filter[includeDisabled]", "true");
	}
	const response = await fetch(
		`${API_BASE_URL}/capacity-scenarios?${searchParams}`,
	);
	return handleResponse<PaginatedResponse<CapacityScenario>>(response);
}

export async function createCapacityScenario(
	input: CreateCapacityScenarioInput,
): Promise<SingleResponse<CapacityScenario>> {
	const response = await fetch(`${API_BASE_URL}/capacity-scenarios`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	return handleResponse<SingleResponse<CapacityScenario>>(response);
}

export async function updateCapacityScenario(
	id: number,
	input: UpdateCapacityScenarioInput,
): Promise<SingleResponse<CapacityScenario>> {
	const response = await fetch(`${API_BASE_URL}/capacity-scenarios/${id}`, {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	return handleResponse<SingleResponse<CapacityScenario>>(response);
}

export async function deleteCapacityScenario(id: number): Promise<void> {
	const response = await fetch(`${API_BASE_URL}/capacity-scenarios/${id}`, {
		method: "DELETE",
	});
	return handleResponse<void>(response);
}

export async function restoreCapacityScenario(
	id: number,
): Promise<SingleResponse<CapacityScenario>> {
	const response = await fetch(
		`${API_BASE_URL}/capacity-scenarios/${id}/actions/restore`,
		{ method: "POST" },
	);
	return handleResponse<SingleResponse<CapacityScenario>>(response);
}

// ============================================================
// Capacity Calculation
// ============================================================

export async function calculateCapacity(
	params: CalculateCapacityParams,
): Promise<SingleResponse<CalculateCapacityResult>> {
	const body: Record<string, unknown> = {
		headcountPlanCaseId: params.headcountPlanCaseId,
	};
	if (params.businessUnitCodes?.length) {
		body.businessUnitCodes = params.businessUnitCodes;
	}
	if (params.yearMonthFrom) {
		body.yearMonthFrom = params.yearMonthFrom;
	}
	if (params.yearMonthTo) {
		body.yearMonthTo = params.yearMonthTo;
	}

	const response = await fetch(
		`${API_BASE_URL}/capacity-scenarios/${params.capacityScenarioId}/actions/calculate`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		},
	);
	return handleResponse<SingleResponse<CalculateCapacityResult>>(response);
}

// ============================================================
// Monthly Capacities
// ============================================================

export async function fetchMonthlyCapacities(
	scenarioId: number,
	businessUnitCode?: string,
): Promise<PaginatedResponse<MonthlyCapacity>> {
	const searchParams = new URLSearchParams({
		"page[number]": "1",
		"page[size]": "1000",
	});
	if (businessUnitCode) {
		searchParams.set("businessUnitCode", businessUnitCode);
	}
	const response = await fetch(
		`${API_BASE_URL}/capacity-scenarios/${scenarioId}/monthly-capacities?${searchParams}`,
	);
	return handleResponse<PaginatedResponse<MonthlyCapacity>>(response);
}
