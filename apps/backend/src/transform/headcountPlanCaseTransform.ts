import type { HeadcountPlanCaseRow, HeadcountPlanCase } from '@/types/headcountPlanCase'

export function toHeadcountPlanCaseResponse(row: HeadcountPlanCaseRow): HeadcountPlanCase {
  return {
    headcountPlanCaseId: row.headcount_plan_case_id,
    caseName: row.case_name,
    isPrimary: row.is_primary,
    description: row.description,
    businessUnitCode: row.business_unit_code,
    businessUnitName: row.business_unit_name,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}
