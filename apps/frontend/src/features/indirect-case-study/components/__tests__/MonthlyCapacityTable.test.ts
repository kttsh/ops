import { describe, expect, it } from "vitest";
import {
	buildFiscalYearMonths,
	pivotCapacities,
} from "../MonthlyCapacityTable";
import type { MonthlyCapacity } from "../../types";

describe("buildFiscalYearMonths", () => {
	it("4月始まり12ヶ月のYYYY-MM配列を返す", () => {
		const result = buildFiscalYearMonths(2025);
		expect(result).toHaveLength(12);
		expect(result[0]).toBe("2025-04");
		expect(result[8]).toBe("2025-12");
		expect(result[11]).toBe("2026-03");
	});

	it("月を0埋めする", () => {
		const result = buildFiscalYearMonths(2025);
		expect(result[0]).toBe("2025-04");
		expect(result[5]).toBe("2025-09");
	});
});

describe("pivotCapacities", () => {
	const capacities: MonthlyCapacity[] = [
		{
			monthlyCapacityId: 1,
			capacityScenarioId: 1,
			businessUnitCode: "BU1",
			yearMonth: "2025-04",
			capacity: 100,
			createdAt: "",
			updatedAt: "",
		},
		{
			monthlyCapacityId: 2,
			capacityScenarioId: 1,
			businessUnitCode: "BU1",
			yearMonth: "2025-05",
			capacity: 120,
			createdAt: "",
			updatedAt: "",
		},
		{
			monthlyCapacityId: 3,
			capacityScenarioId: 1,
			businessUnitCode: "BU2",
			yearMonth: "2025-04",
			capacity: 80,
			createdAt: "",
			updatedAt: "",
		},
	];

	it("BUごとに月別キャパシティをピボットする", () => {
		const months = buildFiscalYearMonths(2025);
		const result = pivotCapacities(capacities, months);

		expect(result).toHaveLength(2);
		expect(result[0].businessUnitCode).toBe("BU1");
		expect(result[0].values["2025-04"]).toBe(100);
		expect(result[0].values["2025-05"]).toBe(120);
		expect(result[0].values["2025-06"]).toBeUndefined();

		expect(result[1].businessUnitCode).toBe("BU2");
		expect(result[1].values["2025-04"]).toBe(80);
	});

	it("空配列の場合は空配列を返す", () => {
		const months = buildFiscalYearMonths(2025);
		const result = pivotCapacities([], months);
		expect(result).toHaveLength(0);
	});

	it("BUコード順にソートする", () => {
		const reversed: MonthlyCapacity[] = [
			{ ...capacities[2] },
			{ ...capacities[0] },
		];
		const months = buildFiscalYearMonths(2025);
		const result = pivotCapacities(reversed, months);
		expect(result[0].businessUnitCode).toBe("BU1");
		expect(result[1].businessUnitCode).toBe("BU2");
	});
});
