import type {
	ChartColorPalette,
	ChartColorPaletteRow,
} from "@/types/chartColorPalette";

export function toChartColorPaletteResponse(
	row: ChartColorPaletteRow,
): ChartColorPalette {
	return {
		chartColorPaletteId: row.chart_color_palette_id,
		name: row.name,
		colorCode: row.color_code,
		displayOrder: row.display_order,
		createdAt: row.created_at.toISOString(),
		updatedAt: row.updated_at.toISOString(),
	};
}
