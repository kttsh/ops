import { API_BASE_URL, handleResponse } from "@/lib/api";

export interface ExportRow {
	projectCaseId: number;
	projectName: string;
	caseName: string;
	loads: Array<{ yearMonth: string; manhour: number }>;
}

export interface ExportDataResponse {
	data: ExportRow[];
	yearMonths: string[];
}

export interface BulkImportResult {
	data: {
		updatedCases: number;
		updatedRecords: number;
	};
}

export async function fetchExportData(): Promise<ExportDataResponse> {
	const response = await fetch(`${API_BASE_URL}/bulk/export-project-loads`);
	return handleResponse<ExportDataResponse>(response);
}

export async function postBulkImport(
	items: Array<{
		projectCaseId: number;
		yearMonth: string;
		manhour: number;
	}>,
): Promise<BulkImportResult> {
	const response = await fetch(`${API_BASE_URL}/bulk/import-project-loads`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ items }),
	});
	return handleResponse<BulkImportResult>(response);
}
