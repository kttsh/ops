import { describe, expect, it } from "vitest";
import {
	toFiscalYear,
	toYearMonth,
} from "@/features/indirect-case-study/hooks/useMonthlyLoadsPage";

describe("toFiscalYear", () => {
	it("4月〜12月はその年の年度を返す", () => {
		expect(toFiscalYear("202404")).toBe(2024);
		expect(toFiscalYear("202412")).toBe(2024);
		expect(toFiscalYear("202506")).toBe(2025);
	});

	it("1月〜3月は前年の年度を返す", () => {
		expect(toFiscalYear("202501")).toBe(2024);
		expect(toFiscalYear("202502")).toBe(2024);
		expect(toFiscalYear("202503")).toBe(2024);
		expect(toFiscalYear("202603")).toBe(2025);
	});
});

describe("toYearMonth", () => {
	it("年度とmonthIndex(0=4月)からyearMonth(YYYYMM)を返す", () => {
		// 4月（monthIndex 0）
		expect(toYearMonth(2024, 0)).toBe("202404");
		// 5月（monthIndex 1）
		expect(toYearMonth(2024, 1)).toBe("202405");
		// 12月（monthIndex 8）
		expect(toYearMonth(2024, 8)).toBe("202412");
		// 1月（monthIndex 9）→ 翌年
		expect(toYearMonth(2024, 9)).toBe("202501");
		// 2月（monthIndex 10）→ 翌年
		expect(toYearMonth(2024, 10)).toBe("202502");
		// 3月（monthIndex 11）→ 翌年
		expect(toYearMonth(2024, 11)).toBe("202503");
	});

	it("toFiscalYear と toYearMonth は逆変換の関係にある", () => {
		for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
			const ym = toYearMonth(2024, monthIndex);
			expect(toFiscalYear(ym)).toBe(2024);
		}
	});
});
