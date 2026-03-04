import type {
	ChartViewIndirectWorkItem,
	ChartViewIndirectWorkItemRow,
} from "@/types/chartViewIndirectWorkItem";
import { createFieldMapper } from "@/utils/fieldMapper";

export const toChartViewIndirectWorkItemResponse = createFieldMapper<
	ChartViewIndirectWorkItemRow,
	ChartViewIndirectWorkItem
>({
	chartViewIndirectWorkItemId: "chart_view_indirect_work_item_id",
	chartViewId: "chart_view_id",
	indirectWorkCaseId: "indirect_work_case_id",
	caseName: "case_name",
	displayOrder: "display_order",
	isVisible: { field: "is_visible", transform: (v) => !!v },
	createdAt: "created_at",
	updatedAt: "updated_at",
});
