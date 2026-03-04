import type { ProjectLoad, ProjectLoadRow } from "@/types/projectLoad";
import { createFieldMapper } from "@/utils/fieldMapper";

export const toProjectLoadResponse = createFieldMapper<
	ProjectLoadRow,
	ProjectLoad
>({
	projectLoadId: "project_load_id",
	projectCaseId: "project_case_id",
	yearMonth: "year_month",
	manhour: "manhour",
	createdAt: "created_at",
	updatedAt: "updated_at",
});
