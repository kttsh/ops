import { HTTPException } from "hono/http-exception";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { ChartViewCapacityItemRow } from "@/types/chartViewCapacityItem";

// --- モック ---
const mockData = {
	findAll: vi.fn(),
	bulkUpsert: vi.fn(),
	chartViewExists: vi.fn(),
	capacityScenariosExist: vi.fn(),
};

vi.mock("@/data/chartViewCapacityItemData", () => ({
	chartViewCapacityItemData: mockData,
}));

// --- テスト用データ ---
const sampleRow: ChartViewCapacityItemRow = {
	chart_view_capacity_item_id: 1,
	chart_view_id: 10,
	capacity_scenario_id: 1,
	is_visible: true,
	color_code: "#dc2626",
	created_at: new Date("2026-01-01T00:00:00.000Z"),
	updated_at: new Date("2026-01-01T00:00:00.000Z"),
	scenario_name: "標準シナリオ",
};

const sampleRow2: ChartViewCapacityItemRow = {
	chart_view_capacity_item_id: 2,
	chart_view_id: 10,
	capacity_scenario_id: 2,
	is_visible: false,
	color_code: null,
	created_at: new Date("2026-01-02T00:00:00.000Z"),
	updated_at: new Date("2026-01-02T00:00:00.000Z"),
	scenario_name: "楽観シナリオ",
};

describe("chartViewCapacityItemService", () => {
	let chartViewCapacityItemService: typeof import("@/services/chartViewCapacityItemService").chartViewCapacityItemService;

	beforeEach(async () => {
		vi.clearAllMocks();
		const mod = await import("@/services/chartViewCapacityItemService");
		chartViewCapacityItemService = mod.chartViewCapacityItemService;
	});

	// ===========================================================================
	// findAll
	// ===========================================================================
	describe("findAll", () => {
		test("チャートビューが存在する場合、変換済み配列を返す", async () => {
			mockData.chartViewExists.mockResolvedValue(true);
			mockData.findAll.mockResolvedValue([sampleRow, sampleRow2]);

			const result = await chartViewCapacityItemService.findAll(10);

			expect(result).toHaveLength(2);
			expect(result[0].chartViewCapacityItemId).toBe(1);
			expect(result[0].capacityScenarioId).toBe(1);
			expect(result[0].scenarioName).toBe("標準シナリオ");
			expect(result[0].isVisible).toBe(true);
			expect(result[0].colorCode).toBe("#dc2626");
			expect(result[1].chartViewCapacityItemId).toBe(2);
			expect(result[1].isVisible).toBe(false);
		});

		test("チャートビューが存在しない場合、404 を投げる", async () => {
			mockData.chartViewExists.mockResolvedValue(false);

			await expect(
				chartViewCapacityItemService.findAll(999),
			).rejects.toThrow(HTTPException);
			try {
				await chartViewCapacityItemService.findAll(999);
			} catch (e) {
				expect((e as HTTPException).status).toBe(404);
			}
		});
	});

	// ===========================================================================
	// bulkUpsert
	// ===========================================================================
	describe("bulkUpsert", () => {
		test("正常に一括更新して変換済み配列を返す", async () => {
			mockData.chartViewExists.mockResolvedValue(true);
			mockData.capacityScenariosExist.mockResolvedValue(true);
			mockData.bulkUpsert.mockResolvedValue([sampleRow, sampleRow2]);

			const result = await chartViewCapacityItemService.bulkUpsert(10, {
				items: [
					{
						capacityScenarioId: 1,
						isVisible: true,
						colorCode: "#dc2626",
					},
					{
						capacityScenarioId: 2,
						isVisible: false,
						colorCode: null,
					},
				],
			});

			expect(result).toHaveLength(2);
			expect(result[0].chartViewCapacityItemId).toBe(1);
			expect(result[1].chartViewCapacityItemId).toBe(2);
			expect(mockData.bulkUpsert).toHaveBeenCalledWith(10, [
				{
					capacityScenarioId: 1,
					isVisible: true,
					colorCode: "#dc2626",
				},
				{
					capacityScenarioId: 2,
					isVisible: false,
					colorCode: null,
				},
			]);
		});

		test("空配列で呼び出した場合も正常動作する", async () => {
			mockData.chartViewExists.mockResolvedValue(true);
			mockData.bulkUpsert.mockResolvedValue([]);

			const result = await chartViewCapacityItemService.bulkUpsert(10, {
				items: [],
			});

			expect(result).toHaveLength(0);
			expect(mockData.bulkUpsert).toHaveBeenCalledWith(10, []);
		});

		test("チャートビュー不存在で 404 を投げる", async () => {
			mockData.chartViewExists.mockResolvedValue(false);

			await expect(
				chartViewCapacityItemService.bulkUpsert(999, {
					items: [
						{
							capacityScenarioId: 1,
							isVisible: true,
							colorCode: null,
						},
					],
				}),
			).rejects.toThrow(HTTPException);

			try {
				await chartViewCapacityItemService.bulkUpsert(999, {
					items: [
						{
							capacityScenarioId: 1,
							isVisible: true,
							colorCode: null,
						},
					],
				});
			} catch (e) {
				expect((e as HTTPException).status).toBe(404);
			}
		});

		test("シナリオID重複で 422 を投げる", async () => {
			mockData.chartViewExists.mockResolvedValue(true);

			await expect(
				chartViewCapacityItemService.bulkUpsert(10, {
					items: [
						{
							capacityScenarioId: 1,
							isVisible: true,
							colorCode: null,
						},
						{
							capacityScenarioId: 1,
							isVisible: false,
							colorCode: null,
						},
					],
				}),
			).rejects.toThrow(HTTPException);

			try {
				await chartViewCapacityItemService.bulkUpsert(10, {
					items: [
						{
							capacityScenarioId: 1,
							isVisible: true,
							colorCode: null,
						},
						{
							capacityScenarioId: 1,
							isVisible: false,
							colorCode: null,
						},
					],
				});
			} catch (e) {
				expect((e as HTTPException).status).toBe(422);
			}
		});

		test("存在しないシナリオIDで 422 を投げる", async () => {
			mockData.chartViewExists.mockResolvedValue(true);
			mockData.capacityScenariosExist.mockResolvedValue(false);

			await expect(
				chartViewCapacityItemService.bulkUpsert(10, {
					items: [
						{
							capacityScenarioId: 999,
							isVisible: true,
							colorCode: null,
						},
					],
				}),
			).rejects.toThrow(HTTPException);

			try {
				await chartViewCapacityItemService.bulkUpsert(10, {
					items: [
						{
							capacityScenarioId: 999,
							isVisible: true,
							colorCode: null,
						},
					],
				});
			} catch (e) {
				expect((e as HTTPException).status).toBe(422);
			}
		});
	});
});
