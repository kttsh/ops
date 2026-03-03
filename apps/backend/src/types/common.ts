import { z } from "zod";

/**
 * YYYYMM 形式の年月スキーマ。6桁数字 + 月範囲 01-12 を検証。
 */
export const yearMonthSchema = z
	.string()
	.regex(/^\d{6}$/, "yearMonth must be a 6-digit string in YYYYMM format")
	.refine(
		(val) => {
			const month = parseInt(val.slice(4, 6), 10);
			return month >= 1 && month <= 12;
		},
		{ message: "Month part must be between 01 and 12" },
	);

/**
 * 事業部コードスキーマ。1-20文字、英数字・ハイフン・アンダースコアのみ。
 */
export const businessUnitCodeSchema = z
	.string()
	.min(1)
	.max(20)
	.regex(/^[a-zA-Z0-9_-]+$/);

/**
 * カラーコードスキーマ。# + 6桁16進数。
 */
export const colorCodeSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, {
	message: "colorCode must be a valid hex color code (e.g. #FF5733)",
});

/**
 * ソフトデリート済みレコード包含フィルタ。デフォルト false。
 */
export const includeDisabledFilterSchema = z.coerce.boolean().default(false);

export type YearMonth = z.infer<typeof yearMonthSchema>;
export type BusinessUnitCode = z.infer<typeof businessUnitCodeSchema>;
export type ColorCode = z.infer<typeof colorCodeSchema>;
