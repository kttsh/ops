import sql from 'mssql'
import { getPool } from '@/database/client'
import type { WorkTypeRow } from '@/types/workType'

export const workTypeData = {
  async findAll(params: {
    page: number
    pageSize: number
    includeDisabled: boolean
  }): Promise<{ items: WorkTypeRow[]; totalCount: number }> {
    const pool = await getPool()
    const offset = (params.page - 1) * params.pageSize
    const whereClause = params.includeDisabled ? '' : 'WHERE deleted_at IS NULL'

    const itemsResult = await pool
      .request()
      .input('offset', sql.Int, offset)
      .input('pageSize', sql.Int, params.pageSize)
      .query<WorkTypeRow>(
        `SELECT work_type_code, name, display_order, color, created_at, updated_at, deleted_at
         FROM work_types
         ${whereClause}
         ORDER BY display_order ASC
         OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`,
      )

    const countResult = await pool
      .request()
      .query<{ totalCount: number }>(
        `SELECT COUNT(*) AS totalCount FROM work_types ${whereClause}`,
      )

    return {
      items: itemsResult.recordset,
      totalCount: countResult.recordset[0].totalCount,
    }
  },

  async findByCode(code: string): Promise<WorkTypeRow | undefined> {
    const pool = await getPool()
    const result = await pool
      .request()
      .input('code', sql.VarChar, code)
      .query<WorkTypeRow>(
        `SELECT work_type_code, name, display_order, color, created_at, updated_at, deleted_at
         FROM work_types
         WHERE work_type_code = @code AND deleted_at IS NULL`,
      )

    return result.recordset[0]
  },

  async findByCodeIncludingDeleted(code: string): Promise<WorkTypeRow | undefined> {
    const pool = await getPool()
    const result = await pool
      .request()
      .input('code', sql.VarChar, code)
      .query<WorkTypeRow>(
        `SELECT work_type_code, name, display_order, color, created_at, updated_at, deleted_at
         FROM work_types
         WHERE work_type_code = @code`,
      )

    return result.recordset[0]
  },

  async create(data: {
    workTypeCode: string
    name: string
    displayOrder: number
    color?: string | null
  }): Promise<WorkTypeRow> {
    const pool = await getPool()
    const result = await pool
      .request()
      .input('workTypeCode', sql.VarChar, data.workTypeCode)
      .input('name', sql.NVarChar, data.name)
      .input('displayOrder', sql.Int, data.displayOrder)
      .input('color', sql.VarChar, data.color ?? null)
      .query<WorkTypeRow>(
        `INSERT INTO work_types (work_type_code, name, display_order, color)
         OUTPUT INSERTED.work_type_code, INSERTED.name, INSERTED.display_order,
                INSERTED.color, INSERTED.created_at, INSERTED.updated_at, INSERTED.deleted_at
         VALUES (@workTypeCode, @name, @displayOrder, @color)`,
      )

    return result.recordset[0]
  },

  async update(
    code: string,
    data: { name: string; displayOrder?: number; color?: string | null },
  ): Promise<WorkTypeRow | undefined> {
    const pool = await getPool()
    const setClauses = ['name = @name', 'updated_at = GETDATE()']
    const request = pool
      .request()
      .input('code', sql.VarChar, code)
      .input('name', sql.NVarChar, data.name)

    if (data.displayOrder !== undefined) {
      setClauses.push('display_order = @displayOrder')
      request.input('displayOrder', sql.Int, data.displayOrder)
    }

    if (data.color !== undefined) {
      setClauses.push('color = @color')
      request.input('color', sql.VarChar, data.color)
    }

    const result = await request.query<WorkTypeRow>(
      `UPDATE work_types
       SET ${setClauses.join(', ')}
       OUTPUT INSERTED.work_type_code, INSERTED.name, INSERTED.display_order,
              INSERTED.color, INSERTED.created_at, INSERTED.updated_at, INSERTED.deleted_at
       WHERE work_type_code = @code AND deleted_at IS NULL`,
    )

    return result.recordset[0]
  },

  async softDelete(code: string): Promise<WorkTypeRow | undefined> {
    const pool = await getPool()
    const result = await pool
      .request()
      .input('code', sql.VarChar, code)
      .query<WorkTypeRow>(
        `UPDATE work_types
         SET deleted_at = GETDATE(), updated_at = GETDATE()
         OUTPUT INSERTED.work_type_code, INSERTED.name, INSERTED.display_order,
                INSERTED.color, INSERTED.created_at, INSERTED.updated_at, INSERTED.deleted_at
         WHERE work_type_code = @code AND deleted_at IS NULL`,
      )

    return result.recordset[0]
  },

  async restore(code: string): Promise<WorkTypeRow | undefined> {
    const pool = await getPool()
    const result = await pool
      .request()
      .input('code', sql.VarChar, code)
      .query<WorkTypeRow>(
        `UPDATE work_types
         SET deleted_at = NULL, updated_at = GETDATE()
         OUTPUT INSERTED.work_type_code, INSERTED.name, INSERTED.display_order,
                INSERTED.color, INSERTED.created_at, INSERTED.updated_at, INSERTED.deleted_at
         WHERE work_type_code = @code AND deleted_at IS NOT NULL`,
      )

    return result.recordset[0]
  },

  async hasReferences(code: string): Promise<boolean> {
    const pool = await getPool()
    const result = await pool
      .request()
      .input('code', sql.VarChar, code)
      .query<{ hasRef: boolean }>(
        `SELECT CASE
           WHEN EXISTS (SELECT 1 FROM indirect_work_type_ratios WHERE work_type_code = @code)
           THEN CAST(1 AS BIT)
           ELSE CAST(0 AS BIT)
         END AS hasRef`,
      )

    return result.recordset[0].hasRef
  },
}
