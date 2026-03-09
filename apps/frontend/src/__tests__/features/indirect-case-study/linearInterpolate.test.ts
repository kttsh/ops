import { linearInterpolate } from "@/features/indirect-case-study/utils/linearInterpolate";

describe("linearInterpolate", () => {
	it("配列長が常に12であること", () => {
		const result = linearInterpolate(10, 15);
		expect(result).toHaveLength(12);
	});

	it("result[0] === startValue, result[11] === endValue であること", () => {
		const result = linearInterpolate(10, 15);
		expect(result[0]).toBe(10);
		expect(result[11]).toBe(15);
	});

	it("増員パターン: linearInterpolate(10, 15) が Issue #63 の計算例と一致すること", () => {
		const result = linearInterpolate(10, 15);
		expect(result).toEqual([10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15]);
	});

	it("減員パターン: linearInterpolate(15, 10) が正しい減少値を返すこと", () => {
		const result = linearInterpolate(15, 10);
		expect(result[0]).toBe(15);
		expect(result[11]).toBe(10);
		expect(result).toHaveLength(12);
		// 値が単調に減少（または同値）であること
		for (let i = 1; i < result.length; i++) {
			expect(result[i]).toBeLessThanOrEqual(result[i - 1]);
		}
	});

	it("同値パターン: linearInterpolate(10, 10) が全月10を返すこと", () => {
		const result = linearInterpolate(10, 10);
		expect(result).toEqual([10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10]);
	});

	it("ゼロパターン: linearInterpolate(0, 0) が全月0を返すこと", () => {
		const result = linearInterpolate(0, 0);
		expect(result).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
	});

	it("連番パターン: linearInterpolate(0, 11) が各月 0, 1, 2, ..., 11 を返すこと", () => {
		const result = linearInterpolate(0, 11);
		expect(result).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
	});

	it("全ての値が0以上の整数であること", () => {
		const result = linearInterpolate(3, 20);
		for (const val of result) {
			expect(val).toBeGreaterThanOrEqual(0);
			expect(Number.isInteger(val)).toBe(true);
		}
	});
});
