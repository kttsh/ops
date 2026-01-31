import { HTTPException } from 'hono/http-exception'
import { businessUnitData } from '@/data/businessUnitData'
import { toBusinessUnitResponse } from '@/transform/businessUnitTransform'
import type { BusinessUnit, CreateBusinessUnit, UpdateBusinessUnit } from '@/types/businessUnit'

export const businessUnitService = {
  async findAll(params: {
    page: number
    pageSize: number
    includeDisabled: boolean
  }): Promise<{ items: BusinessUnit[]; totalCount: number }> {
    const result = await businessUnitData.findAll(params)
    return {
      items: result.items.map(toBusinessUnitResponse),
      totalCount: result.totalCount,
    }
  },

  async findByCode(code: string): Promise<BusinessUnit> {
    const row = await businessUnitData.findByCode(code)
    if (!row) {
      throw new HTTPException(404, {
        message: `Business unit with code '${code}' not found`,
      })
    }
    return toBusinessUnitResponse(row)
  },

  async create(data: CreateBusinessUnit): Promise<BusinessUnit> {
    const existing = await businessUnitData.findByCodeIncludingDeleted(data.businessUnitCode)
    if (existing) {
      const detail = existing.deleted_at
        ? `Business unit with code '${data.businessUnitCode}' already exists (soft-deleted). Use restore to reactivate it.`
        : `Business unit with code '${data.businessUnitCode}' already exists`
      throw new HTTPException(409, { message: detail })
    }
    const created = await businessUnitData.create(data)
    return toBusinessUnitResponse(created)
  },

  async update(code: string, data: UpdateBusinessUnit): Promise<BusinessUnit> {
    const updated = await businessUnitData.update(code, data)
    if (!updated) {
      throw new HTTPException(404, {
        message: `Business unit with code '${code}' not found`,
      })
    }
    return toBusinessUnitResponse(updated)
  },

  async delete(code: string): Promise<void> {
    const hasRefs = await businessUnitData.hasReferences(code)
    if (hasRefs) {
      throw new HTTPException(409, {
        message: `Business unit with code '${code}' is referenced by other resources and cannot be deleted`,
      })
    }
    const deleted = await businessUnitData.softDelete(code)
    if (!deleted) {
      throw new HTTPException(404, {
        message: `Business unit with code '${code}' not found`,
      })
    }
  },

  async restore(code: string): Promise<BusinessUnit> {
    const existing = await businessUnitData.findByCodeIncludingDeleted(code)
    if (!existing) {
      throw new HTTPException(404, {
        message: `Business unit with code '${code}' not found`,
      })
    }
    if (!existing.deleted_at) {
      throw new HTTPException(409, {
        message: `Business unit with code '${code}' is not soft-deleted`,
      })
    }
    const restored = await businessUnitData.restore(code)
    return toBusinessUnitResponse(restored!)
  },
}
