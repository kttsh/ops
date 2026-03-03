import { describe, expect, it } from "vitest";
import { formatDateTime } from "../format-utils";

describe("formatDateTime", () => {
	it("ISO 8601 文字列を ja-JP ロケールでフォーマットする", () => {
		const result = formatDateTime("2024-01-15T10:30:00Z");

		expect(result).toMatch(/2024/);
		expect(result).toMatch(/01/);
		expect(result).toMatch(/\d{2}:\d{2}/);
	});

	it("年・月・日・時・分を含むフォーマットを返す", () => {
		const result = formatDateTime("2024-12-25T23:59:00+09:00");

		expect(result).toMatch(/2024/);
		expect(result).toMatch(/12/);
		expect(result).toMatch(/25/);
		expect(result).toMatch(/\d{2}:\d{2}/);
	});

	it("秒は含まない", () => {
		const result = formatDateTime("2024-06-01T12:34:56Z");

		// 秒が含まれないことを確認（時:分 のみ）
		const timePart = result.match(/\d{2}:\d{2}(:\d{2})?/);
		expect(timePart).not.toBeNull();
		// 秒部分がないことを確認
		expect(timePart![0]).toMatch(/^\d{2}:\d{2}$/);
	});

	it("同一入力に対して常に同一出力を返す", () => {
		const input = "2024-03-15T14:00:00Z";
		const result1 = formatDateTime(input);
		const result2 = formatDateTime(input);

		expect(result1).toBe(result2);
	});
});
