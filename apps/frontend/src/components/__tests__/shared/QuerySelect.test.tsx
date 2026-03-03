import { describe, expect, it } from "vitest";
import {
	QuerySelect,
	EMPTY_SENTINEL,
	convertSentinelValue,
} from "@/components/shared/QuerySelect";

describe("QuerySelect", () => {
	it("コンポーネントが関数として export されている", () => {
		expect(typeof QuerySelect).toBe("function");
	});

	it("EMPTY_SENTINEL が __none__ である", () => {
		expect(EMPTY_SENTINEL).toBe("__none__");
	});

	describe("convertSentinelValue", () => {
		it("sentinel 値を空文字に変換する", () => {
			expect(convertSentinelValue("__none__")).toBe("");
		});

		it("通常の値はそのまま返す", () => {
			expect(convertSentinelValue("BU001")).toBe("BU001");
			expect(convertSentinelValue("abc")).toBe("abc");
		});

		it("空文字はそのまま返す", () => {
			expect(convertSentinelValue("")).toBe("");
		});
	});
});
