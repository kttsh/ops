import type { ChartStackOrderSettingRow, ChartStackOrderSetting } from '@/types/chartStackOrderSetting'

export function toChartStackOrderSettingResponse(row: ChartStackOrderSettingRow): ChartStackOrderSetting {
  return {
    chartStackOrderSettingId: row.chart_stack_order_setting_id,
    targetType: row.target_type,
    targetId: row.target_id,
    stackOrder: row.stack_order,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}
