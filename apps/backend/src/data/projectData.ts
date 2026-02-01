import sql from "mssql";
import { getPool } from "@/database/client";
import type { CreateProject, ProjectRow } from "@/types/project";

const SELECT_COLUMNS = `
  p.project_id, p.project_code, p.name,
  p.business_unit_code, bu.name AS business_unit_name,
  p.project_type_code, pt.name AS project_type_name,
  p.start_year_month, p.total_manhour, p.status, p.duration_months,
  p.created_at, p.updated_at, p.deleted_at`;

const JOIN_CLAUSE = `
  INNER JOIN business_units bu ON p.business_unit_code = bu.business_unit_code AND bu.deleted_at IS NULL
  LEFT JOIN project_types pt ON p.project_type_code = pt.project_type_code AND pt.deleted_at IS NULL`;

export const projectData = {
	async findAll(params: {
		page: number;
		pageSize: number;
		includeDisabled: boolean;
		businessUnitCodes?: string[];
		status?: string;
	}): Promise<{ items: ProjectRow[]; totalCount: number }> {
		const pool = await getPool();
		const offset = (params.page - 1) * params.pageSize;

		const whereClauses: string[] = [];
		if (!params.includeDisabled) {
			whereClauses.push("p.deleted_at IS NULL");
		}
		if (params.businessUnitCodes && params.businessUnitCodes.length > 0) {
			const buPlaceholders = params.businessUnitCodes.map((_, i) => `@bu${i}`);
			whereClauses.push(
				`p.business_unit_code IN (${buPlaceholders.join(",")})`,
			);
		}
		if (params.status) {
			whereClauses.push("p.status = @status");
		}

		const whereClause =
			whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

		const itemsRequest = pool
			.request()
			.input("offset", sql.Int, offset)
			.input("pageSize", sql.Int, params.pageSize);

		const countRequest = pool.request();

		if (params.businessUnitCodes && params.businessUnitCodes.length > 0) {
			params.businessUnitCodes.forEach((code, i) => {
				itemsRequest.input(`bu${i}`, sql.VarChar, code);
				countRequest.input(`bu${i}`, sql.VarChar, code);
			});
		}
		if (params.status) {
			itemsRequest.input("status", sql.VarChar, params.status);
			countRequest.input("status", sql.VarChar, params.status);
		}

		const itemsResult = await itemsRequest.query<ProjectRow>(
			`SELECT ${SELECT_COLUMNS}
       FROM projects p
       ${JOIN_CLAUSE}
       ${whereClause}
       ORDER BY p.project_id ASC
       OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`,
		);

		// count query uses simplified WHERE (no JOIN needed for count, but need to keep filter consistency)
		const countWhereClauses: string[] = [];
		if (!params.includeDisabled) {
			countWhereClauses.push("deleted_at IS NULL");
		}
		if (params.businessUnitCodes && params.businessUnitCodes.length > 0) {
			const buPlaceholders = params.businessUnitCodes.map((_, i) => `@bu${i}`);
			countWhereClauses.push(
				`business_unit_code IN (${buPlaceholders.join(",")})`,
			);
		}
		if (params.status) {
			countWhereClauses.push("status = @status");
		}
		const countWhereClause =
			countWhereClauses.length > 0
				? `WHERE ${countWhereClauses.join(" AND ")}`
				: "";

		const countResult = await countRequest.query<{ totalCount: number }>(
			`SELECT COUNT(*) AS totalCount FROM projects ${countWhereClause}`,
		);

		return {
			items: itemsResult.recordset,
			totalCount: countResult.recordset[0].totalCount,
		};
	},

	async findById(id: number): Promise<ProjectRow | undefined> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("id", sql.Int, id)
			.query<ProjectRow>(
				`SELECT ${SELECT_COLUMNS}
         FROM projects p
         ${JOIN_CLAUSE}
         WHERE p.project_id = @id AND p.deleted_at IS NULL`,
			);

		return result.recordset[0];
	},

	async findByIdIncludingDeleted(id: number): Promise<ProjectRow | undefined> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("id", sql.Int, id)
			.query<ProjectRow>(
				`SELECT ${SELECT_COLUMNS}
         FROM projects p
         ${JOIN_CLAUSE}
         WHERE p.project_id = @id`,
			);

		return result.recordset[0];
	},

	async findByProjectCode(code: string): Promise<ProjectRow | undefined> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("code", sql.NVarChar, code)
			.query<ProjectRow>(
				`SELECT ${SELECT_COLUMNS}
         FROM projects p
         ${JOIN_CLAUSE}
         WHERE p.project_code = @code AND p.deleted_at IS NULL`,
			);

		return result.recordset[0];
	},

	async create(data: CreateProject): Promise<ProjectRow> {
		const pool = await getPool();
		const request = pool
			.request()
			.input("projectCode", sql.NVarChar, data.projectCode)
			.input("name", sql.NVarChar, data.name)
			.input("businessUnitCode", sql.VarChar, data.businessUnitCode)
			.input("startYearMonth", sql.Char, data.startYearMonth)
			.input("totalManhour", sql.Int, data.totalManhour)
			.input("status", sql.VarChar, data.status);

		if (data.projectTypeCode !== undefined) {
			request.input("projectTypeCode", sql.VarChar, data.projectTypeCode);
		} else {
			request.input("projectTypeCode", sql.VarChar, null);
		}

		if (data.durationMonths !== undefined) {
			request.input("durationMonths", sql.Int, data.durationMonths);
		} else {
			request.input("durationMonths", sql.Int, null);
		}

		const insertResult = await request.query<{ project_id: number }>(
			`INSERT INTO projects (project_code, name, business_unit_code, project_type_code, start_year_month, total_manhour, status, duration_months)
       OUTPUT INSERTED.project_id
       VALUES (@projectCode, @name, @businessUnitCode, @projectTypeCode, @startYearMonth, @totalManhour, @status, @durationMonths)`,
		);

		const insertedId = insertResult.recordset[0].project_id;
		const row = await this.findById(insertedId);
		return row!;
	},

	async update(
		id: number,
		data: Record<string, unknown>,
	): Promise<ProjectRow | undefined> {
		const pool = await getPool();
		const setClauses: string[] = ["updated_at = GETDATE()"];
		const request = pool.request().input("id", sql.Int, id);

		const fieldMap: Record<
			string,
			{ sqlType: (() => sql.ISqlType) | sql.ISqlType; column: string }
		> = {
			projectCode: { sqlType: sql.NVarChar, column: "project_code" },
			name: { sqlType: sql.NVarChar, column: "name" },
			businessUnitCode: { sqlType: sql.VarChar, column: "business_unit_code" },
			projectTypeCode: { sqlType: sql.VarChar, column: "project_type_code" },
			startYearMonth: { sqlType: sql.Char, column: "start_year_month" },
			totalManhour: { sqlType: sql.Int, column: "total_manhour" },
			status: { sqlType: sql.VarChar, column: "status" },
			durationMonths: { sqlType: sql.Int, column: "duration_months" },
		};

		for (const [key, value] of Object.entries(data)) {
			const mapping = fieldMap[key];
			if (mapping && value !== undefined) {
				setClauses.push(`${mapping.column} = @${key}`);
				request.input(key, mapping.sqlType, value);
			}
		}

		await request.query(
			`UPDATE projects
       SET ${setClauses.join(", ")}
       WHERE project_id = @id AND deleted_at IS NULL`,
		);

		return this.findById(id);
	},

	async softDelete(id: number): Promise<ProjectRow | undefined> {
		const pool = await getPool();

		// findById before delete to check existence and get the row for return
		const existing = await this.findById(id);
		if (!existing) {
			return undefined;
		}

		await pool
			.request()
			.input("id", sql.Int, id)
			.query(
				`UPDATE projects
         SET deleted_at = GETDATE(), updated_at = GETDATE()
         WHERE project_id = @id AND deleted_at IS NULL`,
			);

		return existing;
	},

	async restore(id: number): Promise<ProjectRow | undefined> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("id", sql.Int, id)
			.query<{ project_id: number }>(
				`UPDATE projects
         SET deleted_at = NULL, updated_at = GETDATE()
         OUTPUT INSERTED.project_id
         WHERE project_id = @id AND deleted_at IS NOT NULL`,
			);

		if (result.recordset.length === 0) {
			return undefined;
		}

		return this.findById(id);
	},

	async hasReferences(id: number): Promise<boolean> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("id", sql.Int, id)
			.query<{ hasRef: boolean }>(
				`SELECT CASE
           WHEN EXISTS (SELECT 1 FROM project_cases WHERE project_id = @id AND deleted_at IS NULL)
           THEN CAST(1 AS BIT)
           ELSE CAST(0 AS BIT)
         END AS hasRef`,
			);

		return result.recordset[0].hasRef;
	},
};
