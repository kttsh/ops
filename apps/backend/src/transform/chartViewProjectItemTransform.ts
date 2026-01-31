import type { ChartViewProjectItemRow, ChartViewProjectItem } from '@/types/chartViewProjectItem'

export function toChartViewProjectItemResponse(row: ChartViewProjectItemRow): ChartViewProjectItem {
  return {
    chartViewProjectItemId: row.chart_view_project_item_id,
    chartViewId: row.chart_view_id,
    projectId: row.project_id,
    projectCaseId: row.project_case_id,
    displayOrder: row.display_order,
    isVisible: !!row.is_visible,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    project: {
      projectCode: row.project_code,
      projectName: row.project_name,
    },
    projectCase: row.project_case_id !== null
      ? { caseName: row.case_name! }
      : null,
  }
}
