import type { Project, ProjectRow } from "@/types/project";

export function toProjectResponse(row: ProjectRow): Project {
	return {
		projectId: row.project_id,
		projectCode: row.project_code,
		name: row.name,
		businessUnitCode: row.business_unit_code,
		businessUnitName: row.business_unit_name,
		projectTypeCode: row.project_type_code,
		projectTypeName: row.project_type_name,
		startYearMonth: row.start_year_month,
		totalManhour: row.total_manhour,
		status: row.status.toLowerCase(),
		durationMonths: row.duration_months,
		createdAt: row.created_at.toISOString(),
		updatedAt: row.updated_at.toISOString(),
		deletedAt: row.deleted_at?.toISOString() ?? null,
	};
}
