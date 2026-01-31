import sql from 'mssql'
import { getPool } from '@/database/client'
import type { ChartViewProjectItemRow } from '@/types/chartViewProjectItem'

const SELECT_COLUMNS = `
  i.chart_view_project_item_id, i.chart_view_id, i.project_id, i.project_case_id,
  i.display_order, i.is_visible, i.created_at, i.updated_at,
  p.project_code, p.project_name,
  pc.case_name
`

export const chartViewProjectItemData = {
  async findAll(chartViewId: number): Promise<ChartViewProjectItemRow[]> {
    const pool = await getPool()
    const result = await pool
      .request()
      .input('chartViewId', sql.Int, chartViewId)
      .query<ChartViewProjectItemRow>(
        `SELECT ${SELECT_COLUMNS}
         FROM chart_view_project_items i
         INNER JOIN projects p ON i.project_id = p.project_id
         LEFT JOIN project_cases pc ON i.project_case_id = pc.project_case_id
         WHERE i.chart_view_id = @chartViewId
         ORDER BY i.display_order ASC`,
      )

    return result.recordset
  },

  async findById(id: number): Promise<ChartViewProjectItemRow | undefined> {
    const pool = await getPool()
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query<ChartViewProjectItemRow>(
        `SELECT ${SELECT_COLUMNS}
         FROM chart_view_project_items i
         INNER JOIN projects p ON i.project_id = p.project_id
         LEFT JOIN project_cases pc ON i.project_case_id = pc.project_case_id
         WHERE i.chart_view_project_item_id = @id`,
      )

    return result.recordset[0]
  },

  async create(data: {
    chartViewId: number
    projectId: number
    projectCaseId: number | null
    displayOrder: number
    isVisible: boolean
  }): Promise<ChartViewProjectItemRow> {
    const pool = await getPool()
    const insertResult = await pool
      .request()
      .input('chartViewId', sql.Int, data.chartViewId)
      .input('projectId', sql.Int, data.projectId)
      .input('projectCaseId', sql.Int, data.projectCaseId)
      .input('displayOrder', sql.Int, data.displayOrder)
      .input('isVisible', sql.Bit, data.isVisible)
      .query<{ chart_view_project_item_id: number }>(
        `INSERT INTO chart_view_project_items (
           chart_view_id, project_id, project_case_id, display_order, is_visible
         )
         OUTPUT INSERTED.chart_view_project_item_id
         VALUES (
           @chartViewId, @projectId, @projectCaseId, @displayOrder, @isVisible
         )`,
      )

    const newId = insertResult.recordset[0].chart_view_project_item_id
    const row = await this.findById(newId)
    return row!
  },

  async update(
    id: number,
    data: Partial<{
      projectCaseId: number | null
      displayOrder: number
      isVisible: boolean
    }>,
  ): Promise<ChartViewProjectItemRow | undefined> {
    const pool = await getPool()
    const setClauses: string[] = ['updated_at = GETDATE()']
    const request = pool.request().input('id', sql.Int, id)

    if (data.projectCaseId !== undefined) {
      setClauses.push('project_case_id = @projectCaseId')
      request.input('projectCaseId', sql.Int, data.projectCaseId)
    }
    if (data.displayOrder !== undefined) {
      setClauses.push('display_order = @displayOrder')
      request.input('displayOrder', sql.Int, data.displayOrder)
    }
    if (data.isVisible !== undefined) {
      setClauses.push('is_visible = @isVisible')
      request.input('isVisible', sql.Bit, data.isVisible)
    }

    await request.query(
      `UPDATE chart_view_project_items
       SET ${setClauses.join(', ')}
       WHERE chart_view_project_item_id = @id`,
    )

    return this.findById(id)
  },

  async deleteById(id: number): Promise<boolean> {
    const pool = await getPool()
    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(
        `DELETE FROM chart_view_project_items
         WHERE chart_view_project_item_id = @id`,
      )

    return result.rowsAffected[0] > 0
  },

  async updateDisplayOrders(
    items: Array<{ chartViewProjectItemId: number; displayOrder: number }>,
  ): Promise<void> {
    const pool = await getPool()
    const transaction = new sql.Transaction(pool)

    try {
      await transaction.begin()

      for (const item of items) {
        const request = new sql.Request(transaction)
        await request
          .input('id', sql.Int, item.chartViewProjectItemId)
          .input('displayOrder', sql.Int, item.displayOrder)
          .query(
            `UPDATE chart_view_project_items
             SET display_order = @displayOrder, updated_at = GETDATE()
             WHERE chart_view_project_item_id = @id`,
          )
      }

      await transaction.commit()
    } catch (err) {
      await transaction.rollback()
      throw err
    }
  },

  async chartViewExists(chartViewId: number): Promise<boolean> {
    const pool = await getPool()
    const result = await pool
      .request()
      .input('chartViewId', sql.Int, chartViewId)
      .query<{ exists: boolean }>(
        `SELECT CASE
           WHEN EXISTS (SELECT 1 FROM chart_views WHERE chart_view_id = @chartViewId AND deleted_at IS NULL)
           THEN CAST(1 AS BIT)
           ELSE CAST(0 AS BIT)
         END AS [exists]`,
      )

    return result.recordset[0].exists
  },

  async projectExists(projectId: number): Promise<boolean> {
    const pool = await getPool()
    const result = await pool
      .request()
      .input('projectId', sql.Int, projectId)
      .query<{ exists: boolean }>(
        `SELECT CASE
           WHEN EXISTS (SELECT 1 FROM projects WHERE project_id = @projectId AND deleted_at IS NULL)
           THEN CAST(1 AS BIT)
           ELSE CAST(0 AS BIT)
         END AS [exists]`,
      )

    return result.recordset[0].exists
  },

  async projectCaseBelongsToProject(
    projectCaseId: number,
    projectId: number,
  ): Promise<boolean> {
    const pool = await getPool()
    const result = await pool
      .request()
      .input('projectCaseId', sql.Int, projectCaseId)
      .input('projectId', sql.Int, projectId)
      .query<{ exists: boolean }>(
        `SELECT CASE
           WHEN EXISTS (
             SELECT 1 FROM project_cases
             WHERE project_case_id = @projectCaseId
               AND project_id = @projectId
               AND deleted_at IS NULL
           )
           THEN CAST(1 AS BIT)
           ELSE CAST(0 AS BIT)
         END AS [exists]`,
      )

    return result.recordset[0].exists
  },
}
