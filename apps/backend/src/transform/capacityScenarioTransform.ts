import type {
	CapacityScenario,
	CapacityScenarioRow,
} from "@/types/capacityScenario";
import { createFieldMapper } from "@/utils/fieldMapper";

export const toCapacityScenarioResponse = createFieldMapper<
	CapacityScenarioRow,
	CapacityScenario
>({
	capacityScenarioId: "capacity_scenario_id",
	scenarioName: "scenario_name",
	isPrimary: "is_primary",
	description: "description",
	hoursPerPerson: "hours_per_person",
	createdAt: "created_at",
	updatedAt: "updated_at",
	deletedAt: "deleted_at",
});
