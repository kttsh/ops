import type { ChartView, ChartViewRow } from "@/types/chartView";
import { createFieldMapper } from "@/utils/fieldMapper";

function parseBusinessUnitCodes(value: string | null): string[] | null {
	if (value === null) return null;
	try {
		return JSON.parse(value);
	} catch {
		return null;
	}
}

export const toChartViewResponse = createFieldMapper<ChartViewRow, ChartView>({
	chartViewId: "chart_view_id",
	viewName: "view_name",
	chartType: "chart_type",
	startYearMonth: "start_year_month",
	endYearMonth: "end_year_month",
	isDefault: "is_default",
	description: "description",
	businessUnitCodes: {
		computed: (row) => parseBusinessUnitCodes(row.business_unit_codes),
	},
	createdAt: "created_at",
	updatedAt: "updated_at",
});
