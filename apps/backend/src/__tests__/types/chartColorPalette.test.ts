import { describe, expect, it } from "vitest";
import {
	createChartColorPaletteSchema,
	updateChartColorPaletteSchema,
} from "@/types/chartColorPalette";

describe("createChartColorPaletteSchema", () => {
	it("有効な入力を受け付ける", () => {
		const result = createChartColorPaletteSchema.safeParse({
			name: "レッド",
			colorCode: "#FF5733",
			displayOrder: 1,
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toEqual({
				name: "レッド",
				colorCode: "#FF5733",
				displayOrder: 1,
			});
		}
	});

	it("displayOrder 省略時にデフォルト値 0 を設定する", () => {
		const result = createChartColorPaletteSchema.safeParse({
			name: "ブルー",
			colorCode: "#0000FF",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.displayOrder).toBe(0);
		}
	});

	describe("name のバリデーション", () => {
		it("空文字を拒否する", () => {
			const result = createChartColorPaletteSchema.safeParse({
				name: "",
				colorCode: "#FF5733",
			});
			expect(result.success).toBe(false);
		});

		it("1文字を受け付ける", () => {
			const result = createChartColorPaletteSchema.safeParse({
				name: "A",
				colorCode: "#FF5733",
			});
			expect(result.success).toBe(true);
		});

		it("100文字を受け付ける", () => {
			const result = createChartColorPaletteSchema.safeParse({
				name: "あ".repeat(100),
				colorCode: "#FF5733",
			});
			expect(result.success).toBe(true);
		});

		it("101文字以上を拒否する", () => {
			const result = createChartColorPaletteSchema.safeParse({
				name: "あ".repeat(101),
				colorCode: "#FF5733",
			});
			expect(result.success).toBe(false);
		});

		it("未指定を拒否する", () => {
			const result = createChartColorPaletteSchema.safeParse({
				colorCode: "#FF5733",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("colorCode のバリデーション", () => {
		it("#FF5733 を受け付ける", () => {
			const result = createChartColorPaletteSchema.safeParse({
				name: "テスト",
				colorCode: "#FF5733",
			});
			expect(result.success).toBe(true);
		});

		it("#000000 を受け付ける", () => {
			const result = createChartColorPaletteSchema.safeParse({
				name: "テスト",
				colorCode: "#000000",
			});
			expect(result.success).toBe(true);
		});

		it("小文字の16進数を受け付ける", () => {
			const result = createChartColorPaletteSchema.safeParse({
				name: "テスト",
				colorCode: "#ff5733",
			});
			expect(result.success).toBe(true);
		});

		it("# なしを拒否する", () => {
			const result = createChartColorPaletteSchema.safeParse({
				name: "テスト",
				colorCode: "FF5733",
			});
			expect(result.success).toBe(false);
		});

		it("不正な16進数文字を拒否する", () => {
			const result = createChartColorPaletteSchema.safeParse({
				name: "テスト",
				colorCode: "#GG0000",
			});
			expect(result.success).toBe(false);
		});

		it("3桁の短縮形式を拒否する", () => {
			const result = createChartColorPaletteSchema.safeParse({
				name: "テスト",
				colorCode: "#fff",
			});
			expect(result.success).toBe(false);
		});

		it("未指定を拒否する", () => {
			const result = createChartColorPaletteSchema.safeParse({
				name: "テスト",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("displayOrder のバリデーション", () => {
		it("0 を受け付ける", () => {
			const result = createChartColorPaletteSchema.safeParse({
				name: "テスト",
				colorCode: "#FF5733",
				displayOrder: 0,
			});
			expect(result.success).toBe(true);
		});

		it("小数を拒否する", () => {
			const result = createChartColorPaletteSchema.safeParse({
				name: "テスト",
				colorCode: "#FF5733",
				displayOrder: 1.5,
			});
			expect(result.success).toBe(false);
		});
	});
});

describe("updateChartColorPaletteSchema", () => {
	it("有効な入力を受け付ける", () => {
		const result = updateChartColorPaletteSchema.safeParse({
			name: "更新後の名前",
			colorCode: "#00FF00",
			displayOrder: 5,
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toEqual({
				name: "更新後の名前",
				colorCode: "#00FF00",
				displayOrder: 5,
			});
		}
	});

	it("displayOrder を省略できる", () => {
		const result = updateChartColorPaletteSchema.safeParse({
			name: "更新後の名前",
			colorCode: "#00FF00",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.displayOrder).toBeUndefined();
		}
	});

	it("name が必須である", () => {
		const result = updateChartColorPaletteSchema.safeParse({
			colorCode: "#00FF00",
		});
		expect(result.success).toBe(false);
	});

	it("colorCode が必須である", () => {
		const result = updateChartColorPaletteSchema.safeParse({
			name: "テスト",
		});
		expect(result.success).toBe(false);
	});

	it("name の空文字を拒否する", () => {
		const result = updateChartColorPaletteSchema.safeParse({
			name: "",
			colorCode: "#00FF00",
		});
		expect(result.success).toBe(false);
	});

	it("name の101文字以上を拒否する", () => {
		const result = updateChartColorPaletteSchema.safeParse({
			name: "あ".repeat(101),
			colorCode: "#00FF00",
		});
		expect(result.success).toBe(false);
	});

	it("colorCode の不正値を拒否する", () => {
		const result = updateChartColorPaletteSchema.safeParse({
			name: "テスト",
			colorCode: "invalid",
		});
		expect(result.success).toBe(false);
	});
});
