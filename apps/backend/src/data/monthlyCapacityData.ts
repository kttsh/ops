import sql from 'mssql'
import { getPool } from '@/database/client'
import type { MonthlyCapacityRow } from '@/types/monthlyCapacity'

const SELECT_COLUMNS = `
  mc.monthly_capacity_id, mc.capacity_scenario_id, mc.business_unit_code,
  mc.year_month, mc.capacity, mc.created_at, mc.updated_at
`

export const monthlyCapacityData = {
  async findAll(capacityScenarioId: number): Promise<MonthlyCapacityRow[]> {
    const pool = await getPool()
    const result = await pool
      .request()
      .input('capacityScenarioId', sql.Int, capacityScenarioId)
      .query<MonthlyCapacityRow>(
        `SELECT ${SELECT_COLUMNS}
         FROM monthly_capacity mc
         WHERE mc.capacity_scenario_id = @capacityScenarioId
         ORDER BY mc.business_unit_code ASC, mc.year_month ASC`,
      )

    return result.recordset
  },

  async findById(monthlyCapacityId: number): Promise<MonthlyCapacityRow | undefined> {
    const pool = await getPool()
    const result = await pool
      .request()
      .input('monthlyCapacityId', sql.Int, monthlyCapacityId)
      .query<MonthlyCapacityRow>(
        `SELECT ${SELECT_COLUMNS}
         FROM monthly_capacity mc
         WHERE mc.monthly_capacity_id = @monthlyCapacityId`,
      )

    return result.recordset[0]
  },

  async create(data: {
    capacityScenarioId: number
    businessUnitCode: string
    yearMonth: string
    capacity: number
  }): Promise<MonthlyCapacityRow> {
    const pool = await getPool()
    const insertResult = await pool
      .request()
      .input('capacityScenarioId', sql.Int, data.capacityScenarioId)
      .input('businessUnitCode', sql.VarChar(20), data.businessUnitCode)
      .input('yearMonth', sql.Char(6), data.yearMonth)
      .input('capacity', sql.Decimal(10, 2), data.capacity)
      .query<{ monthly_capacity_id: number }>(
        `INSERT INTO monthly_capacity (
           capacity_scenario_id, business_unit_code, year_month, capacity
         )
         OUTPUT INSERTED.monthly_capacity_id
         VALUES (
           @capacityScenarioId, @businessUnitCode, @yearMonth, @capacity
         )`,
      )

    const newId = insertResult.recordset[0].monthly_capacity_id
    const row = await this.findById(newId)
    return row!
  },

  async update(
    monthlyCapacityId: number,
    data: Partial<{
      businessUnitCode: string
      yearMonth: string
      capacity: number
    }>,
  ): Promise<MonthlyCapacityRow | undefined> {
    const pool = await getPool()
    const setClauses: string[] = ['updated_at = GETDATE()']
    const request = pool
      .request()
      .input('monthlyCapacityId', sql.Int, monthlyCapacityId)

    if (data.businessUnitCode !== undefined) {
      setClauses.push('business_unit_code = @businessUnitCode')
      request.input('businessUnitCode', sql.VarChar(20), data.businessUnitCode)
    }
    if (data.yearMonth !== undefined) {
      setClauses.push('year_month = @yearMonth')
      request.input('yearMonth', sql.Char(6), data.yearMonth)
    }
    if (data.capacity !== undefined) {
      setClauses.push('capacity = @capacity')
      request.input('capacity', sql.Decimal(10, 2), data.capacity)
    }

    await request.query(
      `UPDATE monthly_capacity
       SET ${setClauses.join(', ')}
       WHERE monthly_capacity_id = @monthlyCapacityId`,
    )

    return this.findById(monthlyCapacityId)
  },

  async deleteById(monthlyCapacityId: number): Promise<boolean> {
    const pool = await getPool()
    const result = await pool
      .request()
      .input('monthlyCapacityId', sql.Int, monthlyCapacityId)
      .query(
        `DELETE FROM monthly_capacity
         WHERE monthly_capacity_id = @monthlyCapacityId`,
      )

    return result.rowsAffected[0] > 0
  },

  async bulkUpsert(
    capacityScenarioId: number,
    items: Array<{ businessUnitCode: string; yearMonth: string; capacity: number }>,
  ): Promise<MonthlyCapacityRow[]> {
    const pool = await getPool()
    const transaction = new sql.Transaction(pool)

    try {
      await transaction.begin()

      for (const item of items) {
        const request = new sql.Request(transaction)
        await request
          .input('capacityScenarioId', sql.Int, capacityScenarioId)
          .input('businessUnitCode', sql.VarChar(20), item.businessUnitCode)
          .input('yearMonth', sql.Char(6), item.yearMonth)
          .input('capacity', sql.Decimal(10, 2), item.capacity)
          .query(
            `MERGE monthly_capacity AS target
             USING (SELECT @capacityScenarioId AS capacity_scenario_id, @businessUnitCode AS business_unit_code, @yearMonth AS year_month) AS source
             ON target.capacity_scenario_id = source.capacity_scenario_id
                AND target.business_unit_code = source.business_unit_code
                AND target.year_month = source.year_month
             WHEN MATCHED THEN
               UPDATE SET capacity = @capacity, updated_at = GETDATE()
             WHEN NOT MATCHED THEN
               INSERT (capacity_scenario_id, business_unit_code, year_month, capacity)
               VALUES (@capacityScenarioId, @businessUnitCode, @yearMonth, @capacity);`,
          )
      }

      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }

    return this.findAll(capacityScenarioId)
  },

  async capacityScenarioExists(capacityScenarioId: number): Promise<boolean> {
    const pool = await getPool()
    const result = await pool
      .request()
      .input('capacityScenarioId', sql.Int, capacityScenarioId)
      .query<{ exists: boolean }>(
        `SELECT CASE
           WHEN EXISTS (SELECT 1 FROM capacity_scenarios WHERE capacity_scenario_id = @capacityScenarioId AND deleted_at IS NULL)
           THEN CAST(1 AS BIT)
           ELSE CAST(0 AS BIT)
         END AS [exists]`,
      )

    return result.recordset[0].exists
  },

  async businessUnitExists(businessUnitCode: string): Promise<boolean> {
    const pool = await getPool()
    const result = await pool
      .request()
      .input('businessUnitCode', sql.VarChar(20), businessUnitCode)
      .query<{ exists: boolean }>(
        `SELECT CASE
           WHEN EXISTS (SELECT 1 FROM business_units WHERE business_unit_code = @businessUnitCode AND deleted_at IS NULL)
           THEN CAST(1 AS BIT)
           ELSE CAST(0 AS BIT)
         END AS [exists]`,
      )

    return result.recordset[0].exists
  },

  async businessUnitsExist(businessUnitCodes: string[]): Promise<boolean> {
    const pool = await getPool()
    const request = pool.request()

    const params: string[] = []
    businessUnitCodes.forEach((code, index) => {
      const paramName = `code${index}`
      request.input(paramName, sql.VarChar(20), code)
      params.push(`@${paramName}`)
    })

    const result = await request.query<{ cnt: number }>(
      `SELECT COUNT(DISTINCT business_unit_code) AS cnt
       FROM business_units
       WHERE business_unit_code IN (${params.join(', ')})
         AND deleted_at IS NULL`,
    )

    const uniqueCodes = new Set(businessUnitCodes)
    return result.recordset[0].cnt === uniqueCodes.size
  },

  async uniqueKeyExists(
    capacityScenarioId: number,
    businessUnitCode: string,
    yearMonth: string,
    excludeId?: number,
  ): Promise<boolean> {
    const pool = await getPool()
    const request = pool
      .request()
      .input('capacityScenarioId', sql.Int, capacityScenarioId)
      .input('businessUnitCode', sql.VarChar(20), businessUnitCode)
      .input('yearMonth', sql.Char(6), yearMonth)

    let excludeClause = ''
    if (excludeId !== undefined) {
      excludeClause = 'AND monthly_capacity_id <> @excludeId'
      request.input('excludeId', sql.Int, excludeId)
    }

    const result = await request.query<{ exists: boolean }>(
      `SELECT CASE
         WHEN EXISTS (
           SELECT 1 FROM monthly_capacity
           WHERE capacity_scenario_id = @capacityScenarioId
             AND business_unit_code = @businessUnitCode
             AND year_month = @yearMonth
             ${excludeClause}
         )
         THEN CAST(1 AS BIT)
         ELSE CAST(0 AS BIT)
       END AS [exists]`,
    )

    return result.recordset[0].exists
  },
}
