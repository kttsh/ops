import type { CapacityScenarioRow, CapacityScenario } from '@/types/capacityScenario'

export function toCapacityScenarioResponse(row: CapacityScenarioRow): CapacityScenario {
  return {
    capacityScenarioId: row.capacity_scenario_id,
    scenarioName: row.scenario_name,
    isPrimary: row.is_primary,
    description: row.description,
    hoursPerPerson: row.hours_per_person,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    deletedAt: row.deleted_at?.toISOString() ?? null,
  }
}
