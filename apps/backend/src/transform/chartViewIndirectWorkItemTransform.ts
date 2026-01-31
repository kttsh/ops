import type { ChartViewIndirectWorkItemRow, ChartViewIndirectWorkItem } from '@/types/chartViewIndirectWorkItem'

export function toChartViewIndirectWorkItemResponse(row: ChartViewIndirectWorkItemRow): ChartViewIndirectWorkItem {
  return {
    chartViewIndirectWorkItemId: row.chart_view_indirect_work_item_id,
    chartViewId: row.chart_view_id,
    indirectWorkCaseId: row.indirect_work_case_id,
    caseName: row.case_name,
    displayOrder: row.display_order,
    isVisible: !!row.is_visible,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}
