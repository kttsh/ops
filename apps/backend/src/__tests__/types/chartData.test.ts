import { describe, expect, it } from "vitest";
import { chartDataQuerySchema } from "@/types/chartData";

describe("chartDataQuerySchema", () => {
	const validParams = {
		businessUnitCodes: "BU001,BU002",
		startYearMonth: "202504",
		endYearMonth: "202603",
	};

	it("全必須パラメータ指定時にパース成功する", () => {
		const result = chartDataQuerySchema.safeParse(validParams);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.businessUnitCodes).toEqual(["BU001", "BU002"]);
			expect(result.data.startYearMonth).toBe("202504");
			expect(result.data.endYearMonth).toBe("202603");
		}
	});

	it("オプショナルパラメータを含めてパース成功する", () => {
		const result = chartDataQuerySchema.safeParse({
			...validParams,
			chartViewId: "1",
			capacityScenarioIds: "1,2,3",
			indirectWorkCaseIds: "10,20",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.chartViewId).toBe(1);
			expect(result.data.capacityScenarioIds).toEqual([1, 2, 3]);
			expect(result.data.indirectWorkCaseIds).toEqual([10, 20]);
		}
	});

	describe("businessUnitCodes のバリデーション", () => {
		it("未指定を拒否する", () => {
			const { businessUnitCodes, ...rest } = validParams;
			const result = chartDataQuerySchema.safeParse(rest);
			expect(result.success).toBe(false);
		});

		it("空文字を拒否する", () => {
			const result = chartDataQuerySchema.safeParse({
				...validParams,
				businessUnitCodes: "",
			});
			expect(result.success).toBe(false);
		});

		it("21文字のコードを拒否する", () => {
			const result = chartDataQuerySchema.safeParse({
				...validParams,
				businessUnitCodes: "a".repeat(21),
			});
			expect(result.success).toBe(false);
		});

		it("20文字のコードを受け付ける", () => {
			const result = chartDataQuerySchema.safeParse({
				...validParams,
				businessUnitCodes: "a".repeat(20),
			});
			expect(result.success).toBe(true);
		});

		it("1文字のコードを受け付ける", () => {
			const result = chartDataQuerySchema.safeParse({
				...validParams,
				businessUnitCodes: "A",
			});
			expect(result.success).toBe(true);
		});

		it("CSV → 配列変換でスペースをトリムする", () => {
			const result = chartDataQuerySchema.safeParse({
				...validParams,
				businessUnitCodes: " BU001 , BU002 ",
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.businessUnitCodes).toEqual(["BU001", "BU002"]);
			}
		});
	});

	describe("startYearMonth / endYearMonth のバリデーション", () => {
		it("YYYYMM形式でない場合を拒否する（5桁）", () => {
			const result = chartDataQuerySchema.safeParse({
				...validParams,
				startYearMonth: "20250",
			});
			expect(result.success).toBe(false);
		});

		it("YYYYMM形式でない場合を拒否する（7桁）", () => {
			const result = chartDataQuerySchema.safeParse({
				...validParams,
				startYearMonth: "2025040",
			});
			expect(result.success).toBe(false);
		});

		it("月が00の場合を拒否する", () => {
			const result = chartDataQuerySchema.safeParse({
				...validParams,
				startYearMonth: "202500",
			});
			expect(result.success).toBe(false);
		});

		it("月が13の場合を拒否する", () => {
			const result = chartDataQuerySchema.safeParse({
				...validParams,
				endYearMonth: "202513",
			});
			expect(result.success).toBe(false);
		});

		it("月が12の場合を受け付ける", () => {
			const result = chartDataQuerySchema.safeParse({
				...validParams,
				startYearMonth: "202512",
				endYearMonth: "202512",
			});
			expect(result.success).toBe(true);
		});

		it("月が01の場合を受け付ける", () => {
			const result = chartDataQuerySchema.safeParse({
				...validParams,
				startYearMonth: "202501",
				endYearMonth: "202501",
			});
			expect(result.success).toBe(true);
		});
	});

	describe("期間バリデーション", () => {
		it("startYearMonth > endYearMonth の場合を拒否する", () => {
			const result = chartDataQuerySchema.safeParse({
				...validParams,
				startYearMonth: "202604",
				endYearMonth: "202603",
			});
			expect(result.success).toBe(false);
		});

		it("startYearMonth == endYearMonth の場合を受け付ける", () => {
			const result = chartDataQuerySchema.safeParse({
				...validParams,
				startYearMonth: "202504",
				endYearMonth: "202504",
			});
			expect(result.success).toBe(true);
		});

		it("期間が60ヶ月を超える場合を拒否する", () => {
			const result = chartDataQuerySchema.safeParse({
				...validParams,
				startYearMonth: "202001",
				endYearMonth: "202501",
			});
			expect(result.success).toBe(false);
		});

		it("期間がちょうど60ヶ月の場合を受け付ける", () => {
			const result = chartDataQuerySchema.safeParse({
				...validParams,
				startYearMonth: "202001",
				endYearMonth: "202412",
			});
			expect(result.success).toBe(true);
		});
	});

	describe("CSV → 数値配列変換", () => {
		it("capacityScenarioIds を数値配列に変換する", () => {
			const result = chartDataQuerySchema.safeParse({
				...validParams,
				capacityScenarioIds: "1,2,3",
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.capacityScenarioIds).toEqual([1, 2, 3]);
			}
		});

		it("indirectWorkCaseIds を数値配列に変換する", () => {
			const result = chartDataQuerySchema.safeParse({
				...validParams,
				indirectWorkCaseIds: "10,20,30",
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.indirectWorkCaseIds).toEqual([10, 20, 30]);
			}
		});

		it("単一値の場合も配列に変換する", () => {
			const result = chartDataQuerySchema.safeParse({
				...validParams,
				capacityScenarioIds: "5",
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.capacityScenarioIds).toEqual([5]);
			}
		});
	});

	describe("projectCaseIds のバリデーション", () => {
		it("CSV形式の数値配列を受け付ける", () => {
			const result = chartDataQuerySchema.safeParse({
				...validParams,
				projectCaseIds: "101,102,105",
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.projectCaseIds).toEqual([101, 102, 105]);
			}
		});

		it("単一値を受け付ける", () => {
			const result = chartDataQuerySchema.safeParse({
				...validParams,
				projectCaseIds: "101",
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.projectCaseIds).toEqual([101]);
			}
		});

		it("未指定を許容する", () => {
			const result = chartDataQuerySchema.safeParse(validParams);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.projectCaseIds).toBeUndefined();
			}
		});
	});

	describe("chartViewId のバリデーション", () => {
		it("正の整数を受け付ける", () => {
			const result = chartDataQuerySchema.safeParse({
				...validParams,
				chartViewId: "1",
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.chartViewId).toBe(1);
			}
		});

		it("0を拒否する", () => {
			const result = chartDataQuerySchema.safeParse({
				...validParams,
				chartViewId: "0",
			});
			expect(result.success).toBe(false);
		});

		it("負の数を拒否する", () => {
			const result = chartDataQuerySchema.safeParse({
				...validParams,
				chartViewId: "-1",
			});
			expect(result.success).toBe(false);
		});

		it("未指定を許容する", () => {
			const result = chartDataQuerySchema.safeParse(validParams);
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.chartViewId).toBeUndefined();
			}
		});
	});
});
