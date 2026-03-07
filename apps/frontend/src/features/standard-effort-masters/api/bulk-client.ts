import { API_BASE_URL, handleResponse } from "@/lib/api";

export interface StandardEffortExportRow {
	standardEffortId: number;
	name: string;
	businessUnitCode: string;
	projectTypeCode: string;
	weights: Array<{ progressRate: number; weight: number }>;
}

export interface StandardEffortExportResponse {
	data: StandardEffortExportRow[];
}

export interface StandardEffortBulkImportItem {
	standardEffortId: number;
	weights: Array<{ progressRate: number; weight: number }>;
}

export interface StandardEffortBulkImportResult {
	data: {
		updatedMasters: number;
		updatedWeights: number;
	};
}

export async function fetchExportData(params?: {
	businessUnitCode?: string;
}): Promise<StandardEffortExportResponse> {
	const searchParams = new URLSearchParams();
	if (params?.businessUnitCode) {
		searchParams.set("filter[businessUnitCode]", params.businessUnitCode);
	}
	const query = searchParams.toString();
	const url = `${API_BASE_URL}/standard-effort-masters/actions/export${query ? `?${query}` : ""}`;
	const response = await fetch(url);
	return handleResponse<StandardEffortExportResponse>(response);
}

export async function postBulkImport(
	items: StandardEffortBulkImportItem[],
): Promise<StandardEffortBulkImportResult> {
	const response = await fetch(
		`${API_BASE_URL}/standard-effort-masters/actions/import`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ items }),
		},
	);
	return handleResponse<StandardEffortBulkImportResult>(response);
}
