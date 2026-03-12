import { HTTPException } from "hono/http-exception";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { ExportDataRow } from "@/types/importExport";

// mssql のモック
const mockTransactionBegin = vi.fn();
const mockTransactionCommit = vi.fn();
const mockTransactionRollback = vi.fn();

const mockTransaction = {
	begin: mockTransactionBegin,
	commit: mockTransactionCommit,
	rollback: mockTransactionRollback,
};

function MockTransactionCtor() {
	return mockTransaction;
}

vi.mock("mssql", () => ({
	default: {
		Transaction: MockTransactionCtor,
		Int: "Int",
		Char: (n: number) => `Char(${n})`,
		VarChar: (n: number) => `VarChar(${n})`,
		NVarChar: (n: number) => `NVarChar(${n})`,
	},
}));

vi.mock("@/database/client", () => ({
	getPool: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/data/importExportData", () => ({
	importExportData: {
		getExportData: vi.fn(),
		getYearMonthRange: vi.fn(),
		validateBusinessUnitCodes: vi.fn(),
		validateProjectTypeCodes: vi.fn(),
		findProjectsByProjectCodes: vi.fn(),
		generateNextAutoCode: vi.fn(),
		createProject: vi.fn(),
		updateProject: vi.fn(),
		softDeleteProject: vi.fn(),
		createProjectCase: vi.fn(),
		mergeProjectLoad: vi.fn(),
	},
}));

import { importExportData } from "@/data/importExportData";
import { importExportService } from "@/services/importExportService";

const mockedData = vi.mocked(importExportData);

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

const validImportRow = {
	projectCode: null as string | null,
	businessUnitCode: "BU-A",
	fiscalYear: 2026,
	projectTypeCode: "PT-001",
	name: "新規案件",
	nickname: "略称",
	customerName: "客先",
	orderNumber: "ORD-001",
	startYearMonth: "202601",
	totalManhour: 1000,
	durationMonths: 12,
	calculationBasis: "根拠",
	remarks: "備考",
	region: "東北",
	deleteFlag: false,
	projectCaseId: null as number | null,
	caseName: "標準ケース",
	loads: [
		{ yearMonth: "202601", manhour: 100 },
		{ yearMonth: "202602", manhour: 200 },
	],
};

describe("importExportService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockTransactionBegin.mockResolvedValue(undefined);
		mockTransactionCommit.mockResolvedValue(undefined);
		mockTransactionRollback.mockResolvedValue(undefined);
		// デフォルトモック（各テストで必要に応じてオーバーライド）
		mockedData.validateBusinessUnitCodes.mockResolvedValue([]);
		mockedData.validateProjectTypeCodes.mockResolvedValue([]);
		mockedData.findProjectsByProjectCodes.mockResolvedValue(new Map());
	});

	// =========================================================================
	// 3.1: エクスポートサービスの刷新
	// =========================================================================

	describe("getExportData", () => {
		test("全案件メタデータをレスポンスに含むこと", async () => {
			mockedData.getExportData.mockResolvedValue(sampleExportRows);
			mockedData.getYearMonthRange.mockResolvedValue({
				minYearMonth: "202601",
				maxYearMonth: "202602",
			});

			const result = await importExportService.getExportData();

			expect(result.data).toHaveLength(2);
			const row1 = result.data[0];
			expect(row1.projectCode).toBe("PRJ-001");
			expect(row1.businessUnitCode).toBe("BU-A");
			expect(row1.fiscalYear).toBe(2026);
			expect(row1.projectTypeCode).toBe("PT-001");
			expect(row1.name).toBe("案件A");
			expect(row1.nickname).toBe("略称A");
			expect(row1.customerName).toBe("客先A");
			expect(row1.orderNumber).toBe("ORD-001");
			expect(row1.startYearMonth).toBe("202601");
			expect(row1.totalManhour).toBe(5000);
			expect(row1.durationMonths).toBe(12);
			expect(row1.calculationBasis).toBe("根拠A");
			expect(row1.remarks).toBe("備考A");
			expect(row1.region).toBe("東北");
			expect(row1.projectCaseId).toBe(1);
			expect(row1.caseName).toBe("標準ケース");
			expect(row1.loads).toEqual([
				{ yearMonth: "202601", manhour: 1000 },
				{ yearMonth: "202602", manhour: 2000 },
			]);
		});

		test("NULL 許容フィールドが null で返ること", async () => {
			mockedData.getExportData.mockResolvedValue(sampleExportRows);
			mockedData.getYearMonthRange.mockResolvedValue({
				minYearMonth: "202601",
				maxYearMonth: "202602",
			});

			const result = await importExportService.getExportData();

			const row2 = result.data[1];
			expect(row2.fiscalYear).toBeNull();
			expect(row2.projectTypeCode).toBeNull();
			expect(row2.nickname).toBeNull();
			expect(row2.customerName).toBeNull();
			expect(row2.orderNumber).toBeNull();
			expect(row2.calculationBasis).toBeNull();
			expect(row2.remarks).toBeNull();
			expect(row2.region).toBeNull();
		});

		test("ケース単位でグループ化すること", async () => {
			mockedData.getExportData.mockResolvedValue(sampleExportRows);
			mockedData.getYearMonthRange.mockResolvedValue({
				minYearMonth: "202601",
				maxYearMonth: "202602",
			});

			const result = await importExportService.getExportData();

			expect(result.data).toHaveLength(2);
			expect(result.data[0].loads).toHaveLength(2);
			expect(result.data[1].loads).toHaveLength(1);
		});

		test("年月範囲を正しく生成すること", async () => {
			mockedData.getExportData.mockResolvedValue(sampleExportRows);
			mockedData.getYearMonthRange.mockResolvedValue({
				minYearMonth: "202601",
				maxYearMonth: "202602",
			});

			const result = await importExportService.getExportData();

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

	// =========================================================================
	// 3.2: インポートサービスのオーケストレーション刷新
	// =========================================================================

	describe("bulkImport", () => {
		test("新規案件作成: 案件コード空欄時に AUTO コード生成して INSERT", async () => {
			mockedData.validateBusinessUnitCodes.mockResolvedValue([]);
			mockedData.validateProjectTypeCodes.mockResolvedValue([]);
			mockedData.findProjectsByProjectCodes.mockResolvedValue(new Map());
			mockedData.generateNextAutoCode.mockResolvedValue("AUTO-000001");
			mockedData.createProject.mockResolvedValue(1);
			mockedData.createProjectCase.mockResolvedValue(100);
			mockedData.mergeProjectLoad.mockResolvedValue(undefined);

			const result = await importExportService.bulkImport({
				items: [validImportRow],
			});

			expect(result.createdProjects).toBe(1);
			expect(result.createdCases).toBe(1);
			expect(result.updatedRecords).toBe(2);
			expect(mockedData.generateNextAutoCode).toHaveBeenCalledTimes(1);
			expect(mockedData.createProject).toHaveBeenCalledWith(
				expect.objectContaining({
					projectCode: "AUTO-000001",
					name: "新規案件",
					businessUnitCode: "BU-A",
					status: "ACTIVE",
				}),
				mockTransaction,
			);
			expect(mockTransactionCommit).toHaveBeenCalledTimes(1);
		});

		test("既存案件更新: 案件コードが DB に存在する場合はメタデータ UPDATE", async () => {
			mockedData.validateBusinessUnitCodes.mockResolvedValue([]);
			mockedData.validateProjectTypeCodes.mockResolvedValue([]);
			mockedData.findProjectsByProjectCodes.mockResolvedValue(
				new Map([["PRJ-001", { project_id: 1, project_code: "PRJ-001" }]]),
			);
			mockedData.mergeProjectLoad.mockResolvedValue(undefined);

			const result = await importExportService.bulkImport({
				items: [
					{
						...validImportRow,
						projectCode: "PRJ-001",
						projectCaseId: 10,
					},
				],
			});

			expect(result.updatedProjects).toBe(1);
			expect(result.updatedCases).toBe(1);
			expect(result.createdProjects).toBe(0);
			expect(mockedData.updateProject).toHaveBeenCalledWith(
				1,
				expect.objectContaining({ name: "新規案件" }),
				mockTransaction,
			);
		});

		test("同一案件コードの複数行: 最初の行のみ UPDATE される", async () => {
			mockedData.validateBusinessUnitCodes.mockResolvedValue([]);
			mockedData.findProjectsByProjectCodes.mockResolvedValue(
				new Map([["PRJ-001", { project_id: 1, project_code: "PRJ-001" }]]),
			);
			mockedData.mergeProjectLoad.mockResolvedValue(undefined);

			const result = await importExportService.bulkImport({
				items: [
					{
						...validImportRow,
						projectCode: "PRJ-001",
						projectCaseId: 10,
						caseName: "ケースA",
					},
					{
						...validImportRow,
						projectCode: "PRJ-001",
						projectCaseId: 20,
						caseName: "ケースB",
					},
				],
			});

			expect(result.updatedProjects).toBe(1);
			expect(result.updatedCases).toBe(2);
			expect(mockedData.updateProject).toHaveBeenCalledTimes(1);
		});

		test("新規ケース作成: projectCaseId 空欄時に INSERT", async () => {
			mockedData.validateBusinessUnitCodes.mockResolvedValue([]);
			mockedData.validateProjectTypeCodes.mockResolvedValue([]);
			mockedData.findProjectsByProjectCodes.mockResolvedValue(new Map());
			mockedData.generateNextAutoCode.mockResolvedValue("AUTO-000001");
			mockedData.createProject.mockResolvedValue(1);
			mockedData.createProjectCase.mockResolvedValue(100);
			mockedData.mergeProjectLoad.mockResolvedValue(undefined);

			const result = await importExportService.bulkImport({
				items: [{ ...validImportRow, projectCaseId: null }],
			});

			expect(result.createdCases).toBe(1);
			expect(mockedData.createProjectCase).toHaveBeenCalledWith(
				1,
				"標準ケース",
				mockTransaction,
			);
		});

		test("ソフトデリート: deleteFlag が true の場合", async () => {
			mockedData.validateBusinessUnitCodes.mockResolvedValue([]);
			mockedData.findProjectsByProjectCodes.mockResolvedValue(
				new Map([["PRJ-001", { project_id: 1, project_code: "PRJ-001" }]]),
			);

			const result = await importExportService.bulkImport({
				items: [
					{
						...validImportRow,
						projectCode: "PRJ-001",
						deleteFlag: true,
						projectCaseId: 10,
					},
				],
			});

			expect(result.deletedProjects).toBe(1);
			expect(result.updatedRecords).toBe(0);
			expect(mockedData.softDeleteProject).toHaveBeenCalledWith(
				1,
				mockTransaction,
			);
			// ソフトデリート時はケース処理・月次データ処理をスキップ
			expect(mockedData.createProjectCase).not.toHaveBeenCalled();
			expect(mockedData.mergeProjectLoad).not.toHaveBeenCalled();
		});

		test("AUTO コード連番: 複数行の新規案件で連番生成", async () => {
			mockedData.validateBusinessUnitCodes.mockResolvedValue([]);
			mockedData.findProjectsByProjectCodes.mockResolvedValue(new Map());
			mockedData.generateNextAutoCode
				.mockResolvedValueOnce("AUTO-000001")
				.mockResolvedValueOnce("AUTO-000002");
			mockedData.createProject
				.mockResolvedValueOnce(1)
				.mockResolvedValueOnce(2);
			mockedData.createProjectCase
				.mockResolvedValueOnce(100)
				.mockResolvedValueOnce(200);
			mockedData.mergeProjectLoad.mockResolvedValue(undefined);

			const result = await importExportService.bulkImport({
				items: [
					{ ...validImportRow, projectCode: null },
					{
						...validImportRow,
						projectCode: null,
						name: "新規案件2",
					},
				],
			});

			expect(result.createdProjects).toBe(2);
			expect(mockedData.generateNextAutoCode).toHaveBeenCalledTimes(2);
		});

		test("マスタ不整合: 無効な BU コードで 422 エラー", async () => {
			mockedData.validateBusinessUnitCodes.mockResolvedValue(["BU-INVALID"]);

			await expect(
				importExportService.bulkImport({
					items: [{ ...validImportRow, businessUnitCode: "BU-INVALID" }],
				}),
			).rejects.toThrow(HTTPException);

			try {
				await importExportService.bulkImport({
					items: [{ ...validImportRow, businessUnitCode: "BU-INVALID" }],
				});
			} catch (err) {
				expect(err).toBeInstanceOf(HTTPException);
				expect((err as HTTPException).status).toBe(422);
			}
		});

		test("マスタ不整合: 無効な PT コードで 422 エラー", async () => {
			mockedData.validateBusinessUnitCodes.mockResolvedValue([]);
			mockedData.validateProjectTypeCodes.mockResolvedValue(["PT-INVALID"]);

			await expect(
				importExportService.bulkImport({
					items: [{ ...validImportRow, projectTypeCode: "PT-INVALID" }],
				}),
			).rejects.toThrow(HTTPException);
		});

		test("PT コードが null のみの場合は PT 検証をスキップ", async () => {
			mockedData.validateBusinessUnitCodes.mockResolvedValue([]);
			mockedData.findProjectsByProjectCodes.mockResolvedValue(new Map());
			mockedData.generateNextAutoCode.mockResolvedValue("AUTO-000001");
			mockedData.createProject.mockResolvedValue(1);
			mockedData.createProjectCase.mockResolvedValue(100);
			mockedData.mergeProjectLoad.mockResolvedValue(undefined);

			await importExportService.bulkImport({
				items: [{ ...validImportRow, projectTypeCode: null }],
			});

			expect(mockedData.validateProjectTypeCodes).not.toHaveBeenCalled();
		});

		test("エラー時にトランザクションをロールバック", async () => {
			mockedData.validateBusinessUnitCodes.mockResolvedValue([]);
			mockedData.findProjectsByProjectCodes.mockResolvedValue(new Map());
			mockedData.generateNextAutoCode.mockRejectedValue(new Error("DB Error"));

			await expect(
				importExportService.bulkImport({
					items: [validImportRow],
				}),
			).rejects.toThrow("DB Error");

			expect(mockTransactionRollback).toHaveBeenCalledTimes(1);
			expect(mockTransactionCommit).not.toHaveBeenCalled();
		});

		test("新規案件 + 既存案件 + ソフトデリートの混在インポート", async () => {
			mockedData.validateBusinessUnitCodes.mockResolvedValue([]);
			mockedData.validateProjectTypeCodes.mockResolvedValue([]);
			mockedData.findProjectsByProjectCodes.mockResolvedValue(
				new Map([["PRJ-001", { project_id: 1, project_code: "PRJ-001" }]]),
			);
			mockedData.generateNextAutoCode.mockResolvedValue("AUTO-000001");
			mockedData.createProject.mockResolvedValue(2);
			mockedData.createProjectCase.mockResolvedValue(100);
			mockedData.mergeProjectLoad.mockResolvedValue(undefined);

			const result = await importExportService.bulkImport({
				items: [
					// 既存案件更新
					{
						...validImportRow,
						projectCode: "PRJ-001",
						projectCaseId: 10,
					},
					// 新規案件
					{
						...validImportRow,
						projectCode: null,
					},
					// ソフトデリート
					{
						...validImportRow,
						projectCode: "PRJ-001",
						deleteFlag: true,
						projectCaseId: 10,
					},
				],
			});

			expect(result.createdProjects).toBe(1);
			expect(result.updatedProjects).toBe(1);
			expect(result.deletedProjects).toBe(1);
			expect(result.createdCases).toBe(1);
			expect(result.updatedCases).toBe(1);
		});
	});
});
