import sql from "mssql";
import { getPool } from "@/database/client";
import type { ChartViewIndirectWorkItemRow } from "@/types/chartViewIndirectWorkItem";

const SELECT_COLUMNS = `
  i.chart_view_indirect_work_item_id, i.chart_view_id, i.indirect_work_case_id,
  i.display_order, i.is_visible, i.created_at, i.updated_at,
  c.case_name
`;

export const chartViewIndirectWorkItemData = {
	async findAll(chartViewId: number): Promise<ChartViewIndirectWorkItemRow[]> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("chartViewId", sql.Int, chartViewId)
			.query<ChartViewIndirectWorkItemRow>(
				`SELECT ${SELECT_COLUMNS}
         FROM chart_view_indirect_work_items i
         LEFT JOIN indirect_work_cases c ON i.indirect_work_case_id = c.indirect_work_case_id
         WHERE i.chart_view_id = @chartViewId
         ORDER BY i.display_order ASC`,
			);

		return result.recordset;
	},

	async findById(
		id: number,
	): Promise<ChartViewIndirectWorkItemRow | undefined> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("id", sql.Int, id)
			.query<ChartViewIndirectWorkItemRow>(
				`SELECT ${SELECT_COLUMNS}
         FROM chart_view_indirect_work_items i
         LEFT JOIN indirect_work_cases c ON i.indirect_work_case_id = c.indirect_work_case_id
         WHERE i.chart_view_indirect_work_item_id = @id`,
			);

		return result.recordset[0];
	},

	async create(data: {
		chartViewId: number;
		indirectWorkCaseId: number;
		displayOrder: number;
		isVisible: boolean;
	}): Promise<ChartViewIndirectWorkItemRow> {
		const pool = await getPool();
		const insertResult = await pool
			.request()
			.input("chartViewId", sql.Int, data.chartViewId)
			.input("indirectWorkCaseId", sql.Int, data.indirectWorkCaseId)
			.input("displayOrder", sql.Int, data.displayOrder)
			.input("isVisible", sql.Bit, data.isVisible)
			.query<{ chart_view_indirect_work_item_id: number }>(
				`INSERT INTO chart_view_indirect_work_items (
           chart_view_id, indirect_work_case_id, display_order, is_visible
         )
         OUTPUT INSERTED.chart_view_indirect_work_item_id
         VALUES (
           @chartViewId, @indirectWorkCaseId, @displayOrder, @isVisible
         )`,
			);

		const newId = insertResult.recordset[0].chart_view_indirect_work_item_id;
		const row = await this.findById(newId);
		return row!;
	},

	async update(
		id: number,
		data: Partial<{
			displayOrder: number;
			isVisible: boolean;
		}>,
	): Promise<ChartViewIndirectWorkItemRow | undefined> {
		const pool = await getPool();
		const setClauses: string[] = ["updated_at = GETDATE()"];
		const request = pool.request().input("id", sql.Int, id);

		if (data.displayOrder !== undefined) {
			setClauses.push("display_order = @displayOrder");
			request.input("displayOrder", sql.Int, data.displayOrder);
		}
		if (data.isVisible !== undefined) {
			setClauses.push("is_visible = @isVisible");
			request.input("isVisible", sql.Bit, data.isVisible);
		}

		await request.query(
			`UPDATE chart_view_indirect_work_items
       SET ${setClauses.join(", ")}
       WHERE chart_view_indirect_work_item_id = @id`,
		);

		return this.findById(id);
	},

	async deleteById(id: number): Promise<boolean> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("id", sql.Int, id)
			.query(
				`DELETE FROM chart_view_indirect_work_items
         WHERE chart_view_indirect_work_item_id = @id`,
			);

		return result.rowsAffected[0] > 0;
	},

	async chartViewExists(chartViewId: number): Promise<boolean> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("chartViewId", sql.Int, chartViewId)
			.query<{ exists: boolean }>(
				`SELECT CASE
           WHEN EXISTS (SELECT 1 FROM chart_views WHERE chart_view_id = @chartViewId AND deleted_at IS NULL)
           THEN CAST(1 AS BIT)
           ELSE CAST(0 AS BIT)
         END AS [exists]`,
			);

		return result.recordset[0].exists;
	},

	async indirectWorkCaseExists(indirectWorkCaseId: number): Promise<boolean> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("indirectWorkCaseId", sql.Int, indirectWorkCaseId)
			.query<{ exists: boolean }>(
				`SELECT CASE
           WHEN EXISTS (SELECT 1 FROM indirect_work_cases WHERE indirect_work_case_id = @indirectWorkCaseId AND deleted_at IS NULL)
           THEN CAST(1 AS BIT)
           ELSE CAST(0 AS BIT)
         END AS [exists]`,
			);

		return result.recordset[0].exists;
	},

	async duplicateExists(
		chartViewId: number,
		indirectWorkCaseId: number,
		excludeId?: number,
	): Promise<boolean> {
		const pool = await getPool();
		const request = pool
			.request()
			.input("chartViewId", sql.Int, chartViewId)
			.input("indirectWorkCaseId", sql.Int, indirectWorkCaseId);

		let excludeClause = "";
		if (excludeId !== undefined) {
			excludeClause = "AND chart_view_indirect_work_item_id <> @excludeId";
			request.input("excludeId", sql.Int, excludeId);
		}

		const result = await request.query<{ exists: boolean }>(
			`SELECT CASE
         WHEN EXISTS (
           SELECT 1 FROM chart_view_indirect_work_items
           WHERE chart_view_id = @chartViewId
             AND indirect_work_case_id = @indirectWorkCaseId
             ${excludeClause}
         )
         THEN CAST(1 AS BIT)
         ELSE CAST(0 AS BIT)
       END AS [exists]`,
		);

		return result.recordset[0].exists;
	},
};
