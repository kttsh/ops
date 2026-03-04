import type {
	MonthlyIndirectWorkLoad,
	MonthlyIndirectWorkLoadRow,
} from "@/types/monthlyIndirectWorkLoad";
import { createFieldMapper } from "@/utils/fieldMapper";

export const toMonthlyIndirectWorkLoadResponse = createFieldMapper<
	MonthlyIndirectWorkLoadRow,
	MonthlyIndirectWorkLoad
>({
	monthlyIndirectWorkLoadId: "monthly_indirect_work_load_id",
	indirectWorkCaseId: "indirect_work_case_id",
	businessUnitCode: "business_unit_code",
	yearMonth: "year_month",
	manhour: "manhour",
	source: "source",
	createdAt: "created_at",
	updatedAt: "updated_at",
});
