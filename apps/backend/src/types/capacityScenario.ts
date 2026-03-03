import { z } from "zod";
import { paginationQuerySchema } from "@/types/pagination";
import {
	yearMonthSchema,
	includeDisabledFilterSchema,
} from "@/types/common";

// --- 共通バリデーション ---

/** hoursPerPerson バリデーション: 0 超 744 以下 */
const hoursPerPersonField = z
	.number()
	.gt(0, { message: "hoursPerPerson must be greater than 0" })
	.lte(744, { message: "hoursPerPerson must be 744 or less" });

// --- Zod スキーマ ---

/** 作成用スキーマ */
export const createCapacityScenarioSchema = z.object({
	scenarioName: z.string().min(1).max(100),
	isPrimary: z.boolean().default(false),
	description: z.string().max(500).nullish(),
	hoursPerPerson: hoursPerPersonField.optional().default(160.0),
});

/** 更新用スキーマ */
export const updateCapacityScenarioSchema = z.object({
	scenarioName: z.string().min(1).max(100).optional(),
	isPrimary: z.boolean().optional(),
	description: z.string().max(500).nullish(),
	hoursPerPerson: hoursPerPersonField.optional(),
});

/** 一覧取得クエリスキーマ（ページネーション + フィルタ） */
export const capacityScenarioListQuerySchema = paginationQuerySchema.extend({
	"filter[includeDisabled]": includeDisabledFilterSchema,
});

/** 自動計算リクエストスキーマ */
export const calculateCapacitySchema = z.object({
	headcountPlanCaseId: z.number().int().positive(),
	businessUnitCodes: z.array(z.string().min(1).max(20)).optional(),
	yearMonthFrom: yearMonthSchema.optional(),
	yearMonthTo: yearMonthSchema.optional(),
});

// --- TypeScript 型 ---

/** 作成リクエスト型 */
export type CreateCapacityScenario = z.infer<
	typeof createCapacityScenarioSchema
>;

/** 更新リクエスト型 */
export type UpdateCapacityScenario = z.infer<
	typeof updateCapacityScenarioSchema
>;

/** 一覧取得クエリ型 */
export type CapacityScenarioListQuery = z.infer<
	typeof capacityScenarioListQuerySchema
>;

/** 自動計算リクエスト型 */
export type CalculateCapacity = z.infer<typeof calculateCapacitySchema>;

/** DB 行型（snake_case — DB のカラム名そのまま） */
export type CapacityScenarioRow = {
	capacity_scenario_id: number;
	scenario_name: string;
	is_primary: boolean;
	description: string | null;
	hours_per_person: number;
	created_at: Date;
	updated_at: Date;
	deleted_at: Date | null;
};

/** API レスポンス型（camelCase） */
export type CapacityScenario = {
	capacityScenarioId: number;
	scenarioName: string;
	isPrimary: boolean;
	description: string | null;
	hoursPerPerson: number;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
};

/** 計算結果レスポンス型 */
export type CalculateCapacityResult = {
	calculated: number;
	hoursPerPerson: number;
	items: import("@/types/monthlyCapacity").MonthlyCapacity[];
};
