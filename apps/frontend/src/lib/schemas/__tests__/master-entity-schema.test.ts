import { describe, expect, it } from "vitest";
import {
	codeSchema,
	colorCodeSchema,
	displayOrderSchema,
	nameSchema,
} from "../master-entity-schema";

describe("codeSchema", () => {
	it("英数字のコードを受け入れる", () => {
		expect(codeSchema.safeParse("ABC123").success).toBe(true);
		expect(codeSchema.safeParse("a").success).toBe(true);
	});

	it("ハイフンとアンダースコアを受け入れる", () => {
		expect(codeSchema.safeParse("work-type_01").success).toBe(true);
		expect(codeSchema.safeParse("A_B-C").success).toBe(true);
	});

	it("空文字を拒否し日本語エラーメッセージを返す", () => {
		const result = codeSchema.safeParse("");
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].message).toBe("コードは必須です");
		}
	});

	it("21文字以上を拒否し日本語エラーメッセージを返す", () => {
		const result = codeSchema.safeParse("a".repeat(21));
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].message).toBe(
				"コードは20文字以内で入力してください",
			);
		}
	});

	it("20文字ちょうどを受け入れる", () => {
		expect(codeSchema.safeParse("a".repeat(20)).success).toBe(true);
	});

	it("日本語や特殊文字を拒否する", () => {
		const result = codeSchema.safeParse("テスト");
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].message).toBe(
				"英数字・ハイフン・アンダースコアのみ使用できます",
			);
		}
	});

	it("スペースを含む文字列を拒否する", () => {
		const result = codeSchema.safeParse("AB CD");
		expect(result.success).toBe(false);
	});
});

describe("nameSchema", () => {
	it("通常の名称を受け入れる", () => {
		expect(nameSchema.safeParse("テスト").success).toBe(true);
		expect(nameSchema.safeParse("開発チーム A").success).toBe(true);
	});

	it("空文字を拒否し日本語エラーメッセージを返す", () => {
		const result = nameSchema.safeParse("");
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].message).toBe("名称は必須です");
		}
	});

	it("101文字以上を拒否し日本語エラーメッセージを返す", () => {
		const result = nameSchema.safeParse("あ".repeat(101));
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].message).toBe(
				"名称は100文字以内で入力してください",
			);
		}
	});

	it("100文字ちょうどを受け入れる", () => {
		expect(nameSchema.safeParse("あ".repeat(100)).success).toBe(true);
	});
});

describe("displayOrderSchema", () => {
	it("0以上の整数を受け入れる", () => {
		expect(displayOrderSchema.safeParse(0).success).toBe(true);
		expect(displayOrderSchema.safeParse(1).success).toBe(true);
		expect(displayOrderSchema.safeParse(100).success).toBe(true);
	});

	it("負数を拒否し日本語エラーメッセージを返す", () => {
		const result = displayOrderSchema.safeParse(-1);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].message).toBe(
				"表示順は0以上で入力してください",
			);
		}
	});

	it("小数を拒否し日本語エラーメッセージを返す", () => {
		const result = displayOrderSchema.safeParse(1.5);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].message).toBe(
				"表示順は整数で入力してください",
			);
		}
	});

	it("文字列を拒否する", () => {
		expect(displayOrderSchema.safeParse("1").success).toBe(false);
	});
});

describe("colorCodeSchema", () => {
	it("正しい #RRGGBB 形式を受け入れる", () => {
		expect(colorCodeSchema.safeParse("#FF0000").success).toBe(true);
		expect(colorCodeSchema.safeParse("#00ff00").success).toBe(true);
		expect(colorCodeSchema.safeParse("#aaBBcc").success).toBe(true);
	});

	it("null を受け入れる", () => {
		expect(colorCodeSchema.safeParse(null).success).toBe(true);
	});

	it("undefined を受け入れる", () => {
		expect(colorCodeSchema.safeParse(undefined).success).toBe(true);
	});

	it("不正な形式を拒否し日本語エラーメッセージを返す", () => {
		const result = colorCodeSchema.safeParse("FF0000");
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].message).toBe(
				"カラーコードは #RRGGBB 形式で入力してください",
			);
		}
	});

	it("#RRGGBB 以外の長さを拒否する", () => {
		expect(colorCodeSchema.safeParse("#FFF").success).toBe(false);
		expect(colorCodeSchema.safeParse("#FF00FF00").success).toBe(false);
	});
});
