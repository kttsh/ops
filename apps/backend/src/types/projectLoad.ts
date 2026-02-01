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

/** 工数バリデーション: 0以上の整数 */
const manhourSchema = z.number().int().min(0).max(99999999);

// --- Zod スキーマ ---

/** 作成用スキーマ */
export const createProjectLoadSchema = z.object({
	yearMonth: yearMonthSchema,
	manhour: manhourSchema,
});

/** 更新用スキーマ */
export const updateProjectLoadSchema = z.object({
	yearMonth: yearMonthSchema.optional(),
	manhour: manhourSchema.optional(),
});

/** バルク Upsert アイテムスキーマ */
const bulkUpsertItemSchema = z.object({
	yearMonth: yearMonthSchema,
	manhour: manhourSchema,
});

/** バルク Upsert スキーマ */
export const bulkUpsertProjectLoadSchema = z.object({
	items: z.array(bulkUpsertItemSchema).min(1),
});

// --- TypeScript 型 ---

/** 作成リクエスト型 */
export type CreateProjectLoad = z.infer<typeof createProjectLoadSchema>;

/** 更新リクエスト型 */
export type UpdateProjectLoad = z.infer<typeof updateProjectLoadSchema>;

/** バルク Upsert リクエスト型 */
export type BulkUpsertProjectLoad = z.infer<typeof bulkUpsertProjectLoadSchema>;

/** DB 行型（snake_case — DB のカラム名そのまま） */
export type ProjectLoadRow = {
	project_load_id: number;
	project_case_id: number;
	year_month: string;
	manhour: number;
	created_at: Date;
	updated_at: Date;
};

/** API レスポンス型（camelCase） */
export type ProjectLoad = {
	projectLoadId: number;
	projectCaseId: number;
	yearMonth: string;
	manhour: number;
	createdAt: string;
	updatedAt: string;
};
