import { z } from "zod";
import { includeDisabledFilterSchema } from "@/types/common";
import { paginationQuerySchema } from "@/types/pagination";

// --- Zod スキーマ ---

/** 作成用スキーマ */
export const createIndirectWorkCaseSchema = z.object({
	caseName: z.string().min(1).max(100),
	isPrimary: z.boolean().default(false),
	description: z.string().max(500).nullish(),
	businessUnitCode: z
		.string()
		.min(1)
		.max(20)
		.regex(/^[a-zA-Z0-9_-]+$/),
});

/** 更新用スキーマ */
export const updateIndirectWorkCaseSchema = z.object({
	caseName: z.string().min(1).max(100).optional(),
	isPrimary: z.boolean().optional(),
	description: z.string().max(500).nullish(),
	businessUnitCode: z
		.string()
		.min(1)
		.max(20)
		.regex(/^[a-zA-Z0-9_-]+$/)
		.optional(),
});

/** 一覧取得クエリスキーマ（ページネーション + フィルタ） */
export const indirectWorkCaseListQuerySchema = paginationQuerySchema.extend({
	"filter[includeDisabled]": includeDisabledFilterSchema,
	"filter[businessUnitCode]": z.string().max(20).optional(),
});

// --- TypeScript 型 ---

/** 作成リクエスト型 */
export type CreateIndirectWorkCase = z.infer<
	typeof createIndirectWorkCaseSchema
>;

/** 更新リクエスト型 */
export type UpdateIndirectWorkCase = z.infer<
	typeof updateIndirectWorkCaseSchema
>;

/** 一覧取得クエリ型 */
export type IndirectWorkCaseListQuery = z.infer<
	typeof indirectWorkCaseListQuerySchema
>;

/** DB 行型（snake_case — DB のカラム名そのまま） */
export type IndirectWorkCaseRow = {
	indirect_work_case_id: number;
	case_name: string;
	is_primary: boolean;
	description: string | null;
	business_unit_code: string;
	business_unit_name: string | null;
	created_at: Date;
	updated_at: Date;
	deleted_at: Date | null;
};

/** API レスポンス型（camelCase） */
export type IndirectWorkCase = {
	indirectWorkCaseId: number;
	caseName: string;
	isPrimary: boolean;
	description: string | null;
	businessUnitCode: string;
	businessUnitName: string | null;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
};
