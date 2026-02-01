import sql from "mssql";
import { getPool } from "@/database/client";
import type { ProjectTypeRow } from "@/types/projectType";

export const projectTypeData = {
	async findAll(params: {
		page: number;
		pageSize: number;
		includeDisabled: boolean;
	}): Promise<{ items: ProjectTypeRow[]; totalCount: number }> {
		const pool = await getPool();
		const offset = (params.page - 1) * params.pageSize;
		const whereClause = params.includeDisabled
			? ""
			: "WHERE deleted_at IS NULL";

		const itemsResult = await pool
			.request()
			.input("offset", sql.Int, offset)
			.input("pageSize", sql.Int, params.pageSize)
			.query<ProjectTypeRow>(
				`SELECT project_type_code, name, display_order, created_at, updated_at, deleted_at
         FROM project_types
         ${whereClause}
         ORDER BY display_order ASC
         OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`,
			);

		const countResult = await pool
			.request()
			.query<{ totalCount: number }>(
				`SELECT COUNT(*) AS totalCount FROM project_types ${whereClause}`,
			);

		return {
			items: itemsResult.recordset,
			totalCount: countResult.recordset[0].totalCount,
		};
	},

	async findByCode(code: string): Promise<ProjectTypeRow | undefined> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("code", sql.VarChar, code)
			.query<ProjectTypeRow>(
				`SELECT project_type_code, name, display_order, created_at, updated_at, deleted_at
         FROM project_types
         WHERE project_type_code = @code AND deleted_at IS NULL`,
			);

		return result.recordset[0];
	},

	async findByCodeIncludingDeleted(
		code: string,
	): Promise<ProjectTypeRow | undefined> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("code", sql.VarChar, code)
			.query<ProjectTypeRow>(
				`SELECT project_type_code, name, display_order, created_at, updated_at, deleted_at
         FROM project_types
         WHERE project_type_code = @code`,
			);

		return result.recordset[0];
	},

	async create(data: {
		projectTypeCode: string;
		name: string;
		displayOrder: number;
	}): Promise<ProjectTypeRow> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("projectTypeCode", sql.VarChar, data.projectTypeCode)
			.input("name", sql.NVarChar, data.name)
			.input("displayOrder", sql.Int, data.displayOrder)
			.query<ProjectTypeRow>(
				`INSERT INTO project_types (project_type_code, name, display_order)
         OUTPUT INSERTED.project_type_code, INSERTED.name, INSERTED.display_order,
                INSERTED.created_at, INSERTED.updated_at, INSERTED.deleted_at
         VALUES (@projectTypeCode, @name, @displayOrder)`,
			);

		return result.recordset[0];
	},

	async update(
		code: string,
		data: { name: string; displayOrder?: number },
	): Promise<ProjectTypeRow | undefined> {
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

		const result = await request.query<ProjectTypeRow>(
			`UPDATE project_types
       SET ${setClauses.join(", ")}
       OUTPUT INSERTED.project_type_code, INSERTED.name, INSERTED.display_order,
              INSERTED.created_at, INSERTED.updated_at, INSERTED.deleted_at
       WHERE project_type_code = @code AND deleted_at IS NULL`,
		);

		return result.recordset[0];
	},

	async softDelete(code: string): Promise<ProjectTypeRow | undefined> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("code", sql.VarChar, code)
			.query<ProjectTypeRow>(
				`UPDATE project_types
         SET deleted_at = GETDATE(), updated_at = GETDATE()
         OUTPUT INSERTED.project_type_code, INSERTED.name, INSERTED.display_order,
                INSERTED.created_at, INSERTED.updated_at, INSERTED.deleted_at
         WHERE project_type_code = @code AND deleted_at IS NULL`,
			);

		return result.recordset[0];
	},

	async restore(code: string): Promise<ProjectTypeRow | undefined> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("code", sql.VarChar, code)
			.query<ProjectTypeRow>(
				`UPDATE project_types
         SET deleted_at = NULL, updated_at = GETDATE()
         OUTPUT INSERTED.project_type_code, INSERTED.name, INSERTED.display_order,
                INSERTED.created_at, INSERTED.updated_at, INSERTED.deleted_at
         WHERE project_type_code = @code AND deleted_at IS NOT NULL`,
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
           WHEN EXISTS (SELECT 1 FROM projects WHERE project_type_code = @code AND deleted_at IS NULL)
             OR EXISTS (SELECT 1 FROM standard_effort_masters WHERE project_type_code = @code AND deleted_at IS NULL)
           THEN CAST(1 AS BIT)
           ELSE CAST(0 AS BIT)
         END AS hasRef`,
			);

		return result.recordset[0].hasRef;
	},
};
