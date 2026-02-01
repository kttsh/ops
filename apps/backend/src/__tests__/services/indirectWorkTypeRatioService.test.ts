import { HTTPException } from "hono/http-exception";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { IndirectWorkTypeRatioRow } from "@/types/indirectWorkTypeRatio";

// --- モック ---
const mockData = {
	findAll: vi.fn(),
	findById: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
	deleteById: vi.fn(),
	bulkUpsert: vi.fn(),
	indirectWorkCaseExists: vi.fn(),
	workTypeExists: vi.fn(),
	compositeKeyExists: vi.fn(),
};

vi.mock("@/data/indirectWorkTypeRatioData", () => ({
	indirectWorkTypeRatioData: mockData,
}));

// --- テスト用データ ---
const sampleRow: IndirectWorkTypeRatioRow = {
	indirect_work_type_ratio_id: 1,
	indirect_work_case_id: 10,
	work_type_code: "DESIGN",
	fiscal_year: 2026,
	ratio: 0.5,
	created_at: new Date("2026-01-01T00:00:00.000Z"),
	updated_at: new Date("2026-01-01T00:00:00.000Z"),
};

const sampleRow2: IndirectWorkTypeRatioRow = {
	indirect_work_type_ratio_id: 2,
	indirect_work_case_id: 10,
	work_type_code: "REVIEW",
	fiscal_year: 2026,
	ratio: 0.3,
	created_at: new Date("2026-01-02T00:00:00.000Z"),
	updated_at: new Date("2026-01-02T00:00:00.000Z"),
};

describe("indirectWorkTypeRatioService", () => {
	let indirectWorkTypeRatioService: typeof import("@/services/indirectWorkTypeRatioService").indirectWorkTypeRatioService;

	beforeEach(async () => {
		vi.clearAllMocks();
		const mod = await import("@/services/indirectWorkTypeRatioService");
		indirectWorkTypeRatioService = mod.indirectWorkTypeRatioService;
	});

	// ===========================================================================
	// findAll
	// ===========================================================================
	describe("findAll", () => {
		test("親ケースが存在する場合、変換済み配列を返す", async () => {
			mockData.indirectWorkCaseExists.mockResolvedValue(true);
			mockData.findAll.mockResolvedValue([sampleRow, sampleRow2]);

			const result = await indirectWorkTypeRatioService.findAll(10);

			expect(result).toHaveLength(2);
			expect(result[0].indirectWorkTypeRatioId).toBe(1);
			expect(result[1].indirectWorkTypeRatioId).toBe(2);
		});

		test("親ケースが存在しない場合、404 を投げる", async () => {
			mockData.indirectWorkCaseExists.mockResolvedValue(false);

			await expect(indirectWorkTypeRatioService.findAll(999)).rejects.toThrow(
				HTTPException,
			);
			try {
				await indirectWorkTypeRatioService.findAll(999);
			} catch (e) {
				expect((e as HTTPException).status).toBe(404);
			}
		});
	});

	// ===========================================================================
	// findById
	// ===========================================================================
	describe("findById", () => {
		test("レコードが存在し親ケースIDが一致する場合、変換済みオブジェクトを返す", async () => {
			mockData.findById.mockResolvedValue(sampleRow);

			const result = await indirectWorkTypeRatioService.findById(10, 1);

			expect(result.indirectWorkTypeRatioId).toBe(1);
			expect(result.workTypeCode).toBe("DESIGN");
		});

		test("レコードが存在しない場合、404 を投げる", async () => {
			mockData.findById.mockResolvedValue(undefined);

			await expect(
				indirectWorkTypeRatioService.findById(10, 999),
			).rejects.toThrow(HTTPException);
			try {
				await indirectWorkTypeRatioService.findById(10, 999);
			} catch (e) {
				expect((e as HTTPException).status).toBe(404);
			}
		});

		test("親ケースIDが不一致の場合、404 を投げる", async () => {
			mockData.findById.mockResolvedValue(sampleRow);

			await expect(
				indirectWorkTypeRatioService.findById(20, 1),
			).rejects.toThrow(HTTPException);
			try {
				await indirectWorkTypeRatioService.findById(20, 1);
			} catch (e) {
				expect((e as HTTPException).status).toBe(404);
			}
		});
	});

	// ===========================================================================
	// create
	// ===========================================================================
	describe("create", () => {
		test("正常に作成して変換済みオブジェクトを返す", async () => {
			mockData.indirectWorkCaseExists.mockResolvedValue(true);
			mockData.workTypeExists.mockResolvedValue(true);
			mockData.compositeKeyExists.mockResolvedValue(false);
			mockData.create.mockResolvedValue(sampleRow);

			const result = await indirectWorkTypeRatioService.create(10, {
				workTypeCode: "DESIGN",
				fiscalYear: 2026,
				ratio: 0.5,
			});

			expect(result.indirectWorkTypeRatioId).toBe(1);
			expect(mockData.create).toHaveBeenCalledWith({
				indirectWorkCaseId: 10,
				workTypeCode: "DESIGN",
				fiscalYear: 2026,
				ratio: 0.5,
			});
		});

		test("親ケース不存在で 404 を投げる", async () => {
			mockData.indirectWorkCaseExists.mockResolvedValue(false);

			await expect(
				indirectWorkTypeRatioService.create(999, {
					workTypeCode: "DESIGN",
					fiscalYear: 2026,
					ratio: 0.5,
				}),
			).rejects.toThrow(HTTPException);

			try {
				await indirectWorkTypeRatioService.create(999, {
					workTypeCode: "DESIGN",
					fiscalYear: 2026,
					ratio: 0.5,
				});
			} catch (e) {
				expect((e as HTTPException).status).toBe(404);
			}
		});

		test("workTypeCode が存在しない場合、422 を投げる", async () => {
			mockData.indirectWorkCaseExists.mockResolvedValue(true);
			mockData.workTypeExists.mockResolvedValue(false);

			await expect(
				indirectWorkTypeRatioService.create(10, {
					workTypeCode: "INVALID",
					fiscalYear: 2026,
					ratio: 0.5,
				}),
			).rejects.toThrow(HTTPException);

			try {
				await indirectWorkTypeRatioService.create(10, {
					workTypeCode: "INVALID",
					fiscalYear: 2026,
					ratio: 0.5,
				});
			} catch (e) {
				expect((e as HTTPException).status).toBe(422);
			}
		});

		test("複合キー重複で 409 を投げる", async () => {
			mockData.indirectWorkCaseExists.mockResolvedValue(true);
			mockData.workTypeExists.mockResolvedValue(true);
			mockData.compositeKeyExists.mockResolvedValue(true);

			await expect(
				indirectWorkTypeRatioService.create(10, {
					workTypeCode: "DESIGN",
					fiscalYear: 2026,
					ratio: 0.5,
				}),
			).rejects.toThrow(HTTPException);

			try {
				await indirectWorkTypeRatioService.create(10, {
					workTypeCode: "DESIGN",
					fiscalYear: 2026,
					ratio: 0.5,
				});
			} catch (e) {
				expect((e as HTTPException).status).toBe(409);
			}
		});
	});

	// ===========================================================================
	// update
	// ===========================================================================
	describe("update", () => {
		test("正常に更新して変換済みオブジェクトを返す", async () => {
			const updatedRow = { ...sampleRow, ratio: 0.8 };
			mockData.findById.mockResolvedValue(sampleRow);
			mockData.compositeKeyExists.mockResolvedValue(false);
			mockData.update.mockResolvedValue(updatedRow);

			const result = await indirectWorkTypeRatioService.update(10, 1, {
				ratio: 0.8,
			});

			expect(result.ratio).toBe(0.8);
		});

		test("レコードが存在しない場合、404 を投げる", async () => {
			mockData.findById.mockResolvedValue(undefined);

			await expect(
				indirectWorkTypeRatioService.update(10, 999, { ratio: 0.8 }),
			).rejects.toThrow(HTTPException);

			try {
				await indirectWorkTypeRatioService.update(10, 999, { ratio: 0.8 });
			} catch (e) {
				expect((e as HTTPException).status).toBe(404);
			}
		});

		test("親ケースIDが不一致の場合、404 を投げる", async () => {
			mockData.findById.mockResolvedValue(sampleRow);

			await expect(
				indirectWorkTypeRatioService.update(20, 1, { ratio: 0.8 }),
			).rejects.toThrow(HTTPException);

			try {
				await indirectWorkTypeRatioService.update(20, 1, { ratio: 0.8 });
			} catch (e) {
				expect((e as HTTPException).status).toBe(404);
			}
		});

		test("workTypeCode 変更時に複合キー重複で 409 を投げる", async () => {
			mockData.findById.mockResolvedValue(sampleRow);
			mockData.compositeKeyExists.mockResolvedValue(true);

			await expect(
				indirectWorkTypeRatioService.update(10, 1, { workTypeCode: "REVIEW" }),
			).rejects.toThrow(HTTPException);

			try {
				await indirectWorkTypeRatioService.update(10, 1, {
					workTypeCode: "REVIEW",
				});
			} catch (e) {
				expect((e as HTTPException).status).toBe(409);
			}
		});

		test("ratio のみの変更時は重複チェックを実行しない", async () => {
			const updatedRow = { ...sampleRow, ratio: 0.9 };
			mockData.findById.mockResolvedValue(sampleRow);
			mockData.update.mockResolvedValue(updatedRow);

			const result = await indirectWorkTypeRatioService.update(10, 1, {
				ratio: 0.9,
			});

			expect(result.ratio).toBe(0.9);
			expect(mockData.compositeKeyExists).not.toHaveBeenCalled();
		});
	});

	// ===========================================================================
	// delete
	// ===========================================================================
	describe("delete", () => {
		test("正常に削除する", async () => {
			mockData.findById.mockResolvedValue(sampleRow);
			mockData.deleteById.mockResolvedValue(true);

			await expect(
				indirectWorkTypeRatioService.delete(10, 1),
			).resolves.toBeUndefined();
			expect(mockData.deleteById).toHaveBeenCalledWith(1);
		});

		test("レコードが存在しない場合、404 を投げる", async () => {
			mockData.findById.mockResolvedValue(undefined);

			await expect(
				indirectWorkTypeRatioService.delete(10, 999),
			).rejects.toThrow(HTTPException);
			try {
				await indirectWorkTypeRatioService.delete(10, 999);
			} catch (e) {
				expect((e as HTTPException).status).toBe(404);
			}
		});

		test("親ケースIDが不一致の場合、404 を投げる", async () => {
			mockData.findById.mockResolvedValue(sampleRow);

			await expect(indirectWorkTypeRatioService.delete(20, 1)).rejects.toThrow(
				HTTPException,
			);
			try {
				await indirectWorkTypeRatioService.delete(20, 1);
			} catch (e) {
				expect((e as HTTPException).status).toBe(404);
			}
		});
	});

	// ===========================================================================
	// bulkUpsert
	// ===========================================================================
	describe("bulkUpsert", () => {
		test("正常にバルク Upsert して変換済み配列を返す", async () => {
			mockData.indirectWorkCaseExists.mockResolvedValue(true);
			mockData.bulkUpsert.mockResolvedValue([sampleRow, sampleRow2]);

			const result = await indirectWorkTypeRatioService.bulkUpsert(10, {
				items: [
					{ workTypeCode: "DESIGN", fiscalYear: 2026, ratio: 0.5 },
					{ workTypeCode: "REVIEW", fiscalYear: 2026, ratio: 0.3 },
				],
			});

			expect(result).toHaveLength(2);
			expect(result[0].workTypeCode).toBe("DESIGN");
			expect(result[1].workTypeCode).toBe("REVIEW");
		});

		test("親ケース不存在で 404 を投げる", async () => {
			mockData.indirectWorkCaseExists.mockResolvedValue(false);

			await expect(
				indirectWorkTypeRatioService.bulkUpsert(999, {
					items: [{ workTypeCode: "DESIGN", fiscalYear: 2026, ratio: 0.5 }],
				}),
			).rejects.toThrow(HTTPException);

			try {
				await indirectWorkTypeRatioService.bulkUpsert(999, {
					items: [{ workTypeCode: "DESIGN", fiscalYear: 2026, ratio: 0.5 }],
				});
			} catch (e) {
				expect((e as HTTPException).status).toBe(404);
			}
		});

		test("配列内の workTypeCode + fiscalYear 重複で 422 を投げる", async () => {
			mockData.indirectWorkCaseExists.mockResolvedValue(true);

			await expect(
				indirectWorkTypeRatioService.bulkUpsert(10, {
					items: [
						{ workTypeCode: "DESIGN", fiscalYear: 2026, ratio: 0.5 },
						{ workTypeCode: "DESIGN", fiscalYear: 2026, ratio: 0.8 },
					],
				}),
			).rejects.toThrow(HTTPException);

			try {
				await indirectWorkTypeRatioService.bulkUpsert(10, {
					items: [
						{ workTypeCode: "DESIGN", fiscalYear: 2026, ratio: 0.5 },
						{ workTypeCode: "DESIGN", fiscalYear: 2026, ratio: 0.8 },
					],
				});
			} catch (e) {
				expect((e as HTTPException).status).toBe(422);
			}
		});

		test("異なる年度の同一 workTypeCode は重複とみなさない", async () => {
			mockData.indirectWorkCaseExists.mockResolvedValue(true);
			mockData.bulkUpsert.mockResolvedValue([
				sampleRow,
				{ ...sampleRow2, fiscal_year: 2027 },
			]);

			const result = await indirectWorkTypeRatioService.bulkUpsert(10, {
				items: [
					{ workTypeCode: "DESIGN", fiscalYear: 2026, ratio: 0.5 },
					{ workTypeCode: "DESIGN", fiscalYear: 2027, ratio: 0.3 },
				],
			});

			expect(result).toHaveLength(2);
		});
	});
});
