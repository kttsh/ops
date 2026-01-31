import sql from 'mssql'
import { getPool } from '@/database/client'
import type { HeadcountPlanCaseRow } from '@/types/headcountPlanCase'

const BASE_SELECT = `
  hpc.headcount_plan_case_id, hpc.case_name, hpc.is_primary,
  hpc.description, hpc.business_unit_code,
  bu.name AS business_unit_name,
  hpc.created_at, hpc.updated_at, hpc.deleted_at`

const FROM_WITH_JOIN = `
  FROM headcount_plan_cases hpc
  LEFT JOIN business_units bu
    ON hpc.business_unit_code = bu.business_unit_code AND bu.deleted_at IS NULL`

export const headcountPlanCaseData = {
  async findAll(params: {
    page: number
    pageSize: number
    includeDisabled: boolean
  }): Promise<{ items: HeadcountPlanCaseRow[]; totalCount: number }> {
    const pool = await getPool()
    const offset = (params.page - 1) * params.pageSize
    const whereClause = params.includeDisabled ? '' : 'WHERE hpc.deleted_at IS NULL'

    const itemsResult = await pool
      .request()
      .input('offset', sql.Int, offset)
      .input('pageSize', sql.Int, params.pageSize)
      .query<HeadcountPlanCaseRow>(
        `SELECT ${BASE_SELECT}
         ${FROM_WITH_JOIN}
         ${whereClause}
         ORDER BY hpc.headcount_plan_case_id ASC
         OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`,
      )

    const countResult = await pool
      .request()
      .query<{ totalCount: number }>(
        `SELECT COUNT(*) AS totalCount
         FROM headcount_plan_cases hpc
         ${whereClause}`,
      )

    return {
      items: itemsResult.recordset,
      totalCount: countResult.recordset[0].totalCount,
    }
  },

  async findById(id: number): Promise<HeadcountPlanCaseRow | undefined> {
    const pool = await getPool()
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query<HeadcountPlanCaseRow>(
        `SELECT ${BASE_SELECT}
         ${FROM_WITH_JOIN}
         WHERE hpc.headcount_plan_case_id = @id AND hpc.deleted_at IS NULL`,
      )

    return result.recordset[0]
  },

  async findByIdIncludingDeleted(id: number): Promise<HeadcountPlanCaseRow | undefined> {
    const pool = await getPool()
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query<HeadcountPlanCaseRow>(
        `SELECT ${BASE_SELECT}
         ${FROM_WITH_JOIN}
         WHERE hpc.headcount_plan_case_id = @id`,
      )

    return result.recordset[0]
  },

  async create(data: {
    caseName: string
    isPrimary: boolean
    description: string | null
    businessUnitCode: string | null
  }): Promise<HeadcountPlanCaseRow> {
    const pool = await getPool()
    const result = await pool
      .request()
      .input('caseName', sql.NVarChar, data.caseName)
      .input('isPrimary', sql.Bit, data.isPrimary)
      .input('description', sql.NVarChar, data.description)
      .input('businessUnitCode', sql.VarChar, data.businessUnitCode)
      .query<{ headcount_plan_case_id: number }>(
        `INSERT INTO headcount_plan_cases (case_name, is_primary, description, business_unit_code)
         OUTPUT INSERTED.headcount_plan_case_id
         VALUES (@caseName, @isPrimary, @description, @businessUnitCode)`,
      )

    const id = result.recordset[0].headcount_plan_case_id
    return (await headcountPlanCaseData.findById(id))!
  },

  async update(
    id: number,
    data: {
      caseName?: string
      isPrimary?: boolean
      description?: string | null
      businessUnitCode?: string | null
    },
  ): Promise<HeadcountPlanCaseRow | undefined> {
    const pool = await getPool()
    const setClauses = ['updated_at = GETDATE()']
    const request = pool.request().input('id', sql.Int, id)

    if (data.caseName !== undefined) {
      setClauses.push('case_name = @caseName')
      request.input('caseName', sql.NVarChar, data.caseName)
    }
    if (data.isPrimary !== undefined) {
      setClauses.push('is_primary = @isPrimary')
      request.input('isPrimary', sql.Bit, data.isPrimary)
    }
    if (data.description !== undefined) {
      setClauses.push('description = @description')
      request.input('description', sql.NVarChar, data.description)
    }
    if (data.businessUnitCode !== undefined) {
      setClauses.push('business_unit_code = @businessUnitCode')
      request.input('businessUnitCode', sql.VarChar, data.businessUnitCode)
    }

    const result = await request.query<{ headcount_plan_case_id: number }>(
      `UPDATE headcount_plan_cases
       SET ${setClauses.join(', ')}
       OUTPUT INSERTED.headcount_plan_case_id
       WHERE headcount_plan_case_id = @id AND deleted_at IS NULL`,
    )

    if (result.recordset.length === 0) return undefined
    return headcountPlanCaseData.findById(id)
  },

  async softDelete(id: number): Promise<HeadcountPlanCaseRow | undefined> {
    const pool = await getPool()
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query<HeadcountPlanCaseRow>(
        `UPDATE headcount_plan_cases
         SET deleted_at = GETDATE(), updated_at = GETDATE()
         OUTPUT INSERTED.headcount_plan_case_id, INSERTED.case_name, INSERTED.is_primary,
                INSERTED.description, INSERTED.business_unit_code,
                NULL AS business_unit_name,
                INSERTED.created_at, INSERTED.updated_at, INSERTED.deleted_at
         WHERE headcount_plan_case_id = @id AND deleted_at IS NULL`,
      )

    return result.recordset[0]
  },

  async restore(id: number): Promise<HeadcountPlanCaseRow | undefined> {
    const pool = await getPool()
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query<HeadcountPlanCaseRow>(
        `UPDATE headcount_plan_cases
         SET deleted_at = NULL, updated_at = GETDATE()
         OUTPUT INSERTED.headcount_plan_case_id, INSERTED.case_name, INSERTED.is_primary,
                INSERTED.description, INSERTED.business_unit_code,
                NULL AS business_unit_name,
                INSERTED.created_at, INSERTED.updated_at, INSERTED.deleted_at
         WHERE headcount_plan_case_id = @id AND deleted_at IS NOT NULL`,
      )

    if (result.recordset.length === 0) return undefined
    return headcountPlanCaseData.findById(id)
  },

  async hasReferences(id: number): Promise<boolean> {
    const pool = await getPool()
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query<{ hasRef: boolean }>(
        `SELECT CASE
           WHEN EXISTS (SELECT 1 FROM monthly_headcount_plan WHERE headcount_plan_case_id = @id)
           THEN CAST(1 AS BIT)
           ELSE CAST(0 AS BIT)
         END AS hasRef`,
      )

    return result.recordset[0].hasRef
  },
}
