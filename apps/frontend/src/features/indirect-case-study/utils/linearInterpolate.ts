const MONTH_COUNT = 12;

export function linearInterpolate(
	startValue: number,
	endValue: number,
): number[] {
	const result: number[] = [];
	for (let i = 0; i < MONTH_COUNT; i++) {
		result.push(
			Math.round(startValue + ((endValue - startValue) * i) / (MONTH_COUNT - 1)),
		);
	}
	return result;
}
