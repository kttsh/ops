import sql from 'mssql'
import { getPool } from '@/database/client'
import type { CapacityScenarioRow } from '@/types/capacityScenario'

const BASE_SELECT = `
  capacity_scenario_id, scenario_name, is_primary,
  description, created_at, updated_at, deleted_at`

export const capacityScenarioData = {
  async findAll(params: {
    page: number
    pageSize: number
    includeDisabled: boolean
  }): Promise<{ items: CapacityScenarioRow[]; totalCount: number }> {
    const pool = await getPool()
    const offset = (params.page - 1) * params.pageSize
    const whereClause = params.includeDisabled ? '' : 'WHERE deleted_at IS NULL'

    const itemsResult = await pool
      .request()
      .input('offset', sql.Int, offset)
      .input('pageSize', sql.Int, params.pageSize)
      .query<CapacityScenarioRow>(
        `SELECT ${BASE_SELECT}
         FROM capacity_scenarios
         ${whereClause}
         ORDER BY capacity_scenario_id ASC
         OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`,
      )

    const countResult = await pool
      .request()
      .query<{ totalCount: number }>(
        `SELECT COUNT(*) AS totalCount
         FROM capacity_scenarios
         ${whereClause}`,
      )

    return {
      items: itemsResult.recordset,
      totalCount: countResult.recordset[0].totalCount,
    }
  },

  async findById(id: number): Promise<CapacityScenarioRow | undefined> {
    const pool = await getPool()
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query<CapacityScenarioRow>(
        `SELECT ${BASE_SELECT}
         FROM capacity_scenarios
         WHERE capacity_scenario_id = @id AND deleted_at IS NULL`,
      )

    return result.recordset[0]
  },

  async findByIdIncludingDeleted(id: number): Promise<CapacityScenarioRow | undefined> {
    const pool = await getPool()
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query<CapacityScenarioRow>(
        `SELECT ${BASE_SELECT}
         FROM capacity_scenarios
         WHERE capacity_scenario_id = @id`,
      )

    return result.recordset[0]
  },

  async create(data: {
    scenarioName: string
    isPrimary: boolean
    description: string | null
  }): Promise<CapacityScenarioRow> {
    const pool = await getPool()
    const result = await pool
      .request()
      .input('scenarioName', sql.NVarChar, data.scenarioName)
      .input('isPrimary', sql.Bit, data.isPrimary)
      .input('description', sql.NVarChar, data.description)
      .query<{ capacity_scenario_id: number }>(
        `INSERT INTO capacity_scenarios (scenario_name, is_primary, description)
         OUTPUT INSERTED.capacity_scenario_id
         VALUES (@scenarioName, @isPrimary, @description)`,
      )

    const id = result.recordset[0].capacity_scenario_id
    return (await capacityScenarioData.findById(id))!
  },

  async update(
    id: number,
    data: {
      scenarioName?: string
      isPrimary?: boolean
      description?: string | null
    },
  ): Promise<CapacityScenarioRow | undefined> {
    const pool = await getPool()
    const setClauses = ['updated_at = GETDATE()']
    const request = pool.request().input('id', sql.Int, id)

    if (data.scenarioName !== undefined) {
      setClauses.push('scenario_name = @scenarioName')
      request.input('scenarioName', sql.NVarChar, data.scenarioName)
    }
    if (data.isPrimary !== undefined) {
      setClauses.push('is_primary = @isPrimary')
      request.input('isPrimary', sql.Bit, data.isPrimary)
    }
    if (data.description !== undefined) {
      setClauses.push('description = @description')
      request.input('description', sql.NVarChar, data.description)
    }

    const result = await request.query<{ capacity_scenario_id: number }>(
      `UPDATE capacity_scenarios
       SET ${setClauses.join(', ')}
       OUTPUT INSERTED.capacity_scenario_id
       WHERE capacity_scenario_id = @id AND deleted_at IS NULL`,
    )

    if (result.recordset.length === 0) return undefined
    return capacityScenarioData.findById(id)
  },

  async softDelete(id: number): Promise<CapacityScenarioRow | undefined> {
    const pool = await getPool()
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query<CapacityScenarioRow>(
        `UPDATE capacity_scenarios
         SET deleted_at = GETDATE(), updated_at = GETDATE()
         OUTPUT INSERTED.capacity_scenario_id, INSERTED.scenario_name, INSERTED.is_primary,
                INSERTED.description,
                INSERTED.created_at, INSERTED.updated_at, INSERTED.deleted_at
         WHERE capacity_scenario_id = @id AND deleted_at IS NULL`,
      )

    return result.recordset[0]
  },

  async restore(id: number): Promise<CapacityScenarioRow | undefined> {
    const pool = await getPool()
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query<CapacityScenarioRow>(
        `UPDATE capacity_scenarios
         SET deleted_at = NULL, updated_at = GETDATE()
         OUTPUT INSERTED.capacity_scenario_id, INSERTED.scenario_name, INSERTED.is_primary,
                INSERTED.description,
                INSERTED.created_at, INSERTED.updated_at, INSERTED.deleted_at
         WHERE capacity_scenario_id = @id AND deleted_at IS NOT NULL`,
      )

    if (result.recordset.length === 0) return undefined
    return capacityScenarioData.findById(id)
  },

  async hasReferences(id: number): Promise<boolean> {
    const pool = await getPool()
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query<{ hasRef: boolean }>(
        `SELECT CASE
           WHEN EXISTS (SELECT 1 FROM monthly_capacity WHERE capacity_scenario_id = @id)
           THEN CAST(1 AS BIT)
           ELSE CAST(0 AS BIT)
         END AS hasRef`,
      )

    return result.recordset[0].hasRef
  },
}
