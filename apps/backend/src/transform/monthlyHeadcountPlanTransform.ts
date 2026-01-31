import type { MonthlyHeadcountPlanRow, MonthlyHeadcountPlan } from '@/types/monthlyHeadcountPlan'

export function toMonthlyHeadcountPlanResponse(row: MonthlyHeadcountPlanRow): MonthlyHeadcountPlan {
  return {
    monthlyHeadcountPlanId: row.monthly_headcount_plan_id,
    headcountPlanCaseId: row.headcount_plan_case_id,
    businessUnitCode: row.business_unit_code,
    yearMonth: row.year_month,
    headcount: row.headcount,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}
