import { HTTPException } from "hono/http-exception";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type {
	StandardEffortMasterRow,
	StandardEffortWeightRow,
} from "@/types/standardEffortMaster";

// standardEffortMasterData のモック
const mockData = {
	findAll: vi.fn(),
	findById: vi.fn(),
	findByIdIncludingDeleted: vi.fn(),
	findByCompositeKey: vi.fn(),
	findWeightsByMasterId: vi.fn(),
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

vi.mock("@/data/standardEffortMasterData", () => ({
	standardEffortMasterData: mockData,
}));

vi.mock("@/data/businessUnitData", () => ({
	businessUnitData: mockBusinessUnitData,
}));

vi.mock("@/data/projectTypeData", () => ({
	projectTypeData: mockProjectTypeData,
}));

// テスト用サンプルデータ
const sampleRow: StandardEffortMasterRow = {
	standard_effort_id: 1,
	business_unit_code: "BU-001",
	project_type_code: "PT-001",
	name: "Sカーブパターン",
	created_at: new Date("2026-01-01T00:00:00Z"),
	updated_at: new Date("2026-01-15T00:00:00Z"),
	deleted_at: null,
};

const deletedRow: StandardEffortMasterRow = {
	...sampleRow,
	standard_effort_id: 2,
	name: "削除済みパターン",
	deleted_at: new Date("2026-01-10T00:00:00Z"),
};

const sampleWeightRows: StandardEffortWeightRow[] = [
	{
		standard_effort_weight_id: 1,
		standard_effort_id: 1,
		progress_rate: 0,
		weight: 0,
		created_at: new Date("2026-01-01T00:00:00Z"),
		updated_at: new Date("2026-01-01T00:00:00Z"),
	},
	{
		standard_effort_weight_id: 2,
		standard_effort_id: 1,
		progress_rate: 50,
		weight: 10,
		created_at: new Date("2026-01-01T00:00:00Z"),
		updated_at: new Date("2026-01-01T00:00:00Z"),
	},
];

const sampleSummaryResponse = {
	standardEffortId: 1,
	businessUnitCode: "BU-001",
	projectTypeCode: "PT-001",
	name: "Sカーブパターン",
	createdAt: "2026-01-01T00:00:00.000Z",
	updatedAt: "2026-01-15T00:00:00.000Z",
};

const sampleDetailResponse = {
	...sampleSummaryResponse,
	weights: [
		{ standardEffortWeightId: 1, progressRate: 0, weight: 0 },
		{ standardEffortWeightId: 2, progressRate: 50, weight: 10 },
	],
};

describe("standardEffortMasterService", () => {
	let standardEffortMasterService: typeof import("@/services/standardEffortMasterService").standardEffortMasterService;

	beforeEach(async () => {
		vi.clearAllMocks();
		const mod = await import("@/services/standardEffortMasterService");
		standardEffortMasterService = mod.standardEffortMasterService;
	});

	// --- 一覧取得 ---

	describe("findAll", () => {
		test("データ層の結果をサマリレスポンスに変換して返す", async () => {
			mockData.findAll.mockResolvedValue({
				items: [sampleRow],
				totalCount: 1,
			});

			const result = await standardEffortMasterService.findAll({
				page: 1,
				pageSize: 20,
				includeDisabled: false,
			});

			expect(result.items).toEqual([sampleSummaryResponse]);
			expect(result.totalCount).toBe(1);
		});

		test("データ層にパラメータを正しく渡す", async () => {
			mockData.findAll.mockResolvedValue({ items: [], totalCount: 0 });

			await standardEffortMasterService.findAll({
				page: 2,
				pageSize: 10,
				includeDisabled: true,
				businessUnitCode: "BU-001",
				projectTypeCode: "PT-001",
			});

			expect(mockData.findAll).toHaveBeenCalledWith({
				page: 2,
				pageSize: 10,
				includeDisabled: true,
				businessUnitCode: "BU-001",
				projectTypeCode: "PT-001",
			});
		});

		test("空の結果を正しく返す", async () => {
			mockData.findAll.mockResolvedValue({ items: [], totalCount: 0 });

			const result = await standardEffortMasterService.findAll({
				page: 1,
				pageSize: 20,
				includeDisabled: false,
			});

			expect(result.items).toEqual([]);
			expect(result.totalCount).toBe(0);
		});
	});

	// --- 単一取得 ---

	describe("findById", () => {
		test("マスタと重みを結合した詳細レスポンスを返す", async () => {
			mockData.findById.mockResolvedValue(sampleRow);
			mockData.findWeightsByMasterId.mockResolvedValue(sampleWeightRows);

			const result = await standardEffortMasterService.findById(1);

			expect(result).toEqual(sampleDetailResponse);
		});

		test("存在しない場合は HTTPException(404) を投げる", async () => {
			mockData.findById.mockResolvedValue(undefined);

			try {
				await standardEffortMasterService.findById(999);
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(404);
			}
		});
	});

	// --- 作成 ---

	describe("create", () => {
		test("新規マスタを作成して詳細レスポンスを返す", async () => {
			mockBusinessUnitData.findByCode.mockResolvedValue({
				business_unit_code: "BU-001",
			});
			mockProjectTypeData.findByCode.mockResolvedValue({
				project_type_code: "PT-001",
			});
			mockData.findByCompositeKey.mockResolvedValue(undefined);
			mockData.create.mockResolvedValue(sampleRow);
			mockData.findWeightsByMasterId.mockResolvedValue(sampleWeightRows);

			const result = await standardEffortMasterService.create({
				businessUnitCode: "BU-001",
				projectTypeCode: "PT-001",
				name: "Sカーブパターン",
				weights: [
					{ progressRate: 0, weight: 0 },
					{ progressRate: 50, weight: 10 },
				],
			});

			expect(result).toEqual(sampleDetailResponse);
		});

		test("businessUnitCode が存在しない場合は HTTPException(422) を投げる", async () => {
			mockBusinessUnitData.findByCode.mockResolvedValue(undefined);

			try {
				await standardEffortMasterService.create({
					businessUnitCode: "UNKNOWN-BU",
					projectTypeCode: "PT-001",
					name: "テスト",
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
				await standardEffortMasterService.create({
					businessUnitCode: "BU-001",
					projectTypeCode: "UNKNOWN-PT",
					name: "テスト",
				});
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(422);
			}
		});

		test("複合ユニークキーが重複する場合は HTTPException(409) を投げる", async () => {
			mockBusinessUnitData.findByCode.mockResolvedValue({
				business_unit_code: "BU-001",
			});
			mockProjectTypeData.findByCode.mockResolvedValue({
				project_type_code: "PT-001",
			});
			mockData.findByCompositeKey.mockResolvedValue(sampleRow);

			try {
				await standardEffortMasterService.create({
					businessUnitCode: "BU-001",
					projectTypeCode: "PT-001",
					name: "Sカーブパターン",
				});
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(409);
			}
		});
	});

	// --- 更新 ---

	describe("update", () => {
		test("名称を更新して詳細レスポンスを返す", async () => {
			const updatedRow = { ...sampleRow, name: "更新名" };
			mockData.findById.mockResolvedValue(sampleRow);
			mockData.findByCompositeKey.mockResolvedValue(undefined);
			mockData.update.mockResolvedValue(updatedRow);
			mockData.findWeightsByMasterId.mockResolvedValue(sampleWeightRows);

			const result = await standardEffortMasterService.update(1, {
				name: "更新名",
			});

			expect(result.name).toBe("更新名");
		});

		test("weights を更新して詳細レスポンスを返す", async () => {
			mockData.findById.mockResolvedValue(sampleRow);
			mockData.update.mockResolvedValue(sampleRow);
			mockData.findWeightsByMasterId.mockResolvedValue(sampleWeightRows);

			const result = await standardEffortMasterService.update(1, {
				weights: [{ progressRate: 0, weight: 5 }],
			});

			expect(result).toEqual(sampleDetailResponse);
		});

		test("name と weights の両方を更新する", async () => {
			const updatedRow = { ...sampleRow, name: "更新名" };
			mockData.findById.mockResolvedValue(sampleRow);
			mockData.findByCompositeKey.mockResolvedValue(undefined);
			mockData.update.mockResolvedValue(updatedRow);
			mockData.findWeightsByMasterId.mockResolvedValue(sampleWeightRows);

			const result = await standardEffortMasterService.update(1, {
				name: "更新名",
				weights: [{ progressRate: 0, weight: 5 }],
			});

			expect(result.name).toBe("更新名");
		});

		test("存在しない場合は HTTPException(404) を投げる", async () => {
			mockData.findById.mockResolvedValue(undefined);

			try {
				await standardEffortMasterService.update(999, { name: "更新" });
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(404);
			}
		});

		test("名称変更時に他レコードと重複する場合は HTTPException(409) を投げる", async () => {
			const otherRow = { ...sampleRow, standard_effort_id: 99 };
			mockData.findById.mockResolvedValue(sampleRow);
			mockData.findByCompositeKey.mockResolvedValue(otherRow);

			try {
				await standardEffortMasterService.update(1, { name: "重複名" });
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(409);
			}
		});

		test("名称変更時のユニークチェックで自身は除外する", async () => {
			mockData.findById.mockResolvedValue(sampleRow);
			mockData.findByCompositeKey.mockResolvedValue(sampleRow); // 自身のレコード
			mockData.update.mockResolvedValue(sampleRow);
			mockData.findWeightsByMasterId.mockResolvedValue(sampleWeightRows);

			const result = await standardEffortMasterService.update(1, {
				name: "Sカーブパターン",
			});

			expect(result).toEqual(sampleDetailResponse);
		});
	});

	// --- 削除 ---

	describe("delete", () => {
		test("マスタを論理削除する", async () => {
			mockData.findById.mockResolvedValue(sampleRow);
			mockData.hasReferences.mockResolvedValue(false);
			mockData.softDelete.mockResolvedValue(sampleRow);

			await expect(
				standardEffortMasterService.delete(1),
			).resolves.toBeUndefined();
		});

		test("存在しない場合は HTTPException(404) を投げる", async () => {
			mockData.findById.mockResolvedValue(undefined);

			try {
				await standardEffortMasterService.delete(999);
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(404);
			}
		});

		test("参照が存在する場合は HTTPException(409) を投げる", async () => {
			mockData.findById.mockResolvedValue(sampleRow);
			mockData.hasReferences.mockResolvedValue(true);

			try {
				await standardEffortMasterService.delete(1);
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(409);
			}
		});
	});

	// --- 復元 ---

	describe("restore", () => {
		test("論理削除済みマスタを復元して詳細レスポンスを返す", async () => {
			const restoredRow = { ...deletedRow, deleted_at: null };
			mockData.findByIdIncludingDeleted.mockResolvedValue(deletedRow);
			mockData.findByCompositeKey.mockResolvedValue(undefined);
			mockData.restore.mockResolvedValue(restoredRow);
			mockData.findWeightsByMasterId.mockResolvedValue(sampleWeightRows);

			const result = await standardEffortMasterService.restore(2);

			expect(result.name).toBe("削除済みパターン");
		});

		test("存在しない場合は HTTPException(404) を投げる", async () => {
			mockData.findByIdIncludingDeleted.mockResolvedValue(undefined);

			try {
				await standardEffortMasterService.restore(999);
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(404);
			}
		});

		test("論理削除されていない場合は HTTPException(404) を投げる", async () => {
			mockData.findByIdIncludingDeleted.mockResolvedValue(sampleRow); // deleted_at: null

			try {
				await standardEffortMasterService.restore(1);
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(404);
			}
		});

		test("復元時に複合ユニークキーが重複する場合は HTTPException(409) を投げる", async () => {
			const conflictingRow = { ...sampleRow, standard_effort_id: 99 };
			mockData.findByIdIncludingDeleted.mockResolvedValue(deletedRow);
			mockData.findByCompositeKey.mockResolvedValue(conflictingRow);

			try {
				await standardEffortMasterService.restore(2);
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(409);
			}
		});
	});
});
