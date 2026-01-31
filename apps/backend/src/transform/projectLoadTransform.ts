import type { ProjectLoadRow, ProjectLoad } from '@/types/projectLoad'

export function toProjectLoadResponse(row: ProjectLoadRow): ProjectLoad {
  return {
    projectLoadId: row.project_load_id,
    projectCaseId: row.project_case_id,
    yearMonth: row.year_month,
    manhour: row.manhour,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}
