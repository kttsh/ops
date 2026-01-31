import type { MonthlyIndirectWorkLoadRow, MonthlyIndirectWorkLoad } from '@/types/monthlyIndirectWorkLoad'

export function toMonthlyIndirectWorkLoadResponse(row: MonthlyIndirectWorkLoadRow): MonthlyIndirectWorkLoad {
  return {
    monthlyIndirectWorkLoadId: row.monthly_indirect_work_load_id,
    indirectWorkCaseId: row.indirect_work_case_id,
    businessUnitCode: row.business_unit_code,
    yearMonth: row.year_month,
    manhour: row.manhour,
    source: row.source,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}
