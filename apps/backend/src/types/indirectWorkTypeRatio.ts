import { z } from "zod";

// --- 共通バリデーション ---

/** 作業種別コード: 最大20文字 */
const workTypeCodeSchema = z.string().max(20);

/** 年度: 整数 */
const fiscalYearSchema = z.number().int();

/** 配分比率: 0.0000 以上 1.0000 以下 */
const ratioSchema = z.number().min(0).max(1);

// --- Zod スキーマ ---

/** 作成用スキーマ */
export const createIndirectWorkTypeRatioSchema = z.object({
	workTypeCode: workTypeCodeSchema,
	fiscalYear: fiscalYearSchema,
	ratio: ratioSchema,
});

/** 更新用スキーマ */
export const updateIndirectWorkTypeRatioSchema = z.object({
	workTypeCode: workTypeCodeSchema.optional(),
	fiscalYear: fiscalYearSchema.optional(),
	ratio: ratioSchema.optional(),
});

/** バルク Upsert アイテムスキーマ */
const bulkUpsertItemSchema = z.object({
	workTypeCode: workTypeCodeSchema,
	fiscalYear: fiscalYearSchema,
	ratio: ratioSchema,
});

/** バルク Upsert スキーマ */
export const bulkUpsertIndirectWorkTypeRatioSchema = z.object({
	items: z.array(bulkUpsertItemSchema).min(1),
});

// --- TypeScript 型 ---

/** 作成リクエスト型 */
export type CreateIndirectWorkTypeRatio = z.infer<
	typeof createIndirectWorkTypeRatioSchema
>;

/** 更新リクエスト型 */
export type UpdateIndirectWorkTypeRatio = z.infer<
	typeof updateIndirectWorkTypeRatioSchema
>;

/** バルク Upsert リクエスト型 */
export type BulkUpsertIndirectWorkTypeRatio = z.infer<
	typeof bulkUpsertIndirectWorkTypeRatioSchema
>;

/** DB 行型（snake_case — DB のカラム名そのまま） */
export type IndirectWorkTypeRatioRow = {
	indirect_work_type_ratio_id: number;
	indirect_work_case_id: number;
	work_type_code: string;
	fiscal_year: number;
	ratio: number;
	created_at: Date;
	updated_at: Date;
};

/** API レスポンス型（camelCase） */
export type IndirectWorkTypeRatio = {
	indirectWorkTypeRatioId: number;
	indirectWorkCaseId: number;
	workTypeCode: string;
	fiscalYear: number;
	ratio: number;
	createdAt: string;
	updatedAt: string;
};
