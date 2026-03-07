import { z } from "zod";

// --- Zod スキーマ ---

/** 一括 upsert 用スキーマ */
export const bulkUpsertChartViewCapacityItemSchema = z.object({
	items: z.array(
		z.object({
			capacityScenarioId: z.number().int().positive(),
			isVisible: z.boolean().default(true),
			colorCode: z
				.string()
				.length(7)
				.regex(/^#[0-9a-fA-F]{6}$/)
				.nullable()
				.default(null),
		}),
	),
});

// --- TypeScript 型 ---

/** 一括 upsert リクエスト型 */
export type BulkUpsertChartViewCapacityItem = z.infer<
	typeof bulkUpsertChartViewCapacityItemSchema
>;

/** 一括 upsert 入力アイテム型 */
export type BulkUpsertCapacityItemInput =
	BulkUpsertChartViewCapacityItem["items"][number];

/** DB 行型（snake_case — JOIN カラム含む） */
export type ChartViewCapacityItemRow = {
	chart_view_capacity_item_id: number;
	chart_view_id: number;
	capacity_scenario_id: number;
	is_visible: boolean;
	color_code: string | null;
	created_at: Date;
	updated_at: Date;
	scenario_name: string | null;
};

/** API レスポンス型（camelCase） */
export type ChartViewCapacityItem = {
	chartViewCapacityItemId: number;
	chartViewId: number;
	capacityScenarioId: number;
	scenarioName: string | null;
	isVisible: boolean;
	colorCode: string | null;
	createdAt: string;
	updatedAt: string;
};
