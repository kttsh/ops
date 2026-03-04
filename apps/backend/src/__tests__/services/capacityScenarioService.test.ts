import { HTTPException } from "hono/http-exception";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { CapacityScenarioRow } from "@/types/capacityScenario";
import type { MonthlyCapacityRow } from "@/types/monthlyCapacity";
import type { MonthlyHeadcountPlanRow } from "@/types/monthlyHeadcountPlan";

// capacityScenarioData のモック
const mockCapacityScenarioData = {
	findAll: vi.fn(),
	findById: vi.fn(),
	findByIdIncludingDeleted: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
	softDelete: vi.fn(),
	restore: vi.fn(),
	hasReferences: vi.fn(),
};

// monthlyHeadcountPlanData のモック
const mockMonthlyHeadcountPlanData = {
	headcountPlanCaseExists: vi.fn(),
	findForCalculation: vi.fn(),
};

// monthlyCapacityData のモック
const mockMonthlyCapacityData = {
	bulkUpsert: vi.fn(),
};

vi.mock("@/data/capacityScenarioData", () => ({
	capacityScenarioData: mockCapacityScenarioData,
}));

vi.mock("@/data/monthlyHeadcountPlanData", () => ({
	monthlyHeadcountPlanData: mockMonthlyHeadcountPlanData,
}));

vi.mock("@/data/monthlyCapacityData", () => ({
	monthlyCapacityData: mockMonthlyCapacityData,
}));

// テスト用サンプルデータ
const sampleRow: CapacityScenarioRow = {
	capacity_scenario_id: 1,
	scenario_name: "標準シナリオ",
	is_primary: true,
	description: "標準的なキャパシティ計画",
	hours_per_person: 128.0,
	created_at: new Date("2026-01-01T00:00:00Z"),
	updated_at: new Date("2026-01-15T00:00:00Z"),
	deleted_at: null,
};

const deletedRow: CapacityScenarioRow = {
	...sampleRow,
	capacity_scenario_id: 2,
	scenario_name: "削除済みシナリオ",
	deleted_at: new Date("2026-01-10T00:00:00Z"),
};

describe("capacityScenarioService", () => {
	let capacityScenarioService: typeof import("@/services/capacityScenarioService").capacityScenarioService;

	beforeEach(async () => {
		vi.clearAllMocks();
		const mod = await import("@/services/capacityScenarioService");
		capacityScenarioService = mod.capacityScenarioService;
	});

	describe("findAll", () => {
		test("データ層の結果を camelCase のレスポンス形式に変換して返す", async () => {
			mockCapacityScenarioData.findAll.mockResolvedValue({
				items: [sampleRow],
				totalCount: 1,
			});

			const result = await capacityScenarioService.findAll({
				page: 1,
				pageSize: 20,
				includeDisabled: false,
			});

			expect(result.items).toEqual([
				{
					capacityScenarioId: 1,
					scenarioName: "標準シナリオ",
					isPrimary: true,
					description: "標準的なキャパシティ計画",
					hoursPerPerson: 128.0,
					createdAt: "2026-01-01T00:00:00.000Z",
					updatedAt: "2026-01-15T00:00:00.000Z",
					deletedAt: null,
				},
			]);
			expect(result.totalCount).toBe(1);
		});

		test("データ層にパラメータを正しく渡す", async () => {
			mockCapacityScenarioData.findAll.mockResolvedValue({
				items: [],
				totalCount: 0,
			});

			await capacityScenarioService.findAll({
				page: 2,
				pageSize: 10,
				includeDisabled: true,
			});

			expect(mockCapacityScenarioData.findAll).toHaveBeenCalledWith({
				page: 2,
				pageSize: 10,
				includeDisabled: true,
			});
		});

		test("空の結果を正しく返す", async () => {
			mockCapacityScenarioData.findAll.mockResolvedValue({
				items: [],
				totalCount: 0,
			});

			const result = await capacityScenarioService.findAll({
				page: 1,
				pageSize: 20,
				includeDisabled: false,
			});

			expect(result.items).toEqual([]);
			expect(result.totalCount).toBe(0);
		});
	});

	describe("findById", () => {
		test("存在するキャパシティシナリオを camelCase で返す（hoursPerPerson 含む）", async () => {
			mockCapacityScenarioData.findById.mockResolvedValue(sampleRow);

			const result = await capacityScenarioService.findById(1);

			expect(result).toEqual({
				capacityScenarioId: 1,
				scenarioName: "標準シナリオ",
				isPrimary: true,
				description: "標準的なキャパシティ計画",
				hoursPerPerson: 128.0,
				createdAt: "2026-01-01T00:00:00.000Z",
				updatedAt: "2026-01-15T00:00:00.000Z",
				deletedAt: null,
			});
		});

		test("存在しない場合は HTTPException(404) を投げる", async () => {
			mockCapacityScenarioData.findById.mockResolvedValue(undefined);

			await expect(capacityScenarioService.findById(999)).rejects.toThrow(
				HTTPException,
			);

			try {
				await capacityScenarioService.findById(999);
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(404);
			}
		});
	});

	describe("create", () => {
		test("新規キャパシティシナリオを作成して camelCase で返す（hoursPerPerson 含む）", async () => {
			mockCapacityScenarioData.create.mockResolvedValue(sampleRow);

			const result = await capacityScenarioService.create({
				scenarioName: "標準シナリオ",
				isPrimary: true,
				description: "標準的なキャパシティ計画",
				hoursPerPerson: 128.0,
			});

			expect(result).toEqual({
				capacityScenarioId: 1,
				scenarioName: "標準シナリオ",
				isPrimary: true,
				description: "標準的なキャパシティ計画",
				hoursPerPerson: 128.0,
				createdAt: "2026-01-01T00:00:00.000Z",
				updatedAt: "2026-01-15T00:00:00.000Z",
				deletedAt: null,
			});
		});

		test("hoursPerPerson を含めてデータ層に渡す", async () => {
			mockCapacityScenarioData.create.mockResolvedValue(sampleRow);

			await capacityScenarioService.create({
				scenarioName: "標準シナリオ",
				isPrimary: false,
				hoursPerPerson: 160.0,
			});

			expect(mockCapacityScenarioData.create).toHaveBeenCalledWith({
				scenarioName: "標準シナリオ",
				isPrimary: false,
				description: null,
				hoursPerPerson: 160.0,
			});
		});
	});

	describe("update", () => {
		test("キャパシティシナリオを更新して camelCase で返す", async () => {
			const updatedRow = { ...sampleRow, scenario_name: "更新後シナリオ" };
			mockCapacityScenarioData.update.mockResolvedValue(updatedRow);

			const result = await capacityScenarioService.update(1, {
				scenarioName: "更新後シナリオ",
			});

			expect(result.scenarioName).toBe("更新後シナリオ");
		});

		test("hoursPerPerson のみの更新ができる", async () => {
			const updatedRow = { ...sampleRow, hours_per_person: 180.0 };
			mockCapacityScenarioData.update.mockResolvedValue(updatedRow);

			const result = await capacityScenarioService.update(1, {
				hoursPerPerson: 180.0,
			});

			expect(result.hoursPerPerson).toBe(180.0);
			expect(mockCapacityScenarioData.update).toHaveBeenCalledWith(1, {
				hoursPerPerson: 180.0,
			});
		});

		test("hoursPerPerson 省略時はデータ層に undefined として渡す", async () => {
			mockCapacityScenarioData.update.mockResolvedValue(sampleRow);

			await capacityScenarioService.update(1, {
				scenarioName: "更新テスト",
			});

			expect(mockCapacityScenarioData.update).toHaveBeenCalledWith(1, {
				scenarioName: "更新テスト",
			});
		});

		test("存在しない場合は HTTPException(404) を投げる", async () => {
			mockCapacityScenarioData.update.mockResolvedValue(undefined);

			await expect(
				capacityScenarioService.update(999, { scenarioName: "更新" }),
			).rejects.toThrow(HTTPException);

			try {
				await capacityScenarioService.update(999, { scenarioName: "更新" });
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(404);
			}
		});
	});

	describe("delete", () => {
		test("キャパシティシナリオを論理削除する", async () => {
			mockCapacityScenarioData.hasReferences.mockResolvedValue(false);
			mockCapacityScenarioData.softDelete.mockResolvedValue({
				...sampleRow,
				deleted_at: new Date(),
			});

			await expect(capacityScenarioService.delete(1)).resolves.toBeUndefined();
		});

		test("存在しない場合は HTTPException(404) を投げる", async () => {
			mockCapacityScenarioData.hasReferences.mockResolvedValue(false);
			mockCapacityScenarioData.softDelete.mockResolvedValue(undefined);

			await expect(capacityScenarioService.delete(999)).rejects.toThrow(
				HTTPException,
			);

			try {
				await capacityScenarioService.delete(999);
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(404);
			}
		});

		test("参照が存在する場合は HTTPException(409) を投げる", async () => {
			mockCapacityScenarioData.hasReferences.mockResolvedValue(true);

			await expect(capacityScenarioService.delete(1)).rejects.toThrow(
				HTTPException,
			);

			try {
				await capacityScenarioService.delete(1);
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(409);
			}
		});
	});

	describe("restore", () => {
		test("論理削除済みキャパシティシナリオを復元して camelCase で返す", async () => {
			mockCapacityScenarioData.findByIdIncludingDeleted.mockResolvedValue(
				deletedRow,
			);
			mockCapacityScenarioData.restore.mockResolvedValue({
				...deletedRow,
				deleted_at: null,
			});

			const result = await capacityScenarioService.restore(2);

			expect(result).toEqual({
				capacityScenarioId: 2,
				scenarioName: "削除済みシナリオ",
				isPrimary: true,
				description: "標準的なキャパシティ計画",
				hoursPerPerson: 128.0,
				createdAt: "2026-01-01T00:00:00.000Z",
				updatedAt: "2026-01-15T00:00:00.000Z",
				deletedAt: null,
			});
		});

		test("存在しない場合は HTTPException(404) を投げる", async () => {
			mockCapacityScenarioData.findByIdIncludingDeleted.mockResolvedValue(
				undefined,
			);

			await expect(capacityScenarioService.restore(999)).rejects.toThrow(
				HTTPException,
			);

			try {
				await capacityScenarioService.restore(999);
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(404);
			}
		});

		test("論理削除されていない場合は HTTPException(409) を投げる", async () => {
			mockCapacityScenarioData.findByIdIncludingDeleted.mockResolvedValue(
				sampleRow,
			);

			await expect(capacityScenarioService.restore(1)).rejects.toThrow(
				HTTPException,
			);

			try {
				await capacityScenarioService.restore(1);
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(409);
			}
		});
	});

	describe("calculate", () => {
		const sampleHeadcountRows: MonthlyHeadcountPlanRow[] = [
			{
				monthly_headcount_plan_id: 1,
				headcount_plan_case_id: 1,
				business_unit_code: "PLANT",
				year_month: "202601",
				headcount: 10,
				created_at: new Date("2026-01-01T00:00:00Z"),
				updated_at: new Date("2026-01-01T00:00:00Z"),
			},
			{
				monthly_headcount_plan_id: 2,
				headcount_plan_case_id: 1,
				business_unit_code: "PLANT",
				year_month: "202602",
				headcount: 12,
				created_at: new Date("2026-01-01T00:00:00Z"),
				updated_at: new Date("2026-01-01T00:00:00Z"),
			},
		];

		const sampleCapacityRows: MonthlyCapacityRow[] = [
			{
				monthly_capacity_id: 1,
				capacity_scenario_id: 1,
				business_unit_code: "PLANT",
				year_month: "202601",
				capacity: 1280.0,
				created_at: new Date("2026-01-01T00:00:00Z"),
				updated_at: new Date("2026-01-01T00:00:00Z"),
			},
			{
				monthly_capacity_id: 2,
				capacity_scenario_id: 1,
				business_unit_code: "PLANT",
				year_month: "202602",
				capacity: 1536.0,
				created_at: new Date("2026-01-01T00:00:00Z"),
				updated_at: new Date("2026-01-01T00:00:00Z"),
			},
		];

		test("正常系: 人員計画データからキャパシティを計算して返す", async () => {
			mockCapacityScenarioData.findById.mockResolvedValue(sampleRow);
			mockMonthlyHeadcountPlanData.headcountPlanCaseExists.mockResolvedValue(
				true,
			);
			mockMonthlyHeadcountPlanData.findForCalculation.mockResolvedValue(
				sampleHeadcountRows,
			);
			mockMonthlyCapacityData.bulkUpsert.mockResolvedValue(sampleCapacityRows);

			const result = await capacityScenarioService.calculate(1, {
				headcountPlanCaseId: 1,
			});

			expect(result.calculated).toBe(2);
			expect(result.hoursPerPerson).toBe(128.0);
			expect(result.items).toHaveLength(2);
			expect(result.items[0].capacity).toBe(1280.0);
			expect(result.items[1].capacity).toBe(1536.0);
		});

		test("計算式 headcount × hoursPerPerson が正しい", async () => {
			mockCapacityScenarioData.findById.mockResolvedValue(sampleRow);
			mockMonthlyHeadcountPlanData.headcountPlanCaseExists.mockResolvedValue(
				true,
			);
			mockMonthlyHeadcountPlanData.findForCalculation.mockResolvedValue(
				sampleHeadcountRows,
			);
			mockMonthlyCapacityData.bulkUpsert.mockResolvedValue(sampleCapacityRows);

			await capacityScenarioService.calculate(1, { headcountPlanCaseId: 1 });

			// bulkUpsert に渡された計算結果を検証
			expect(mockMonthlyCapacityData.bulkUpsert).toHaveBeenCalledWith(1, [
				{
					businessUnitCode: "PLANT",
					yearMonth: "202601",
					capacity: 10 * 128.0,
				},
				{
					businessUnitCode: "PLANT",
					yearMonth: "202602",
					capacity: 12 * 128.0,
				},
			]);
		});

		test("businessUnitCodes を findForCalculation に渡す", async () => {
			mockCapacityScenarioData.findById.mockResolvedValue(sampleRow);
			mockMonthlyHeadcountPlanData.headcountPlanCaseExists.mockResolvedValue(
				true,
			);
			mockMonthlyHeadcountPlanData.findForCalculation.mockResolvedValue(
				sampleHeadcountRows,
			);
			mockMonthlyCapacityData.bulkUpsert.mockResolvedValue(sampleCapacityRows);

			await capacityScenarioService.calculate(1, {
				headcountPlanCaseId: 1,
				businessUnitCodes: ["PLANT"],
			});

			expect(
				mockMonthlyHeadcountPlanData.findForCalculation,
			).toHaveBeenCalledWith({
				headcountPlanCaseId: 1,
				businessUnitCodes: ["PLANT"],
				yearMonthFrom: undefined,
				yearMonthTo: undefined,
			});
		});

		test("yearMonthFrom / yearMonthTo を findForCalculation に渡す", async () => {
			mockCapacityScenarioData.findById.mockResolvedValue(sampleRow);
			mockMonthlyHeadcountPlanData.headcountPlanCaseExists.mockResolvedValue(
				true,
			);
			mockMonthlyHeadcountPlanData.findForCalculation.mockResolvedValue(
				sampleHeadcountRows,
			);
			mockMonthlyCapacityData.bulkUpsert.mockResolvedValue(sampleCapacityRows);

			await capacityScenarioService.calculate(1, {
				headcountPlanCaseId: 1,
				yearMonthFrom: "202601",
				yearMonthTo: "202603",
			});

			expect(
				mockMonthlyHeadcountPlanData.findForCalculation,
			).toHaveBeenCalledWith({
				headcountPlanCaseId: 1,
				businessUnitCodes: undefined,
				yearMonthFrom: "202601",
				yearMonthTo: "202603",
			});
		});

		test("シナリオが存在しない場合 HTTPException(404) を投げる", async () => {
			mockCapacityScenarioData.findById.mockResolvedValue(undefined);

			await expect(
				capacityScenarioService.calculate(999, { headcountPlanCaseId: 1 }),
			).rejects.toThrow(HTTPException);

			try {
				await capacityScenarioService.calculate(999, {
					headcountPlanCaseId: 1,
				});
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(404);
				expect((e as HTTPException).message).toContain("Capacity scenario");
			}
		});

		test("人員計画ケースが存在しない場合 HTTPException(404) を投げる", async () => {
			mockCapacityScenarioData.findById.mockResolvedValue(sampleRow);
			mockMonthlyHeadcountPlanData.headcountPlanCaseExists.mockResolvedValue(
				false,
			);

			await expect(
				capacityScenarioService.calculate(1, { headcountPlanCaseId: 999 }),
			).rejects.toThrow(HTTPException);

			try {
				await capacityScenarioService.calculate(1, {
					headcountPlanCaseId: 999,
				});
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(404);
				expect((e as HTTPException).message).toContain("Headcount plan case");
			}
		});

		test("人員計画データが存在しない場合 HTTPException(422) を投げる", async () => {
			mockCapacityScenarioData.findById.mockResolvedValue(sampleRow);
			mockMonthlyHeadcountPlanData.headcountPlanCaseExists.mockResolvedValue(
				true,
			);
			mockMonthlyHeadcountPlanData.findForCalculation.mockResolvedValue([]);

			await expect(
				capacityScenarioService.calculate(1, {
					headcountPlanCaseId: 1,
					businessUnitCodes: ["NONEXIST"],
				}),
			).rejects.toThrow(HTTPException);

			try {
				await capacityScenarioService.calculate(1, {
					headcountPlanCaseId: 1,
					businessUnitCodes: ["NONEXIST"],
				});
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(422);
			}
		});
	});
});
