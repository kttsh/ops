import { HTTPException } from 'hono/http-exception'
import { capacityScenarioData } from '@/data/capacityScenarioData'
import { toCapacityScenarioResponse } from '@/transform/capacityScenarioTransform'
import type {
  CapacityScenario,
  CreateCapacityScenario,
  UpdateCapacityScenario,
} from '@/types/capacityScenario'

export const capacityScenarioService = {
  async findAll(params: {
    page: number
    pageSize: number
    includeDisabled: boolean
  }): Promise<{ items: CapacityScenario[]; totalCount: number }> {
    const result = await capacityScenarioData.findAll(params)
    return {
      items: result.items.map(toCapacityScenarioResponse),
      totalCount: result.totalCount,
    }
  },

  async findById(id: number): Promise<CapacityScenario> {
    const row = await capacityScenarioData.findById(id)
    if (!row) {
      throw new HTTPException(404, {
        message: `Capacity scenario with ID '${id}' not found`,
      })
    }
    return toCapacityScenarioResponse(row)
  },

  async create(data: CreateCapacityScenario): Promise<CapacityScenario> {
    const created = await capacityScenarioData.create({
      scenarioName: data.scenarioName,
      isPrimary: data.isPrimary ?? false,
      description: data.description ?? null,
    })
    return toCapacityScenarioResponse(created)
  },

  async update(id: number, data: UpdateCapacityScenario): Promise<CapacityScenario> {
    const updated = await capacityScenarioData.update(id, data)
    if (!updated) {
      throw new HTTPException(404, {
        message: `Capacity scenario with ID '${id}' not found`,
      })
    }
    return toCapacityScenarioResponse(updated)
  },

  async delete(id: number): Promise<void> {
    const hasRefs = await capacityScenarioData.hasReferences(id)
    if (hasRefs) {
      throw new HTTPException(409, {
        message: `Capacity scenario with ID '${id}' is referenced by other resources and cannot be deleted`,
      })
    }
    const deleted = await capacityScenarioData.softDelete(id)
    if (!deleted) {
      throw new HTTPException(404, {
        message: `Capacity scenario with ID '${id}' not found`,
      })
    }
  },

  async restore(id: number): Promise<CapacityScenario> {
    const existing = await capacityScenarioData.findByIdIncludingDeleted(id)
    if (!existing) {
      throw new HTTPException(404, {
        message: `Capacity scenario with ID '${id}' not found`,
      })
    }
    if (!existing.deleted_at) {
      throw new HTTPException(409, {
        message: `Capacity scenario with ID '${id}' is not soft-deleted`,
      })
    }
    const restored = await capacityScenarioData.restore(id)
    return toCapacityScenarioResponse(restored!)
  },
}
