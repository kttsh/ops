import { HTTPException } from 'hono/http-exception'
import { monthlyCapacityData } from '@/data/monthlyCapacityData'
import { toMonthlyCapacityResponse } from '@/transform/monthlyCapacityTransform'
import type { MonthlyCapacity, CreateMonthlyCapacity, UpdateMonthlyCapacity, BulkUpsertMonthlyCapacity } from '@/types/monthlyCapacity'

export const monthlyCapacityService = {
  async findAll(capacityScenarioId: number): Promise<MonthlyCapacity[]> {
    const exists = await monthlyCapacityData.capacityScenarioExists(capacityScenarioId)
    if (!exists) {
      throw new HTTPException(404, {
        message: `Capacity scenario with ID '${capacityScenarioId}' not found`,
      })
    }

    const rows = await monthlyCapacityData.findAll(capacityScenarioId)
    return rows.map(toMonthlyCapacityResponse)
  },

  async findById(capacityScenarioId: number, monthlyCapacityId: number): Promise<MonthlyCapacity> {
    const row = await monthlyCapacityData.findById(monthlyCapacityId)
    if (!row) {
      throw new HTTPException(404, {
        message: `Monthly capacity with ID '${monthlyCapacityId}' not found`,
      })
    }
    if (row.capacity_scenario_id !== capacityScenarioId) {
      throw new HTTPException(404, {
        message: `Monthly capacity with ID '${monthlyCapacityId}' not found`,
      })
    }
    return toMonthlyCapacityResponse(row)
  },

  async create(capacityScenarioId: number, data: CreateMonthlyCapacity): Promise<MonthlyCapacity> {
    const exists = await monthlyCapacityData.capacityScenarioExists(capacityScenarioId)
    if (!exists) {
      throw new HTTPException(404, {
        message: `Capacity scenario with ID '${capacityScenarioId}' not found`,
      })
    }

    const buExists = await monthlyCapacityData.businessUnitExists(data.businessUnitCode)
    if (!buExists) {
      throw new HTTPException(422, {
        message: `Business unit with code '${data.businessUnitCode}' not found`,
      })
    }

    const duplicate = await monthlyCapacityData.uniqueKeyExists(
      capacityScenarioId,
      data.businessUnitCode,
      data.yearMonth,
    )
    if (duplicate) {
      throw new HTTPException(409, {
        message: `Monthly capacity for business unit '${data.businessUnitCode}' and year-month '${data.yearMonth}' already exists in capacity scenario '${capacityScenarioId}'`,
      })
    }

    const created = await monthlyCapacityData.create({
      capacityScenarioId,
      businessUnitCode: data.businessUnitCode,
      yearMonth: data.yearMonth,
      capacity: data.capacity,
    })
    return toMonthlyCapacityResponse(created)
  },

  async update(
    capacityScenarioId: number,
    monthlyCapacityId: number,
    data: UpdateMonthlyCapacity,
  ): Promise<MonthlyCapacity> {
    const existing = await monthlyCapacityData.findById(monthlyCapacityId)
    if (!existing) {
      throw new HTTPException(404, {
        message: `Monthly capacity with ID '${monthlyCapacityId}' not found`,
      })
    }
    if (existing.capacity_scenario_id !== capacityScenarioId) {
      throw new HTTPException(404, {
        message: `Monthly capacity with ID '${monthlyCapacityId}' not found`,
      })
    }

    if (data.businessUnitCode !== undefined) {
      const buExists = await monthlyCapacityData.businessUnitExists(data.businessUnitCode)
      if (!buExists) {
        throw new HTTPException(422, {
          message: `Business unit with code '${data.businessUnitCode}' not found`,
        })
      }
    }

    const checkBuCode = data.businessUnitCode ?? existing.business_unit_code
    const checkYearMonth = data.yearMonth ?? existing.year_month
    if (data.businessUnitCode !== undefined || data.yearMonth !== undefined) {
      const duplicate = await monthlyCapacityData.uniqueKeyExists(
        capacityScenarioId,
        checkBuCode,
        checkYearMonth,
        monthlyCapacityId,
      )
      if (duplicate) {
        throw new HTTPException(409, {
          message: `Monthly capacity for business unit '${checkBuCode}' and year-month '${checkYearMonth}' already exists in capacity scenario '${capacityScenarioId}'`,
        })
      }
    }

    const updated = await monthlyCapacityData.update(monthlyCapacityId, data)
    if (!updated) {
      throw new HTTPException(404, {
        message: `Monthly capacity with ID '${monthlyCapacityId}' not found`,
      })
    }
    return toMonthlyCapacityResponse(updated)
  },

  async delete(capacityScenarioId: number, monthlyCapacityId: number): Promise<void> {
    const existing = await monthlyCapacityData.findById(monthlyCapacityId)
    if (!existing) {
      throw new HTTPException(404, {
        message: `Monthly capacity with ID '${monthlyCapacityId}' not found`,
      })
    }
    if (existing.capacity_scenario_id !== capacityScenarioId) {
      throw new HTTPException(404, {
        message: `Monthly capacity with ID '${monthlyCapacityId}' not found`,
      })
    }

    await monthlyCapacityData.deleteById(monthlyCapacityId)
  },

  async bulkUpsert(capacityScenarioId: number, data: BulkUpsertMonthlyCapacity): Promise<MonthlyCapacity[]> {
    const exists = await monthlyCapacityData.capacityScenarioExists(capacityScenarioId)
    if (!exists) {
      throw new HTTPException(404, {
        message: `Capacity scenario with ID '${capacityScenarioId}' not found`,
      })
    }

    const keys = data.items.map((item) => `${item.businessUnitCode}_${item.yearMonth}`)
    const uniqueKeys = new Set(keys)
    if (uniqueKeys.size !== keys.length) {
      throw new HTTPException(422, {
        message: 'Duplicate businessUnitCode + yearMonth combinations found in items array',
      })
    }

    const uniqueBuCodes = [...new Set(data.items.map((item) => item.businessUnitCode))]
    const buAllExist = await monthlyCapacityData.businessUnitsExist(uniqueBuCodes)
    if (!buAllExist) {
      throw new HTTPException(422, {
        message: 'One or more business unit codes not found',
      })
    }

    const rows = await monthlyCapacityData.bulkUpsert(capacityScenarioId, data.items)
    return rows.map(toMonthlyCapacityResponse)
  },
}
