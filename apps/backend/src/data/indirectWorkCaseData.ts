import sql from 'mssql'
import { getPool } from '@/database/client'
import type { IndirectWorkCaseRow } from '@/types/indirectWorkCase'

const BASE_SELECT = `
  iwc.indirect_work_case_id, iwc.case_name, iwc.is_primary,
  iwc.description, iwc.business_unit_code,
  bu.name AS business_unit_name,
  iwc.created_at, iwc.updated_at, iwc.deleted_at`

const FROM_WITH_JOIN = `
  FROM indirect_work_cases iwc
  LEFT JOIN business_units bu
    ON iwc.business_unit_code = bu.business_unit_code AND bu.deleted_at IS NULL`

export const indirectWorkCaseData = {
  async findAll(params: {
    page: number
    pageSize: number
    includeDisabled: boolean
  }): Promise<{ items: IndirectWorkCaseRow[]; totalCount: number }> {
    const pool = await getPool()
    const offset = (params.page - 1) * params.pageSize
    const whereClause = params.includeDisabled ? '' : 'WHERE iwc.deleted_at IS NULL'

    const itemsResult = await pool
      .request()
      .input('offset', sql.Int, offset)
      .input('pageSize', sql.Int, params.pageSize)
      .query<IndirectWorkCaseRow>(
        `SELECT ${BASE_SELECT}
         ${FROM_WITH_JOIN}
         ${whereClause}
         ORDER BY iwc.indirect_work_case_id ASC
         OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`,
      )

    const countResult = await pool
      .request()
      .query<{ totalCount: number }>(
        `SELECT COUNT(*) AS totalCount
         FROM indirect_work_cases iwc
         ${whereClause}`,
      )

    return {
      items: itemsResult.recordset,
      totalCount: countResult.recordset[0].totalCount,
    }
  },

  async findById(id: number): Promise<IndirectWorkCaseRow | undefined> {
    const pool = await getPool()
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query<IndirectWorkCaseRow>(
        `SELECT ${BASE_SELECT}
         ${FROM_WITH_JOIN}
         WHERE iwc.indirect_work_case_id = @id AND iwc.deleted_at IS NULL`,
      )

    return result.recordset[0]
  },

  async findByIdIncludingDeleted(id: number): Promise<IndirectWorkCaseRow | undefined> {
    const pool = await getPool()
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query<IndirectWorkCaseRow>(
        `SELECT ${BASE_SELECT}
         ${FROM_WITH_JOIN}
         WHERE iwc.indirect_work_case_id = @id`,
      )

    return result.recordset[0]
  },

  async create(data: {
    caseName: string
    isPrimary: boolean
    description: string | null
    businessUnitCode: string
  }): Promise<IndirectWorkCaseRow> {
    const pool = await getPool()
    const result = await pool
      .request()
      .input('caseName', sql.NVarChar, data.caseName)
      .input('isPrimary', sql.Bit, data.isPrimary)
      .input('description', sql.NVarChar, data.description)
      .input('businessUnitCode', sql.VarChar, data.businessUnitCode)
      .query<{ indirect_work_case_id: number }>(
        `INSERT INTO indirect_work_cases (case_name, is_primary, description, business_unit_code)
         OUTPUT INSERTED.indirect_work_case_id
         VALUES (@caseName, @isPrimary, @description, @businessUnitCode)`,
      )

    const id = result.recordset[0].indirect_work_case_id
    return (await indirectWorkCaseData.findById(id))!
  },

  async update(
    id: number,
    data: {
      caseName?: string
      isPrimary?: boolean
      description?: string | null
      businessUnitCode?: string
    },
  ): Promise<IndirectWorkCaseRow | undefined> {
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

    const result = await request.query<{ indirect_work_case_id: number }>(
      `UPDATE indirect_work_cases
       SET ${setClauses.join(', ')}
       OUTPUT INSERTED.indirect_work_case_id
       WHERE indirect_work_case_id = @id AND deleted_at IS NULL`,
    )

    if (result.recordset.length === 0) return undefined
    return indirectWorkCaseData.findById(id)
  },

  async softDelete(id: number): Promise<IndirectWorkCaseRow | undefined> {
    const pool = await getPool()
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query<IndirectWorkCaseRow>(
        `UPDATE indirect_work_cases
         SET deleted_at = GETDATE(), updated_at = GETDATE()
         OUTPUT INSERTED.indirect_work_case_id, INSERTED.case_name, INSERTED.is_primary,
                INSERTED.description, INSERTED.business_unit_code,
                NULL AS business_unit_name,
                INSERTED.created_at, INSERTED.updated_at, INSERTED.deleted_at
         WHERE indirect_work_case_id = @id AND deleted_at IS NULL`,
      )

    return result.recordset[0]
  },

  async restore(id: number): Promise<IndirectWorkCaseRow | undefined> {
    const pool = await getPool()
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query<IndirectWorkCaseRow>(
        `UPDATE indirect_work_cases
         SET deleted_at = NULL, updated_at = GETDATE()
         OUTPUT INSERTED.indirect_work_case_id, INSERTED.case_name, INSERTED.is_primary,
                INSERTED.description, INSERTED.business_unit_code,
                NULL AS business_unit_name,
                INSERTED.created_at, INSERTED.updated_at, INSERTED.deleted_at
         WHERE indirect_work_case_id = @id AND deleted_at IS NOT NULL`,
      )

    if (result.recordset.length === 0) return undefined
    return indirectWorkCaseData.findById(id)
  },

  async hasReferences(id: number): Promise<boolean> {
    const pool = await getPool()
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query<{ hasRef: boolean }>(
        `SELECT CASE
           WHEN EXISTS (SELECT 1 FROM monthly_indirect_work_load WHERE indirect_work_case_id = @id)
             OR EXISTS (SELECT 1 FROM indirect_work_type_ratios WHERE indirect_work_case_id = @id)
             OR EXISTS (SELECT 1 FROM chart_view_indirect_work_items WHERE indirect_work_case_id = @id)
           THEN CAST(1 AS BIT)
           ELSE CAST(0 AS BIT)
         END AS hasRef`,
      )

    return result.recordset[0].hasRef
  },
}
