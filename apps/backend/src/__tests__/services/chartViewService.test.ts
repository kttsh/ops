import { HTTPException } from "hono/http-exception";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { ChartViewRow } from "@/types/chartView";

// chartViewData のモック
const mockChartViewData = {
	findAll: vi.fn(),
	findById: vi.fn(),
	findByIdIncludingDeleted: vi.fn(),
	create: vi.fn(),
	update: vi.fn(),
	softDelete: vi.fn(),
	restore: vi.fn(),
};

vi.mock("@/data/chartViewData", () => ({
	chartViewData: mockChartViewData,
}));

// テスト用サンプルデータ
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
	updated_at: new Date("2026-01-15T00:00:00Z"),
	deleted_at: null,
};

const deletedRow: ChartViewRow = {
	...sampleRow,
	chart_view_id: 2,
	view_name: "削除済みビュー",
	deleted_at: new Date("2026-01-10T00:00:00Z"),
};

describe("chartViewService", () => {
	let chartViewService: typeof import("@/services/chartViewService").chartViewService;

	beforeEach(async () => {
		vi.clearAllMocks();
		const mod = await import("@/services/chartViewService");
		chartViewService = mod.chartViewService;
	});

	describe("findAll", () => {
		test("データ層の結果を camelCase のレスポンス形式に変換して返す", async () => {
			mockChartViewData.findAll.mockResolvedValue({
				items: [sampleRow],
				totalCount: 1,
			});

			const result = await chartViewService.findAll({
				page: 1,
				pageSize: 20,
				includeDisabled: false,
			});

			expect(result.items).toEqual([
				{
					chartViewId: 1,
					viewName: "2026年度全体ビュー",
					chartType: "stacked-area",
					startYearMonth: "202604",
					endYearMonth: "202703",
					isDefault: true,
					description: "2026年度のプロジェクト工数積み上げ表示",
					businessUnitCodes: ["PLANT"],
					createdAt: "2026-01-01T00:00:00.000Z",
					updatedAt: "2026-01-15T00:00:00.000Z",
				},
			]);
			expect(result.totalCount).toBe(1);
		});

		test("データ層にパラメータを正しく渡す", async () => {
			mockChartViewData.findAll.mockResolvedValue({
				items: [],
				totalCount: 0,
			});

			await chartViewService.findAll({
				page: 2,
				pageSize: 10,
				includeDisabled: true,
			});

			expect(mockChartViewData.findAll).toHaveBeenCalledWith({
				page: 2,
				pageSize: 10,
				includeDisabled: true,
			});
		});

		test("空の結果を正しく返す", async () => {
			mockChartViewData.findAll.mockResolvedValue({
				items: [],
				totalCount: 0,
			});

			const result = await chartViewService.findAll({
				page: 1,
				pageSize: 20,
				includeDisabled: false,
			});

			expect(result.items).toEqual([]);
			expect(result.totalCount).toBe(0);
		});
	});

	describe("findById", () => {
		test("存在するチャートビューを camelCase で返す", async () => {
			mockChartViewData.findById.mockResolvedValue(sampleRow);

			const result = await chartViewService.findById(1);

			expect(result).toEqual({
				chartViewId: 1,
				viewName: "2026年度全体ビュー",
				chartType: "stacked-area",
				startYearMonth: "202604",
				endYearMonth: "202703",
				isDefault: true,
				description: "2026年度のプロジェクト工数積み上げ表示",
				businessUnitCodes: ["PLANT"],
				createdAt: "2026-01-01T00:00:00.000Z",
				updatedAt: "2026-01-15T00:00:00.000Z",
			});
		});

		test("存在しない場合は HTTPException(404) を投げる", async () => {
			mockChartViewData.findById.mockResolvedValue(undefined);

			await expect(chartViewService.findById(999)).rejects.toThrow(
				HTTPException,
			);

			try {
				await chartViewService.findById(999);
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(404);
			}
		});
	});

	describe("create", () => {
		test("新規チャートビューを作成して camelCase で返す", async () => {
			mockChartViewData.create.mockResolvedValue(sampleRow);

			const result = await chartViewService.create({
				viewName: "2026年度全体ビュー",
				chartType: "stacked-area",
				startYearMonth: "202604",
				endYearMonth: "202703",
				isDefault: true,
				description: "2026年度のプロジェクト工数積み上げ表示",
			});

			expect(result).toEqual({
				chartViewId: 1,
				viewName: "2026年度全体ビュー",
				chartType: "stacked-area",
				startYearMonth: "202604",
				endYearMonth: "202703",
				isDefault: true,
				description: "2026年度のプロジェクト工数積み上げ表示",
				businessUnitCodes: ["PLANT"],
				createdAt: "2026-01-01T00:00:00.000Z",
				updatedAt: "2026-01-15T00:00:00.000Z",
			});
		});

		test("isDefault 省略時にデフォルト値 false を使用する", async () => {
			const rowWithDefaultFalse = { ...sampleRow, is_default: false };
			mockChartViewData.create.mockResolvedValue(rowWithDefaultFalse);

			await chartViewService.create({
				viewName: "テストビュー",
				chartType: "stacked-bar",
				startYearMonth: "202601",
				endYearMonth: "202612",
			});

			expect(mockChartViewData.create).toHaveBeenCalledWith({
				viewName: "テストビュー",
				chartType: "stacked-bar",
				startYearMonth: "202601",
				endYearMonth: "202612",
				isDefault: false,
				description: null,
			});
		});
	});

	describe("update", () => {
		test("チャートビューを更新して camelCase で返す", async () => {
			const updatedRow = { ...sampleRow, view_name: "更新後ビュー" };
			mockChartViewData.findById.mockResolvedValue(sampleRow);
			mockChartViewData.update.mockResolvedValue(updatedRow);

			const result = await chartViewService.update(1, {
				viewName: "更新後ビュー",
			});

			expect(result.viewName).toBe("更新後ビュー");
		});

		test("存在しない場合は HTTPException(404) を投げる", async () => {
			mockChartViewData.findById.mockResolvedValue(undefined);

			await expect(
				chartViewService.update(999, { viewName: "更新" }),
			).rejects.toThrow(HTTPException);

			try {
				await chartViewService.update(999, { viewName: "更新" });
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(404);
			}
		});

		test("startYearMonth のみ更新して既存 endYearMonth との大小関係が不正な場合 HTTPException(422) を投げる", async () => {
			mockChartViewData.findById.mockResolvedValue(sampleRow);

			await expect(
				chartViewService.update(1, { startYearMonth: "202801" }),
			).rejects.toThrow(HTTPException);

			try {
				await chartViewService.update(1, { startYearMonth: "202801" });
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(422);
			}
		});

		test("endYearMonth のみ更新して既存 startYearMonth との大小関係が不正な場合 HTTPException(422) を投げる", async () => {
			mockChartViewData.findById.mockResolvedValue(sampleRow);

			await expect(
				chartViewService.update(1, { endYearMonth: "202501" }),
			).rejects.toThrow(HTTPException);

			try {
				await chartViewService.update(1, { endYearMonth: "202501" });
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(422);
			}
		});

		test("両方更新して大小関係が正しい場合は正常に更新される", async () => {
			const updatedRow = {
				...sampleRow,
				start_year_month: "202501",
				end_year_month: "202512",
			};
			mockChartViewData.findById.mockResolvedValue(sampleRow);
			mockChartViewData.update.mockResolvedValue(updatedRow);

			const result = await chartViewService.update(1, {
				startYearMonth: "202501",
				endYearMonth: "202512",
			});

			expect(result.startYearMonth).toBe("202501");
			expect(result.endYearMonth).toBe("202512");
		});
	});

	describe("delete", () => {
		test("チャートビューを論理削除する", async () => {
			mockChartViewData.softDelete.mockResolvedValue({
				...sampleRow,
				deleted_at: new Date(),
			});

			await expect(chartViewService.delete(1)).resolves.toBeUndefined();
		});

		test("存在しない場合は HTTPException(404) を投げる", async () => {
			mockChartViewData.softDelete.mockResolvedValue(undefined);

			await expect(chartViewService.delete(999)).rejects.toThrow(HTTPException);

			try {
				await chartViewService.delete(999);
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(404);
			}
		});
	});

	describe("restore", () => {
		test("論理削除済みチャートビューを復元して camelCase で返す", async () => {
			mockChartViewData.findByIdIncludingDeleted.mockResolvedValue(deletedRow);
			mockChartViewData.restore.mockResolvedValue({
				...deletedRow,
				deleted_at: null,
			});

			const result = await chartViewService.restore(2);

			expect(result).toEqual({
				chartViewId: 2,
				viewName: "削除済みビュー",
				chartType: "stacked-area",
				startYearMonth: "202604",
				endYearMonth: "202703",
				isDefault: true,
				description: "2026年度のプロジェクト工数積み上げ表示",
				businessUnitCodes: ["PLANT"],
				createdAt: "2026-01-01T00:00:00.000Z",
				updatedAt: "2026-01-15T00:00:00.000Z",
			});
		});

		test("存在しない場合は HTTPException(404) を投げる", async () => {
			mockChartViewData.findByIdIncludingDeleted.mockResolvedValue(undefined);

			await expect(chartViewService.restore(999)).rejects.toThrow(
				HTTPException,
			);

			try {
				await chartViewService.restore(999);
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(404);
			}
		});

		test("論理削除されていない場合は HTTPException(404) を投げる", async () => {
			mockChartViewData.findByIdIncludingDeleted.mockResolvedValue(sampleRow);

			await expect(chartViewService.restore(1)).rejects.toThrow(HTTPException);

			try {
				await chartViewService.restore(1);
			} catch (e) {
				expect(e).toBeInstanceOf(HTTPException);
				expect((e as HTTPException).status).toBe(404);
			}
		});
	});
});
