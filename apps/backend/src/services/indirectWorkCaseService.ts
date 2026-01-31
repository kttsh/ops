import { HTTPException } from 'hono/http-exception'
import { indirectWorkCaseData } from '@/data/indirectWorkCaseData'
import { businessUnitData } from '@/data/businessUnitData'
import { toIndirectWorkCaseResponse } from '@/transform/indirectWorkCaseTransform'
import type {
  IndirectWorkCase,
  CreateIndirectWorkCase,
  UpdateIndirectWorkCase,
} from '@/types/indirectWorkCase'

export const indirectWorkCaseService = {
  async findAll(params: {
    page: number
    pageSize: number
    includeDisabled: boolean
    businessUnitCode?: string
  }): Promise<{ items: IndirectWorkCase[]; totalCount: number }> {
    const result = await indirectWorkCaseData.findAll(params)
    return {
      items: result.items.map(toIndirectWorkCaseResponse),
      totalCount: result.totalCount,
    }
  },

  async findById(id: number): Promise<IndirectWorkCase> {
    const row = await indirectWorkCaseData.findById(id)
    if (!row) {
      throw new HTTPException(404, {
        message: `Indirect work case with ID '${id}' not found`,
      })
    }
    return toIndirectWorkCaseResponse(row)
  },

  async create(data: CreateIndirectWorkCase): Promise<IndirectWorkCase> {
    const bu = await businessUnitData.findByCode(data.businessUnitCode)
    if (!bu) {
      throw new HTTPException(422, {
        message: `Business unit with code '${data.businessUnitCode}' not found`,
      })
    }
    const created = await indirectWorkCaseData.create({
      caseName: data.caseName,
      isPrimary: data.isPrimary ?? false,
      description: data.description ?? null,
      businessUnitCode: data.businessUnitCode,
    })
    return toIndirectWorkCaseResponse(created)
  },

  async update(id: number, data: UpdateIndirectWorkCase): Promise<IndirectWorkCase> {
    if (data.businessUnitCode) {
      const bu = await businessUnitData.findByCode(data.businessUnitCode)
      if (!bu) {
        throw new HTTPException(422, {
          message: `Business unit with code '${data.businessUnitCode}' not found`,
        })
      }
    }
    const updated = await indirectWorkCaseData.update(id, data)
    if (!updated) {
      throw new HTTPException(404, {
        message: `Indirect work case with ID '${id}' not found`,
      })
    }
    return toIndirectWorkCaseResponse(updated)
  },

  async delete(id: number): Promise<void> {
    const hasRefs = await indirectWorkCaseData.hasReferences(id)
    if (hasRefs) {
      throw new HTTPException(409, {
        message: `Indirect work case with ID '${id}' is referenced by other resources and cannot be deleted`,
      })
    }
    const deleted = await indirectWorkCaseData.softDelete(id)
    if (!deleted) {
      throw new HTTPException(404, {
        message: `Indirect work case with ID '${id}' not found`,
      })
    }
  },

  async restore(id: number): Promise<IndirectWorkCase> {
    const existing = await indirectWorkCaseData.findByIdIncludingDeleted(id)
    if (!existing) {
      throw new HTTPException(404, {
        message: `Indirect work case with ID '${id}' not found`,
      })
    }
    if (!existing.deleted_at) {
      throw new HTTPException(404, {
        message: `Indirect work case with ID '${id}' not found`,
      })
    }
    const restored = await indirectWorkCaseData.restore(id)
    return toIndirectWorkCaseResponse(restored!)
  },
}
