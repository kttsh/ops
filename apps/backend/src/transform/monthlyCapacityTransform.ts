import type {
	MonthlyCapacity,
	MonthlyCapacityRow,
} from "@/types/monthlyCapacity";
import { createFieldMapper } from "@/utils/fieldMapper";

export const toMonthlyCapacityResponse = createFieldMapper<
	MonthlyCapacityRow,
	MonthlyCapacity
>({
	monthlyCapacityId: "monthly_capacity_id",
	capacityScenarioId: "capacity_scenario_id",
	businessUnitCode: "business_unit_code",
	yearMonth: "year_month",
	capacity: "capacity",
	createdAt: "created_at",
	updatedAt: "updated_at",
});
