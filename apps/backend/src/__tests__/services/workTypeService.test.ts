import { HTTPException } from "hono/http-exception";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { WorkTypeRow } from "@/types/workType";

// workTypeData のモック
const mockWorkTypeData = {
	findAll: vi.fn(),
	findByCode: vi.fn(),
	findByCodeIncludingDeleted: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
	softDelete: vi.fn(),
	restore: vi.fn(),
	hasReferences: vi.fn(),
};

vi.mock("@/data/workTypeData", () => ({
	workTypeData: mockWorkTypeData,
}));

// テスト用サンプルデータ
const sampleRow: WorkTypeRow = {
	work_type_code: "WT-001",
	name: "作業種類1",
	display_order: 1,
	color: "#FF5733",
	created_at: new Date("2026-01-01T00:00:00Z"),
	updated_at: new Date("2026-01-15T00:00:00Z"),
	deleted_at: null,
};

const deletedRow: WorkTypeRow = {
	...sampleRow,
	work_type_code: "WT-002",
	name: "削除済み作業種類",
	deleted_at: new Date("2026-01-10T00:00:00Z"),
};

describe("workTypeService", () => {
	let workTypeService: typeof import("@/services/workTypeService").workTypeService;

	beforeEach(async () => {
		vi.clearAllMocks();
		const mod = await import("@/services/workTypeService");
		workTypeService = mod.workTypeService;
	});

	describe("findAll", () => {
		test("データ層の結果を camelCase のレスポンス形式に変換して返す", async () => {
			mockWorkTypeData.findAll.mockResolvedValue({
				items: [sampleRow],
				totalCount: 1,
			});

			const result = await workTypeService.findAll({
				page: 1,
				pageSize: 20,
				includeDisabled: false,
			});

			expect(result.items).toEqual([
				{
					workTypeCode: "WT-001",
					name: "作業種類1",
					displayOrder: 1,
					color: "#FF5733",
					createdAt: "2026-01-01T00:00:00.000Z",
					updatedAt: "2026-01-15T00:00:00.000Z",
				},
			]);
			expect(result.totalCount).toBe(1);
		});

		test("データ層にパラメータを正しく渡す", async () => {
			mockWorkTypeData.findAll.mockResolvedValue({
				items: [],
				totalCount: 0,
			});

			await workTypeService.findAll({
				page: 2,
				pageSize: 10,
				includeDisabled: true,
			});

			expect(mockWorkTypeData.findAll).toHaveBeenCalledWith({
				page: 2,
				pageSize: 10,
				includeDisabled: true,
			});
		});

		test("空の結果を正しく返す", async () => {
			mockWorkTypeData.findAll.mockResolvedValue({
				items: [],
				totalCount: 0,
			});

			const result = await workTypeService.findAll({
				page: 1,
				pageSize: 20,
				includeDisabled: false,
			});

			expect(result.items).toEqual([]);
			expect(result.totalCount).toBe(0);
		});
	});

	describe("findByCode", () => {
		test("存在する作業種類を camelCase で返す", async () => {
			mockWorkTypeData.findByCode.mockResolvedValue(sampleRow);

			const result = await workTypeService.findByCode("WT-001");

			expect(result).toEqual({
				workTypeCode: "WT-001",
				name: "作業種類1",
				displayOrder: 1,
				color: "#FF5733",
				createdAt: "2026-01-01T00:00:00.000Z",
				updatedAt: "2026-01-15T00:00:00.000Z",
			});
		});

		test("存在しない場合は HTTPException(404) を投げる", async () => {
			mockWorkTypeData.findByCode.mockResolvedValue(undefined);

			await expect(workTypeService.findByCode("NON-EXISTENT")).rejects.toThrow(
				HTTPException,
			);

			try {
				await workTypeService.findByCode("NON-EXISTENT");
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(404);
			}
		});
	});

	describe("create", () => {
		test("新規作業種類を作成して camelCase で返す", async () => {
			mockWorkTypeData.findByCodeIncludingDeleted.mockResolvedValue(undefined);
			mockWorkTypeData.create.mockResolvedValue(sampleRow);

			const result = await workTypeService.create({
				workTypeCode: "WT-001",
				name: "作業種類1",
				displayOrder: 1,
				color: "#FF5733",
			});

			expect(result).toEqual({
				workTypeCode: "WT-001",
				name: "作業種類1",
				displayOrder: 1,
				color: "#FF5733",
				createdAt: "2026-01-01T00:00:00.000Z",
				updatedAt: "2026-01-15T00:00:00.000Z",
			});
		});

		test("同一コードが既に存在する場合は HTTPException(409) を投げる", async () => {
			mockWorkTypeData.findByCodeIncludingDeleted.mockResolvedValue(sampleRow);

			await expect(
				workTypeService.create({
					workTypeCode: "WT-001",
					name: "新規",
					displayOrder: 0,
				}),
			).rejects.toThrow(HTTPException);

			try {
				await workTypeService.create({
					workTypeCode: "WT-001",
					name: "新規",
					displayOrder: 0,
				});
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(409);
			}
		});

		test("論理削除済みコードが存在する場合も HTTPException(409) を投げ、復元を促すメッセージを含める", async () => {
			mockWorkTypeData.findByCodeIncludingDeleted.mockResolvedValue(deletedRow);

			try {
				await workTypeService.create({
					workTypeCode: "WT-002",
					name: "新規",
					displayOrder: 0,
				});
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(409);
				expect((e as HTTPException).message).toContain("restore");
			}
		});
	});

	describe("update", () => {
		test("作業種類を更新して camelCase で返す", async () => {
			const updatedRow = { ...sampleRow, name: "更新後の名前" };
			mockWorkTypeData.update.mockResolvedValue(updatedRow);

			const result = await workTypeService.update("WT-001", {
				name: "更新後の名前",
			});

			expect(result).toEqual({
				workTypeCode: "WT-001",
				name: "更新後の名前",
				displayOrder: 1,
				color: "#FF5733",
				createdAt: "2026-01-01T00:00:00.000Z",
				updatedAt: "2026-01-15T00:00:00.000Z",
			});
		});

		test("存在しない場合は HTTPException(404) を投げる", async () => {
			mockWorkTypeData.update.mockResolvedValue(undefined);

			await expect(
				workTypeService.update("NON-EXISTENT", { name: "更新" }),
			).rejects.toThrow(HTTPException);

			try {
				await workTypeService.update("NON-EXISTENT", { name: "更新" });
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(404);
			}
		});
	});

	describe("delete", () => {
		test("作業種類を論理削除する", async () => {
			mockWorkTypeData.hasReferences.mockResolvedValue(false);
			mockWorkTypeData.softDelete.mockResolvedValue({
				...sampleRow,
				deleted_at: new Date(),
			});

			await expect(workTypeService.delete("WT-001")).resolves.toBeUndefined();
		});

		test("存在しない場合は HTTPException(404) を投げる", async () => {
			mockWorkTypeData.hasReferences.mockResolvedValue(false);
			mockWorkTypeData.softDelete.mockResolvedValue(undefined);

			await expect(workTypeService.delete("NON-EXISTENT")).rejects.toThrow(
				HTTPException,
			);

			try {
				await workTypeService.delete("NON-EXISTENT");
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(404);
			}
		});

		test("参照が存在する場合は HTTPException(409) を投げる", async () => {
			mockWorkTypeData.hasReferences.mockResolvedValue(true);

			await expect(workTypeService.delete("WT-001")).rejects.toThrow(
				HTTPException,
			);

			try {
				await workTypeService.delete("WT-001");
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(409);
			}
		});
	});

	describe("restore", () => {
		test("論理削除済み作業種類を復元して camelCase で返す", async () => {
			mockWorkTypeData.findByCodeIncludingDeleted.mockResolvedValue(deletedRow);
			mockWorkTypeData.restore.mockResolvedValue({
				...deletedRow,
				deleted_at: null,
			});

			const result = await workTypeService.restore("WT-002");

			expect(result).toEqual({
				workTypeCode: "WT-002",
				name: "削除済み作業種類",
				displayOrder: 1,
				color: "#FF5733",
				createdAt: "2026-01-01T00:00:00.000Z",
				updatedAt: "2026-01-15T00:00:00.000Z",
			});
		});

		test("存在しない場合は HTTPException(404) を投げる", async () => {
			mockWorkTypeData.findByCodeIncludingDeleted.mockResolvedValue(undefined);

			await expect(workTypeService.restore("NON-EXISTENT")).rejects.toThrow(
				HTTPException,
			);

			try {
				await workTypeService.restore("NON-EXISTENT");
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(404);
			}
		});

		test("論理削除されていない場合は HTTPException(409) を投げる", async () => {
			mockWorkTypeData.findByCodeIncludingDeleted.mockResolvedValue(sampleRow);

			await expect(workTypeService.restore("WT-001")).rejects.toThrow(
				HTTPException,
			);

			try {
				await workTypeService.restore("WT-001");
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(409);
			}
		});
	});
});
