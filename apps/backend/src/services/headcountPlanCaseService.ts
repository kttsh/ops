import { HTTPException } from 'hono/http-exception'
import { headcountPlanCaseData } from '@/data/headcountPlanCaseData'
import { businessUnitData } from '@/data/businessUnitData'
import { toHeadcountPlanCaseResponse } from '@/transform/headcountPlanCaseTransform'
import type {
  HeadcountPlanCase,
  CreateHeadcountPlanCase,
  UpdateHeadcountPlanCase,
} from '@/types/headcountPlanCase'

export const headcountPlanCaseService = {
  async findAll(params: {
    page: number
    pageSize: number
    includeDisabled: boolean
  }): Promise<{ items: HeadcountPlanCase[]; totalCount: number }> {
    const result = await headcountPlanCaseData.findAll(params)
    return {
      items: result.items.map(toHeadcountPlanCaseResponse),
      totalCount: result.totalCount,
    }
  },

  async findById(id: number): Promise<HeadcountPlanCase> {
    const row = await headcountPlanCaseData.findById(id)
    if (!row) {
      throw new HTTPException(404, {
        message: `Headcount plan case with ID '${id}' not found`,
      })
    }
    return toHeadcountPlanCaseResponse(row)
  },

  async create(data: CreateHeadcountPlanCase): Promise<HeadcountPlanCase> {
    if (data.businessUnitCode) {
      const bu = await businessUnitData.findByCode(data.businessUnitCode)
      if (!bu) {
        throw new HTTPException(422, {
          message: `Business unit with code '${data.businessUnitCode}' not found`,
        })
      }
    }
    const created = await headcountPlanCaseData.create({
      caseName: data.caseName,
      isPrimary: data.isPrimary ?? false,
      description: data.description ?? null,
      businessUnitCode: data.businessUnitCode ?? null,
    })
    return toHeadcountPlanCaseResponse(created)
  },

  async update(id: number, data: UpdateHeadcountPlanCase): Promise<HeadcountPlanCase> {
    if (data.businessUnitCode) {
      const bu = await businessUnitData.findByCode(data.businessUnitCode)
      if (!bu) {
        throw new HTTPException(422, {
          message: `Business unit with code '${data.businessUnitCode}' not found`,
        })
      }
    }
    const updated = await headcountPlanCaseData.update(id, data)
    if (!updated) {
      throw new HTTPException(404, {
        message: `Headcount plan case with ID '${id}' not found`,
      })
    }
    return toHeadcountPlanCaseResponse(updated)
  },

  async delete(id: number): Promise<void> {
    const hasRefs = await headcountPlanCaseData.hasReferences(id)
    if (hasRefs) {
      throw new HTTPException(409, {
        message: `Headcount plan case with ID '${id}' is referenced by other resources and cannot be deleted`,
      })
    }
    const deleted = await headcountPlanCaseData.softDelete(id)
    if (!deleted) {
      throw new HTTPException(404, {
        message: `Headcount plan case with ID '${id}' not found`,
      })
    }
  },

  async restore(id: number): Promise<HeadcountPlanCase> {
    const existing = await headcountPlanCaseData.findByIdIncludingDeleted(id)
    if (!existing) {
      throw new HTTPException(404, {
        message: `Headcount plan case with ID '${id}' not found`,
      })
    }
    if (!existing.deleted_at) {
      throw new HTTPException(409, {
        message: `Headcount plan case with ID '${id}' is not soft-deleted`,
      })
    }
    const restored = await headcountPlanCaseData.restore(id)
    return toHeadcountPlanCaseResponse(restored!)
  },
}
