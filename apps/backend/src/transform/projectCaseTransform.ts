import type { ProjectCase, ProjectCaseRow } from "@/types/projectCase";
import { createFieldMapper } from "@/utils/fieldMapper";

export const toProjectCaseResponse = createFieldMapper<
	ProjectCaseRow,
	ProjectCase
>({
	projectCaseId: "project_case_id",
	projectId: "project_id",
	caseName: "case_name",
	isPrimary: "is_primary",
	description: "description",
	calculationType: "calculation_type",
	standardEffortId: "standard_effort_id",
	startYearMonth: "start_year_month",
	durationMonths: "duration_months",
	totalManhour: "total_manhour",
	createdAt: "created_at",
	updatedAt: "updated_at",
	projectName: "project_name",
	standardEffortName: "standard_effort_name",
});
