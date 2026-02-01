import { describe, expect, it } from "vitest";
import {
	calculateCapacitySchema,
	createCapacityScenarioSchema,
	updateCapacityScenarioSchema,
} from "@/types/capacityScenario";

describe("createCapacityScenarioSchema - hoursPerPerson", () => {
	const validData = {
		scenarioName: "テストシナリオ",
	};

	it("hoursPerPerson 省略時にデフォルト値 160.00 が適用される", () => {
		const result = createCapacityScenarioSchema.safeParse(validData);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.hoursPerPerson).toBe(160.0);
		}
	});

	it("hoursPerPerson を指定できる", () => {
		const result = createCapacityScenarioSchema.safeParse({
			...validData,
			hoursPerPerson: 128,
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.hoursPerPerson).toBe(128);
		}
	});

	it("hoursPerPerson = 0.01（最小境界値）を受け付ける", () => {
		const result = createCapacityScenarioSchema.safeParse({
			...validData,
			hoursPerPerson: 0.01,
		});
		expect(result.success).toBe(true);
	});

	it("hoursPerPerson = 744（最大境界値）を受け付ける", () => {
		const result = createCapacityScenarioSchema.safeParse({
			...validData,
			hoursPerPerson: 744,
		});
		expect(result.success).toBe(true);
	});

	it("hoursPerPerson = 0 を拒否する", () => {
		const result = createCapacityScenarioSchema.safeParse({
			...validData,
			hoursPerPerson: 0,
		});
		expect(result.success).toBe(false);
	});

	it("hoursPerPerson = -1 を拒否する", () => {
		const result = createCapacityScenarioSchema.safeParse({
			...validData,
			hoursPerPerson: -1,
		});
		expect(result.success).toBe(false);
	});

	it("hoursPerPerson = 744.01 を拒否する", () => {
		const result = createCapacityScenarioSchema.safeParse({
			...validData,
			hoursPerPerson: 744.01,
		});
		expect(result.success).toBe(false);
	});
});

describe("updateCapacityScenarioSchema - hoursPerPerson", () => {
	it("hoursPerPerson を省略できる", () => {
		const result = updateCapacityScenarioSchema.safeParse({
			scenarioName: "テスト",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.hoursPerPerson).toBeUndefined();
		}
	});

	it("hoursPerPerson を指定できる", () => {
		const result = updateCapacityScenarioSchema.safeParse({
			hoursPerPerson: 180,
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.hoursPerPerson).toBe(180);
		}
	});

	it("hoursPerPerson = 0 を拒否する", () => {
		const result = updateCapacityScenarioSchema.safeParse({
			hoursPerPerson: 0,
		});
		expect(result.success).toBe(false);
	});

	it("hoursPerPerson = 744.01 を拒否する", () => {
		const result = updateCapacityScenarioSchema.safeParse({
			hoursPerPerson: 744.01,
		});
		expect(result.success).toBe(false);
	});
});

describe("calculateCapacitySchema", () => {
	it("必須フィールドのみで有効", () => {
		const result = calculateCapacitySchema.safeParse({
			headcountPlanCaseId: 1,
		});
		expect(result.success).toBe(true);
	});

	it("全フィールド指定で有効", () => {
		const result = calculateCapacitySchema.safeParse({
			headcountPlanCaseId: 1,
			businessUnitCodes: ["PLANT", "TRANS"],
			yearMonthFrom: "202601",
			yearMonthTo: "202612",
		});
		expect(result.success).toBe(true);
	});

	it("headcountPlanCaseId 未指定を拒否する", () => {
		const result = calculateCapacitySchema.safeParse({});
		expect(result.success).toBe(false);
	});

	it("headcountPlanCaseId = 0 を拒否する", () => {
		const result = calculateCapacitySchema.safeParse({
			headcountPlanCaseId: 0,
		});
		expect(result.success).toBe(false);
	});

	it("headcountPlanCaseId が小数の場合を拒否する", () => {
		const result = calculateCapacitySchema.safeParse({
			headcountPlanCaseId: 1.5,
		});
		expect(result.success).toBe(false);
	});

	it("headcountPlanCaseId が負の数の場合を拒否する", () => {
		const result = calculateCapacitySchema.safeParse({
			headcountPlanCaseId: -1,
		});
		expect(result.success).toBe(false);
	});

	it("businessUnitCodes が空配列を受け付ける", () => {
		const result = calculateCapacitySchema.safeParse({
			headcountPlanCaseId: 1,
			businessUnitCodes: [],
		});
		expect(result.success).toBe(true);
	});

	it("businessUnitCodes 内の空文字を拒否する", () => {
		const result = calculateCapacitySchema.safeParse({
			headcountPlanCaseId: 1,
			businessUnitCodes: [""],
		});
		expect(result.success).toBe(false);
	});

	it("businessUnitCodes 内の21文字以上を拒否する", () => {
		const result = calculateCapacitySchema.safeParse({
			headcountPlanCaseId: 1,
			businessUnitCodes: ["a".repeat(21)],
		});
		expect(result.success).toBe(false);
	});

	it("yearMonthFrom が不正形式（5桁）を拒否する", () => {
		const result = calculateCapacitySchema.safeParse({
			headcountPlanCaseId: 1,
			yearMonthFrom: "20261",
		});
		expect(result.success).toBe(false);
	});

	it("yearMonthFrom が不正形式（英字含む）を拒否する", () => {
		const result = calculateCapacitySchema.safeParse({
			headcountPlanCaseId: 1,
			yearMonthFrom: "2026ab",
		});
		expect(result.success).toBe(false);
	});

	it("yearMonthFrom の月が 13 の場合を拒否する", () => {
		const result = calculateCapacitySchema.safeParse({
			headcountPlanCaseId: 1,
			yearMonthFrom: "202613",
		});
		expect(result.success).toBe(false);
	});

	it("yearMonthFrom の月が 00 の場合を拒否する", () => {
		const result = calculateCapacitySchema.safeParse({
			headcountPlanCaseId: 1,
			yearMonthFrom: "202600",
		});
		expect(result.success).toBe(false);
	});

	it("yearMonthTo が有効な YYYYMM 形式を受け付ける", () => {
		const result = calculateCapacitySchema.safeParse({
			headcountPlanCaseId: 1,
			yearMonthTo: "202612",
		});
		expect(result.success).toBe(true);
	});
});
