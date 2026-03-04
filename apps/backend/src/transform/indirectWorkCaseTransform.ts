import type {
	IndirectWorkCase,
	IndirectWorkCaseRow,
} from "@/types/indirectWorkCase";
import { createFieldMapper } from "@/utils/fieldMapper";

export const toIndirectWorkCaseResponse = createFieldMapper<
	IndirectWorkCaseRow,
	IndirectWorkCase
>({
	indirectWorkCaseId: "indirect_work_case_id",
	caseName: "case_name",
	isPrimary: "is_primary",
	description: "description",
	businessUnitCode: "business_unit_code",
	businessUnitName: "business_unit_name",
	createdAt: "created_at",
	updatedAt: "updated_at",
	deletedAt: "deleted_at",
});
