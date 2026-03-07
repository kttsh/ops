import { describe, expect, it } from "vitest";
import { normalizeNumericInput } from "@/lib/normalizeNumericInput";

describe("normalizeNumericInput", () => {
	describe("整数モード（デフォルト）", () => {
		it("半角数字がそのまま通過する", () => {
			expect(normalizeNumericInput("12345")).toBe("12345");
		});

		it("全角数字が半角に正しく変換される", () => {
			expect(normalizeNumericInput("０１２３４５６７８９")).toBe("0123456789");
		});

		it("全角・半角混在文字列が正しく変換される", () => {
			expect(normalizeNumericInput("１2３4")).toBe("1234");
		});

		it("整数モードで小数点が除去される", () => {
			expect(normalizeNumericInput("12.34")).toBe("1234");
			expect(normalizeNumericInput("12．34")).toBe("1234");
		});

		it("空文字列に対して空文字列を返す", () => {
			expect(normalizeNumericInput("")).toBe("");
		});

		it("アルファベット・記号が除去される", () => {
			expect(normalizeNumericInput("abc123def")).toBe("123");
			expect(normalizeNumericInput("!@#$%")).toBe("");
			expect(normalizeNumericInput("１２abc３")).toBe("123");
		});
	});

	describe("小数モード（allowDecimal: true）", () => {
		it("半角ピリオドが保持される", () => {
			expect(normalizeNumericInput("12.34", { allowDecimal: true })).toBe(
				"12.34",
			);
		});

		it("全角ピリオドが半角に変換される", () => {
			expect(normalizeNumericInput("12．34", { allowDecimal: true })).toBe(
				"12.34",
			);
		});

		it("全角数字と全角ピリオドが正しく変換される", () => {
			expect(normalizeNumericInput("１２．３４", { allowDecimal: true })).toBe(
				"12.34",
			);
		});

		it("数字とピリオド以外の文字が除去される", () => {
			expect(normalizeNumericInput("12.3abc4", { allowDecimal: true })).toBe(
				"12.34",
			);
		});

		it("空文字列に対して空文字列を返す", () => {
			expect(normalizeNumericInput("", { allowDecimal: true })).toBe("");
		});
	});
});
