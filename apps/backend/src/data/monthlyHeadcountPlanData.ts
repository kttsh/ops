import sql from 'mssql'
import { getPool } from '@/database/client'
import type { MonthlyHeadcountPlanRow } from '@/types/monthlyHeadcountPlan'

const SELECT_COLUMNS = `
  mhp.monthly_headcount_plan_id, mhp.headcount_plan_case_id, mhp.business_unit_code,
  mhp.year_month, mhp.headcount, mhp.created_at, mhp.updated_at
`

export const monthlyHeadcountPlanData = {
  async findAll(headcountPlanCaseId: number, businessUnitCode?: string): Promise<MonthlyHeadcountPlanRow[]> {
    const pool = await getPool()
    const request = pool
      .request()
      .input('headcountPlanCaseId', sql.Int, headcountPlanCaseId)

    let whereClause = 'WHERE mhp.headcount_plan_case_id = @headcountPlanCaseId'
    if (businessUnitCode !== undefined) {
      whereClause += ' AND mhp.business_unit_code = @businessUnitCode'
      request.input('businessUnitCode', sql.VarChar(20), businessUnitCode)
    }

    const result = await request.query<MonthlyHeadcountPlanRow>(
      `SELECT ${SELECT_COLUMNS}
       FROM monthly_headcount_plan mhp
       ${whereClause}
       ORDER BY mhp.business_unit_code ASC, mhp.year_month ASC`,
    )

    return result.recordset
  },

  async findById(monthlyHeadcountPlanId: number): Promise<MonthlyHeadcountPlanRow | undefined> {
    const pool = await getPool()
    const result = await pool
      .request()
      .input('monthlyHeadcountPlanId', sql.Int, monthlyHeadcountPlanId)
      .query<MonthlyHeadcountPlanRow>(
        `SELECT ${SELECT_COLUMNS}
         FROM monthly_headcount_plan mhp
         WHERE mhp.monthly_headcount_plan_id = @monthlyHeadcountPlanId`,
      )

    return result.recordset[0]
  },

  async create(data: {
    headcountPlanCaseId: number
    businessUnitCode: string
    yearMonth: string
    headcount: number
  }): Promise<MonthlyHeadcountPlanRow> {
    const pool = await getPool()
    const insertResult = await pool
      .request()
      .input('headcountPlanCaseId', sql.Int, data.headcountPlanCaseId)
      .input('businessUnitCode', sql.VarChar(20), data.businessUnitCode)
      .input('yearMonth', sql.Char(6), data.yearMonth)
      .input('headcount', sql.Int, data.headcount)
      .query<{ monthly_headcount_plan_id: number }>(
        `INSERT INTO monthly_headcount_plan (
           headcount_plan_case_id, business_unit_code, year_month, headcount
         )
         OUTPUT INSERTED.monthly_headcount_plan_id
         VALUES (
           @headcountPlanCaseId, @businessUnitCode, @yearMonth, @headcount
         )`,
      )

    const newId = insertResult.recordset[0].monthly_headcount_plan_id
    const row = await this.findById(newId)
    return row!
  },

  async update(
    monthlyHeadcountPlanId: number,
    data: Partial<{
      businessUnitCode: string
      yearMonth: string
      headcount: number
    }>,
  ): Promise<MonthlyHeadcountPlanRow | undefined> {
    const pool = await getPool()
    const setClauses: string[] = ['updated_at = GETDATE()']
    const request = pool
      .request()
      .input('monthlyHeadcountPlanId', sql.Int, monthlyHeadcountPlanId)

    if (data.businessUnitCode !== undefined) {
      setClauses.push('business_unit_code = @businessUnitCode')
      request.input('businessUnitCode', sql.VarChar(20), data.businessUnitCode)
    }
    if (data.yearMonth !== undefined) {
      setClauses.push('year_month = @yearMonth')
      request.input('yearMonth', sql.Char(6), data.yearMonth)
    }
    if (data.headcount !== undefined) {
      setClauses.push('headcount = @headcount')
      request.input('headcount', sql.Int, data.headcount)
    }

    await request.query(
      `UPDATE monthly_headcount_plan
       SET ${setClauses.join(', ')}
       WHERE monthly_headcount_plan_id = @monthlyHeadcountPlanId`,
    )

    return this.findById(monthlyHeadcountPlanId)
  },

  async deleteById(monthlyHeadcountPlanId: number): Promise<boolean> {
    const pool = await getPool()
    const result = await pool
      .request()
      .input('monthlyHeadcountPlanId', sql.Int, monthlyHeadcountPlanId)
      .query(
        `DELETE FROM monthly_headcount_plan
         WHERE monthly_headcount_plan_id = @monthlyHeadcountPlanId`,
      )

    return result.rowsAffected[0] > 0
  },

  async bulkUpsert(
    headcountPlanCaseId: number,
    items: Array<{ businessUnitCode: string; yearMonth: string; headcount: number }>,
  ): Promise<MonthlyHeadcountPlanRow[]> {
    const pool = await getPool()
    const transaction = new sql.Transaction(pool)

    try {
      await transaction.begin()

      for (const item of items) {
        const request = new sql.Request(transaction)
        await request
          .input('headcountPlanCaseId', sql.Int, headcountPlanCaseId)
          .input('businessUnitCode', sql.VarChar(20), item.businessUnitCode)
          .input('yearMonth', sql.Char(6), item.yearMonth)
          .input('headcount', sql.Int, item.headcount)
          .query(
            `MERGE monthly_headcount_plan AS target
             USING (SELECT @headcountPlanCaseId AS headcount_plan_case_id, @businessUnitCode AS business_unit_code, @yearMonth AS year_month) AS source
             ON target.headcount_plan_case_id = source.headcount_plan_case_id
                AND target.business_unit_code = source.business_unit_code
                AND target.year_month = source.year_month
             WHEN MATCHED THEN
               UPDATE SET headcount = @headcount, updated_at = GETDATE()
             WHEN NOT MATCHED THEN
               INSERT (headcount_plan_case_id, business_unit_code, year_month, headcount)
               VALUES (@headcountPlanCaseId, @businessUnitCode, @yearMonth, @headcount);`,
          )
      }

      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }

    return this.findAll(headcountPlanCaseId)
  },

  async headcountPlanCaseExists(headcountPlanCaseId: number): Promise<boolean> {
    const pool = await getPool()
    const result = await pool
      .request()
      .input('headcountPlanCaseId', sql.Int, headcountPlanCaseId)
      .query<{ exists: boolean }>(
        `SELECT CASE
           WHEN EXISTS (SELECT 1 FROM headcount_plan_cases WHERE headcount_plan_case_id = @headcountPlanCaseId AND deleted_at IS NULL)
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
    const request = pool.request()

    const params: string[] = []
    businessUnitCodes.forEach((code, index) => {
      const paramName = `buCode${index}`
      params.push(`@${paramName}`)
      request.input(paramName, sql.VarChar(20), code)
    })

    const result = await request.query<{ count: number }>(
      `SELECT COUNT(DISTINCT business_unit_code) AS [count]
       FROM business_units
       WHERE business_unit_code IN (${params.join(', ')})
         AND deleted_at IS NULL`,
    )

    const uniqueCodes = new Set(businessUnitCodes)
    return result.recordset[0].count === uniqueCodes.size
  },

  async uniqueConstraintExists(
    headcountPlanCaseId: number,
    businessUnitCode: string,
    yearMonth: string,
    excludeId?: number,
  ): Promise<boolean> {
    const pool = await getPool()
    const request = pool
      .request()
      .input('headcountPlanCaseId', sql.Int, headcountPlanCaseId)
      .input('businessUnitCode', sql.VarChar(20), businessUnitCode)
      .input('yearMonth', sql.Char(6), yearMonth)

    let excludeClause = ''
    if (excludeId !== undefined) {
      excludeClause = 'AND monthly_headcount_plan_id <> @excludeId'
      request.input('excludeId', sql.Int, excludeId)
    }

    const result = await request.query<{ exists: boolean }>(
      `SELECT CASE
         WHEN EXISTS (
           SELECT 1 FROM monthly_headcount_plan
           WHERE headcount_plan_case_id = @headcountPlanCaseId
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
