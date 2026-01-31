import type { MonthlyCapacityRow, MonthlyCapacity } from '@/types/monthlyCapacity'

export function toMonthlyCapacityResponse(row: MonthlyCapacityRow): MonthlyCapacity {
  return {
    monthlyCapacityId: row.monthly_capacity_id,
    capacityScenarioId: row.capacity_scenario_id,
    businessUnitCode: row.business_unit_code,
    yearMonth: row.year_month,
    capacity: row.capacity,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}
