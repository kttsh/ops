import sql from 'mssql'
import { getPool } from '@/database/client'
import type { MonthlyIndirectWorkLoadRow } from '@/types/monthlyIndirectWorkLoad'

const SELECT_COLUMNS = `
  miwl.monthly_indirect_work_load_id, miwl.indirect_work_case_id,
  miwl.business_unit_code, miwl.year_month, miwl.manhour, miwl.source,
  miwl.created_at, miwl.updated_at
`

export const monthlyIndirectWorkLoadData = {
  async findAll(indirectWorkCaseId: number): Promise<MonthlyIndirectWorkLoadRow[]> {
    const pool = await getPool()
    const result = await pool
      .request()
      .input('indirectWorkCaseId', sql.Int, indirectWorkCaseId)
      .query<MonthlyIndirectWorkLoadRow>(
        `SELECT ${SELECT_COLUMNS}
         FROM monthly_indirect_work_load miwl
         WHERE miwl.indirect_work_case_id = @indirectWorkCaseId
         ORDER BY miwl.business_unit_code ASC, miwl.year_month ASC`,
      )

    return result.recordset
  },

  async findById(monthlyIndirectWorkLoadId: number): Promise<MonthlyIndirectWorkLoadRow | undefined> {
    const pool = await getPool()
    const result = await pool
      .request()
      .input('monthlyIndirectWorkLoadId', sql.Int, monthlyIndirectWorkLoadId)
      .query<MonthlyIndirectWorkLoadRow>(
        `SELECT ${SELECT_COLUMNS}
         FROM monthly_indirect_work_load miwl
         WHERE miwl.monthly_indirect_work_load_id = @monthlyIndirectWorkLoadId`,
      )

    return result.recordset[0]
  },

  async create(data: {
    indirectWorkCaseId: number
    businessUnitCode: string
    yearMonth: string
    manhour: number
    source: string
  }): Promise<MonthlyIndirectWorkLoadRow> {
    const pool = await getPool()
    const insertResult = await pool
      .request()
      .input('indirectWorkCaseId', sql.Int, data.indirectWorkCaseId)
      .input('businessUnitCode', sql.VarChar(20), data.businessUnitCode)
      .input('yearMonth', sql.Char(6), data.yearMonth)
      .input('manhour', sql.Decimal(10, 2), data.manhour)
      .input('source', sql.VarChar(20), data.source)
      .query<{ monthly_indirect_work_load_id: number }>(
        `INSERT INTO monthly_indirect_work_load (
           indirect_work_case_id, business_unit_code, year_month, manhour, source
         )
         OUTPUT INSERTED.monthly_indirect_work_load_id
         VALUES (
           @indirectWorkCaseId, @businessUnitCode, @yearMonth, @manhour, @source
         )`,
      )

    const newId = insertResult.recordset[0].monthly_indirect_work_load_id
    const row = await this.findById(newId)
    return row!
  },

  async update(
    monthlyIndirectWorkLoadId: number,
    data: Partial<{
      businessUnitCode: string
      yearMonth: string
      manhour: number
      source: string
    }>,
  ): Promise<MonthlyIndirectWorkLoadRow | undefined> {
    const pool = await getPool()
    const setClauses: string[] = ['updated_at = GETDATE()']
    const request = pool
      .request()
      .input('monthlyIndirectWorkLoadId', sql.Int, monthlyIndirectWorkLoadId)

    if (data.businessUnitCode !== undefined) {
      setClauses.push('business_unit_code = @businessUnitCode')
      request.input('businessUnitCode', sql.VarChar(20), data.businessUnitCode)
    }
    if (data.yearMonth !== undefined) {
      setClauses.push('year_month = @yearMonth')
      request.input('yearMonth', sql.Char(6), data.yearMonth)
    }
    if (data.manhour !== undefined) {
      setClauses.push('manhour = @manhour')
      request.input('manhour', sql.Decimal(10, 2), data.manhour)
    }
    if (data.source !== undefined) {
      setClauses.push('source = @source')
      request.input('source', sql.VarChar(20), data.source)
    }

    await request.query(
      `UPDATE monthly_indirect_work_load
       SET ${setClauses.join(', ')}
       WHERE monthly_indirect_work_load_id = @monthlyIndirectWorkLoadId`,
    )

    return this.findById(monthlyIndirectWorkLoadId)
  },

  async deleteById(monthlyIndirectWorkLoadId: number): Promise<boolean> {
    const pool = await getPool()
    const result = await pool
      .request()
      .input('monthlyIndirectWorkLoadId', sql.Int, monthlyIndirectWorkLoadId)
      .query(
        `DELETE FROM monthly_indirect_work_load
         WHERE monthly_indirect_work_load_id = @monthlyIndirectWorkLoadId`,
      )

    return result.rowsAffected[0] > 0
  },

  async bulkUpsert(
    indirectWorkCaseId: number,
    items: Array<{ businessUnitCode: string; yearMonth: string; manhour: number; source: string }>,
  ): Promise<MonthlyIndirectWorkLoadRow[]> {
    const pool = await getPool()
    const transaction = new sql.Transaction(pool)

    try {
      await transaction.begin()

      for (const item of items) {
        const request = new sql.Request(transaction)
        await request
          .input('indirectWorkCaseId', sql.Int, indirectWorkCaseId)
          .input('businessUnitCode', sql.VarChar(20), item.businessUnitCode)
          .input('yearMonth', sql.Char(6), item.yearMonth)
          .input('manhour', sql.Decimal(10, 2), item.manhour)
          .input('source', sql.VarChar(20), item.source)
          .query(
            `MERGE monthly_indirect_work_load AS target
             USING (SELECT @indirectWorkCaseId AS indirect_work_case_id, @businessUnitCode AS business_unit_code, @yearMonth AS year_month) AS source
             ON target.indirect_work_case_id = source.indirect_work_case_id
                AND target.business_unit_code = source.business_unit_code
                AND target.year_month = source.year_month
             WHEN MATCHED THEN
               UPDATE SET manhour = @manhour, source = @source, updated_at = GETDATE()
             WHEN NOT MATCHED THEN
               INSERT (indirect_work_case_id, business_unit_code, year_month, manhour, source)
               VALUES (@indirectWorkCaseId, @businessUnitCode, @yearMonth, @manhour, @source);`,
          )
      }

      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }

    return this.findAll(indirectWorkCaseId)
  },

  async indirectWorkCaseExists(indirectWorkCaseId: number): Promise<boolean> {
    const pool = await getPool()
    const result = await pool
      .request()
      .input('indirectWorkCaseId', sql.Int, indirectWorkCaseId)
      .query<{ exists: boolean }>(
        `SELECT CASE
           WHEN EXISTS (SELECT 1 FROM indirect_work_cases WHERE indirect_work_case_id = @indirectWorkCaseId AND deleted_at IS NULL)
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
    if (businessUnitCodes.length === 0) return true

    const pool = await getPool()
    const uniqueCodes = [...new Set(businessUnitCodes)]
    const request = pool.request()

    const inClauses: string[] = []
    for (let i = 0; i < uniqueCodes.length; i++) {
      const paramName = `buCode${i}`
      request.input(paramName, sql.VarChar(20), uniqueCodes[i])
      inClauses.push(`@${paramName}`)
    }

    const result = await request.query<{ cnt: number }>(
      `SELECT COUNT(DISTINCT business_unit_code) AS cnt
       FROM business_units
       WHERE business_unit_code IN (${inClauses.join(', ')})
         AND deleted_at IS NULL`,
    )

    return result.recordset[0].cnt === uniqueCodes.length
  },

  async uniqueKeyExists(
    indirectWorkCaseId: number,
    businessUnitCode: string,
    yearMonth: string,
    excludeId?: number,
  ): Promise<boolean> {
    const pool = await getPool()
    const request = pool
      .request()
      .input('indirectWorkCaseId', sql.Int, indirectWorkCaseId)
      .input('businessUnitCode', sql.VarChar(20), businessUnitCode)
      .input('yearMonth', sql.Char(6), yearMonth)

    let excludeClause = ''
    if (excludeId !== undefined) {
      excludeClause = 'AND monthly_indirect_work_load_id <> @excludeId'
      request.input('excludeId', sql.Int, excludeId)
    }

    const result = await request.query<{ exists: boolean }>(
      `SELECT CASE
         WHEN EXISTS (
           SELECT 1 FROM monthly_indirect_work_load
           WHERE indirect_work_case_id = @indirectWorkCaseId
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
