import { describe, expect, test } from "vitest";
import { toChartViewCapacityItemResponse } from "@/transform/chartViewCapacityItemTransform";
import type { ChartViewCapacityItemRow } from "@/types/chartViewCapacityItem";
import { bulkUpsertChartViewCapacityItemSchema } from "@/types/chartViewCapacityItem";

describe("bulkUpsertChartViewCapacityItemSchema", () => {
	test("正常なリクエストをパースできる", () => {
		const input = {
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
		};

		const result = bulkUpsertChartViewCapacityItemSchema.parse(input);

		expect(result.items).toHaveLength(2);
		expect(result.items[0].capacityScenarioId).toBe(1);
		expect(result.items[0].isVisible).toBe(true);
		expect(result.items[0].colorCode).toBe("#dc2626");
		expect(result.items[1].colorCode).toBeNull();
	});

	test("デフォルト値が適用される", () => {
		const input = {
			items: [{ capacityScenarioId: 1 }],
		};

		const result = bulkUpsertChartViewCapacityItemSchema.parse(input);

		expect(result.items[0].isVisible).toBe(true);
		expect(result.items[0].colorCode).toBeNull();
	});

	test("空配列を許可する", () => {
		const result = bulkUpsertChartViewCapacityItemSchema.parse({
			items: [],
		});
		expect(result.items).toHaveLength(0);
	});

	test("capacityScenarioId が 0 以下の場合バリデーションエラー", () => {
		expect(() =>
			bulkUpsertChartViewCapacityItemSchema.parse({
				items: [{ capacityScenarioId: 0 }],
			}),
		).toThrow();
	});

	test("colorCode が不正な形式の場合バリデーションエラー", () => {
		expect(() =>
			bulkUpsertChartViewCapacityItemSchema.parse({
				items: [{ capacityScenarioId: 1, colorCode: "red" }],
			}),
		).toThrow();
	});

	test("colorCode が7文字でないHEXの場合バリデーションエラー", () => {
		expect(() =>
			bulkUpsertChartViewCapacityItemSchema.parse({
				items: [{ capacityScenarioId: 1, colorCode: "#fff" }],
			}),
		).toThrow();
	});
});

describe("toChartViewCapacityItemResponse", () => {
	test("DB行をAPIレスポンス形式に変換する", () => {
		const row: ChartViewCapacityItemRow = {
			chart_view_capacity_item_id: 1,
			chart_view_id: 10,
			capacity_scenario_id: 2,
			is_visible: true,
			color_code: "#dc2626",
			created_at: new Date("2026-01-01T00:00:00Z"),
			updated_at: new Date("2026-01-02T00:00:00Z"),
			scenario_name: "標準シナリオ",
		};

		const result = toChartViewCapacityItemResponse(row);

		expect(result).toEqual({
			chartViewCapacityItemId: 1,
			chartViewId: 10,
			capacityScenarioId: 2,
			scenarioName: "標準シナリオ",
			isVisible: true,
			colorCode: "#dc2626",
			createdAt: "2026-01-01T00:00:00.000Z",
			updatedAt: "2026-01-02T00:00:00.000Z",
		});
	});

	test("is_visible が falsy の場合 false に変換する", () => {
		const row: ChartViewCapacityItemRow = {
			chart_view_capacity_item_id: 2,
			chart_view_id: 10,
			capacity_scenario_id: 1,
			is_visible: false,
			color_code: null,
			created_at: new Date("2026-01-01T00:00:00Z"),
			updated_at: new Date("2026-01-01T00:00:00Z"),
			scenario_name: null,
		};

		const result = toChartViewCapacityItemResponse(row);

		expect(result.isVisible).toBe(false);
		expect(result.colorCode).toBeNull();
		expect(result.scenarioName).toBeNull();
	});
});
