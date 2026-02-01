import type { ProjectType, ProjectTypeRow } from "@/types/projectType";

export function toProjectTypeResponse(row: ProjectTypeRow): ProjectType {
	return {
		projectTypeCode: row.project_type_code,
		name: row.name,
		displayOrder: row.display_order,
		createdAt: row.created_at.toISOString(),
		updatedAt: row.updated_at.toISOString(),
	};
}
