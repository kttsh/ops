import type {
	ChartColorPalette,
	ChartColorPaletteRow,
} from "@/types/chartColorPalette";
import { createFieldMapper } from "@/utils/fieldMapper";

export const toChartColorPaletteResponse = createFieldMapper<
	ChartColorPaletteRow,
	ChartColorPalette
>({
	chartColorPaletteId: "chart_color_palette_id",
	name: "name",
	colorCode: "color_code",
	displayOrder: "display_order",
	createdAt: "created_at",
	updatedAt: "updated_at",
});
