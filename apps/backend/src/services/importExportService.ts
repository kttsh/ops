import { HTTPException } from "hono/http-exception";
import { importExportData } from "@/data/importExportData";
import type {
	BulkImportInput,
	BulkImportResult,
	ExportDataResponse,
	ExportRow,
} from "@/types/importExport";

function generateYearMonths(min: string, max: string): string[] {
	const result: string[] = [];
	let year = parseInt(min.slice(0, 4), 10);
	let month = parseInt(min.slice(4, 6), 10);
	const endYear = parseInt(max.slice(0, 4), 10);
	const endMonth = parseInt(max.slice(4, 6), 10);

	while (year < endYear || (year === endYear && month <= endMonth)) {
		result.push(`${year}${String(month).padStart(2, "0")}`);
		month++;
		if (month > 12) {
			month = 1;
			year++;
		}
	}

	return result;
}

export const importExportService = {
	async getExportData(): Promise<ExportDataResponse> {
		const [rows, range] = await Promise.all([
			importExportData.getExportData(),
			importExportData.getYearMonthRange(),
		]);

		if (rows.length === 0 || !range) {
			return { data: [], yearMonths: [] };
		}

		const yearMonths = generateYearMonths(
			range.minYearMonth,
			range.maxYearMonth,
		);

		// ケース単位でグループ化
		const caseMap = new Map<number, ExportRow>();
		for (const row of rows) {
			let exportRow = caseMap.get(row.project_case_id);
			if (!exportRow) {
				exportRow = {
					projectCaseId: row.project_case_id,
					projectName: row.project_name,
					caseName: row.case_name,
					loads: [],
				};
				caseMap.set(row.project_case_id, exportRow);
			}
			exportRow.loads.push({
				yearMonth: row.year_month,
				manhour: row.manhour,
			});
		}

		return {
			data: Array.from(caseMap.values()),
			yearMonths,
		};
	},

	async bulkImport(input: BulkImportInput): Promise<BulkImportResult> {
		// 全 projectCaseId を抽出してバリデーション
		const uniqueIds = [
			...new Set(input.items.map((item) => item.projectCaseId)),
		];
		const invalidIds = await importExportData.validateProjectCaseIds(uniqueIds);

		if (invalidIds.length > 0) {
			throw new HTTPException(422, {
				message: `Invalid project case IDs: ${invalidIds.join(", ")}`,
			});
		}

		return importExportData.bulkImportByCase(input.items);
	},
};
