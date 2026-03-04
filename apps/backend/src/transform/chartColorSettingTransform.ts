import type {
	ChartColorSetting,
	ChartColorSettingRow,
} from "@/types/chartColorSetting";
import { createFieldMapper } from "@/utils/fieldMapper";

export const toChartColorSettingResponse = createFieldMapper<
	ChartColorSettingRow,
	ChartColorSetting
>({
	chartColorSettingId: "chart_color_setting_id",
	targetType: "target_type",
	targetCode: "target_code",
	colorCode: "color_code",
	createdAt: "created_at",
	updatedAt: "updated_at",
});
