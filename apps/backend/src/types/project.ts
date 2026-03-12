import { z } from "zod";
import { includeDisabledFilterSchema } from "@/types/common";
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
	fiscalYear: z.number().int().optional(),
	nickname: z.string().max(120).optional(),
	customerName: z.string().max(120).optional(),
	orderNumber: z.string().max(120).optional(),
	calculationBasis: z.string().max(500).optional(),
	remarks: z.string().max(500).optional(),
	region: z.string().max(100).optional(),
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
		fiscalYear: z.number().int().nullable().optional(),
		nickname: z.string().max(120).nullable().optional(),
		customerName: z.string().max(120).nullable().optional(),
		orderNumber: z.string().max(120).nullable().optional(),
		calculationBasis: z.string().max(500).nullable().optional(),
		remarks: z.string().max(500).nullable().optional(),
		region: z.string().max(100).nullable().optional(),
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: "At least one field must be provided",
	});

/** 一覧取得クエリスキーマ（ページネーション + フィルタ） */
export const projectListQuerySchema = paginationQuerySchema.extend({
	"filter[includeDisabled]": includeDisabledFilterSchema,
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
	fiscal_year: number | null;
	nickname: string | null;
	customer_name: string | null;
	order_number: string | null;
	calculation_basis: string | null;
	remarks: string | null;
	region: string | null;
	created_at: Date;
	updated_at: Date;
	deleted_at: Date | null;
};

/** ケースサマリ DB 行型（snake_case） */
export type ProjectCaseSummaryRow = {
	project_case_id: number;
	project_id: number;
	case_name: string;
	is_primary: boolean;
};

/** ケースサマリ API レスポンス型（camelCase） */
export type ProjectCaseSummary = {
	projectCaseId: number;
	caseName: string;
	isPrimary: boolean;
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
	fiscalYear: number | null;
	nickname: string | null;
	customerName: string | null;
	orderNumber: string | null;
	calculationBasis: string | null;
	remarks: string | null;
	region: string | null;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
	cases: ProjectCaseSummary[];
};
