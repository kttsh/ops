import { describe, expect, test } from "vitest";
import {
	CAPACITY_COLORS,
	PROJECT_TYPE_COLORS,
} from "@/lib/chart-colors";

describe("chart-colors", () => {
	test("CAPACITY_COLORS の全エントリが PROJECT_TYPE_COLORS と重複しない", () => {
		const projectColors = new Set<string>(PROJECT_TYPE_COLORS);
		for (const color of CAPACITY_COLORS) {
			expect(projectColors.has(color)).toBe(false);
		}
	});

	test("CAPACITY_COLORS は4色定義されている", () => {
		expect(CAPACITY_COLORS).toHaveLength(4);
	});

	test("CAPACITY_COLORS の全エントリが有効な HEX カラーコード", () => {
		for (const color of CAPACITY_COLORS) {
			expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
		}
	});
});
