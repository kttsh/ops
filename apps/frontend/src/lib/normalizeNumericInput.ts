interface NormalizeOptions {
	/** 小数点の入力を許可する（default: false） */
	allowDecimal?: boolean;
}

/**
 * 全角数字を半角に変換し、不正文字を除去する。
 * 数値型への変換は行わない（文字列を返す）。
 */
export function normalizeNumericInput(
	value: string,
	options?: NormalizeOptions,
): string {
	const allowDecimal = options?.allowDecimal ?? false;

	// 全角数字→半角数字
	let result = value.replace(/[０-９]/g, (ch) =>
		String.fromCharCode(ch.charCodeAt(0) - 0xfee0),
	);

	// 全角ピリオド→半角ピリオド（小数モード時のみ）
	if (allowDecimal) {
		result = result.replace(/．/g, ".");
	}

	// 不正文字除去
	if (allowDecimal) {
		result = result.replace(/[^0-9.]/g, "");
	} else {
		result = result.replace(/[^0-9]/g, "");
	}

	return result;
}
