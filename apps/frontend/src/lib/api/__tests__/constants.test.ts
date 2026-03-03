import { describe, expect, it } from "vitest";
import { STALE_TIMES } from "../constants";

describe("STALE_TIMES", () => {
	it("SHORT は 1分（60,000ms）", () => {
		expect(STALE_TIMES.SHORT).toBe(60_000);
	});

	it("STANDARD は 2分（120,000ms）", () => {
		expect(STALE_TIMES.STANDARD).toBe(120_000);
	});

	it("MEDIUM は 5分（300,000ms）", () => {
		expect(STALE_TIMES.MEDIUM).toBe(300_000);
	});

	it("LONG は 30分（1,800,000ms）", () => {
		expect(STALE_TIMES.LONG).toBe(1_800_000);
	});

	it("全ての値がミリ秒単位の正の整数である", () => {
		for (const value of Object.values(STALE_TIMES)) {
			expect(value).toBeGreaterThan(0);
			expect(Number.isInteger(value)).toBe(true);
		}
	});
});
