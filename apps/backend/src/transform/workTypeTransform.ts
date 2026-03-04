import type { WorkType, WorkTypeRow } from "@/types/workType";
import { createFieldMapper } from "@/utils/fieldMapper";

export const toWorkTypeResponse = createFieldMapper<WorkTypeRow, WorkType>({
	workTypeCode: "work_type_code",
	name: "name",
	displayOrder: "display_order",
	color: "color",
	createdAt: "created_at",
	updatedAt: "updated_at",
});
