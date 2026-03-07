import sql from "mssql";
import { getPool } from "@/database/client";
import type { ChartViewCapacityItemRow } from "@/types/chartViewCapacityItem";

const SELECT_COLUMNS = `
  i.chart_view_capacity_item_id, i.chart_view_id, i.capacity_scenario_id,
  i.is_visible, i.color_code, i.created_at, i.updated_at,
  cs.scenario_name
`;

export const chartViewCapacityItemData = {
	async findAll(chartViewId: number): Promise<ChartViewCapacityItemRow[]> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("chartViewId", sql.Int, chartViewId)
			.query<ChartViewCapacityItemRow>(
				`SELECT ${SELECT_COLUMNS}
         FROM chart_view_capacity_items i
         LEFT JOIN capacity_scenarios cs ON i.capacity_scenario_id = cs.capacity_scenario_id
         WHERE i.chart_view_id = @chartViewId
         ORDER BY i.capacity_scenario_id ASC`,
			);

		return result.recordset;
	},

	async bulkUpsert(
		chartViewId: number,
		items: Array<{
			capacityScenarioId: number;
			isVisible: boolean;
			colorCode: string | null;
		}>,
	): Promise<ChartViewCapacityItemRow[]> {
		const pool = await getPool();
		const transaction = new sql.Transaction(pool);

		try {
			await transaction.begin();

			for (const item of items) {
				const request = new sql.Request(transaction);
				await request
					.input("chartViewId", sql.Int, chartViewId)
					.input("capacityScenarioId", sql.Int, item.capacityScenarioId)
					.input("isVisible", sql.Bit, item.isVisible)
					.input("colorCode", sql.VarChar, item.colorCode)
					.query(
						`MERGE chart_view_capacity_items AS target
             USING (SELECT @chartViewId AS chart_view_id, @capacityScenarioId AS capacity_scenario_id) AS source
             ON target.chart_view_id = source.chart_view_id
                AND target.capacity_scenario_id = source.capacity_scenario_id
             WHEN MATCHED THEN
               UPDATE SET is_visible = @isVisible, color_code = @colorCode, updated_at = GETDATE()
             WHEN NOT MATCHED THEN
               INSERT (chart_view_id, capacity_scenario_id, is_visible, color_code)
               VALUES (@chartViewId, @capacityScenarioId, @isVisible, @colorCode);`,
					);
			}

			// リクエストに含まれないアイテムを削除（完全同期）
			if (items.length > 0) {
				const deleteRequest = new sql.Request(transaction);
				deleteRequest.input("chartViewId", sql.Int, chartViewId);

				const keepConditions = items.map((item, i) => {
					deleteRequest.input(`csid${i}`, sql.Int, item.capacityScenarioId);
					return `capacity_scenario_id = @csid${i}`;
				});

				await deleteRequest.query(
					`DELETE FROM chart_view_capacity_items
           WHERE chart_view_id = @chartViewId
             AND NOT (${keepConditions.join(" OR ")})`,
				);
			} else {
				const deleteRequest = new sql.Request(transaction);
				deleteRequest.input("chartViewId", sql.Int, chartViewId);
				await deleteRequest.query(
					`DELETE FROM chart_view_capacity_items WHERE chart_view_id = @chartViewId`,
				);
			}

			await transaction.commit();
		} catch (err) {
			await transaction.rollback();
			throw err;
		}

		return this.findAll(chartViewId);
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

	async capacityScenariosExist(
		capacityScenarioIds: number[],
	): Promise<boolean> {
		if (capacityScenarioIds.length === 0) return true;

		const pool = await getPool();
		const request = pool.request();
		const params = capacityScenarioIds.map((id, i) => {
			request.input(`id${i}`, sql.Int, id);
			return `@id${i}`;
		});

		const result = await request.query<{ cnt: number }>(
			`SELECT COUNT(DISTINCT capacity_scenario_id) AS cnt
       FROM capacity_scenarios
       WHERE capacity_scenario_id IN (${params.join(", ")})`,
		);

		return result.recordset[0].cnt === capacityScenarioIds.length;
	},
};
