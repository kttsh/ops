import { z } from "zod";
import { includeDisabledFilterSchema } from "@/types/common";
import { paginationQuerySchema } from "@/types/pagination";

// --- Zod スキーマ ---

/** 作成用スキーマ */
export const createProjectCaseSchema = z.object({
	caseName: z.string().min(1).max(100),
	isPrimary: z.boolean().default(false),
	description: z.string().max(500).nullable().optional(),
	calculationType: z.enum(["MANUAL", "STANDARD"]).default("MANUAL"),
	standardEffortId: z.number().int().positive().nullable().optional(),
	startYearMonth: z
		.string()
		.regex(/^\d{6}$/)
		.nullable()
		.optional(),
	durationMonths: z.number().int().positive().nullable().optional(),
	totalManhour: z.number().int().min(0).nullable().optional(),
});

/** 更新用スキーマ */
export const updateProjectCaseSchema = z.object({
	caseName: z.string().min(1).max(100).optional(),
	isPrimary: z.boolean().optional(),
	description: z.string().max(500).nullable().optional(),
	calculationType: z.enum(["MANUAL", "STANDARD"]).optional(),
	standardEffortId: z.number().int().positive().nullable().optional(),
	startYearMonth: z
		.string()
		.regex(/^\d{6}$/)
		.nullable()
		.optional(),
	durationMonths: z.number().int().positive().nullable().optional(),
	totalManhour: z.number().int().min(0).nullable().optional(),
});

/** 一覧取得クエリスキーマ（ページネーション + フィルタ） */
export const projectCaseListQuerySchema = paginationQuerySchema.extend({
	"filter[includeDisabled]": includeDisabledFilterSchema,
});

// --- TypeScript 型 ---

/** 作成リクエスト型 */
export type CreateProjectCase = z.infer<typeof createProjectCaseSchema>;

/** 更新リクエスト型 */
export type UpdateProjectCase = z.infer<typeof updateProjectCaseSchema>;

/** 一覧取得クエリ型 */
export type ProjectCaseListQuery = z.infer<typeof projectCaseListQuerySchema>;

/** DB 行型（snake_case — DB のカラム名そのまま + JOIN フィールド） */
export type ProjectCaseRow = {
	project_case_id: number;
	project_id: number;
	case_name: string;
	is_primary: boolean;
	description: string | null;
	calculation_type: string;
	standard_effort_id: number | null;
	start_year_month: string | null;
	duration_months: number | null;
	total_manhour: number | null;
	created_at: Date;
	updated_at: Date;
	deleted_at: Date | null;
	// JOIN フィールド
	project_name: string;
	standard_effort_name: string | null;
};

/** API レスポンス型（camelCase） */
export type ProjectCase = {
	projectCaseId: number;
	projectId: number;
	caseName: string;
	isPrimary: boolean;
	description: string | null;
	calculationType: string;
	standardEffortId: number | null;
	startYearMonth: string | null;
	durationMonths: number | null;
	totalManhour: number | null;
	createdAt: string;
	updatedAt: string;
	// JOIN フィールド
	projectName: string;
	standardEffortName: string | null;
};
