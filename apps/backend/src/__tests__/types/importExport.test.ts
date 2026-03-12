import { describe, expect, it } from "vitest";
import { bulkImportRowSchema, bulkImportSchema } from "@/types/importExport";

describe("bulkImportRowSchema", () => {
	const validRow = {
		projectCode: null,
		businessUnitCode: "BU-001",
		fiscalYear: 2026,
		projectTypeCode: "PT-001",
		name: "テスト案件",
		nickname: "テスト",
		customerName: "テスト客先",
		orderNumber: "ORD-001",
		startYearMonth: "202601",
		totalManhour: 100,
		durationMonths: 12,
		calculationBasis: "見積もり根拠",
		remarks: "備考",
		region: "東北",
		deleteFlag: false,
		projectCaseId: null,
		caseName: "標準ケース",
		loads: [{ yearMonth: "202601", manhour: 50 }],
	};

	it("有効な入力を受け付ける（全フィールド指定）", () => {
		const result = bulkImportRowSchema.safeParse(validRow);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.businessUnitCode).toBe("BU-001");
			expect(result.data.name).toBe("テスト案件");
			expect(result.data.loads).toHaveLength(1);
		}
	});

	it("projectCode が null を許容する（新規案件）", () => {
		const result = bulkImportRowSchema.safeParse({
			...validRow,
			projectCode: null,
		});
		expect(result.success).toBe(true);
	});

	it("projectCode が string を受け付ける（既存案件）", () => {
		const result = bulkImportRowSchema.safeParse({
			...validRow,
			projectCode: "PRJ-001",
		});
		expect(result.success).toBe(true);
	});

	describe("businessUnitCode のバリデーション", () => {
		it("空文字を拒否する", () => {
			const result = bulkImportRowSchema.safeParse({
				...validRow,
				businessUnitCode: "",
			});
			expect(result.success).toBe(false);
		});

		it("未指定を拒否する", () => {
			const { businessUnitCode: _, ...rest } = validRow;
			const result = bulkImportRowSchema.safeParse(rest);
			expect(result.success).toBe(false);
		});
	});

	describe("NULL 許容フィールド", () => {
		it("fiscalYear に null を許容する", () => {
			const result = bulkImportRowSchema.safeParse({
				...validRow,
				fiscalYear: null,
			});
			expect(result.success).toBe(true);
		});

		it("projectTypeCode に null を許容する", () => {
			const result = bulkImportRowSchema.safeParse({
				...validRow,
				projectTypeCode: null,
			});
			expect(result.success).toBe(true);
		});

		it("nickname に null を許容する", () => {
			const result = bulkImportRowSchema.safeParse({
				...validRow,
				nickname: null,
			});
			expect(result.success).toBe(true);
		});

		it("customerName に null を許容する", () => {
			const result = bulkImportRowSchema.safeParse({
				...validRow,
				customerName: null,
			});
			expect(result.success).toBe(true);
		});

		it("orderNumber に null を許容する", () => {
			const result = bulkImportRowSchema.safeParse({
				...validRow,
				orderNumber: null,
			});
			expect(result.success).toBe(true);
		});

		it("durationMonths に null を許容する", () => {
			const result = bulkImportRowSchema.safeParse({
				...validRow,
				durationMonths: null,
			});
			expect(result.success).toBe(true);
		});

		it("calculationBasis に null を許容する", () => {
			const result = bulkImportRowSchema.safeParse({
				...validRow,
				calculationBasis: null,
			});
			expect(result.success).toBe(true);
		});

		it("remarks に null を許容する", () => {
			const result = bulkImportRowSchema.safeParse({
				...validRow,
				remarks: null,
			});
			expect(result.success).toBe(true);
		});

		it("region に null を許容する", () => {
			const result = bulkImportRowSchema.safeParse({
				...validRow,
				region: null,
			});
			expect(result.success).toBe(true);
		});

		it("projectCaseId に null を許容する（新規ケース）", () => {
			const result = bulkImportRowSchema.safeParse({
				...validRow,
				projectCaseId: null,
			});
			expect(result.success).toBe(true);
		});

		it("projectCaseId に正の整数を受け付ける（既存ケース）", () => {
			const result = bulkImportRowSchema.safeParse({
				...validRow,
				projectCaseId: 10,
			});
			expect(result.success).toBe(true);
		});
	});

	describe("startYearMonth のバリデーション", () => {
		it("YYYYMM 形式を受け付ける", () => {
			const result = bulkImportRowSchema.safeParse({
				...validRow,
				startYearMonth: "202612",
			});
			expect(result.success).toBe(true);
		});

		it("不正形式を拒否する", () => {
			const result = bulkImportRowSchema.safeParse({
				...validRow,
				startYearMonth: "2026-01",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("totalManhour のバリデーション", () => {
		it("0 を受け付ける", () => {
			const result = bulkImportRowSchema.safeParse({
				...validRow,
				totalManhour: 0,
			});
			expect(result.success).toBe(true);
		});

		it("99999999 を受け付ける", () => {
			const result = bulkImportRowSchema.safeParse({
				...validRow,
				totalManhour: 99999999,
			});
			expect(result.success).toBe(true);
		});

		it("負の数を拒否する", () => {
			const result = bulkImportRowSchema.safeParse({
				...validRow,
				totalManhour: -1,
			});
			expect(result.success).toBe(false);
		});

		it("100000000 を拒否する", () => {
			const result = bulkImportRowSchema.safeParse({
				...validRow,
				totalManhour: 100000000,
			});
			expect(result.success).toBe(false);
		});
	});

	describe("deleteFlag のバリデーション", () => {
		it("true を受け付ける", () => {
			const result = bulkImportRowSchema.safeParse({
				...validRow,
				deleteFlag: true,
			});
			expect(result.success).toBe(true);
		});

		it("false を受け付ける", () => {
			const result = bulkImportRowSchema.safeParse({
				...validRow,
				deleteFlag: false,
			});
			expect(result.success).toBe(true);
		});
	});

	describe("caseName のバリデーション", () => {
		it("空文字を拒否する", () => {
			const result = bulkImportRowSchema.safeParse({
				...validRow,
				caseName: "",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("loads のバリデーション", () => {
		it("空配列を受け付ける", () => {
			const result = bulkImportRowSchema.safeParse({
				...validRow,
				loads: [],
			});
			expect(result.success).toBe(true);
		});

		it("複数の月次データを受け付ける", () => {
			const result = bulkImportRowSchema.safeParse({
				...validRow,
				loads: [
					{ yearMonth: "202601", manhour: 50 },
					{ yearMonth: "202602", manhour: 100 },
				],
			});
			expect(result.success).toBe(true);
		});

		it("月次データの manhour が範囲外を拒否する", () => {
			const result = bulkImportRowSchema.safeParse({
				...validRow,
				loads: [{ yearMonth: "202601", manhour: 100000000 }],
			});
			expect(result.success).toBe(false);
		});

		it("月次データの yearMonth が不正形式を拒否する", () => {
			const result = bulkImportRowSchema.safeParse({
				...validRow,
				loads: [{ yearMonth: "2026-01", manhour: 50 }],
			});
			expect(result.success).toBe(false);
		});
	});
});

describe("bulkImportSchema", () => {
	const validRow = {
		projectCode: "PRJ-001",
		businessUnitCode: "BU-001",
		fiscalYear: null,
		projectTypeCode: null,
		name: "テスト案件",
		nickname: null,
		customerName: null,
		orderNumber: null,
		startYearMonth: "202601",
		totalManhour: 100,
		durationMonths: null,
		calculationBasis: null,
		remarks: null,
		region: null,
		deleteFlag: false,
		projectCaseId: 1,
		caseName: "標準ケース",
		loads: [{ yearMonth: "202601", manhour: 50 }],
	};

	it("有効な入力を受け付ける", () => {
		const result = bulkImportSchema.safeParse({
			items: [validRow],
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.items).toHaveLength(1);
		}
	});

	it("複数アイテムを受け付ける", () => {
		const result = bulkImportSchema.safeParse({
			items: [validRow, { ...validRow, projectCode: "PRJ-002", name: "案件2" }],
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.items).toHaveLength(2);
		}
	});

	it("空配列を拒否する", () => {
		const result = bulkImportSchema.safeParse({ items: [] });
		expect(result.success).toBe(false);
	});

	it("items 未指定を拒否する", () => {
		const result = bulkImportSchema.safeParse({});
		expect(result.success).toBe(false);
	});
});
