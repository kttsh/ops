import { z } from "zod";
import { yearMonthSchema } from "@/types/common";

// --- 共通バリデーション ---

const manhourSchema = z.number().int().min(0).max(99999999);

// =============================================================================
// 新スキーマ（17 固定列 + 動的年月列）
// =============================================================================

/** 月次データスキーマ */
const loadEntrySchema = z.object({
	yearMonth: yearMonthSchema,
	manhour: manhourSchema,
});

/** インポート行スキーマ（1行 = 1案件ケース + 月次データ） */
export const bulkImportRowSchema = z.object({
	projectCode: z.string().min(1).max(120).nullable(),
	businessUnitCode: z
		.string()
		.min(1)
		.max(20)
		.regex(/^[a-zA-Z0-9_-]+$/),
	fiscalYear: z.number().int().nullable(),
	projectTypeCode: z
		.string()
		.min(1)
		.max(20)
		.regex(/^[a-zA-Z0-9_-]+$/)
		.nullable(),
	name: z.string().min(1).max(120),
	nickname: z.string().max(120).nullable(),
	customerName: z.string().max(120).nullable(),
	orderNumber: z.string().max(120).nullable(),
	startYearMonth: yearMonthSchema,
	totalManhour: manhourSchema,
	durationMonths: z.number().int().positive().nullable(),
	calculationBasis: z.string().max(500).nullable(),
	remarks: z.string().max(500).nullable(),
	region: z.string().max(100).nullable(),
	deleteFlag: z.boolean(),
	projectCaseId: z.number().int().positive().nullable(),
	caseName: z.string().min(1).max(100),
	loads: z.array(loadEntrySchema),
});

/** インポートリクエストスキーマ */
export const bulkImportSchema = z.object({
	items: z.array(bulkImportRowSchema).min(1),
});

// --- TypeScript 型 ---

/** インポート行型 */
export type BulkImportRow = z.infer<typeof bulkImportRowSchema>;

/** インポートリクエスト型 */
export type BulkImportInput = z.infer<typeof bulkImportSchema>;

/** インポート結果型 */
export type BulkImportResult = {
	createdProjects: number;
	updatedProjects: number;
	deletedProjects: number;
	createdCases: number;
	updatedCases: number;
	updatedRecords: number;
};

/** エクスポート行型（案件メタデータ付き） */
export type ExportRow = {
	projectCode: string;
	businessUnitCode: string;
	fiscalYear: number | null;
	projectTypeCode: string | null;
	name: string;
	nickname: string | null;
	customerName: string | null;
	orderNumber: string | null;
	startYearMonth: string;
	totalManhour: number;
	durationMonths: number | null;
	calculationBasis: string | null;
	remarks: string | null;
	region: string | null;
	projectCaseId: number;
	caseName: string;
	loads: Array<{ yearMonth: string; manhour: number }>;
};

/** エクスポートレスポンス型 */
export type ExportDataResponse = {
	data: ExportRow[];
	yearMonths: string[];
};

/** インポート用 案件検索結果の DB 行型 */
export type ImportProjectLookupRow = {
	project_id: number;
	project_code: string;
};

/** インポート用 案件作成データ型 */
export type CreateImportProjectData = {
	projectCode: string;
	name: string;
	businessUnitCode: string;
	projectTypeCode: string | null;
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
};

/** インポート用 案件更新データ型 */
export type UpdateImportProjectData = {
	name: string;
	businessUnitCode: string;
	projectTypeCode: string | null;
	startYearMonth: string;
	totalManhour: number;
	durationMonths: number | null;
	fiscalYear: number | null;
	nickname: string | null;
	customerName: string | null;
	orderNumber: string | null;
	calculationBasis: string | null;
	remarks: string | null;
	region: string | null;
};

/** DB エクスポート行型（snake_case） */
export type ExportDataRow = {
	project_code: string;
	business_unit_code: string;
	fiscal_year: number | null;
	project_type_code: string | null;
	project_name: string;
	nickname: string | null;
	customer_name: string | null;
	order_number: string | null;
	start_year_month: string;
	total_manhour: number;
	duration_months: number | null;
	calculation_basis: string | null;
	remarks: string | null;
	region: string | null;
	project_case_id: number;
	case_name: string;
	year_month: string;
	manhour: number;
};
