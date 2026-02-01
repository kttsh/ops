import { HTTPException } from "hono/http-exception";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { ProjectTypeRow } from "@/types/projectType";

// projectTypeData のモック
const mockProjectTypeData = {
	findAll: vi.fn(),
	findByCode: vi.fn(),
	findByCodeIncludingDeleted: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
	softDelete: vi.fn(),
	restore: vi.fn(),
	hasReferences: vi.fn(),
};

vi.mock("@/data/projectTypeData", () => ({
	projectTypeData: mockProjectTypeData,
}));

// テスト用サンプルデータ
const sampleRow: ProjectTypeRow = {
	project_type_code: "PT-001",
	name: "案件タイプ1",
	display_order: 1,
	created_at: new Date("2026-01-01T00:00:00Z"),
	updated_at: new Date("2026-01-15T00:00:00Z"),
	deleted_at: null,
};

const deletedRow: ProjectTypeRow = {
	...sampleRow,
	project_type_code: "PT-002",
	name: "削除済み案件タイプ",
	deleted_at: new Date("2026-01-10T00:00:00Z"),
};

describe("projectTypeService", () => {
	let projectTypeService: typeof import("@/services/projectTypeService").projectTypeService;

	beforeEach(async () => {
		vi.clearAllMocks();
		const mod = await import("@/services/projectTypeService");
		projectTypeService = mod.projectTypeService;
	});

	describe("findAll", () => {
		test("データ層の結果を camelCase のレスポンス形式に変換して返す", async () => {
			mockProjectTypeData.findAll.mockResolvedValue({
				items: [sampleRow],
				totalCount: 1,
			});

			const result = await projectTypeService.findAll({
				page: 1,
				pageSize: 20,
				includeDisabled: false,
			});

			expect(result.items).toEqual([
				{
					projectTypeCode: "PT-001",
					name: "案件タイプ1",
					displayOrder: 1,
					createdAt: "2026-01-01T00:00:00.000Z",
					updatedAt: "2026-01-15T00:00:00.000Z",
				},
			]);
			expect(result.totalCount).toBe(1);
		});

		test("データ層にパラメータを正しく渡す", async () => {
			mockProjectTypeData.findAll.mockResolvedValue({
				items: [],
				totalCount: 0,
			});

			await projectTypeService.findAll({
				page: 2,
				pageSize: 10,
				includeDisabled: true,
			});

			expect(mockProjectTypeData.findAll).toHaveBeenCalledWith({
				page: 2,
				pageSize: 10,
				includeDisabled: true,
			});
		});

		test("空の結果を正しく返す", async () => {
			mockProjectTypeData.findAll.mockResolvedValue({
				items: [],
				totalCount: 0,
			});

			const result = await projectTypeService.findAll({
				page: 1,
				pageSize: 20,
				includeDisabled: false,
			});

			expect(result.items).toEqual([]);
			expect(result.totalCount).toBe(0);
		});
	});

	describe("findByCode", () => {
		test("存在する案件タイプを camelCase で返す", async () => {
			mockProjectTypeData.findByCode.mockResolvedValue(sampleRow);

			const result = await projectTypeService.findByCode("PT-001");

			expect(result).toEqual({
				projectTypeCode: "PT-001",
				name: "案件タイプ1",
				displayOrder: 1,
				createdAt: "2026-01-01T00:00:00.000Z",
				updatedAt: "2026-01-15T00:00:00.000Z",
			});
		});

		test("存在しない場合は HTTPException(404) を投げる", async () => {
			mockProjectTypeData.findByCode.mockResolvedValue(undefined);

			await expect(
				projectTypeService.findByCode("NON-EXISTENT"),
			).rejects.toThrow(HTTPException);

			try {
				await projectTypeService.findByCode("NON-EXISTENT");
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(404);
			}
		});
	});

	describe("create", () => {
		test("新規案件タイプを作成して camelCase で返す", async () => {
			mockProjectTypeData.findByCodeIncludingDeleted.mockResolvedValue(
				undefined,
			);
			mockProjectTypeData.create.mockResolvedValue(sampleRow);

			const result = await projectTypeService.create({
				projectTypeCode: "PT-001",
				name: "案件タイプ1",
				displayOrder: 1,
			});

			expect(result).toEqual({
				projectTypeCode: "PT-001",
				name: "案件タイプ1",
				displayOrder: 1,
				createdAt: "2026-01-01T00:00:00.000Z",
				updatedAt: "2026-01-15T00:00:00.000Z",
			});
		});

		test("同一コードが既に存在する場合は HTTPException(409) を投げる", async () => {
			mockProjectTypeData.findByCodeIncludingDeleted.mockResolvedValue(
				sampleRow,
			);

			await expect(
				projectTypeService.create({
					projectTypeCode: "PT-001",
					name: "新規",
					displayOrder: 0,
				}),
			).rejects.toThrow(HTTPException);

			try {
				await projectTypeService.create({
					projectTypeCode: "PT-001",
					name: "新規",
					displayOrder: 0,
				});
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(409);
			}
		});

		test("論理削除済みコードが存在する場合も HTTPException(409) を投げる", async () => {
			mockProjectTypeData.findByCodeIncludingDeleted.mockResolvedValue(
				deletedRow,
			);

			try {
				await projectTypeService.create({
					projectTypeCode: "PT-002",
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
		test("案件タイプを更新して camelCase で返す", async () => {
			const updatedRow = { ...sampleRow, name: "更新後の名前" };
			mockProjectTypeData.update.mockResolvedValue(updatedRow);

			const result = await projectTypeService.update("PT-001", {
				name: "更新後の名前",
			});

			expect(result).toEqual({
				projectTypeCode: "PT-001",
				name: "更新後の名前",
				displayOrder: 1,
				createdAt: "2026-01-01T00:00:00.000Z",
				updatedAt: "2026-01-15T00:00:00.000Z",
			});
		});

		test("存在しない場合は HTTPException(404) を投げる", async () => {
			mockProjectTypeData.update.mockResolvedValue(undefined);

			await expect(
				projectTypeService.update("NON-EXISTENT", { name: "更新" }),
			).rejects.toThrow(HTTPException);

			try {
				await projectTypeService.update("NON-EXISTENT", { name: "更新" });
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(404);
			}
		});
	});

	describe("delete", () => {
		test("案件タイプを論理削除する", async () => {
			mockProjectTypeData.hasReferences.mockResolvedValue(false);
			mockProjectTypeData.softDelete.mockResolvedValue({
				...sampleRow,
				deleted_at: new Date(),
			});

			await expect(
				projectTypeService.delete("PT-001"),
			).resolves.toBeUndefined();
		});

		test("存在しない場合は HTTPException(404) を投げる", async () => {
			mockProjectTypeData.hasReferences.mockResolvedValue(false);
			mockProjectTypeData.softDelete.mockResolvedValue(undefined);

			await expect(projectTypeService.delete("NON-EXISTENT")).rejects.toThrow(
				HTTPException,
			);

			try {
				await projectTypeService.delete("NON-EXISTENT");
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(404);
			}
		});

		test("参照が存在する場合は HTTPException(409) を投げる", async () => {
			mockProjectTypeData.hasReferences.mockResolvedValue(true);

			await expect(projectTypeService.delete("PT-001")).rejects.toThrow(
				HTTPException,
			);

			try {
				await projectTypeService.delete("PT-001");
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(409);
			}
		});
	});

	describe("restore", () => {
		test("論理削除済み案件タイプを復元して camelCase で返す", async () => {
			mockProjectTypeData.findByCodeIncludingDeleted.mockResolvedValue(
				deletedRow,
			);
			mockProjectTypeData.restore.mockResolvedValue({
				...deletedRow,
				deleted_at: null,
			});

			const result = await projectTypeService.restore("PT-002");

			expect(result).toEqual({
				projectTypeCode: "PT-002",
				name: "削除済み案件タイプ",
				displayOrder: 1,
				createdAt: "2026-01-01T00:00:00.000Z",
				updatedAt: "2026-01-15T00:00:00.000Z",
			});
		});

		test("存在しない場合は HTTPException(404) を投げる", async () => {
			mockProjectTypeData.findByCodeIncludingDeleted.mockResolvedValue(
				undefined,
			);

			await expect(projectTypeService.restore("NON-EXISTENT")).rejects.toThrow(
				HTTPException,
			);

			try {
				await projectTypeService.restore("NON-EXISTENT");
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(404);
			}
		});

		test("論理削除されていない場合は HTTPException(409) を投げる", async () => {
			mockProjectTypeData.findByCodeIncludingDeleted.mockResolvedValue(
				sampleRow,
			);

			await expect(projectTypeService.restore("PT-001")).rejects.toThrow(
				HTTPException,
			);

			try {
				await projectTypeService.restore("PT-001");
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(409);
			}
		});
	});
});
