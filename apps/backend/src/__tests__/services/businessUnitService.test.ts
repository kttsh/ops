import { HTTPException } from "hono/http-exception";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { BusinessUnitRow } from "@/types/businessUnit";

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

vi.mock("@/data/businessUnitData", () => ({
	businessUnitData: mockBusinessUnitData,
}));

// テスト用サンプルデータ
const sampleRow: BusinessUnitRow = {
	business_unit_code: "BU-001",
	name: "ビジネスユニット1",
	display_order: 1,
	created_at: new Date("2026-01-01T00:00:00Z"),
	updated_at: new Date("2026-01-15T00:00:00Z"),
	deleted_at: null,
};

const deletedRow: BusinessUnitRow = {
	...sampleRow,
	business_unit_code: "BU-002",
	name: "削除済みユニット",
	deleted_at: new Date("2026-01-10T00:00:00Z"),
};

describe("businessUnitService", () => {
	let businessUnitService: typeof import("@/services/businessUnitService").businessUnitService;

	beforeEach(async () => {
		vi.clearAllMocks();
		const mod = await import("@/services/businessUnitService");
		businessUnitService = mod.businessUnitService;
	});

	// --- 5.1: 一覧取得・単一取得 ---

	describe("findAll", () => {
		test("データ層の結果を camelCase のレスポンス形式に変換して返す", async () => {
			mockBusinessUnitData.findAll.mockResolvedValue({
				items: [sampleRow],
				totalCount: 1,
			});

			const result = await businessUnitService.findAll({
				page: 1,
				pageSize: 20,
				includeDisabled: false,
			});

			expect(result.items).toEqual([
				{
					businessUnitCode: "BU-001",
					name: "ビジネスユニット1",
					displayOrder: 1,
					createdAt: "2026-01-01T00:00:00.000Z",
					updatedAt: "2026-01-15T00:00:00.000Z",
				},
			]);
			expect(result.totalCount).toBe(1);
		});

		test("データ層にパラメータを正しく渡す", async () => {
			mockBusinessUnitData.findAll.mockResolvedValue({
				items: [],
				totalCount: 0,
			});

			await businessUnitService.findAll({
				page: 2,
				pageSize: 10,
				includeDisabled: true,
			});

			expect(mockBusinessUnitData.findAll).toHaveBeenCalledWith({
				page: 2,
				pageSize: 10,
				includeDisabled: true,
			});
		});

		test("空の結果を正しく返す", async () => {
			mockBusinessUnitData.findAll.mockResolvedValue({
				items: [],
				totalCount: 0,
			});

			const result = await businessUnitService.findAll({
				page: 1,
				pageSize: 20,
				includeDisabled: false,
			});

			expect(result.items).toEqual([]);
			expect(result.totalCount).toBe(0);
		});
	});

	describe("findByCode", () => {
		test("存在するビジネスユニットを camelCase で返す", async () => {
			mockBusinessUnitData.findByCode.mockResolvedValue(sampleRow);

			const result = await businessUnitService.findByCode("BU-001");

			expect(result).toEqual({
				businessUnitCode: "BU-001",
				name: "ビジネスユニット1",
				displayOrder: 1,
				createdAt: "2026-01-01T00:00:00.000Z",
				updatedAt: "2026-01-15T00:00:00.000Z",
			});
		});

		test("存在しない場合は HTTPException(404) を投げる", async () => {
			mockBusinessUnitData.findByCode.mockResolvedValue(undefined);

			await expect(
				businessUnitService.findByCode("NON-EXISTENT"),
			).rejects.toThrow(HTTPException);

			try {
				await businessUnitService.findByCode("NON-EXISTENT");
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(404);
			}
		});
	});

	// --- 5.2: 作成・更新 ---

	describe("create", () => {
		test("新規ビジネスユニットを作成して camelCase で返す", async () => {
			mockBusinessUnitData.findByCodeIncludingDeleted.mockResolvedValue(
				undefined,
			);
			mockBusinessUnitData.create.mockResolvedValue(sampleRow);

			const result = await businessUnitService.create({
				businessUnitCode: "BU-001",
				name: "ビジネスユニット1",
				displayOrder: 1,
			});

			expect(result).toEqual({
				businessUnitCode: "BU-001",
				name: "ビジネスユニット1",
				displayOrder: 1,
				createdAt: "2026-01-01T00:00:00.000Z",
				updatedAt: "2026-01-15T00:00:00.000Z",
			});
		});

		test("同一コードが既に存在する場合は HTTPException(409) を投げる", async () => {
			mockBusinessUnitData.findByCodeIncludingDeleted.mockResolvedValue(
				sampleRow,
			);

			await expect(
				businessUnitService.create({
					businessUnitCode: "BU-001",
					name: "新規",
					displayOrder: 0,
				}),
			).rejects.toThrow(HTTPException);

			try {
				await businessUnitService.create({
					businessUnitCode: "BU-001",
					name: "新規",
					displayOrder: 0,
				});
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(409);
			}
		});

		test("論理削除済みコードが存在する場合も HTTPException(409) を投げる", async () => {
			mockBusinessUnitData.findByCodeIncludingDeleted.mockResolvedValue(
				deletedRow,
			);

			try {
				await businessUnitService.create({
					businessUnitCode: "BU-002",
					name: "新規",
					displayOrder: 0,
				});
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(409);
			}
		});
	});

	describe("update", () => {
		test("ビジネスユニットを更新して camelCase で返す", async () => {
			const updatedRow = { ...sampleRow, name: "更新後の名前" };
			mockBusinessUnitData.update.mockResolvedValue(updatedRow);

			const result = await businessUnitService.update("BU-001", {
				name: "更新後の名前",
			});

			expect(result).toEqual({
				businessUnitCode: "BU-001",
				name: "更新後の名前",
				displayOrder: 1,
				createdAt: "2026-01-01T00:00:00.000Z",
				updatedAt: "2026-01-15T00:00:00.000Z",
			});
		});

		test("存在しない場合は HTTPException(404) を投げる", async () => {
			mockBusinessUnitData.update.mockResolvedValue(undefined);

			await expect(
				businessUnitService.update("NON-EXISTENT", { name: "更新" }),
			).rejects.toThrow(HTTPException);

			try {
				await businessUnitService.update("NON-EXISTENT", { name: "更新" });
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(404);
			}
		});
	});

	// --- 5.3: 削除・復元 ---

	describe("delete", () => {
		test("ビジネスユニットを論理削除する", async () => {
			mockBusinessUnitData.hasReferences.mockResolvedValue(false);
			mockBusinessUnitData.softDelete.mockResolvedValue({
				...sampleRow,
				deleted_at: new Date(),
			});

			await expect(
				businessUnitService.delete("BU-001"),
			).resolves.toBeUndefined();
		});

		test("存在しない場合は HTTPException(404) を投げる", async () => {
			mockBusinessUnitData.hasReferences.mockResolvedValue(false);
			mockBusinessUnitData.softDelete.mockResolvedValue(undefined);

			await expect(businessUnitService.delete("NON-EXISTENT")).rejects.toThrow(
				HTTPException,
			);

			try {
				await businessUnitService.delete("NON-EXISTENT");
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(404);
			}
		});

		test("参照が存在する場合は HTTPException(409) を投げる", async () => {
			mockBusinessUnitData.hasReferences.mockResolvedValue(true);

			await expect(businessUnitService.delete("BU-001")).rejects.toThrow(
				HTTPException,
			);

			try {
				await businessUnitService.delete("BU-001");
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(409);
			}
		});
	});

	describe("restore", () => {
		test("論理削除済みビジネスユニットを復元して camelCase で返す", async () => {
			mockBusinessUnitData.findByCodeIncludingDeleted.mockResolvedValue(
				deletedRow,
			);
			mockBusinessUnitData.restore.mockResolvedValue({
				...deletedRow,
				deleted_at: null,
			});

			const result = await businessUnitService.restore("BU-002");

			expect(result).toEqual({
				businessUnitCode: "BU-002",
				name: "削除済みユニット",
				displayOrder: 1,
				createdAt: "2026-01-01T00:00:00.000Z",
				updatedAt: "2026-01-15T00:00:00.000Z",
			});
		});

		test("存在しない場合は HTTPException(404) を投げる", async () => {
			mockBusinessUnitData.findByCodeIncludingDeleted.mockResolvedValue(
				undefined,
			);

			await expect(businessUnitService.restore("NON-EXISTENT")).rejects.toThrow(
				HTTPException,
			);

			try {
				await businessUnitService.restore("NON-EXISTENT");
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(404);
			}
		});

		test("論理削除されていない場合は HTTPException(409) を投げる", async () => {
			mockBusinessUnitData.findByCodeIncludingDeleted.mockResolvedValue(
				sampleRow,
			);

			await expect(businessUnitService.restore("BU-001")).rejects.toThrow(
				HTTPException,
			);

			try {
				await businessUnitService.restore("BU-001");
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(409);
			}
		});
	});
});
