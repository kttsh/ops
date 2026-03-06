import { beforeEach, describe, expect, test, vi } from "vitest";
import type { ExportDataRow } from "@/types/importExport";

// mssql のモック
const mockQuery = vi.fn();
const mockInput = vi.fn().mockReturnThis();
const mockRequest = vi.fn(() => ({
	input: mockInput,
	query: mockQuery,
}));

const mockTransactionBegin = vi.fn();
const mockTransactionCommit = vi.fn();
const mockTransactionRollback = vi.fn();
vi.mock("mssql", () => {
	function MockTransaction() {
		return {
			begin: mockTransactionBegin,
			commit: mockTransactionCommit,
			rollback: mockTransactionRollback,
		};
	}
	function MockRequest() {
		return {
			input: mockInput,
			query: mockQuery,
		};
	}
	return {
		default: {
			Int: "Int",
			Char: (n: number) => `Char(${n})`,
			Transaction: MockTransaction,
			Request: MockRequest,
			VarChar: (n: number) => `VarChar(${n})`,
		},
	};
});

vi.mock("@/database/client", () => ({
	getPool: vi.fn().mockResolvedValue({
		request: mockRequest,
	}),
}));

const sampleExportRows: ExportDataRow[] = [
	{
		project_case_id: 1,
		project_name: "案件A",
		case_name: "標準ケース",
		year_month: "202601",
		manhour: 1000,
	},
	{
		project_case_id: 1,
		project_name: "案件A",
		case_name: "標準ケース",
		year_month: "202602",
		manhour: 2000,
	},
	{
		project_case_id: 2,
		project_name: "案件B",
		case_name: "楽観ケース",
		year_month: "202601",
		manhour: 500,
	},
];

describe("importExportData", () => {
	let importExportData: typeof import("@/data/importExportData").importExportData;

	beforeEach(async () => {
		vi.clearAllMocks();
		mockInput.mockReturnThis();
		const mod = await import("@/data/importExportData");
		importExportData = mod.importExportData;
	});

	describe("getExportData", () => {
		test("全案件・全ケースの工数データを JOIN で取得する", async () => {
			mockQuery.mockResolvedValueOnce({ recordset: sampleExportRows });

			const result = await importExportData.getExportData();

			expect(result).toEqual(sampleExportRows);
			expect(mockQuery).toHaveBeenCalledTimes(1);
			const queryStr = mockQuery.mock.calls[0][0] as string;
			expect(queryStr).toContain("project_load");
			expect(queryStr).toContain("project_cases");
			expect(queryStr).toContain("projects");
			expect(queryStr).toContain("deleted_at IS NULL");
		});

		test("データがない場合は空配列を返す", async () => {
			mockQuery.mockResolvedValueOnce({ recordset: [] });

			const result = await importExportData.getExportData();

			expect(result).toEqual([]);
		});
	});

	describe("getYearMonthRange", () => {
		test("全レコードの年月範囲を返す", async () => {
			mockQuery.mockResolvedValueOnce({
				recordset: [{ min_year_month: "202601", max_year_month: "202612" }],
			});

			const result = await importExportData.getYearMonthRange();

			expect(result).toEqual({
				minYearMonth: "202601",
				maxYearMonth: "202612",
			});
		});

		test("データがない場合は null を返す", async () => {
			mockQuery.mockResolvedValueOnce({
				recordset: [{ min_year_month: null, max_year_month: null }],
			});

			const result = await importExportData.getYearMonthRange();

			expect(result).toBeNull();
		});
	});

	describe("validateProjectCaseIds", () => {
		test("全て有効な場合は空配列を返す", async () => {
			mockQuery.mockResolvedValueOnce({
				recordset: [{ cnt: 3 }],
			});

			const result = await importExportData.validateProjectCaseIds([1, 2, 3]);

			expect(result).toEqual([]);
		});

		test("無効な ID がある場合はそれらを返す", async () => {
			// countクエリ: 2件のみ有効
			mockQuery.mockResolvedValueOnce({
				recordset: [{ cnt: 2 }],
			});
			// 有効なIDを取得するクエリ
			mockQuery.mockResolvedValueOnce({
				recordset: [{ project_case_id: 1 }, { project_case_id: 3 }],
			});

			const result = await importExportData.validateProjectCaseIds([1, 2, 3]);

			expect(result).toEqual([2]);
		});

		test("空配列の場合は空配列を返す", async () => {
			const result = await importExportData.validateProjectCaseIds([]);

			expect(result).toEqual([]);
		});
	});

	describe("bulkImportByCase", () => {
		test("案件ケースごとに MERGE を実行する", async () => {
			mockTransactionBegin.mockResolvedValueOnce(undefined);
			mockTransactionCommit.mockResolvedValueOnce(undefined);
			mockQuery.mockResolvedValue({});

			const items = [
				{ projectCaseId: 1, yearMonth: "202601", manhour: 1000 },
				{ projectCaseId: 1, yearMonth: "202602", manhour: 2000 },
				{ projectCaseId: 2, yearMonth: "202601", manhour: 500 },
			];

			const result = await importExportData.bulkImportByCase(items);

			expect(mockTransactionBegin).toHaveBeenCalledTimes(1);
			expect(mockTransactionCommit).toHaveBeenCalledTimes(1);
			expect(result).toEqual({ updatedCases: 2, updatedRecords: 3 });
		});

		test("エラー時にロールバックする", async () => {
			mockTransactionBegin.mockResolvedValueOnce(undefined);
			mockTransactionRollback.mockResolvedValueOnce(undefined);
			mockQuery.mockRejectedValueOnce(new Error("DB Error"));

			const items = [{ projectCaseId: 1, yearMonth: "202601", manhour: 1000 }];

			await expect(importExportData.bulkImportByCase(items)).rejects.toThrow(
				"DB Error",
			);

			expect(mockTransactionRollback).toHaveBeenCalledTimes(1);
			expect(mockTransactionCommit).not.toHaveBeenCalled();
		});
	});
});
