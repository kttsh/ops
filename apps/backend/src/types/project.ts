import { z } from "zod";
import { paginationQuerySchema } from "@/types/pagination";

// --- Zod スキーマ ---

/** 作成用スキーマ */
export const createProjectSchema = z.object({
	projectCode: z.string().min(1).max(120),
	name: z.string().min(1).max(120),
	businessUnitCode: z
		.string()
		.min(1)
		.max(20)
		.regex(/^[a-zA-Z0-9_-]+$/),
	projectTypeCode: z
		.string()
		.min(1)
		.max(20)
		.regex(/^[a-zA-Z0-9_-]+$/)
		.optional(),
	startYearMonth: z.string().regex(/^\d{6}$/),
	totalManhour: z.number().int().positive(),
	status: z.string().min(1).max(20),
	durationMonths: z.number().int().positive().optional(),
});

/** 更新用スキーマ */
export const updateProjectSchema = z
	.object({
		projectCode: z.string().min(1).max(120).optional(),
		name: z.string().min(1).max(120).optional(),
		businessUnitCode: z
			.string()
			.min(1)
			.max(20)
			.regex(/^[a-zA-Z0-9_-]+$/)
			.optional(),
		projectTypeCode: z
			.string()
			.min(1)
			.max(20)
			.regex(/^[a-zA-Z0-9_-]+$/)
			.nullable()
			.optional(),
		startYearMonth: z
			.string()
			.regex(/^\d{6}$/)
			.optional(),
		totalManhour: z.number().int().positive().optional(),
		status: z.string().min(1).max(20).optional(),
		durationMonths: z.number().int().positive().nullable().optional(),
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: "At least one field must be provided",
	});

/** 一覧取得クエリスキーマ（ページネーション + フィルタ） */
export const projectListQuerySchema = paginationQuerySchema.extend({
	"filter[includeDisabled]": z.coerce.boolean().default(false),
	"filter[businessUnitCode]": z.string().optional(),
	"filter[businessUnitCodes]": z.string().optional(),
	"filter[status]": z.string().optional(),
});

// --- TypeScript 型 ---

/** 作成リクエスト型 */
export type CreateProject = z.infer<typeof createProjectSchema>;

/** 更新リクエスト型 */
export type UpdateProject = z.infer<typeof updateProjectSchema>;

/** 一覧取得クエリ型 */
export type ProjectListQuery = z.infer<typeof projectListQuerySchema>;

/** DB 行型（snake_case — JOIN 結果を含む） */
export type ProjectRow = {
	project_id: number;
	project_code: string;
	name: string;
	business_unit_code: string;
	business_unit_name: string;
	project_type_code: string | null;
	project_type_name: string | null;
	start_year_month: string;
	total_manhour: number;
	status: string;
	duration_months: number | null;
	created_at: Date;
	updated_at: Date;
	deleted_at: Date | null;
};

/** API レスポンス型（camelCase） */
export type Project = {
	projectId: number;
	projectCode: string;
	name: string;
	businessUnitCode: string;
	businessUnitName: string;
	projectTypeCode: string | null;
	projectTypeName: string | null;
	startYearMonth: string;
	totalManhour: number;
	status: string;
	durationMonths: number | null;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
};
