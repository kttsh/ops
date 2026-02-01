import sql from "mssql";
import { getPool } from "@/database/client";
import type { ChartViewRow } from "@/types/chartView";

const BASE_SELECT = `
  chart_view_id, view_name, chart_type,
  start_year_month, end_year_month, is_default,
  description, business_unit_codes, created_at, updated_at, deleted_at`;

export const chartViewData = {
	async findAll(params: {
		page: number;
		pageSize: number;
		includeDisabled: boolean;
	}): Promise<{ items: ChartViewRow[]; totalCount: number }> {
		const pool = await getPool();
		const offset = (params.page - 1) * params.pageSize;
		const whereClause = params.includeDisabled
			? ""
			: "WHERE deleted_at IS NULL";

		const itemsResult = await pool
			.request()
			.input("offset", sql.Int, offset)
			.input("pageSize", sql.Int, params.pageSize)
			.query<ChartViewRow>(
				`SELECT ${BASE_SELECT}
         FROM chart_views
         ${whereClause}
         ORDER BY chart_view_id ASC
         OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`,
			);

		const countResult = await pool.request().query<{ totalCount: number }>(
			`SELECT COUNT(*) AS totalCount
         FROM chart_views
         ${whereClause}`,
		);

		return {
			items: itemsResult.recordset,
			totalCount: countResult.recordset[0].totalCount,
		};
	},

	async findById(id: number): Promise<ChartViewRow | undefined> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("id", sql.Int, id)
			.query<ChartViewRow>(
				`SELECT ${BASE_SELECT}
         FROM chart_views
         WHERE chart_view_id = @id AND deleted_at IS NULL`,
			);

		return result.recordset[0];
	},

	async findByIdIncludingDeleted(
		id: number,
	): Promise<ChartViewRow | undefined> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("id", sql.Int, id)
			.query<ChartViewRow>(
				`SELECT ${BASE_SELECT}
         FROM chart_views
         WHERE chart_view_id = @id`,
			);

		return result.recordset[0];
	},

	async create(data: {
		viewName: string;
		chartType: string;
		startYearMonth: string;
		endYearMonth: string;
		isDefault: boolean;
		description: string | null;
		businessUnitCodes?: string[];
	}): Promise<ChartViewRow> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("viewName", sql.NVarChar, data.viewName)
			.input("chartType", sql.VarChar, data.chartType)
			.input("startYearMonth", sql.Char, data.startYearMonth)
			.input("endYearMonth", sql.Char, data.endYearMonth)
			.input("isDefault", sql.Bit, data.isDefault)
			.input("description", sql.NVarChar, data.description)
			.input(
				"businessUnitCodes",
				sql.NVarChar,
				data.businessUnitCodes
					? JSON.stringify(data.businessUnitCodes)
					: null,
			)
			.query<ChartViewRow>(
				`INSERT INTO chart_views (view_name, chart_type, start_year_month, end_year_month, is_default, description, business_unit_codes)
         OUTPUT INSERTED.chart_view_id, INSERTED.view_name, INSERTED.chart_type,
                INSERTED.start_year_month, INSERTED.end_year_month, INSERTED.is_default,
                INSERTED.description, INSERTED.business_unit_codes, INSERTED.created_at, INSERTED.updated_at, INSERTED.deleted_at
         VALUES (@viewName, @chartType, @startYearMonth, @endYearMonth, @isDefault, @description, @businessUnitCodes)`,
			);

		return result.recordset[0];
	},

	async update(
		id: number,
		data: {
			viewName?: string;
			chartType?: string;
			startYearMonth?: string;
			endYearMonth?: string;
			isDefault?: boolean;
			description?: string | null;
			businessUnitCodes?: string[];
		},
	): Promise<ChartViewRow | undefined> {
		const pool = await getPool();
		const setClauses = ["updated_at = GETDATE()"];
		const request = pool.request().input("id", sql.Int, id);

		if (data.viewName !== undefined) {
			setClauses.push("view_name = @viewName");
			request.input("viewName", sql.NVarChar, data.viewName);
		}
		if (data.chartType !== undefined) {
			setClauses.push("chart_type = @chartType");
			request.input("chartType", sql.VarChar, data.chartType);
		}
		if (data.startYearMonth !== undefined) {
			setClauses.push("start_year_month = @startYearMonth");
			request.input("startYearMonth", sql.Char, data.startYearMonth);
		}
		if (data.endYearMonth !== undefined) {
			setClauses.push("end_year_month = @endYearMonth");
			request.input("endYearMonth", sql.Char, data.endYearMonth);
		}
		if (data.isDefault !== undefined) {
			setClauses.push("is_default = @isDefault");
			request.input("isDefault", sql.Bit, data.isDefault);
		}
		if (data.description !== undefined) {
			setClauses.push("description = @description");
			request.input("description", sql.NVarChar, data.description);
		}
		if (data.businessUnitCodes !== undefined) {
			setClauses.push("business_unit_codes = @businessUnitCodes");
			request.input(
				"businessUnitCodes",
				sql.NVarChar,
				JSON.stringify(data.businessUnitCodes),
			);
		}

		const result = await request.query<{ chart_view_id: number }>(
			`UPDATE chart_views
       SET ${setClauses.join(", ")}
       OUTPUT INSERTED.chart_view_id
       WHERE chart_view_id = @id AND deleted_at IS NULL`,
		);

		if (result.recordset.length === 0) return undefined;
		return chartViewData.findById(id);
	},

	async softDelete(id: number): Promise<ChartViewRow | undefined> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("id", sql.Int, id)
			.query<ChartViewRow>(
				`UPDATE chart_views
         SET deleted_at = GETDATE(), updated_at = GETDATE()
         OUTPUT INSERTED.chart_view_id, INSERTED.view_name, INSERTED.chart_type,
                INSERTED.start_year_month, INSERTED.end_year_month, INSERTED.is_default,
                INSERTED.description, INSERTED.business_unit_codes, INSERTED.created_at, INSERTED.updated_at, INSERTED.deleted_at
         WHERE chart_view_id = @id AND deleted_at IS NULL`,
			);

		return result.recordset[0];
	},

	async restore(id: number): Promise<ChartViewRow | undefined> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("id", sql.Int, id)
			.query<ChartViewRow>(
				`UPDATE chart_views
         SET deleted_at = NULL, updated_at = GETDATE()
         OUTPUT INSERTED.chart_view_id, INSERTED.view_name, INSERTED.chart_type,
                INSERTED.start_year_month, INSERTED.end_year_month, INSERTED.is_default,
                INSERTED.description, INSERTED.business_unit_codes, INSERTED.created_at, INSERTED.updated_at, INSERTED.deleted_at
         WHERE chart_view_id = @id AND deleted_at IS NOT NULL`,
			);

		if (result.recordset.length === 0) return undefined;
		return chartViewData.findById(id);
	},
};
