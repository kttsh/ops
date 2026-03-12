import { beforeEach, describe, expect, test, vi } from "vitest";
import type {
	ExportDataRow,
	ImportProjectLookupRow,
} from "@/types/importExport";

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
			NVarChar: (n: number) => `NVarChar(${n})`,
		},
	};
});

vi.mock("@/database/client", () => ({
	getPool: vi.fn().mockResolvedValue({
		request: mockRequest,
	}),
}));

// --- サンプルデータ ---

const sampleExportRows: ExportDataRow[] = [
	{
		project_code: "PRJ-001",
		business_unit_code: "BU-A",
		fiscal_year: 2026,
		project_type_code: "PT-001",
		project_name: "案件A",
		nickname: "略称A",
		customer_name: "客先A",
		order_number: "ORD-001",
		start_year_month: "202601",
		total_manhour: 5000,
		duration_months: 12,
		calculation_basis: "根拠A",
		remarks: "備考A",
		region: "東北",
		project_case_id: 1,
		case_name: "標準ケース",
		year_month: "202601",
		manhour: 1000,
	},
	{
		project_code: "PRJ-001",
		business_unit_code: "BU-A",
		fiscal_year: 2026,
		project_type_code: "PT-001",
		project_name: "案件A",
		nickname: "略称A",
		customer_name: "客先A",
		order_number: "ORD-001",
		start_year_month: "202601",
		total_manhour: 5000,
		duration_months: 12,
		calculation_basis: "根拠A",
		remarks: "備考A",
		region: "東北",
		project_case_id: 1,
		case_name: "標準ケース",
		year_month: "202602",
		manhour: 2000,
	},
	{
		project_code: "PRJ-002",
		business_unit_code: "BU-B",
		fiscal_year: null,
		project_type_code: null,
		project_name: "案件B",
		nickname: null,
		customer_name: null,
		order_number: null,
		start_year_month: "202601",
		total_manhour: 3000,
		duration_months: null,
		calculation_basis: null,
		remarks: null,
		region: null,
		project_case_id: 2,
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

	// =========================================================================
	// 2.1: エクスポート SQL の拡張
	// =========================================================================

	describe("getExportData", () => {
		test("案件メタデータカラムを含むエクスポートデータを取得する", async () => {
			mockQuery.mockResolvedValueOnce({ recordset: sampleExportRows });

			const result = await importExportData.getExportData();

			expect(result).toEqual(sampleExportRows);
			expect(mockQuery).toHaveBeenCalledTimes(1);
			const queryStr = mockQuery.mock.calls[0][0] as string;
			// 新カラムが SELECT に含まれること
			expect(queryStr).toContain("p.project_code");
			expect(queryStr).toContain("p.business_unit_code");
			expect(queryStr).toContain("p.fiscal_year");
			expect(queryStr).toContain("p.project_type_code");
			expect(queryStr).toContain("p.nickname");
			expect(queryStr).toContain("p.customer_name");
			expect(queryStr).toContain("p.order_number");
			expect(queryStr).toContain("p.calculation_basis");
			expect(queryStr).toContain("p.remarks");
			expect(queryStr).toContain("p.region");
			expect(queryStr).toContain("p.start_year_month");
			expect(queryStr).toContain("p.total_manhour");
			expect(queryStr).toContain("p.duration_months");
		});

		test("ソート順が案件コード昇順 → ケース ID 昇順であること", async () => {
			mockQuery.mockResolvedValueOnce({ recordset: sampleExportRows });

			await importExportData.getExportData();

			const queryStr = mockQuery.mock.calls[0][0] as string;
			expect(queryStr).toContain("p.project_code ASC");
			expect(queryStr).toContain("pc.project_case_id ASC");
		});

		test("削除済みデータを除外すること", async () => {
			mockQuery.mockResolvedValueOnce({ recordset: [] });

			await importExportData.getExportData();

			const queryStr = mockQuery.mock.calls[0][0] as string;
			expect(queryStr).toContain("p.deleted_at IS NULL");
			expect(queryStr).toContain("pc.deleted_at IS NULL");
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

	// =========================================================================
	// 既存: validateProjectCaseIds（維持）
	// =========================================================================

	describe("validateProjectCaseIds", () => {
		test("全て有効な場合は空配列を返す", async () => {
			mockQuery.mockResolvedValueOnce({
				recordset: [{ cnt: 3 }],
			});

			const result = await importExportData.validateProjectCaseIds([1, 2, 3]);

			expect(result).toEqual([]);
		});

		test("無効な ID がある場合はそれらを返す", async () => {
			mockQuery.mockResolvedValueOnce({
				recordset: [{ cnt: 2 }],
			});
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

	// =========================================================================
	// 2.2: マスタ存在チェックのバッチ検証
	// =========================================================================

	describe("validateBusinessUnitCodes", () => {
		test("全て有効な場合は空配列を返す", async () => {
			mockQuery.mockResolvedValueOnce({
				recordset: [
					{ business_unit_code: "BU-A" },
					{ business_unit_code: "BU-B" },
				],
			});

			const result = await importExportData.validateBusinessUnitCodes([
				"BU-A",
				"BU-B",
			]);

			expect(result).toEqual([]);
		});

		test("無効なコードがある場合はそれらを返す", async () => {
			mockQuery.mockResolvedValueOnce({
				recordset: [{ business_unit_code: "BU-A" }],
			});

			const result = await importExportData.validateBusinessUnitCodes([
				"BU-A",
				"BU-INVALID",
			]);

			expect(result).toEqual(["BU-INVALID"]);
		});

		test("空配列の場合は空配列を返す", async () => {
			const result = await importExportData.validateBusinessUnitCodes([]);

			expect(result).toEqual([]);
			expect(mockQuery).not.toHaveBeenCalled();
		});

		test("重複するコードを正しく処理する", async () => {
			mockQuery.mockResolvedValueOnce({
				recordset: [{ business_unit_code: "BU-A" }],
			});

			const result = await importExportData.validateBusinessUnitCodes([
				"BU-A",
				"BU-A",
				"BU-INVALID",
			]);

			expect(result).toEqual(["BU-INVALID"]);
		});
	});

	describe("validateProjectTypeCodes", () => {
		test("全て有効な場合は空配列を返す", async () => {
			mockQuery.mockResolvedValueOnce({
				recordset: [
					{ project_type_code: "PT-001" },
					{ project_type_code: "PT-002" },
				],
			});

			const result = await importExportData.validateProjectTypeCodes([
				"PT-001",
				"PT-002",
			]);

			expect(result).toEqual([]);
		});

		test("無効なコードがある場合はそれらを返す", async () => {
			mockQuery.mockResolvedValueOnce({
				recordset: [{ project_type_code: "PT-001" }],
			});

			const result = await importExportData.validateProjectTypeCodes([
				"PT-001",
				"PT-INVALID",
			]);

			expect(result).toEqual(["PT-INVALID"]);
		});

		test("空配列の場合は空配列を返す", async () => {
			const result = await importExportData.validateProjectTypeCodes([]);

			expect(result).toEqual([]);
			expect(mockQuery).not.toHaveBeenCalled();
		});
	});

	// =========================================================================
	// 2.3: 案件コード自動生成と案件 CRUD
	// =========================================================================

	describe("findProjectsByProjectCodes", () => {
		test("案件コードで既存案件を検索して Map で返す", async () => {
			const rows: ImportProjectLookupRow[] = [
				{ project_id: 1, project_code: "PRJ-001" },
				{ project_id: 2, project_code: "PRJ-002" },
			];
			mockQuery.mockResolvedValueOnce({ recordset: rows });

			const result = await importExportData.findProjectsByProjectCodes([
				"PRJ-001",
				"PRJ-002",
			]);

			expect(result).toBeInstanceOf(Map);
			expect(result.size).toBe(2);
			expect(result.get("PRJ-001")).toEqual({
				project_id: 1,
				project_code: "PRJ-001",
			});
			expect(result.get("PRJ-002")).toEqual({
				project_id: 2,
				project_code: "PRJ-002",
			});
		});

		test("一部の案件コードが見つからない場合は見つかったもののみ返す", async () => {
			const rows: ImportProjectLookupRow[] = [
				{ project_id: 1, project_code: "PRJ-001" },
			];
			mockQuery.mockResolvedValueOnce({ recordset: rows });

			const result = await importExportData.findProjectsByProjectCodes([
				"PRJ-001",
				"PRJ-999",
			]);

			expect(result.size).toBe(1);
			expect(result.has("PRJ-999")).toBe(false);
		});

		test("空配列の場合は空 Map を返す", async () => {
			const result = await importExportData.findProjectsByProjectCodes([]);

			expect(result).toBeInstanceOf(Map);
			expect(result.size).toBe(0);
			expect(mockQuery).not.toHaveBeenCalled();
		});
	});

	describe("generateNextAutoCode", () => {
		test("既存の AUTO コードがない場合は AUTO-000001 を返す", async () => {
			mockQuery.mockResolvedValueOnce({
				recordset: [{ max_code: null }],
			});

			const mockTransaction = { begin: vi.fn(), commit: vi.fn() };
			const result = await importExportData.generateNextAutoCode(
				mockTransaction as never,
			);

			expect(result).toBe("AUTO-000001");
		});

		test("既存の AUTO コードがある場合はインクリメントして返す", async () => {
			mockQuery.mockResolvedValueOnce({
				recordset: [{ max_code: "AUTO-000005" }],
			});

			const mockTransaction = { begin: vi.fn(), commit: vi.fn() };
			const result = await importExportData.generateNextAutoCode(
				mockTransaction as never,
			);

			expect(result).toBe("AUTO-000006");
		});

		test("0 埋め 6 桁でフォーマットされること", async () => {
			mockQuery.mockResolvedValueOnce({
				recordset: [{ max_code: "AUTO-000099" }],
			});

			const mockTransaction = { begin: vi.fn(), commit: vi.fn() };
			const result = await importExportData.generateNextAutoCode(
				mockTransaction as never,
			);

			expect(result).toBe("AUTO-000100");
		});
	});

	describe("createProject", () => {
		test("案件を INSERT して project_id を返す", async () => {
			mockQuery.mockResolvedValueOnce({
				recordset: [{ project_id: 42 }],
			});

			const mockTransaction = { begin: vi.fn(), commit: vi.fn() };
			const result = await importExportData.createProject(
				{
					projectCode: "AUTO-000001",
					name: "新規案件",
					businessUnitCode: "BU-A",
					projectTypeCode: "PT-001",
					startYearMonth: "202601",
					totalManhour: 1000,
					status: "ACTIVE",
					durationMonths: 12,
					fiscalYear: 2026,
					nickname: "略称",
					customerName: "客先",
					orderNumber: "ORD-001",
					calculationBasis: "根拠",
					remarks: "備考",
					region: "東北",
				},
				mockTransaction as never,
			);

			expect(result).toBe(42);
			const queryStr = mockQuery.mock.calls[0][0] as string;
			expect(queryStr).toContain("INSERT INTO projects");
			expect(queryStr).toContain("OUTPUT INSERTED.project_id");
		});
	});

	describe("updateProject", () => {
		test("案件メタデータを UPDATE する", async () => {
			mockQuery.mockResolvedValueOnce({});

			const mockTransaction = { begin: vi.fn(), commit: vi.fn() };
			await importExportData.updateProject(
				1,
				{
					name: "更新案件",
					businessUnitCode: "BU-B",
					projectTypeCode: null,
					startYearMonth: "202602",
					totalManhour: 2000,
					durationMonths: null,
					fiscalYear: null,
					nickname: null,
					customerName: null,
					orderNumber: null,
					calculationBasis: null,
					remarks: null,
					region: null,
				},
				mockTransaction as never,
			);

			expect(mockQuery).toHaveBeenCalledTimes(1);
			const queryStr = mockQuery.mock.calls[0][0] as string;
			expect(queryStr).toContain("UPDATE projects");
			expect(queryStr).toContain("deleted_at IS NULL");
		});
	});

	describe("softDeleteProject", () => {
		test("案件をソフトデリートする", async () => {
			mockQuery.mockResolvedValueOnce({});

			const mockTransaction = { begin: vi.fn(), commit: vi.fn() };
			await importExportData.softDeleteProject(1, mockTransaction as never);

			expect(mockQuery).toHaveBeenCalledTimes(1);
			const queryStr = mockQuery.mock.calls[0][0] as string;
			expect(queryStr).toContain("UPDATE projects");
			expect(queryStr).toContain("deleted_at = GETDATE()");
		});
	});

	// =========================================================================
	// 2.4: ケース CRUD と月次データ MERGE
	// =========================================================================

	describe("createProjectCase", () => {
		test("ケースを INSERT して project_case_id を返す", async () => {
			mockQuery.mockResolvedValueOnce({
				recordset: [{ project_case_id: 100 }],
			});

			const mockTransaction = { begin: vi.fn(), commit: vi.fn() };
			const result = await importExportData.createProjectCase(
				1,
				"標準ケース",
				mockTransaction as never,
			);

			expect(result).toBe(100);
			const queryStr = mockQuery.mock.calls[0][0] as string;
			expect(queryStr).toContain("INSERT INTO project_cases");
			expect(queryStr).toContain("OUTPUT INSERTED.project_case_id");
		});
	});

	describe("mergeProjectLoad", () => {
		test("月次データを MERGE する", async () => {
			mockQuery.mockResolvedValueOnce({});

			const mockTransaction = { begin: vi.fn(), commit: vi.fn() };
			await importExportData.mergeProjectLoad(
				100,
				"202601",
				1000,
				mockTransaction as never,
			);

			expect(mockQuery).toHaveBeenCalledTimes(1);
			const queryStr = mockQuery.mock.calls[0][0] as string;
			expect(queryStr).toContain("MERGE project_load");
			expect(queryStr).toContain("WHEN MATCHED THEN");
			expect(queryStr).toContain("WHEN NOT MATCHED THEN");
		});
	});
});
