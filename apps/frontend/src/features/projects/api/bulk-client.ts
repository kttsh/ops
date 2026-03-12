import { API_BASE_URL, handleResponse } from "@/lib/api";

export interface ExportRow {
	projectCode: string;
	businessUnitCode: string;
	fiscalYear: number | null;
	projectTypeCode: string | null;
	name: string;
	nickname: string | null;
	customerName: string | null;
	orderNumber: string | null;
	startYearMonth: string;
	totalManhour: number;
	durationMonths: number | null;
	calculationBasis: string | null;
	remarks: string | null;
	region: string | null;
	projectCaseId: number;
	caseName: string;
	loads: Array<{ yearMonth: string; manhour: number }>;
}

export interface ExportDataResponse {
	data: ExportRow[];
	yearMonths: string[];
}

export interface BulkImportRow {
	projectCode: string | null;
	businessUnitCode: string;
	fiscalYear: number | null;
	projectTypeCode: string | null;
	name: string;
	nickname: string | null;
	customerName: string | null;
	orderNumber: string | null;
	startYearMonth: string;
	totalManhour: number;
	durationMonths: number | null;
	calculationBasis: string | null;
	remarks: string | null;
	region: string | null;
	deleteFlag: boolean;
	projectCaseId: number | null;
	caseName: string;
	loads: Array<{ yearMonth: string; manhour: number }>;
}

export interface BulkImportResult {
	data: {
		createdProjects: number;
		updatedProjects: number;
		deletedProjects: number;
		createdCases: number;
		updatedCases: number;
		updatedRecords: number;
	};
}

export async function fetchExportData(): Promise<ExportDataResponse> {
	const response = await fetch(`${API_BASE_URL}/bulk/export-project-loads`);
	return handleResponse<ExportDataResponse>(response);
}

export async function postBulkImport(
	items: BulkImportRow[],
): Promise<BulkImportResult> {
	const response = await fetch(`${API_BASE_URL}/bulk/import-project-loads`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ items }),
	});
	return handleResponse<BulkImportResult>(response);
}
