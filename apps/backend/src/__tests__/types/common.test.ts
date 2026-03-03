import { describe, expect, test } from "vitest";
import {
	yearMonthSchema,
	businessUnitCodeSchema,
	colorCodeSchema,
	includeDisabledFilterSchema,
} from "@/types/common";

describe("yearMonthSchema", () => {
	test("正常値（202601）を受理する", () => {
		expect(yearMonthSchema.safeParse("202601").success).toBe(true);
		expect(yearMonthSchema.safeParse("202612").success).toBe(true);
		expect(yearMonthSchema.safeParse("199901").success).toBe(true);
	});

	test("不正月（202613）を拒否する", () => {
		expect(yearMonthSchema.safeParse("202613").success).toBe(false);
	});

	test("月 00 を拒否する", () => {
		expect(yearMonthSchema.safeParse("202600").success).toBe(false);
	});

	test("不正形式（2026-01）を拒否する", () => {
		expect(yearMonthSchema.safeParse("2026-01").success).toBe(false);
	});

	test("5 桁を拒否する", () => {
		expect(yearMonthSchema.safeParse("20261").success).toBe(false);
	});

	test("7 桁を拒否する", () => {
		expect(yearMonthSchema.safeParse("2026011").success).toBe(false);
	});

	test("空文字を拒否する", () => {
		expect(yearMonthSchema.safeParse("").success).toBe(false);
	});

	test("非数字文字を拒否する", () => {
		expect(yearMonthSchema.safeParse("abcdef").success).toBe(false);
	});
});

describe("businessUnitCodeSchema", () => {
	test("正常値（BU-001）を受理する", () => {
		expect(businessUnitCodeSchema.safeParse("BU-001").success).toBe(true);
	});

	test("英数字・ハイフン・アンダースコアを受理する", () => {
		expect(businessUnitCodeSchema.safeParse("abc_123-XYZ").success).toBe(true);
	});

	test("1 文字を受理する", () => {
		expect(businessUnitCodeSchema.safeParse("A").success).toBe(true);
	});

	test("20 文字を受理する", () => {
		expect(businessUnitCodeSchema.safeParse("A".repeat(20)).success).toBe(true);
	});

	test("空文字を拒否する", () => {
		expect(businessUnitCodeSchema.safeParse("").success).toBe(false);
	});

	test("21 文字以上を拒否する", () => {
		expect(businessUnitCodeSchema.safeParse("A".repeat(21)).success).toBe(
			false,
		);
	});

	test("不正文字（スペース・記号）を拒否する", () => {
		expect(businessUnitCodeSchema.safeParse("BU 001!").success).toBe(false);
		expect(businessUnitCodeSchema.safeParse("BU.001").success).toBe(false);
	});
});

describe("colorCodeSchema", () => {
	test("正常値（#FF5733）を受理する", () => {
		expect(colorCodeSchema.safeParse("#FF5733").success).toBe(true);
	});

	test("小文字の 16 進数を受理する", () => {
		expect(colorCodeSchema.safeParse("#ff5733").success).toBe(true);
	});

	test("# なしを拒否する", () => {
		expect(colorCodeSchema.safeParse("FF5733").success).toBe(false);
	});

	test("不正な 16 進数文字を拒否する", () => {
		expect(colorCodeSchema.safeParse("#GGGGGG").success).toBe(false);
	});

	test("3 桁のショートコードを拒否する", () => {
		expect(colorCodeSchema.safeParse("#FFF").success).toBe(false);
	});

	test("空文字を拒否する", () => {
		expect(colorCodeSchema.safeParse("").success).toBe(false);
	});
});

describe("includeDisabledFilterSchema", () => {
	test("デフォルト値 false を確認する", () => {
		expect(includeDisabledFilterSchema.parse(undefined)).toBe(false);
	});

	test("true を受理する", () => {
		expect(includeDisabledFilterSchema.parse(true)).toBe(true);
	});

	test("false を受理する", () => {
		expect(includeDisabledFilterSchema.parse(false)).toBe(false);
	});

	test('"true" 文字列の coerce を確認する', () => {
		expect(includeDisabledFilterSchema.parse("true")).toBe(true);
	});

	test('"false" 文字列は Boolean("false") === true のため true になる', () => {
		// z.coerce.boolean() は Boolean(value) を適用するため、非空文字列は全て true
		expect(includeDisabledFilterSchema.parse("false")).toBe(true);
	});
});
