import type {
	ChartViewProjectItem,
	ChartViewProjectItemRow,
} from "@/types/chartViewProjectItem";
import { createFieldMapper } from "@/utils/fieldMapper";

export const toChartViewProjectItemResponse = createFieldMapper<
	ChartViewProjectItemRow,
	ChartViewProjectItem
>({
	chartViewProjectItemId: "chart_view_project_item_id",
	chartViewId: "chart_view_id",
	projectId: "project_id",
	projectCaseId: "project_case_id",
	displayOrder: "display_order",
	isVisible: { field: "is_visible", transform: (v) => !!v },
	color: { field: "color_code", transform: (v) => v ?? null },
	createdAt: "created_at",
	updatedAt: "updated_at",
	project: {
		computed: (row) => ({
			projectCode: row.project_code,
			projectName: row.project_name,
		}),
	},
	projectCase: {
		computed: (row) =>
			row.project_case_id !== null ? { caseName: row.case_name! } : null,
	},
});
