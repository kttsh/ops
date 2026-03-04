import { z } from "zod";

/** マスターコードフィールド: 英数字・ハイフン・アンダースコア、1〜20文字 */
export const codeSchema = z
	.string()
	.min(1, "コードは必須です")
	.max(20, "コードは20文字以内で入力してください")
	.regex(
		/^[a-zA-Z0-9_-]+$/,
		"英数字・ハイフン・アンダースコアのみ使用できます",
	);

/** 名称フィールド: 1〜100文字 */
export const nameSchema = z
	.string()
	.min(1, "名称は必須です")
	.max(100, "名称は100文字以内で入力してください");

/** 表示順フィールド: 0以上の整数 */
export const displayOrderSchema = z
	.number()
	.int("表示順は整数で入力してください")
	.min(0, "表示順は0以上で入力してください");

/** カラーコードフィールド: #RRGGBB 形式、nullable/optional */
export const colorCodeSchema = z
	.string()
	.regex(/^#[0-9A-Fa-f]{6}$/, "カラーコードは #RRGGBB 形式で入力してください")
	.nullable()
	.optional();
