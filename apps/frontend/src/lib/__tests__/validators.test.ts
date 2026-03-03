import { describe, expect, it } from "vitest";
import { displayOrderValidators } from "../validators";

describe("displayOrderValidators", () => {
	describe("onChange", () => {
		it("正の整数で undefined を返す", () => {
			expect(displayOrderValidators.onChange({ value: 1 })).toBeUndefined();
			expect(displayOrderValidators.onChange({ value: 100 })).toBeUndefined();
		});

		it("0 で undefined を返す", () => {
			expect(displayOrderValidators.onChange({ value: 0 })).toBeUndefined();
		});

		it("非整数でエラーメッセージを返す", () => {
			expect(displayOrderValidators.onChange({ value: 1.5 })).toBe(
				"表示順は整数で入力してください",
			);
		});

		it("負数でエラーメッセージを返す", () => {
			expect(displayOrderValidators.onChange({ value: -1 })).toBe(
				"表示順は0以上で入力してください",
			);
		});

		it("NaN でエラーメッセージを返す", () => {
			expect(displayOrderValidators.onChange({ value: Number.NaN })).toBe(
				"表示順は整数で入力してください",
			);
		});
	});

	describe("onBlur", () => {
		it("正の整数で undefined を返す", () => {
			expect(displayOrderValidators.onBlur({ value: 1 })).toBeUndefined();
		});

		it("0 で undefined を返す", () => {
			expect(displayOrderValidators.onBlur({ value: 0 })).toBeUndefined();
		});

		it("非整数でエラーメッセージを返す", () => {
			expect(displayOrderValidators.onBlur({ value: 1.5 })).toBe(
				"表示順は整数で入力してください",
			);
		});

		it("負数でエラーメッセージを返す", () => {
			expect(displayOrderValidators.onBlur({ value: -1 })).toBe(
				"表示順は0以上で入力してください",
			);
		});
	});

	it("onChange と onBlur は同一ロジックである", () => {
		const testValues = [0, 1, -1, 1.5, 100, Number.NaN];
		for (const value of testValues) {
			expect(displayOrderValidators.onChange({ value })).toBe(
				displayOrderValidators.onBlur({ value }),
			);
		}
	});
});
