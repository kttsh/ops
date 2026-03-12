import { HTTPException } from "hono/http-exception";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { ProjectRow } from "@/types/project";

// projectData のモック
const mockProjectData = {
	findAll: vi.fn(),
	findById: vi.fn(),
	findByIdIncludingDeleted: vi.fn(),
	findByProjectCode: vi.fn(),
	findCaseSummariesByProjectIds: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
	softDelete: vi.fn(),
	restore: vi.fn(),
	hasReferences: vi.fn(),
};

// businessUnitData のモック
const mockBusinessUnitData = {
	findByCode: vi.fn(),
};

// projectTypeData のモック
const mockProjectTypeData = {
	findByCode: vi.fn(),
};

vi.mock("@/data/projectData", () => ({
	projectData: mockProjectData,
}));

vi.mock("@/data/businessUnitData", () => ({
	businessUnitData: mockBusinessUnitData,
}));

vi.mock("@/data/projectTypeData", () => ({
	projectTypeData: mockProjectTypeData,
}));

// テスト用サンプルデータ
const sampleRow: ProjectRow = {
	project_id: 1,
	project_code: "PRJ-001",
	name: "テスト案件",
	business_unit_code: "BU-001",
	business_unit_name: "エンジニアリング部",
	project_type_code: "PT-001",
	project_type_name: "受託開発",
	start_year_month: "202601",
	total_manhour: 100,
	status: "ACTIVE",
	duration_months: 12,
	fiscal_year: null,
	nickname: null,
	customer_name: null,
	order_number: null,
	calculation_basis: null,
	remarks: null,
	region: null,
	created_at: new Date("2026-01-01T00:00:00Z"),
	updated_at: new Date("2026-01-15T00:00:00Z"),
	deleted_at: null,
};

const deletedRow: ProjectRow = {
	...sampleRow,
	project_id: 2,
	project_code: "PRJ-002",
	name: "削除済み案件",
	deleted_at: new Date("2026-01-10T00:00:00Z"),
};

const sampleResponse = {
	projectId: 1,
	projectCode: "PRJ-001",
	name: "テスト案件",
	businessUnitCode: "BU-001",
	businessUnitName: "エンジニアリング部",
	projectTypeCode: "PT-001",
	projectTypeName: "受託開発",
	startYearMonth: "202601",
	totalManhour: 100,
	status: "active",
	durationMonths: 12,
	fiscalYear: null,
	nickname: null,
	customerName: null,
	orderNumber: null,
	calculationBasis: null,
	remarks: null,
	region: null,
	createdAt: "2026-01-01T00:00:00.000Z",
	updatedAt: "2026-01-15T00:00:00.000Z",
	deletedAt: null,
	cases: [],
};

describe("projectService", () => {
	let projectService: typeof import("@/services/projectService").projectService;

	beforeEach(async () => {
		vi.clearAllMocks();
		const mod = await import("@/services/projectService");
		projectService = mod.projectService;
	});

	// --- 一覧取得・単一取得 ---

	describe("findAll", () => {
		test("データ層の結果を camelCase のレスポンス形式に変換して返す", async () => {
			mockProjectData.findAll.mockResolvedValue({
				items: [sampleRow],
				totalCount: 1,
			});
			mockProjectData.findCaseSummariesByProjectIds.mockResolvedValue([]);

			const result = await projectService.findAll({
				page: 1,
				pageSize: 20,
				includeDisabled: false,
			});

			expect(result.items).toEqual([sampleResponse]);
			expect(result.totalCount).toBe(1);
		});

		test("データ層にパラメータを正しく渡す", async () => {
			mockProjectData.findAll.mockResolvedValue({
				items: [],
				totalCount: 0,
			});
			mockProjectData.findCaseSummariesByProjectIds.mockResolvedValue([]);

			await projectService.findAll({
				page: 2,
				pageSize: 10,
				includeDisabled: true,
				businessUnitCode: "BU-001",
				status: "ACTIVE",
			});

			expect(mockProjectData.findAll).toHaveBeenCalledWith({
				page: 2,
				pageSize: 10,
				includeDisabled: true,
				businessUnitCode: "BU-001",
				status: "ACTIVE",
			});
		});

		test("空の結果を正しく返す", async () => {
			mockProjectData.findAll.mockResolvedValue({
				items: [],
				totalCount: 0,
			});

			const result = await projectService.findAll({
				page: 1,
				pageSize: 20,
				includeDisabled: false,
			});

			expect(result.items).toEqual([]);
			expect(result.totalCount).toBe(0);
			// 空の場合はケースサマリのクエリを実行しない
			expect(
				mockProjectData.findCaseSummariesByProjectIds,
			).not.toHaveBeenCalled();
		});

		test("各案件にケースサマリを結合して返す", async () => {
			const row2 = {
				...sampleRow,
				project_id: 2,
				project_code: "PRJ-002",
				name: "案件2",
			};
			mockProjectData.findAll.mockResolvedValue({
				items: [sampleRow, row2],
				totalCount: 2,
			});
			mockProjectData.findCaseSummariesByProjectIds.mockResolvedValue([
				{
					project_case_id: 10,
					project_id: 1,
					case_name: "標準ケース",
					is_primary: true,
				},
				{
					project_case_id: 11,
					project_id: 1,
					case_name: "悲観ケース",
					is_primary: false,
				},
				{
					project_case_id: 20,
					project_id: 2,
					case_name: "メインケース",
					is_primary: true,
				},
			]);

			const result = await projectService.findAll({
				page: 1,
				pageSize: 20,
				includeDisabled: false,
			});

			expect(result.items[0].cases).toEqual([
				{ projectCaseId: 10, caseName: "標準ケース", isPrimary: true },
				{ projectCaseId: 11, caseName: "悲観ケース", isPrimary: false },
			]);
			expect(result.items[1].cases).toEqual([
				{ projectCaseId: 20, caseName: "メインケース", isPrimary: true },
			]);
			expect(
				mockProjectData.findCaseSummariesByProjectIds,
			).toHaveBeenCalledWith([1, 2]);
		});

		test("ケースサマリが存在しない案件は空配列を返す", async () => {
			mockProjectData.findAll.mockResolvedValue({
				items: [sampleRow],
				totalCount: 1,
			});
			mockProjectData.findCaseSummariesByProjectIds.mockResolvedValue([]);

			const result = await projectService.findAll({
				page: 1,
				pageSize: 20,
				includeDisabled: false,
			});

			expect(result.items[0].cases).toEqual([]);
		});
	});

	describe("findById", () => {
		test("存在する案件を camelCase で返す", async () => {
			mockProjectData.findById.mockResolvedValue(sampleRow);

			const result = await projectService.findById(1);

			expect(result).toEqual(sampleResponse);
		});

		test("存在しない場合は HTTPException(404) を投げる", async () => {
			mockProjectData.findById.mockResolvedValue(undefined);

			await expect(projectService.findById(999)).rejects.toThrow(HTTPException);

			try {
				await projectService.findById(999);
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(404);
			}
		});
	});

	// --- 作成 ---

	describe("create", () => {
		test("新規案件を作成して camelCase で返す", async () => {
			mockBusinessUnitData.findByCode.mockResolvedValue({
				business_unit_code: "BU-001",
			});
			mockProjectTypeData.findByCode.mockResolvedValue({
				project_type_code: "PT-001",
			});
			mockProjectData.findByProjectCode.mockResolvedValue(undefined);
			mockProjectData.create.mockResolvedValue(sampleRow);

			const result = await projectService.create({
				projectCode: "PRJ-001",
				name: "テスト案件",
				businessUnitCode: "BU-001",
				projectTypeCode: "PT-001",
				startYearMonth: "202601",
				totalManhour: 100,
				status: "ACTIVE",
				durationMonths: 12,
			});

			expect(result).toEqual(sampleResponse);
		});

		test("projectTypeCode 省略時に PT チェックを行わない", async () => {
			mockBusinessUnitData.findByCode.mockResolvedValue({
				business_unit_code: "BU-001",
			});
			mockProjectData.findByProjectCode.mockResolvedValue(undefined);
			mockProjectData.create.mockResolvedValue(sampleRow);

			await projectService.create({
				projectCode: "PRJ-001",
				name: "テスト案件",
				businessUnitCode: "BU-001",
				startYearMonth: "202601",
				totalManhour: 100,
				status: "ACTIVE",
			});

			expect(mockProjectTypeData.findByCode).not.toHaveBeenCalled();
		});

		test("businessUnitCode が存在しない場合は HTTPException(422) を投げる", async () => {
			mockBusinessUnitData.findByCode.mockResolvedValue(undefined);

			try {
				await projectService.create({
					projectCode: "PRJ-001",
					name: "テスト案件",
					businessUnitCode: "UNKNOWN-BU",
					startYearMonth: "202601",
					totalManhour: 100,
					status: "ACTIVE",
				});
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(422);
			}
		});

		test("projectTypeCode が存在しない場合は HTTPException(422) を投げる", async () => {
			mockBusinessUnitData.findByCode.mockResolvedValue({
				business_unit_code: "BU-001",
			});
			mockProjectTypeData.findByCode.mockResolvedValue(undefined);

			try {
				await projectService.create({
					projectCode: "PRJ-001",
					name: "テスト案件",
					businessUnitCode: "BU-001",
					projectTypeCode: "UNKNOWN-PT",
					startYearMonth: "202601",
					totalManhour: 100,
					status: "ACTIVE",
				});
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(422);
			}
		});

		test("projectCode が重複している場合は HTTPException(409) を投げる", async () => {
			mockBusinessUnitData.findByCode.mockResolvedValue({
				business_unit_code: "BU-001",
			});
			mockProjectData.findByProjectCode.mockResolvedValue(sampleRow);

			try {
				await projectService.create({
					projectCode: "PRJ-001",
					name: "新規案件",
					businessUnitCode: "BU-001",
					startYearMonth: "202601",
					totalManhour: 100,
					status: "ACTIVE",
				});
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(409);
			}
		});
	});

	// --- 更新 ---

	describe("update", () => {
		test("案件を更新して camelCase で返す", async () => {
			const updatedRow = { ...sampleRow, name: "更新後の名前" };
			mockProjectData.findById.mockResolvedValue(sampleRow);
			mockProjectData.update.mockResolvedValue(updatedRow);

			const result = await projectService.update(1, { name: "更新後の名前" });

			expect(result.name).toBe("更新後の名前");
		});

		test("存在しない案件で HTTPException(404) を投げる", async () => {
			mockProjectData.findById.mockResolvedValue(undefined);

			try {
				await projectService.update(999, { name: "更新" });
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(404);
			}
		});

		test("businessUnitCode が存在しない場合は HTTPException(422) を投げる", async () => {
			mockProjectData.findById.mockResolvedValue(sampleRow);
			mockBusinessUnitData.findByCode.mockResolvedValue(undefined);

			try {
				await projectService.update(1, { businessUnitCode: "UNKNOWN-BU" });
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(422);
			}
		});

		test("projectTypeCode が存在しない場合は HTTPException(422) を投げる", async () => {
			mockProjectData.findById.mockResolvedValue(sampleRow);
			mockProjectTypeData.findByCode.mockResolvedValue(undefined);

			try {
				await projectService.update(1, { projectTypeCode: "UNKNOWN-PT" });
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(422);
			}
		});

		test("projectCode が他の案件と重複する場合は HTTPException(409) を投げる", async () => {
			const otherRow = { ...sampleRow, project_id: 99 };
			mockProjectData.findById.mockResolvedValue(sampleRow);
			mockProjectData.findByProjectCode.mockResolvedValue(otherRow);

			try {
				await projectService.update(1, { projectCode: "PRJ-001" });
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(409);
			}
		});

		test("projectCode の重複チェックで自身は除外する", async () => {
			mockProjectData.findById.mockResolvedValue(sampleRow);
			mockProjectData.findByProjectCode.mockResolvedValue(sampleRow); // 自身のレコード
			mockProjectData.update.mockResolvedValue(sampleRow);

			const result = await projectService.update(1, { projectCode: "PRJ-001" });

			expect(result).toEqual(sampleResponse);
		});
	});

	// --- 削除 ---

	describe("delete", () => {
		test("案件を論理削除する", async () => {
			mockProjectData.findById.mockResolvedValue(sampleRow);
			mockProjectData.hasReferences.mockResolvedValue(false);
			mockProjectData.softDelete.mockResolvedValue(sampleRow);

			await expect(projectService.delete(1)).resolves.toBeUndefined();
		});

		test("存在しない場合は HTTPException(404) を投げる", async () => {
			mockProjectData.findById.mockResolvedValue(undefined);

			try {
				await projectService.delete(999);
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(404);
			}
		});

		test("参照が存在する場合は HTTPException(409) を投げる", async () => {
			mockProjectData.findById.mockResolvedValue(sampleRow);
			mockProjectData.hasReferences.mockResolvedValue(true);

			try {
				await projectService.delete(1);
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(409);
			}
		});
	});

	// --- 復元 ---

	describe("restore", () => {
		test("論理削除済み案件を復元して camelCase で返す", async () => {
			mockProjectData.findByIdIncludingDeleted.mockResolvedValue(deletedRow);
			mockProjectData.findByProjectCode.mockResolvedValue(undefined);
			mockProjectData.restore.mockResolvedValue({
				...deletedRow,
				deleted_at: null,
			});

			const result = await projectService.restore(2);

			expect(result.projectCode).toBe("PRJ-002");
		});

		test("存在しない場合は HTTPException(404) を投げる", async () => {
			mockProjectData.findByIdIncludingDeleted.mockResolvedValue(undefined);

			try {
				await projectService.restore(999);
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(404);
			}
		});

		test("論理削除されていない場合は HTTPException(409) を投げる", async () => {
			mockProjectData.findByIdIncludingDeleted.mockResolvedValue(sampleRow);

			try {
				await projectService.restore(1);
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(409);
			}
		});

		test("復元時に projectCode が他の有効な案件と重複する場合は HTTPException(409) を投げる", async () => {
			const conflictingRow = {
				...sampleRow,
				project_id: 99,
				project_code: "PRJ-002",
			};
			mockProjectData.findByIdIncludingDeleted.mockResolvedValue(deletedRow);
			mockProjectData.findByProjectCode.mockResolvedValue(conflictingRow);

			try {
				await projectService.restore(2);
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(409);
			}
		});
	});
});
