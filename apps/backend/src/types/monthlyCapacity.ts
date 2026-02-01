import { z } from "zod";

// --- 共通バリデーション ---

/** 年月バリデーション: YYYYMM形式（6桁数字、月は01〜12の範囲） */
const yearMonthSchema = z
	.string()
	.regex(/^\d{6}$/, "yearMonth must be a 6-digit string in YYYYMM format")
	.refine(
		(val) => {
			const month = parseInt(val.slice(4, 6), 10);
			return month >= 1 && month <= 12;
		},
		{ message: "Month part must be between 01 and 12" },
	);

/** 事業部コードバリデーション: 1文字以上20文字以下 */
const businessUnitCodeSchema = z.string().min(1).max(20);

/** キャパシティバリデーション: 0以上99999999.99以下 */
const capacityValueSchema = z.number().min(0).max(99999999.99);

// --- Zod スキーマ ---

/** 作成用スキーマ */
export const createMonthlyCapacitySchema = z.object({
	businessUnitCode: businessUnitCodeSchema,
	yearMonth: yearMonthSchema,
	capacity: capacityValueSchema,
});

/** 更新用スキーマ */
export const updateMonthlyCapacitySchema = z.object({
	businessUnitCode: businessUnitCodeSchema.optional(),
	yearMonth: yearMonthSchema.optional(),
	capacity: capacityValueSchema.optional(),
});

/** バルク Upsert アイテムスキーマ */
const bulkUpsertItemSchema = z.object({
	businessUnitCode: businessUnitCodeSchema,
	yearMonth: yearMonthSchema,
	capacity: capacityValueSchema,
});

/** バルク Upsert スキーマ */
export const bulkUpsertMonthlyCapacitySchema = z.object({
	items: z.array(bulkUpsertItemSchema).min(1),
});

// --- TypeScript 型 ---

/** 作成リクエスト型 */
export type CreateMonthlyCapacity = z.infer<typeof createMonthlyCapacitySchema>;

/** 更新リクエスト型 */
export type UpdateMonthlyCapacity = z.infer<typeof updateMonthlyCapacitySchema>;

/** バルク Upsert リクエスト型 */
export type BulkUpsertMonthlyCapacity = z.infer<
	typeof bulkUpsertMonthlyCapacitySchema
>;

/** DB 行型（snake_case — DB のカラム名そのまま） */
export type MonthlyCapacityRow = {
	monthly_capacity_id: number;
	capacity_scenario_id: number;
	business_unit_code: string;
	year_month: string;
	capacity: number;
	created_at: Date;
	updated_at: Date;
};

/** API レスポンス型（camelCase） */
export type MonthlyCapacity = {
	monthlyCapacityId: number;
	capacityScenarioId: number;
	businessUnitCode: string;
	yearMonth: string;
	capacity: number;
	createdAt: string;
	updatedAt: string;
};
