import type {
	ChartViewCapacityItem,
	ChartViewCapacityItemRow,
} from "@/types/chartViewCapacityItem";
import { createFieldMapper } from "@/utils/fieldMapper";

export const toChartViewCapacityItemResponse = createFieldMapper<
	ChartViewCapacityItemRow,
	ChartViewCapacityItem
>({
	chartViewCapacityItemId: "chart_view_capacity_item_id",
	chartViewId: "chart_view_id",
	capacityScenarioId: "capacity_scenario_id",
	scenarioName: "scenario_name",
	isVisible: { field: "is_visible", transform: (v) => !!v },
	colorCode: "color_code",
	createdAt: "created_at",
	updatedAt: "updated_at",
});
