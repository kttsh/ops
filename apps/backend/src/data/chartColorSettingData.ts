import sql from "mssql";
import { getPool } from "@/database/client";
import type { ChartColorSettingRow } from "@/types/chartColorSetting";

const BASE_SELECT = `
  chart_color_setting_id, target_type, target_code,
  color_code, created_at, updated_at
`;

export const chartColorSettingData = {
	async findAll(params: {
		page: number;
		pageSize: number;
		targetType?: string;
	}): Promise<{ items: ChartColorSettingRow[]; totalCount: number }> {
		const pool = await getPool();
		const offset = (params.page - 1) * params.pageSize;

		const request = pool
			.request()
			.input("offset", sql.Int, offset)
			.input("pageSize", sql.Int, params.pageSize);

		let whereClause = "";
		if (params.targetType) {
			whereClause = "WHERE target_type = @targetType";
			request.input("targetType", sql.VarChar, params.targetType);
		}

		const itemsResult = await request.query<ChartColorSettingRow>(
			`SELECT ${BASE_SELECT}
       FROM chart_color_settings
       ${whereClause}
       ORDER BY chart_color_setting_id ASC
       OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`,
		);

		const countRequest = pool.request();
		if (params.targetType) {
			countRequest.input("targetType", sql.VarChar, params.targetType);
		}

		const countResult = await countRequest.query<{ totalCount: number }>(
			`SELECT COUNT(*) AS totalCount FROM chart_color_settings ${whereClause}`,
		);

		return {
			items: itemsResult.recordset,
			totalCount: countResult.recordset[0].totalCount,
		};
	},

	async findById(id: number): Promise<ChartColorSettingRow | undefined> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("id", sql.Int, id)
			.query<ChartColorSettingRow>(
				`SELECT ${BASE_SELECT}
         FROM chart_color_settings
         WHERE chart_color_setting_id = @id`,
			);

		return result.recordset[0];
	},

	async findByTarget(
		targetType: string,
		targetCode: string,
	): Promise<ChartColorSettingRow | undefined> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("targetType", sql.VarChar, targetType)
			.input("targetCode", sql.VarChar, targetCode)
			.query<ChartColorSettingRow>(
				`SELECT ${BASE_SELECT}
         FROM chart_color_settings
         WHERE target_type = @targetType AND target_code = @targetCode`,
			);

		return result.recordset[0];
	},

	async findByTargetExcluding(
		targetType: string,
		targetCode: string,
		excludeId: number,
	): Promise<ChartColorSettingRow | undefined> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("targetType", sql.VarChar, targetType)
			.input("targetCode", sql.VarChar, targetCode)
			.input("excludeId", sql.Int, excludeId)
			.query<ChartColorSettingRow>(
				`SELECT ${BASE_SELECT}
         FROM chart_color_settings
         WHERE target_type = @targetType
           AND target_code = @targetCode
           AND chart_color_setting_id <> @excludeId`,
			);

		return result.recordset[0];
	},

	async create(data: {
		targetType: string;
		targetCode: string;
		colorCode: string;
	}): Promise<ChartColorSettingRow> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("targetType", sql.VarChar, data.targetType)
			.input("targetCode", sql.VarChar, data.targetCode)
			.input("colorCode", sql.VarChar, data.colorCode)
			.query<ChartColorSettingRow>(
				`INSERT INTO chart_color_settings (target_type, target_code, color_code)
         OUTPUT INSERTED.chart_color_setting_id, INSERTED.target_type, INSERTED.target_code,
                INSERTED.color_code, INSERTED.created_at, INSERTED.updated_at
         VALUES (@targetType, @targetCode, @colorCode)`,
			);

		return result.recordset[0];
	},

	async update(
		id: number,
		data: Partial<{
			targetType: string;
			targetCode: string;
			colorCode: string;
		}>,
	): Promise<ChartColorSettingRow | undefined> {
		const pool = await getPool();
		const setClauses: string[] = ["updated_at = GETDATE()"];
		const request = pool.request().input("id", sql.Int, id);

		if (data.targetType !== undefined) {
			setClauses.push("target_type = @targetType");
			request.input("targetType", sql.VarChar, data.targetType);
		}
		if (data.targetCode !== undefined) {
			setClauses.push("target_code = @targetCode");
			request.input("targetCode", sql.VarChar, data.targetCode);
		}
		if (data.colorCode !== undefined) {
			setClauses.push("color_code = @colorCode");
			request.input("colorCode", sql.VarChar, data.colorCode);
		}

		const result = await request.query<ChartColorSettingRow>(
			`UPDATE chart_color_settings
       SET ${setClauses.join(", ")}
       OUTPUT INSERTED.chart_color_setting_id, INSERTED.target_type, INSERTED.target_code,
              INSERTED.color_code, INSERTED.created_at, INSERTED.updated_at
       WHERE chart_color_setting_id = @id`,
		);

		return result.recordset[0];
	},

	async hardDelete(id: number): Promise<boolean> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("id", sql.Int, id)
			.query(
				`DELETE FROM chart_color_settings
         WHERE chart_color_setting_id = @id`,
			);

		return result.rowsAffected[0] > 0;
	},

	async bulkUpsert(
		items: Array<{
			targetType: string;
			targetCode: string;
			colorCode: string;
		}>,
	): Promise<ChartColorSettingRow[]> {
		const pool = await getPool();
		const transaction = new sql.Transaction(pool);

		try {
			await transaction.begin();

			const results: ChartColorSettingRow[] = [];

			for (const item of items) {
				const result = await transaction
					.request()
					.input("targetType", sql.VarChar, item.targetType)
					.input("targetCode", sql.VarChar, item.targetCode)
					.input("colorCode", sql.VarChar, item.colorCode)
					.query<ChartColorSettingRow>(
						`MERGE chart_color_settings AS target
             USING (SELECT @targetType AS target_type, @targetCode AS target_code) AS source
             ON target.target_type = source.target_type AND target.target_code = source.target_code
             WHEN MATCHED THEN
               UPDATE SET color_code = @colorCode, updated_at = GETDATE()
             WHEN NOT MATCHED THEN
               INSERT (target_type, target_code, color_code)
               VALUES (@targetType, @targetCode, @colorCode)
             OUTPUT INSERTED.chart_color_setting_id, INSERTED.target_type, INSERTED.target_code,
                    INSERTED.color_code, INSERTED.created_at, INSERTED.updated_at;`,
					);

				results.push(result.recordset[0]);
			}

			await transaction.commit();
			return results;
		} catch (err) {
			await transaction.rollback();
			throw err;
		}
	},
};
