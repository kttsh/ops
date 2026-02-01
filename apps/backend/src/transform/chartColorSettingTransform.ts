import type {
	ChartColorSetting,
	ChartColorSettingRow,
} from "@/types/chartColorSetting";

export function toChartColorSettingResponse(
	row: ChartColorSettingRow,
): ChartColorSetting {
	return {
		chartColorSettingId: row.chart_color_setting_id,
		targetType: row.target_type,
		targetId: row.target_id,
		colorCode: row.color_code,
		createdAt: row.created_at.toISOString(),
		updatedAt: row.updated_at.toISOString(),
	};
}
