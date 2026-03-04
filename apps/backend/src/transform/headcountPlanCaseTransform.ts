import type {
	HeadcountPlanCase,
	HeadcountPlanCaseRow,
} from "@/types/headcountPlanCase";
import { createFieldMapper } from "@/utils/fieldMapper";

export const toHeadcountPlanCaseResponse = createFieldMapper<
	HeadcountPlanCaseRow,
	HeadcountPlanCase
>({
	headcountPlanCaseId: "headcount_plan_case_id",
	caseName: "case_name",
	isPrimary: "is_primary",
	description: "description",
	businessUnitCode: "business_unit_code",
	businessUnitName: "business_unit_name",
	createdAt: "created_at",
	updatedAt: "updated_at",
	deletedAt: "deleted_at",
});
