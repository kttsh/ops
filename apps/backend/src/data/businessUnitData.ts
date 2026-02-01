import sql from "mssql";
import { getPool } from "@/database/client";
import type { BusinessUnitRow } from "@/types/businessUnit";

export const businessUnitData = {
	async findAll(params: {
		page: number;
		pageSize: number;
		includeDisabled: boolean;
	}): Promise<{ items: BusinessUnitRow[]; totalCount: number }> {
		const pool = await getPool();
		const offset = (params.page - 1) * params.pageSize;
		const whereClause = params.includeDisabled
			? ""
			: "WHERE deleted_at IS NULL";

		const itemsResult = await pool
			.request()
			.input("offset", sql.Int, offset)
			.input("pageSize", sql.Int, params.pageSize)
			.query<BusinessUnitRow>(
				`SELECT business_unit_code, name, display_order, created_at, updated_at, deleted_at
         FROM business_units
         ${whereClause}
         ORDER BY display_order ASC
         OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`,
			);

		const countResult = await pool
			.request()
			.query<{ totalCount: number }>(
				`SELECT COUNT(*) AS totalCount FROM business_units ${whereClause}`,
			);

		return {
			items: itemsResult.recordset,
			totalCount: countResult.recordset[0].totalCount,
		};
	},

	async findByCode(code: string): Promise<BusinessUnitRow | undefined> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("code", sql.VarChar, code)
			.query<BusinessUnitRow>(
				`SELECT business_unit_code, name, display_order, created_at, updated_at, deleted_at
         FROM business_units
         WHERE business_unit_code = @code AND deleted_at IS NULL`,
			);

		return result.recordset[0];
	},

	async findByCodeIncludingDeleted(
		code: string,
	): Promise<BusinessUnitRow | undefined> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("code", sql.VarChar, code)
			.query<BusinessUnitRow>(
				`SELECT business_unit_code, name, display_order, created_at, updated_at, deleted_at
         FROM business_units
         WHERE business_unit_code = @code`,
			);

		return result.recordset[0];
	},

	async create(data: {
		businessUnitCode: string;
		name: string;
		displayOrder: number;
	}): Promise<BusinessUnitRow> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("businessUnitCode", sql.VarChar, data.businessUnitCode)
			.input("name", sql.NVarChar, data.name)
			.input("displayOrder", sql.Int, data.displayOrder)
			.query<BusinessUnitRow>(
				`INSERT INTO business_units (business_unit_code, name, display_order)
         OUTPUT INSERTED.business_unit_code, INSERTED.name, INSERTED.display_order,
                INSERTED.created_at, INSERTED.updated_at, INSERTED.deleted_at
         VALUES (@businessUnitCode, @name, @displayOrder)`,
			);

		return result.recordset[0];
	},

	async update(
		code: string,
		data: { name: string; displayOrder?: number },
	): Promise<BusinessUnitRow | undefined> {
		const pool = await getPool();
		const setClauses = ["name = @name", "updated_at = GETDATE()"];
		const request = pool
			.request()
			.input("code", sql.VarChar, code)
			.input("name", sql.NVarChar, data.name);

		if (data.displayOrder !== undefined) {
			setClauses.push("display_order = @displayOrder");
			request.input("displayOrder", sql.Int, data.displayOrder);
		}

		const result = await request.query<BusinessUnitRow>(
			`UPDATE business_units
       SET ${setClauses.join(", ")}
       OUTPUT INSERTED.business_unit_code, INSERTED.name, INSERTED.display_order,
              INSERTED.created_at, INSERTED.updated_at, INSERTED.deleted_at
       WHERE business_unit_code = @code AND deleted_at IS NULL`,
		);

		return result.recordset[0];
	},

	async softDelete(code: string): Promise<BusinessUnitRow | undefined> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("code", sql.VarChar, code)
			.query<BusinessUnitRow>(
				`UPDATE business_units
         SET deleted_at = GETDATE(), updated_at = GETDATE()
         OUTPUT INSERTED.business_unit_code, INSERTED.name, INSERTED.display_order,
                INSERTED.created_at, INSERTED.updated_at, INSERTED.deleted_at
         WHERE business_unit_code = @code AND deleted_at IS NULL`,
			);

		return result.recordset[0];
	},

	async restore(code: string): Promise<BusinessUnitRow | undefined> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("code", sql.VarChar, code)
			.query<BusinessUnitRow>(
				`UPDATE business_units
         SET deleted_at = NULL, updated_at = GETDATE()
         OUTPUT INSERTED.business_unit_code, INSERTED.name, INSERTED.display_order,
                INSERTED.created_at, INSERTED.updated_at, INSERTED.deleted_at
         WHERE business_unit_code = @code AND deleted_at IS NOT NULL`,
			);

		return result.recordset[0];
	},

	async hasReferences(code: string): Promise<boolean> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("code", sql.VarChar, code)
			.query<{ hasRef: boolean }>(
				`SELECT CASE
           WHEN EXISTS (SELECT 1 FROM projects WHERE business_unit_code = @code AND deleted_at IS NULL)
             OR EXISTS (SELECT 1 FROM headcount_plan_cases WHERE business_unit_code = @code AND deleted_at IS NULL)
             OR EXISTS (SELECT 1 FROM indirect_work_cases WHERE business_unit_code = @code AND deleted_at IS NULL)
             OR EXISTS (SELECT 1 FROM standard_effort_masters WHERE business_unit_code = @code AND deleted_at IS NULL)
           THEN CAST(1 AS BIT)
           ELSE CAST(0 AS BIT)
         END AS hasRef`,
			);

		return result.recordset[0].hasRef;
	},
};
