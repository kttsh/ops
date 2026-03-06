import { describe, expect, it } from "vitest";
import { bulkImportItemSchema, bulkImportSchema } from "@/types/importExport";

describe("bulkImportItemSchema", () => {
	const validItem = {
		projectCaseId: 1,
		yearMonth: "202601",
		manhour: 1000,
	};

	it("有効な入力を受け付ける", () => {
		const result = bulkImportItemSchema.safeParse(validItem);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toEqual(validItem);
		}
	});

	describe("projectCaseId のバリデーション", () => {
		it("正の整数を受け付ける", () => {
			const result = bulkImportItemSchema.safeParse({
				...validItem,
				projectCaseId: 999,
			});
			expect(result.success).toBe(true);
		});

		it("0 を拒否する", () => {
			const result = bulkImportItemSchema.safeParse({
				...validItem,
				projectCaseId: 0,
			});
			expect(result.success).toBe(false);
		});

		it("負の数を拒否する", () => {
			const result = bulkImportItemSchema.safeParse({
				...validItem,
				projectCaseId: -1,
			});
			expect(result.success).toBe(false);
		});

		it("小数を拒否する", () => {
			const result = bulkImportItemSchema.safeParse({
				...validItem,
				projectCaseId: 1.5,
			});
			expect(result.success).toBe(false);
		});

		it("未指定を拒否する", () => {
			const { projectCaseId: _, ...rest } = validItem;
			const result = bulkImportItemSchema.safeParse(rest);
			expect(result.success).toBe(false);
		});
	});

	describe("yearMonth のバリデーション", () => {
		it("YYYYMM 形式を受け付ける", () => {
			const result = bulkImportItemSchema.safeParse({
				...validItem,
				yearMonth: "202612",
			});
			expect(result.success).toBe(true);
		});

		it("YYYY-MM 形式を拒否する", () => {
			const result = bulkImportItemSchema.safeParse({
				...validItem,
				yearMonth: "2026-01",
			});
			expect(result.success).toBe(false);
		});

		it("5桁を拒否する", () => {
			const result = bulkImportItemSchema.safeParse({
				...validItem,
				yearMonth: "20261",
			});
			expect(result.success).toBe(false);
		});

		it("月13を拒否する", () => {
			const result = bulkImportItemSchema.safeParse({
				...validItem,
				yearMonth: "202613",
			});
			expect(result.success).toBe(false);
		});

		it("月00を拒否する", () => {
			const result = bulkImportItemSchema.safeParse({
				...validItem,
				yearMonth: "202600",
			});
			expect(result.success).toBe(false);
		});

		it("未指定を拒否する", () => {
			const { yearMonth: _, ...rest } = validItem;
			const result = bulkImportItemSchema.safeParse(rest);
			expect(result.success).toBe(false);
		});
	});

	describe("manhour のバリデーション", () => {
		it("0 を受け付ける", () => {
			const result = bulkImportItemSchema.safeParse({
				...validItem,
				manhour: 0,
			});
			expect(result.success).toBe(true);
		});

		it("99999999 を受け付ける", () => {
			const result = bulkImportItemSchema.safeParse({
				...validItem,
				manhour: 99999999,
			});
			expect(result.success).toBe(true);
		});

		it("負の数を拒否する", () => {
			const result = bulkImportItemSchema.safeParse({
				...validItem,
				manhour: -1,
			});
			expect(result.success).toBe(false);
		});

		it("100000000 を拒否する", () => {
			const result = bulkImportItemSchema.safeParse({
				...validItem,
				manhour: 100000000,
			});
			expect(result.success).toBe(false);
		});

		it("小数を拒否する", () => {
			const result = bulkImportItemSchema.safeParse({
				...validItem,
				manhour: 1.5,
			});
			expect(result.success).toBe(false);
		});

		it("未指定を拒否する", () => {
			const { manhour: _, ...rest } = validItem;
			const result = bulkImportItemSchema.safeParse(rest);
			expect(result.success).toBe(false);
		});
	});
});

describe("bulkImportSchema", () => {
	const validItem = {
		projectCaseId: 1,
		yearMonth: "202601",
		manhour: 1000,
	};

	it("有効な入力を受け付ける", () => {
		const result = bulkImportSchema.safeParse({
			items: [validItem],
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.items).toHaveLength(1);
			expect(result.data.items[0]).toEqual(validItem);
		}
	});

	it("複数アイテムを受け付ける", () => {
		const result = bulkImportSchema.safeParse({
			items: [
				validItem,
				{ projectCaseId: 2, yearMonth: "202602", manhour: 2000 },
			],
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

	it("配列内の無効なアイテムを拒否する", () => {
		const result = bulkImportSchema.safeParse({
			items: [{ projectCaseId: -1, yearMonth: "invalid", manhour: -1 }],
		});
		expect(result.success).toBe(false);
	});
});
