import { describe, expect, test } from "vitest";
import { HTTPException } from "hono/http-exception";
import { parseIntParam } from "@/utils/parseParams";

describe("parseIntParam", () => {
	test("正常な正の整数文字列で number を返す", () => {
		expect(parseIntParam("1", "id")).toBe(1);
		expect(parseIntParam("42", "id")).toBe(42);
		expect(parseIntParam("999", "id")).toBe(999);
	});

	test("undefined で HTTPException(422) をスロー", () => {
		expect(() => parseIntParam(undefined, "projectId")).toThrow(HTTPException);
		try {
			parseIntParam(undefined, "projectId");
		} catch (e) {
			expect(e).toBeInstanceOf(HTTPException);
			expect((e as HTTPException).status).toBe(422);
			expect((e as HTTPException).message).toBe(
				"Missing required parameter: projectId",
			);
		}
	});

	test("空文字で HTTPException(422) をスロー", () => {
		expect(() => parseIntParam("", "caseId")).toThrow(HTTPException);
		try {
			parseIntParam("", "caseId");
		} catch (e) {
			expect(e).toBeInstanceOf(HTTPException);
			expect((e as HTTPException).status).toBe(422);
			expect((e as HTTPException).message).toBe(
				"Missing required parameter: caseId",
			);
		}
	});

	test('NaN 値（"abc"）で HTTPException(422) をスロー', () => {
		expect(() => parseIntParam("abc", "loadId")).toThrow(HTTPException);
		try {
			parseIntParam("abc", "loadId");
		} catch (e) {
			expect(e).toBeInstanceOf(HTTPException);
			expect((e as HTTPException).status).toBe(422);
			expect((e as HTTPException).message).toBe(
				"Invalid loadId: must be a positive integer",
			);
		}
	});

	test("0 で HTTPException(422) をスロー", () => {
		expect(() => parseIntParam("0", "id")).toThrow(HTTPException);
		try {
			parseIntParam("0", "id");
		} catch (e) {
			expect(e).toBeInstanceOf(HTTPException);
			expect((e as HTTPException).status).toBe(422);
			expect((e as HTTPException).message).toBe(
				"Invalid id: must be a positive integer",
			);
		}
	});

	test("負の値で HTTPException(422) をスロー", () => {
		expect(() => parseIntParam("-5", "id")).toThrow(HTTPException);
		try {
			parseIntParam("-5", "id");
		} catch (e) {
			expect(e).toBeInstanceOf(HTTPException);
			expect((e as HTTPException).status).toBe(422);
			expect((e as HTTPException).message).toBe(
				"Invalid id: must be a positive integer",
			);
		}
	});

	test("小数文字列は整数部のみ取得（parseInt の挙動）", () => {
		expect(parseIntParam("1.5", "id")).toBe(1);
		expect(parseIntParam("10.9", "id")).toBe(10);
	});

	test("パラメータ名がエラーメッセージに含まれる", () => {
		try {
			parseIntParam(undefined, "customParam");
		} catch (e) {
			expect((e as HTTPException).message).toContain("customParam");
		}
		try {
			parseIntParam("abc", "anotherParam");
		} catch (e) {
			expect((e as HTTPException).message).toContain("anotherParam");
		}
	});
});
