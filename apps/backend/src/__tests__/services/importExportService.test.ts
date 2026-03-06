import { HTTPException } from "hono/http-exception";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/data/importExportData", () => ({
	importExportData: {
		getExportData: vi.fn(),
		getYearMonthRange: vi.fn(),
		validateProjectCaseIds: vi.fn(),
		bulkImportByCase: vi.fn(),
	},
}));

import { importExportData } from "@/data/importExportData";
import { importExportService } from "@/services/importExportService";

const mockedData = vi.mocked(importExportData);

describe("importExportService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getExportData", () => {
		test("全案件の工数データをケース単位でグループ化して返す", async () => {
			mockedData.getExportData.mockResolvedValue([
				{
					project_case_id: 1,
					project_name: "案件A",
					case_name: "標準",
					year_month: "202601",
					manhour: 1000,
				},
				{
					project_case_id: 1,
					project_name: "案件A",
					case_name: "標準",
					year_month: "202602",
					manhour: 2000,
				},
				{
					project_case_id: 2,
					project_name: "案件B",
					case_name: "楽観",
					year_month: "202601",
					manhour: 500,
				},
			]);
			mockedData.getYearMonthRange.mockResolvedValue({
				minYearMonth: "202601",
				maxYearMonth: "202602",
			});

			const result = await importExportService.getExportData();

			expect(result.data).toHaveLength(2);
			expect(result.data[0]).toEqual({
				projectCaseId: 1,
				projectName: "案件A",
				caseName: "標準",
				loads: [
					{ yearMonth: "202601", manhour: 1000 },
					{ yearMonth: "202602", manhour: 2000 },
				],
			});
			expect(result.data[1]).toEqual({
				projectCaseId: 2,
				projectName: "案件B",
				caseName: "楽観",
				loads: [{ yearMonth: "202601", manhour: 500 }],
			});
			expect(result.yearMonths).toEqual(["202601", "202602"]);
		});

		test("データがない場合は空配列と空年月を返す", async () => {
			mockedData.getExportData.mockResolvedValue([]);
			mockedData.getYearMonthRange.mockResolvedValue(null);

			const result = await importExportService.getExportData();

			expect(result.data).toEqual([]);
			expect(result.yearMonths).toEqual([]);
		});
	});

	describe("bulkImport", () => {
		test("正常インポートで更新件数を返す", async () => {
			mockedData.validateProjectCaseIds.mockResolvedValue([]);
			mockedData.bulkImportByCase.mockResolvedValue({
				updatedCases: 2,
				updatedRecords: 3,
			});

			const result = await importExportService.bulkImport({
				items: [
					{ projectCaseId: 1, yearMonth: "202601", manhour: 1000 },
					{ projectCaseId: 1, yearMonth: "202602", manhour: 2000 },
					{ projectCaseId: 2, yearMonth: "202601", manhour: 500 },
				],
			});

			expect(result).toEqual({ updatedCases: 2, updatedRecords: 3 });
			expect(mockedData.validateProjectCaseIds).toHaveBeenCalledWith([1, 2]);
			expect(mockedData.bulkImportByCase).toHaveBeenCalledWith([
				{ projectCaseId: 1, yearMonth: "202601", manhour: 1000 },
				{ projectCaseId: 1, yearMonth: "202602", manhour: 2000 },
				{ projectCaseId: 2, yearMonth: "202601", manhour: 500 },
			]);
		});

		test("無効な projectCaseId がある場合は 422 をスローする", async () => {
			mockedData.validateProjectCaseIds.mockResolvedValue([999, 888]);

			await expect(
				importExportService.bulkImport({
					items: [
						{ projectCaseId: 999, yearMonth: "202601", manhour: 1000 },
						{ projectCaseId: 888, yearMonth: "202601", manhour: 500 },
					],
				}),
			).rejects.toThrow(HTTPException);

			try {
				await importExportService.bulkImport({
					items: [{ projectCaseId: 999, yearMonth: "202601", manhour: 1000 }],
				});
			} catch (err) {
				expect(err).toBeInstanceOf(HTTPException);
				expect((err as HTTPException).status).toBe(422);
			}

			expect(mockedData.bulkImportByCase).not.toHaveBeenCalled();
		});
	});
});
