import { describe, expect, it } from "vitest";
import {
	bulkUpsertChartColorSettingSchema,
	chartColorSettingListQuerySchema,
	createChartColorSettingSchema,
	updateChartColorSettingSchema,
} from "@/types/chartColorSetting";

describe("createChartColorSettingSchema", () => {
	it("有効な入力を受け付ける", () => {
		const result = createChartColorSettingSchema.safeParse({
			targetType: "project",
			targetId: 1,
			colorCode: "#FF5733",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toEqual({
				targetType: "project",
				targetId: 1,
				colorCode: "#FF5733",
			});
		}
	});

	it("indirect_work タイプを受け付ける", () => {
		const result = createChartColorSettingSchema.safeParse({
			targetType: "indirect_work",
			targetId: 10,
			colorCode: "#00FF00",
		});
		expect(result.success).toBe(true);
	});

	describe("targetType のバリデーション", () => {
		it("project を受け付ける", () => {
			const result = createChartColorSettingSchema.safeParse({
				targetType: "project",
				targetId: 1,
				colorCode: "#FF5733",
			});
			expect(result.success).toBe(true);
		});

		it("indirect_work を受け付ける", () => {
			const result = createChartColorSettingSchema.safeParse({
				targetType: "indirect_work",
				targetId: 1,
				colorCode: "#FF5733",
			});
			expect(result.success).toBe(true);
		});

		it("不正な値を拒否する", () => {
			const result = createChartColorSettingSchema.safeParse({
				targetType: "unknown",
				targetId: 1,
				colorCode: "#FF5733",
			});
			expect(result.success).toBe(false);
		});

		it("未指定を拒否する", () => {
			const result = createChartColorSettingSchema.safeParse({
				targetId: 1,
				colorCode: "#FF5733",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("targetId のバリデーション", () => {
		it("正の整数を受け付ける", () => {
			const result = createChartColorSettingSchema.safeParse({
				targetType: "project",
				targetId: 100,
				colorCode: "#FF5733",
			});
			expect(result.success).toBe(true);
		});

		it("0 を拒否する", () => {
			const result = createChartColorSettingSchema.safeParse({
				targetType: "project",
				targetId: 0,
				colorCode: "#FF5733",
			});
			expect(result.success).toBe(false);
		});

		it("負の数を拒否する", () => {
			const result = createChartColorSettingSchema.safeParse({
				targetType: "project",
				targetId: -1,
				colorCode: "#FF5733",
			});
			expect(result.success).toBe(false);
		});

		it("小数を拒否する", () => {
			const result = createChartColorSettingSchema.safeParse({
				targetType: "project",
				targetId: 1.5,
				colorCode: "#FF5733",
			});
			expect(result.success).toBe(false);
		});

		it("未指定を拒否する", () => {
			const result = createChartColorSettingSchema.safeParse({
				targetType: "project",
				colorCode: "#FF5733",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("colorCode のバリデーション", () => {
		it("#FF5733 を受け付ける", () => {
			const result = createChartColorSettingSchema.safeParse({
				targetType: "project",
				targetId: 1,
				colorCode: "#FF5733",
			});
			expect(result.success).toBe(true);
		});

		it("#000000 を受け付ける", () => {
			const result = createChartColorSettingSchema.safeParse({
				targetType: "project",
				targetId: 1,
				colorCode: "#000000",
			});
			expect(result.success).toBe(true);
		});

		it("小文字の16進数を受け付ける", () => {
			const result = createChartColorSettingSchema.safeParse({
				targetType: "project",
				targetId: 1,
				colorCode: "#ff5733",
			});
			expect(result.success).toBe(true);
		});

		it("# なしを拒否する", () => {
			const result = createChartColorSettingSchema.safeParse({
				targetType: "project",
				targetId: 1,
				colorCode: "FF5733",
			});
			expect(result.success).toBe(false);
		});

		it("不正な16進数文字を拒否する", () => {
			const result = createChartColorSettingSchema.safeParse({
				targetType: "project",
				targetId: 1,
				colorCode: "#GG0000",
			});
			expect(result.success).toBe(false);
		});

		it("3桁の短縮形式を拒否する", () => {
			const result = createChartColorSettingSchema.safeParse({
				targetType: "project",
				targetId: 1,
				colorCode: "#fff",
			});
			expect(result.success).toBe(false);
		});

		it("未指定を拒否する", () => {
			const result = createChartColorSettingSchema.safeParse({
				targetType: "project",
				targetId: 1,
			});
			expect(result.success).toBe(false);
		});
	});
});

describe("updateChartColorSettingSchema", () => {
	it("全フィールド指定を受け付ける", () => {
		const result = updateChartColorSettingSchema.safeParse({
			targetType: "indirect_work",
			targetId: 5,
			colorCode: "#00FF00",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toEqual({
				targetType: "indirect_work",
				targetId: 5,
				colorCode: "#00FF00",
			});
		}
	});

	it("全フィールドオプショナルであること（空オブジェクト）", () => {
		const result = updateChartColorSettingSchema.safeParse({});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.targetType).toBeUndefined();
			expect(result.data.targetId).toBeUndefined();
			expect(result.data.colorCode).toBeUndefined();
		}
	});

	it("colorCode のみ指定を受け付ける", () => {
		const result = updateChartColorSettingSchema.safeParse({
			colorCode: "#AABBCC",
		});
		expect(result.success).toBe(true);
	});

	it("targetType のみ指定を受け付ける", () => {
		const result = updateChartColorSettingSchema.safeParse({
			targetType: "project",
		});
		expect(result.success).toBe(true);
	});

	it("不正な colorCode を拒否する", () => {
		const result = updateChartColorSettingSchema.safeParse({
			colorCode: "invalid",
		});
		expect(result.success).toBe(false);
	});

	it("不正な targetType を拒否する", () => {
		const result = updateChartColorSettingSchema.safeParse({
			targetType: "bad_type",
		});
		expect(result.success).toBe(false);
	});
});

describe("bulkUpsertChartColorSettingSchema", () => {
	it("有効な配列を受け付ける", () => {
		const result = bulkUpsertChartColorSettingSchema.safeParse({
			items: [
				{ targetType: "project", targetId: 1, colorCode: "#FF5733" },
				{ targetType: "indirect_work", targetId: 2, colorCode: "#33FF57" },
			],
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.items).toHaveLength(2);
		}
	});

	it("空配列を拒否する", () => {
		const result = bulkUpsertChartColorSettingSchema.safeParse({
			items: [],
		});
		expect(result.success).toBe(false);
	});

	it("不正な要素を拒否する", () => {
		const result = bulkUpsertChartColorSettingSchema.safeParse({
			items: [{ targetType: "project", targetId: 1, colorCode: "INVALID" }],
		});
		expect(result.success).toBe(false);
	});

	it("必須フィールド欠落を拒否する", () => {
		const result = bulkUpsertChartColorSettingSchema.safeParse({
			items: [{ targetType: "project", targetId: 1 }],
		});
		expect(result.success).toBe(false);
	});

	it("items 未指定を拒否する", () => {
		const result = bulkUpsertChartColorSettingSchema.safeParse({});
		expect(result.success).toBe(false);
	});
});

describe("chartColorSettingListQuerySchema", () => {
	it("デフォルト値を適用する", () => {
		const result = chartColorSettingListQuerySchema.safeParse({});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data["page[number]"]).toBe(1);
			expect(result.data["page[size]"]).toBe(20);
			expect(result.data["filter[targetType]"]).toBeUndefined();
		}
	});

	it("filter[targetType] を受け付ける", () => {
		const result = chartColorSettingListQuerySchema.safeParse({
			"filter[targetType]": "project",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data["filter[targetType]"]).toBe("project");
		}
	});

	it("不正な filter[targetType] を拒否する", () => {
		const result = chartColorSettingListQuerySchema.safeParse({
			"filter[targetType]": "invalid_type",
		});
		expect(result.success).toBe(false);
	});

	it("ページパラメータを文字列から数値に変換する", () => {
		const result = chartColorSettingListQuerySchema.safeParse({
			"page[number]": "2",
			"page[size]": "10",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data["page[number]"]).toBe(2);
			expect(result.data["page[size]"]).toBe(10);
		}
	});
});
