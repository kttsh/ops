import type { ProjectType, ProjectTypeRow } from "@/types/projectType";
import { createFieldMapper } from "@/utils/fieldMapper";

export const toProjectTypeResponse = createFieldMapper<
	ProjectTypeRow,
	ProjectType
>({
	projectTypeCode: "project_type_code",
	name: "name",
	displayOrder: "display_order",
	createdAt: "created_at",
	updatedAt: "updated_at",
});
