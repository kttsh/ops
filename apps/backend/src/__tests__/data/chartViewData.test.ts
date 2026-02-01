import { beforeEach, describe, expect, test, vi } from "vitest";
import type { ChartViewRow } from "@/types/chartView";

// mssql のモック
const mockQuery = vi.fn();
const mockInput = vi.fn().mockReturnThis();
const mockRequest = vi.fn(() => ({
	input: mockInput,
	query: mockQuery,
}));

vi.mock("@/database/client", () => ({
	getPool: vi.fn().mockResolvedValue({
		request: mockRequest,
	}),
}));

// テスト用のサンプルデータ
const sampleRow: ChartViewRow = {
	chart_view_id: 1,
	view_name: "2026年度全体ビュー",
	chart_type: "stacked-area",
	start_year_month: "202604",
	end_year_month: "202703",
	is_default: true,
	description: "2026年度のプロジェクト工数積み上げ表示",
	business_unit_codes: '["PLANT"]',
	created_at: new Date("2026-01-01T00:00:00Z"),
	updated_at: new Date("2026-01-01T00:00:00Z"),
	deleted_at: null,
};

const deletedRow: ChartViewRow = {
	...sampleRow,
	chart_view_id: 2,
	view_name: "削除済みビュー",
	deleted_at: new Date("2026-01-15T00:00:00Z"),
};

describe("chartViewData", () => {
	let chartViewData: typeof import("@/data/chartViewData").chartViewData;

	beforeEach(async () => {
		vi.clearAllMocks();
		mockInput.mockReturnThis();
		const mod = await import("@/data/chartViewData");
		chartViewData = mod.chartViewData;
	});

	describe("findAll", () => {
		test("論理削除されていないレコードをページネーション付きで取得する", async () => {
			mockQuery
				.mockResolvedValueOnce({ recordset: [sampleRow] })
				.mockResolvedValueOnce({ recordset: [{ totalCount: 1 }] });

			const result = await chartViewData.findAll({
				page: 1,
				pageSize: 20,
				includeDisabled: false,
			});

			expect(result.items).toEqual([sampleRow]);
			expect(result.totalCount).toBe(1);
			expect(mockInput).toHaveBeenCalledWith("offset", expect.anything(), 0);
			expect(mockInput).toHaveBeenCalledWith("pageSize", expect.anything(), 20);
		});

		test("includeDisabled=true で論理削除済みも含めて取得する", async () => {
			mockQuery
				.mockResolvedValueOnce({ recordset: [sampleRow, deletedRow] })
				.mockResolvedValueOnce({ recordset: [{ totalCount: 2 }] });

			const result = await chartViewData.findAll({
				page: 1,
				pageSize: 20,
				includeDisabled: true,
			});

			expect(result.items).toEqual([sampleRow, deletedRow]);
			expect(result.totalCount).toBe(2);
		});

		test("2ページ目を取得する場合、offset が正しく計算される", async () => {
			mockQuery
				.mockResolvedValueOnce({ recordset: [] })
				.mockResolvedValueOnce({ recordset: [{ totalCount: 25 }] });

			await chartViewData.findAll({
				page: 2,
				pageSize: 10,
				includeDisabled: false,
			});

			expect(mockInput).toHaveBeenCalledWith("offset", expect.anything(), 10);
			expect(mockInput).toHaveBeenCalledWith("pageSize", expect.anything(), 10);
		});
	});

	describe("findById", () => {
		test("指定IDのアクティブなレコードを返す", async () => {
			mockQuery.mockResolvedValueOnce({ recordset: [sampleRow] });

			const result = await chartViewData.findById(1);

			expect(result).toEqual(sampleRow);
			expect(mockInput).toHaveBeenCalledWith("id", expect.anything(), 1);
		});

		test("存在しない場合は undefined を返す", async () => {
			mockQuery.mockResolvedValueOnce({ recordset: [] });

			const result = await chartViewData.findById(999);

			expect(result).toBeUndefined();
		});
	});

	describe("findByIdIncludingDeleted", () => {
		test("論理削除済みのレコードも含めて返す", async () => {
			mockQuery.mockResolvedValueOnce({ recordset: [deletedRow] });

			const result = await chartViewData.findByIdIncludingDeleted(2);

			expect(result).toEqual(deletedRow);
			expect(mockInput).toHaveBeenCalledWith("id", expect.anything(), 2);
		});

		test("存在しない場合は undefined を返す", async () => {
			mockQuery.mockResolvedValueOnce({ recordset: [] });

			const result = await chartViewData.findByIdIncludingDeleted(999);

			expect(result).toBeUndefined();
		});
	});

	describe("create", () => {
		test("新規レコードを作成して OUTPUT で完全な行を返す", async () => {
			mockQuery.mockResolvedValueOnce({ recordset: [sampleRow] });

			const result = await chartViewData.create({
				viewName: "2026年度全体ビュー",
				chartType: "stacked-area",
				startYearMonth: "202604",
				endYearMonth: "202703",
				isDefault: true,
				description: "2026年度のプロジェクト工数積み上げ表示",
				businessUnitCodes: ["PLANT"],
			});

			expect(result).toEqual(sampleRow);
			expect(mockInput).toHaveBeenCalledWith(
				"viewName",
				expect.anything(),
				"2026年度全体ビュー",
			);
			expect(mockInput).toHaveBeenCalledWith(
				"businessUnitCodes",
				expect.anything(),
				'["PLANT"]',
			);
		});

		test("businessUnitCodes 未指定時に null を格納する", async () => {
			const rowWithoutBu = { ...sampleRow, business_unit_codes: null };
			mockQuery.mockResolvedValueOnce({ recordset: [rowWithoutBu] });

			await chartViewData.create({
				viewName: "テストビュー",
				chartType: "stacked-bar",
				startYearMonth: "202601",
				endYearMonth: "202612",
				isDefault: false,
				description: null,
			});

			expect(mockInput).toHaveBeenCalledWith(
				"businessUnitCodes",
				expect.anything(),
				null,
			);
		});
	});

	describe("update", () => {
		test("指定フィールドのみ更新して findById で完全な行を返す", async () => {
			const updatedRow = { ...sampleRow, view_name: "更新後ビュー" };
			// UPDATE の OUTPUT で ID を返す
			mockQuery.mockResolvedValueOnce({ recordset: [{ chart_view_id: 1 }] });
			// findById の結果
			mockQuery.mockResolvedValueOnce({ recordset: [updatedRow] });

			const result = await chartViewData.update(1, {
				viewName: "更新後ビュー",
			});

			expect(result).toEqual(updatedRow);
			expect(mockInput).toHaveBeenCalledWith("id", expect.anything(), 1);
			expect(mockInput).toHaveBeenCalledWith(
				"viewName",
				expect.anything(),
				"更新後ビュー",
			);
		});

		test("複数フィールドを更新する", async () => {
			// UPDATE の OUTPUT で ID を返す
			mockQuery.mockResolvedValueOnce({ recordset: [{ chart_view_id: 1 }] });
			// findById の結果
			mockQuery.mockResolvedValueOnce({ recordset: [sampleRow] });

			await chartViewData.update(1, {
				viewName: "更新ビュー",
				chartType: "stacked-bar",
				startYearMonth: "202601",
				endYearMonth: "202612",
				isDefault: false,
				description: "更新説明",
			});

			expect(mockInput).toHaveBeenCalledWith(
				"viewName",
				expect.anything(),
				"更新ビュー",
			);
			expect(mockInput).toHaveBeenCalledWith(
				"chartType",
				expect.anything(),
				"stacked-bar",
			);
			expect(mockInput).toHaveBeenCalledWith(
				"startYearMonth",
				expect.anything(),
				"202601",
			);
			expect(mockInput).toHaveBeenCalledWith(
				"endYearMonth",
				expect.anything(),
				"202612",
			);
			expect(mockInput).toHaveBeenCalledWith(
				"isDefault",
				expect.anything(),
				false,
			);
			expect(mockInput).toHaveBeenCalledWith(
				"description",
				expect.anything(),
				"更新説明",
			);
		});

		test("businessUnitCodes を更新する", async () => {
			mockQuery.mockResolvedValueOnce({ recordset: [{ chart_view_id: 1 }] });
			mockQuery.mockResolvedValueOnce({ recordset: [sampleRow] });

			await chartViewData.update(1, {
				businessUnitCodes: ["PLANT", "TRANS"],
			});

			expect(mockInput).toHaveBeenCalledWith(
				"businessUnitCodes",
				expect.anything(),
				'["PLANT","TRANS"]',
			);
		});

		test("存在しないレコードの場合は undefined を返す", async () => {
			mockQuery.mockResolvedValueOnce({ recordset: [] });

			const result = await chartViewData.update(999, {
				viewName: "更新テスト",
			});

			expect(result).toBeUndefined();
		});
	});

	describe("softDelete", () => {
		test("レコードを論理削除して結果を返す", async () => {
			const deletedResult = { ...sampleRow, deleted_at: new Date() };
			mockQuery.mockResolvedValueOnce({ recordset: [deletedResult] });

			const result = await chartViewData.softDelete(1);

			expect(result).toEqual(deletedResult);
			expect(mockInput).toHaveBeenCalledWith("id", expect.anything(), 1);
		});

		test("存在しない/既に削除済みのレコードの場合は undefined を返す", async () => {
			mockQuery.mockResolvedValueOnce({ recordset: [] });

			const result = await chartViewData.softDelete(999);

			expect(result).toBeUndefined();
		});
	});

	describe("restore", () => {
		test("論理削除済みレコードを復元して findById で完全な行を返す", async () => {
			const restoredRow = { ...sampleRow, deleted_at: null };
			// restore の OUTPUT
			mockQuery.mockResolvedValueOnce({ recordset: [restoredRow] });
			// findById の結果
			mockQuery.mockResolvedValueOnce({ recordset: [restoredRow] });

			const result = await chartViewData.restore(2);

			expect(result).toEqual(restoredRow);
			expect(mockInput).toHaveBeenCalledWith("id", expect.anything(), 2);
		});

		test("存在しない/削除されていないレコードの場合は undefined を返す", async () => {
			mockQuery.mockResolvedValueOnce({ recordset: [] });

			const result = await chartViewData.restore(999);

			expect(result).toBeUndefined();
		});
	});
});
