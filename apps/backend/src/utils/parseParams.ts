import { HTTPException } from "hono/http-exception";

/**
 * パスパラメータを正の整数にパースする。
 * undefined、空文字、NaN、0以下の場合は HTTPException(422) をスローする。
 */
export function parseIntParam(
	value: string | undefined,
	name: string,
): number {
	if (!value) {
		throw new HTTPException(422, {
			message: `Missing required parameter: ${name}`,
		});
	}
	const parsed = parseInt(value, 10);
	if (Number.isNaN(parsed) || parsed <= 0) {
		throw new HTTPException(422, {
			message: `Invalid ${name}: must be a positive integer`,
		});
	}
	return parsed;
}
