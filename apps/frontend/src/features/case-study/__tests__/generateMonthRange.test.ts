import { describe, expect, it } from "vitest";
import { generateMonthRange } from "../components/WorkloadCard";
import type { ProjectCase, ProjectLoad } from "../types";

function makeCase(overrides: Partial<ProjectCase> = {}): ProjectCase {
	return {
		projectCaseId: 1,
		projectId: 1,
		caseName: "テスト",
		isPrimary: false,
		description: null,
		calculationType: "MANUAL",
		standardEffortId: null,
		startYearMonth: null,
		durationMonths: null,
		totalManhour: null,
		createdAt: "2026-01-01T00:00:00Z",
		updatedAt: "2026-01-01T00:00:00Z",
		projectName: "テストプロジェクト",
		standardEffortName: null,
		...overrides,
	};
}

function makeLoad(yearMonth: string, manhour = 100): ProjectLoad {
	return {
		projectLoadId: 1,
		projectCaseId: 1,
		yearMonth,
		manhour,
		createdAt: "2026-01-01T00:00:00Z",
		updatedAt: "2026-01-01T00:00:00Z",
	};
}

describe("generateMonthRange", () => {
	it("startYearMonth + durationMonths 設定時はその範囲を返す", () => {
		const pc = makeCase({ startYearMonth: "202601", durationMonths: 3 });
		const result = generateMonthRange(pc, []);
		expect(result).toEqual(["202601", "202602", "202603"]);
	});

	it("年をまたぐ場合も正しく生成する", () => {
		const pc = makeCase({ startYearMonth: "202611", durationMonths: 4 });
		const result = generateMonthRange(pc, []);
		expect(result).toEqual(["202611", "202612", "202701", "202702"]);
	});

	it("12ヶ月の範囲を正しく生成する", () => {
		const pc = makeCase({ startYearMonth: "202601", durationMonths: 12 });
		const result = generateMonthRange(pc, []);
		expect(result).toHaveLength(12);
		expect(result[0]).toBe("202601");
		expect(result[11]).toBe("202612");
	});

	it("startYearMonth未設定時はデータ範囲を返す", () => {
		const pc = makeCase();
		const loads = [makeLoad("202603"), makeLoad("202601"), makeLoad("202606")];
		const result = generateMonthRange(pc, loads);
		expect(result).toEqual([
			"202601",
			"202602",
			"202603",
			"202604",
			"202605",
			"202606",
		]);
	});

	it("データ1件の場合はその月のみ返す", () => {
		const pc = makeCase();
		const loads = [makeLoad("202605")];
		const result = generateMonthRange(pc, loads);
		expect(result).toEqual(["202605"]);
	});

	it("データ0件の場合は現在年の12ヶ月を返す", () => {
		const pc = makeCase();
		const result = generateMonthRange(pc, []);
		expect(result).toHaveLength(12);
		const year = new Date().getFullYear();
		expect(result[0]).toBe(`${year}01`);
		expect(result[11]).toBe(`${year}12`);
	});
});
