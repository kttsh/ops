import { z } from "zod";
import { businessUnitCodeSchema, yearMonthSchema } from "@/types/common";

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
