import type { ChartView, ChartViewRow } from "@/types/chartView";

function parseBusinessUnitCodes(value: string | null): string[] | null {
	if (value === null) return null;
	try {
		return JSON.parse(value);
	} catch {
		return null;
	}
}

export function toChartViewResponse(row: ChartViewRow): ChartView {
	return {
		chartViewId: row.chart_view_id,
		viewName: row.view_name,
		chartType: row.chart_type,
		startYearMonth: row.start_year_month,
		endYearMonth: row.end_year_month,
		isDefault: row.is_default,
		description: row.description,
		businessUnitCodes: parseBusinessUnitCodes(row.business_unit_codes),
		createdAt: row.created_at.toISOString(),
		updatedAt: row.updated_at.toISOString(),
	};
}
