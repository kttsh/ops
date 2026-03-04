import type {
	ChartStackOrderSetting,
	ChartStackOrderSettingRow,
} from "@/types/chartStackOrderSetting";
import { createFieldMapper } from "@/utils/fieldMapper";

export const toChartStackOrderSettingResponse = createFieldMapper<
	ChartStackOrderSettingRow,
	ChartStackOrderSetting
>({
	chartStackOrderSettingId: "chart_stack_order_setting_id",
	targetType: "target_type",
	targetCode: "target_code",
	stackOrder: "stack_order",
	createdAt: "created_at",
	updatedAt: "updated_at",
});
