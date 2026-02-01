import type { ProjectCase, ProjectCaseRow } from "@/types/projectCase";

export function toProjectCaseResponse(row: ProjectCaseRow): ProjectCase {
	return {
		projectCaseId: row.project_case_id,
		projectId: row.project_id,
		caseName: row.case_name,
		isPrimary: row.is_primary,
		description: row.description,
		calculationType: row.calculation_type,
		standardEffortId: row.standard_effort_id,
		startYearMonth: row.start_year_month,
		durationMonths: row.duration_months,
		totalManhour: row.total_manhour,
		createdAt: row.created_at.toISOString(),
		updatedAt: row.updated_at.toISOString(),
		projectName: row.project_name,
		standardEffortName: row.standard_effort_name,
	};
}
