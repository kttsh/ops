import type {
	MonthlyHeadcountPlan,
	MonthlyHeadcountPlanRow,
} from "@/types/monthlyHeadcountPlan";
import { createFieldMapper } from "@/utils/fieldMapper";

export const toMonthlyHeadcountPlanResponse = createFieldMapper<
	MonthlyHeadcountPlanRow,
	MonthlyHeadcountPlan
>({
	monthlyHeadcountPlanId: "monthly_headcount_plan_id",
	headcountPlanCaseId: "headcount_plan_case_id",
	businessUnitCode: "business_unit_code",
	yearMonth: "year_month",
	headcount: "headcount",
	createdAt: "created_at",
	updatedAt: "updated_at",
});
