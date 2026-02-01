import { z } from "zod";

// --- Zod スキーマ ---

/** 作成用スキーマ */
export const createChartViewIndirectWorkItemSchema = z.object({
	indirectWorkCaseId: z.number().int().positive(),
	displayOrder: z.number().int().min(0).default(0),
	isVisible: z.boolean().default(true),
});

/** 更新用スキーマ */
export const updateChartViewIndirectWorkItemSchema = z.object({
	displayOrder: z.number().int().min(0).optional(),
	isVisible: z.boolean().optional(),
});

// --- TypeScript 型 ---

/** 作成リクエスト型 */
export type CreateChartViewIndirectWorkItem = z.infer<
	typeof createChartViewIndirectWorkItemSchema
>;

/** 更新リクエスト型 */
export type UpdateChartViewIndirectWorkItem = z.infer<
	typeof updateChartViewIndirectWorkItemSchema
>;

/** DB 行型（snake_case — DB のカラム名そのまま） */
export type ChartViewIndirectWorkItemRow = {
	chart_view_indirect_work_item_id: number;
	chart_view_id: number;
	indirect_work_case_id: number;
	display_order: number;
	is_visible: boolean;
	created_at: Date;
	updated_at: Date;
	case_name: string | null;
};

/** API レスポンス型（camelCase） */
export type ChartViewIndirectWorkItem = {
	chartViewIndirectWorkItemId: number;
	chartViewId: number;
	indirectWorkCaseId: number;
	caseName: string | null;
	displayOrder: number;
	isVisible: boolean;
	createdAt: string;
	updatedAt: string;
};
