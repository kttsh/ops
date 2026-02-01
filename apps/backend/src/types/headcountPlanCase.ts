import { z } from "zod";
import { paginationQuerySchema } from "@/types/pagination";

// --- Zod スキーマ ---

/** 作成用スキーマ */
export const createHeadcountPlanCaseSchema = z.object({
	caseName: z.string().min(1).max(100),
	isPrimary: z.boolean().default(false),
	description: z.string().max(500).nullish(),
	businessUnitCode: z
		.string()
		.max(20)
		.regex(/^[a-zA-Z0-9_-]+$/)
		.nullish(),
});

/** 更新用スキーマ */
export const updateHeadcountPlanCaseSchema = z.object({
	caseName: z.string().min(1).max(100).optional(),
	isPrimary: z.boolean().optional(),
	description: z.string().max(500).nullish(),
	businessUnitCode: z
		.string()
		.max(20)
		.regex(/^[a-zA-Z0-9_-]+$/)
		.nullish(),
});

/** 一覧取得クエリスキーマ（ページネーション + フィルタ） */
export const headcountPlanCaseListQuerySchema = paginationQuerySchema.extend({
	"filter[includeDisabled]": z.coerce.boolean().default(false),
	"filter[businessUnitCode]": z.string().max(20).optional(),
});

// --- TypeScript 型 ---

/** 作成リクエスト型 */
export type CreateHeadcountPlanCase = z.infer<
	typeof createHeadcountPlanCaseSchema
>;

/** 更新リクエスト型 */
export type UpdateHeadcountPlanCase = z.infer<
	typeof updateHeadcountPlanCaseSchema
>;

/** 一覧取得クエリ型 */
export type HeadcountPlanCaseListQuery = z.infer<
	typeof headcountPlanCaseListQuerySchema
>;

/** DB 行型（snake_case — DB のカラム名そのまま） */
export type HeadcountPlanCaseRow = {
	headcount_plan_case_id: number;
	case_name: string;
	is_primary: boolean;
	description: string | null;
	business_unit_code: string | null;
	business_unit_name: string | null;
	created_at: Date;
	updated_at: Date;
	deleted_at: Date | null;
};

/** API レスポンス型（camelCase） */
export type HeadcountPlanCase = {
	headcountPlanCaseId: number;
	caseName: string;
	isPrimary: boolean;
	description: string | null;
	businessUnitCode: string | null;
	businessUnitName: string | null;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
};
