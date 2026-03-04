import type { BusinessUnit, BusinessUnitRow } from "@/types/businessUnit";
import { createFieldMapper } from "@/utils/fieldMapper";

export const toBusinessUnitResponse = createFieldMapper<
	BusinessUnitRow,
	BusinessUnit
>({
	businessUnitCode: "business_unit_code",
	name: "name",
	displayOrder: "display_order",
	createdAt: "created_at",
	updatedAt: "updated_at",
});
