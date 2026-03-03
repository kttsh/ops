import { z } from "zod";
import { paginationQuerySchema } from "@/types/pagination";
import {
	yearMonthSchema,
	includeDisabledFilterSchema,
} from "@/types/common";

// --- Zod スキーマ ---

/** 作成用スキーマ */
export const createChartViewSchema = z
	.object({
		viewName: z.string().min(1).max(100),
		chartType: z.string().min(1).max(50),
		startYearMonth: yearMonthSchema,
		endYearMonth: yearMonthSchema,
		isDefault: z.boolean().default(false),
		description: z.string().max(500).optional().nullable(),
		businessUnitCodes: z.array(z.string()).optional(),
	})
	.refine((data) => data.startYearMonth <= data.endYearMonth, {
		path: ["endYearMonth"],
		message: "endYearMonth must be greater than or equal to startYearMonth",
	});

/** 更新用スキーマ */
export const updateChartViewSchema = z.object({
	viewName: z.string().min(1).max(100).optional(),
	chartType: z.string().min(1).max(50).optional(),
	startYearMonth: yearMonthSchema.optional(),
	endYearMonth: yearMonthSchema.optional(),
	isDefault: z.boolean().optional(),
	description: z.string().max(500).optional().nullable(),
	businessUnitCodes: z.array(z.string()).optional(),
});

/** 一覧取得クエリスキーマ（ページネーション + フィルタ） */
export const chartViewListQuerySchema = paginationQuerySchema.extend({
	"filter[includeDisabled]": includeDisabledFilterSchema,
});

// --- TypeScript 型 ---

/** 作成リクエスト型 */
export type CreateChartView = z.infer<typeof createChartViewSchema>;

/** 更新リクエスト型 */
export type UpdateChartView = z.infer<typeof updateChartViewSchema>;

/** 一覧取得クエリ型 */
export type ChartViewListQuery = z.infer<typeof chartViewListQuerySchema>;

/** DB 行型（snake_case — DB のカラム名そのまま） */
export type ChartViewRow = {
	chart_view_id: number;
	view_name: string;
	chart_type: string;
	start_year_month: string;
	end_year_month: string;
	is_default: boolean;
	description: string | null;
	business_unit_codes: string | null;
	created_at: Date;
	updated_at: Date;
	deleted_at: Date | null;
};

/** API レスポンス型（camelCase） */
export type ChartView = {
	chartViewId: number;
	viewName: string;
	chartType: string;
	startYearMonth: string;
	endYearMonth: string;
	isDefault: boolean;
	description: string | null;
	businessUnitCodes: string[] | null;
	createdAt: string;
	updatedAt: string;
};
