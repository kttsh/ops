import { describe, expect, test } from "vitest";
import { toChartColorPaletteResponse } from "@/transform/chartColorPaletteTransform";
import type { ChartColorPaletteRow } from "@/types/chartColorPalette";

describe("chartColorPaletteTransform", () => {
	describe("toChartColorPaletteResponse", () => {
		test("snake_case の DB 行を camelCase の API レスポンス形式に変換する", () => {
			const row: ChartColorPaletteRow = {
				chart_color_palette_id: 1,
				name: "レッド",
				color_code: "#FF5733",
				display_order: 1,
				created_at: new Date("2026-01-01T00:00:00Z"),
				updated_at: new Date("2026-01-15T00:00:00Z"),
			};

			const result = toChartColorPaletteResponse(row);

			expect(result).toEqual({
				chartColorPaletteId: 1,
				name: "レッド",
				colorCode: "#FF5733",
				displayOrder: 1,
				createdAt: "2026-01-01T00:00:00.000Z",
				updatedAt: "2026-01-15T00:00:00.000Z",
			});
		});

		test("Date 型を ISO 8601 文字列に変換する", () => {
			const row: ChartColorPaletteRow = {
				chart_color_palette_id: 2,
				name: "ブルー",
				color_code: "#0000FF",
				display_order: 0,
				created_at: new Date("2026-06-15T09:30:00Z"),
				updated_at: new Date("2026-06-15T10:00:00Z"),
			};

			const result = toChartColorPaletteResponse(row);

			expect(result.createdAt).toBe("2026-06-15T09:30:00.000Z");
			expect(result.updatedAt).toBe("2026-06-15T10:00:00.000Z");
		});

		test("displayOrder が 0 の場合も正しく変換する", () => {
			const row: ChartColorPaletteRow = {
				chart_color_palette_id: 3,
				name: "デフォルト",
				color_code: "#000000",
				display_order: 0,
				created_at: new Date("2026-01-01T00:00:00Z"),
				updated_at: new Date("2026-01-01T00:00:00Z"),
			};

			const result = toChartColorPaletteResponse(row);

			expect(result.displayOrder).toBe(0);
		});
	});
});
