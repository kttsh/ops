import { HTTPException } from "hono/http-exception";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { HeadcountPlanCaseRow } from "@/types/headcountPlanCase";

// headcountPlanCaseData のモック
const mockHeadcountPlanCaseData = {
	findAll: vi.fn(),
	findById: vi.fn(),
	findByIdIncludingDeleted: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
	softDelete: vi.fn(),
	restore: vi.fn(),
	hasReferences: vi.fn(),
};

// businessUnitData のモック
const mockBusinessUnitData = {
	findAll: vi.fn(),
	findByCode: vi.fn(),
	findByCodeIncludingDeleted: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
	softDelete: vi.fn(),
	restore: vi.fn(),
	hasReferences: vi.fn(),
};

vi.mock("@/data/headcountPlanCaseData", () => ({
	headcountPlanCaseData: mockHeadcountPlanCaseData,
}));

vi.mock("@/data/businessUnitData", () => ({
	businessUnitData: mockBusinessUnitData,
}));

// テスト用サンプルデータ
const sampleRow: HeadcountPlanCaseRow = {
	headcount_plan_case_id: 1,
	case_name: "標準ケース",
	is_primary: true,
	description: "標準的な人員計画",
	business_unit_code: "plant",
	business_unit_name: "プラント事業",
	created_at: new Date("2026-01-01T00:00:00Z"),
	updated_at: new Date("2026-01-15T00:00:00Z"),
	deleted_at: null,
};

const deletedRow: HeadcountPlanCaseRow = {
	...sampleRow,
	headcount_plan_case_id: 2,
	case_name: "削除済みケース",
	deleted_at: new Date("2026-01-10T00:00:00Z"),
};

describe("headcountPlanCaseService", () => {
	let headcountPlanCaseService: typeof import("@/services/headcountPlanCaseService").headcountPlanCaseService;

	beforeEach(async () => {
		vi.clearAllMocks();
		const mod = await import("@/services/headcountPlanCaseService");
		headcountPlanCaseService = mod.headcountPlanCaseService;
	});

	describe("findAll", () => {
		test("データ層の結果を camelCase のレスポンス形式に変換して返す", async () => {
			mockHeadcountPlanCaseData.findAll.mockResolvedValue({
				items: [sampleRow],
				totalCount: 1,
			});

			const result = await headcountPlanCaseService.findAll({
				page: 1,
				pageSize: 20,
				includeDisabled: false,
			});

			expect(result.items).toEqual([
				{
					headcountPlanCaseId: 1,
					caseName: "標準ケース",
					isPrimary: true,
					description: "標準的な人員計画",
					businessUnitCode: "plant",
					businessUnitName: "プラント事業",
					createdAt: "2026-01-01T00:00:00.000Z",
					updatedAt: "2026-01-15T00:00:00.000Z",
					deletedAt: null,
				},
			]);
			expect(result.totalCount).toBe(1);
		});

		test("データ層にパラメータを正しく渡す", async () => {
			mockHeadcountPlanCaseData.findAll.mockResolvedValue({
				items: [],
				totalCount: 0,
			});

			await headcountPlanCaseService.findAll({
				page: 2,
				pageSize: 10,
				includeDisabled: true,
			});

			expect(mockHeadcountPlanCaseData.findAll).toHaveBeenCalledWith({
				page: 2,
				pageSize: 10,
				includeDisabled: true,
			});
		});

		test("空の結果を正しく返す", async () => {
			mockHeadcountPlanCaseData.findAll.mockResolvedValue({
				items: [],
				totalCount: 0,
			});

			const result = await headcountPlanCaseService.findAll({
				page: 1,
				pageSize: 20,
				includeDisabled: false,
			});

			expect(result.items).toEqual([]);
			expect(result.totalCount).toBe(0);
		});
	});

	describe("findById", () => {
		test("存在する人員計画ケースを camelCase で返す", async () => {
			mockHeadcountPlanCaseData.findById.mockResolvedValue(sampleRow);

			const result = await headcountPlanCaseService.findById(1);

			expect(result).toEqual({
				headcountPlanCaseId: 1,
				caseName: "標準ケース",
				isPrimary: true,
				description: "標準的な人員計画",
				businessUnitCode: "plant",
				businessUnitName: "プラント事業",
				createdAt: "2026-01-01T00:00:00.000Z",
				updatedAt: "2026-01-15T00:00:00.000Z",
				deletedAt: null,
			});
		});

		test("存在しない場合は HTTPException(404) を投げる", async () => {
			mockHeadcountPlanCaseData.findById.mockResolvedValue(undefined);

			await expect(headcountPlanCaseService.findById(999)).rejects.toThrow(
				HTTPException,
			);

			try {
				await headcountPlanCaseService.findById(999);
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(404);
			}
		});
	});

	describe("create", () => {
		test("新規人員計画ケースを作成して camelCase で返す", async () => {
			mockBusinessUnitData.findByCode.mockResolvedValue({
				business_unit_code: "plant",
				name: "プラント事業",
			});
			mockHeadcountPlanCaseData.create.mockResolvedValue(sampleRow);

			const result = await headcountPlanCaseService.create({
				caseName: "標準ケース",
				isPrimary: true,
				description: "標準的な人員計画",
				businessUnitCode: "plant",
			});

			expect(result).toEqual({
				headcountPlanCaseId: 1,
				caseName: "標準ケース",
				isPrimary: true,
				description: "標準的な人員計画",
				businessUnitCode: "plant",
				businessUnitName: "プラント事業",
				createdAt: "2026-01-01T00:00:00.000Z",
				updatedAt: "2026-01-15T00:00:00.000Z",
				deletedAt: null,
			});
		});

		test("businessUnitCode 未指定でも作成できる", async () => {
			const rowWithoutBU = {
				...sampleRow,
				business_unit_code: null,
				business_unit_name: null,
			};
			mockHeadcountPlanCaseData.create.mockResolvedValue(rowWithoutBU);

			const result = await headcountPlanCaseService.create({
				caseName: "標準ケース",
				isPrimary: false,
			});

			expect(result.businessUnitCode).toBeNull();
			expect(result.businessUnitName).toBeNull();
			expect(mockBusinessUnitData.findByCode).not.toHaveBeenCalled();
		});

		test("存在しない businessUnitCode で HTTPException(422) を投げる", async () => {
			mockBusinessUnitData.findByCode.mockResolvedValue(undefined);

			await expect(
				headcountPlanCaseService.create({
					caseName: "標準ケース",
					isPrimary: false,
					businessUnitCode: "INVALID",
				}),
			).rejects.toThrow(HTTPException);

			try {
				await headcountPlanCaseService.create({
					caseName: "標準ケース",
					isPrimary: false,
					businessUnitCode: "INVALID",
				});
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(422);
			}
		});
	});

	describe("update", () => {
		test("人員計画ケースを更新して camelCase で返す", async () => {
			const updatedRow = { ...sampleRow, case_name: "更新後ケース" };
			mockHeadcountPlanCaseData.update.mockResolvedValue(updatedRow);

			const result = await headcountPlanCaseService.update(1, {
				caseName: "更新後ケース",
			});

			expect(result.caseName).toBe("更新後ケース");
		});

		test("businessUnitCode の存在チェックを行う", async () => {
			mockBusinessUnitData.findByCode.mockResolvedValue({
				business_unit_code: "energy",
				name: "エネルギー事業",
			});
			mockHeadcountPlanCaseData.update.mockResolvedValue(sampleRow);

			await headcountPlanCaseService.update(1, {
				businessUnitCode: "energy",
			});

			expect(mockBusinessUnitData.findByCode).toHaveBeenCalledWith("energy");
		});

		test("存在しない場合は HTTPException(404) を投げる", async () => {
			mockHeadcountPlanCaseData.update.mockResolvedValue(undefined);

			await expect(
				headcountPlanCaseService.update(999, { caseName: "更新" }),
			).rejects.toThrow(HTTPException);

			try {
				await headcountPlanCaseService.update(999, { caseName: "更新" });
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(404);
			}
		});

		test("存在しない businessUnitCode で HTTPException(422) を投げる", async () => {
			mockBusinessUnitData.findByCode.mockResolvedValue(undefined);

			await expect(
				headcountPlanCaseService.update(1, { businessUnitCode: "INVALID" }),
			).rejects.toThrow(HTTPException);

			try {
				await headcountPlanCaseService.update(1, {
					businessUnitCode: "INVALID",
				});
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(422);
			}
		});
	});

	describe("delete", () => {
		test("人員計画ケースを論理削除する", async () => {
			mockHeadcountPlanCaseData.hasReferences.mockResolvedValue(false);
			mockHeadcountPlanCaseData.softDelete.mockResolvedValue({
				...sampleRow,
				deleted_at: new Date(),
			});

			await expect(headcountPlanCaseService.delete(1)).resolves.toBeUndefined();
		});

		test("存在しない場合は HTTPException(404) を投げる", async () => {
			mockHeadcountPlanCaseData.hasReferences.mockResolvedValue(false);
			mockHeadcountPlanCaseData.softDelete.mockResolvedValue(undefined);

			await expect(headcountPlanCaseService.delete(999)).rejects.toThrow(
				HTTPException,
			);

			try {
				await headcountPlanCaseService.delete(999);
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(404);
			}
		});

		test("参照が存在する場合は HTTPException(409) を投げる", async () => {
			mockHeadcountPlanCaseData.hasReferences.mockResolvedValue(true);

			await expect(headcountPlanCaseService.delete(1)).rejects.toThrow(
				HTTPException,
			);

			try {
				await headcountPlanCaseService.delete(1);
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(409);
			}
		});
	});

	describe("restore", () => {
		test("論理削除済み人員計画ケースを復元して camelCase で返す", async () => {
			mockHeadcountPlanCaseData.findByIdIncludingDeleted.mockResolvedValue(
				deletedRow,
			);
			mockHeadcountPlanCaseData.restore.mockResolvedValue({
				...deletedRow,
				deleted_at: null,
			});

			const result = await headcountPlanCaseService.restore(2);

			expect(result).toEqual({
				headcountPlanCaseId: 2,
				caseName: "削除済みケース",
				isPrimary: true,
				description: "標準的な人員計画",
				businessUnitCode: "plant",
				businessUnitName: "プラント事業",
				createdAt: "2026-01-01T00:00:00.000Z",
				updatedAt: "2026-01-15T00:00:00.000Z",
				deletedAt: null,
			});
		});

		test("存在しない場合は HTTPException(404) を投げる", async () => {
			mockHeadcountPlanCaseData.findByIdIncludingDeleted.mockResolvedValue(
				undefined,
			);

			await expect(headcountPlanCaseService.restore(999)).rejects.toThrow(
				HTTPException,
			);

			try {
				await headcountPlanCaseService.restore(999);
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(404);
			}
		});

		test("論理削除されていない場合は HTTPException(409) を投げる", async () => {
			mockHeadcountPlanCaseData.findByIdIncludingDeleted.mockResolvedValue(
				sampleRow,
			);

			await expect(headcountPlanCaseService.restore(1)).rejects.toThrow(
				HTTPException,
			);

			try {
				await headcountPlanCaseService.restore(1);
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(409);
			}
		});
	});
});
