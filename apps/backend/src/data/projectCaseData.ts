import sql from "mssql";
import { getPool } from "@/database/client";
import type { ProjectCaseRow } from "@/types/projectCase";

const SELECT_COLUMNS = `
  pc.project_case_id, pc.project_id, pc.case_name, pc.is_primary,
  pc.description, pc.calculation_type, pc.standard_effort_id,
  pc.start_year_month, pc.duration_months, pc.total_manhour,
  pc.created_at, pc.updated_at, pc.deleted_at,
  p.name AS project_name,
  se.name AS standard_effort_name
`;

const FROM_WITH_JOINS = `
  FROM project_cases pc
  INNER JOIN projects p ON pc.project_id = p.project_id
  LEFT JOIN standard_effort_masters se ON pc.standard_effort_id = se.standard_effort_id
`;

export const projectCaseData = {
	async findAll(params: {
		projectId: number;
		page: number;
		pageSize: number;
		includeDisabled: boolean;
	}): Promise<{ items: ProjectCaseRow[]; totalCount: number }> {
		const pool = await getPool();
		const offset = (params.page - 1) * params.pageSize;
		const deletedFilter = params.includeDisabled
			? ""
			: "AND pc.deleted_at IS NULL";

		const itemsResult = await pool
			.request()
			.input("projectId", sql.Int, params.projectId)
			.input("offset", sql.Int, offset)
			.input("pageSize", sql.Int, params.pageSize)
			.query<ProjectCaseRow>(
				`SELECT ${SELECT_COLUMNS}
         ${FROM_WITH_JOINS}
         WHERE pc.project_id = @projectId ${deletedFilter}
         ORDER BY pc.created_at ASC
         OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`,
			);

		const countResult = await pool
			.request()
			.input("projectId", sql.Int, params.projectId)
			.query<{ totalCount: number }>(
				`SELECT COUNT(*) AS totalCount
         FROM project_cases pc
         WHERE pc.project_id = @projectId ${deletedFilter}`,
			);

		return {
			items: itemsResult.recordset,
			totalCount: countResult.recordset[0].totalCount,
		};
	},

	async findById(projectCaseId: number): Promise<ProjectCaseRow | undefined> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("projectCaseId", sql.Int, projectCaseId)
			.query<ProjectCaseRow>(
				`SELECT ${SELECT_COLUMNS}
         ${FROM_WITH_JOINS}
         WHERE pc.project_case_id = @projectCaseId AND pc.deleted_at IS NULL`,
			);

		return result.recordset[0];
	},

	async findByIdIncludingDeleted(
		projectCaseId: number,
	): Promise<ProjectCaseRow | undefined> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("projectCaseId", sql.Int, projectCaseId)
			.query<ProjectCaseRow>(
				`SELECT ${SELECT_COLUMNS}
         ${FROM_WITH_JOINS}
         WHERE pc.project_case_id = @projectCaseId`,
			);

		return result.recordset[0];
	},

	async create(data: {
		projectId: number;
		caseName: string;
		isPrimary: boolean;
		description: string | null;
		calculationType: string;
		standardEffortId: number | null;
		startYearMonth: string | null;
		durationMonths: number | null;
		totalManhour: number | null;
	}): Promise<ProjectCaseRow> {
		const pool = await getPool();
		const insertResult = await pool
			.request()
			.input("projectId", sql.Int, data.projectId)
			.input("caseName", sql.NVarChar, data.caseName)
			.input("isPrimary", sql.Bit, data.isPrimary)
			.input("description", sql.NVarChar, data.description)
			.input("calculationType", sql.VarChar, data.calculationType)
			.input("standardEffortId", sql.Int, data.standardEffortId)
			.input("startYearMonth", sql.Char(6), data.startYearMonth)
			.input("durationMonths", sql.Int, data.durationMonths)
			.input("totalManhour", sql.Int, data.totalManhour)
			.query<{ project_case_id: number }>(
				`INSERT INTO project_cases (
           project_id, case_name, is_primary, description,
           calculation_type, standard_effort_id, start_year_month,
           duration_months, total_manhour
         )
         OUTPUT INSERTED.project_case_id
         VALUES (
           @projectId, @caseName, @isPrimary, @description,
           @calculationType, @standardEffortId, @startYearMonth,
           @durationMonths, @totalManhour
         )`,
			);

		const newId = insertResult.recordset[0].project_case_id;
		const row = await this.findById(newId);
		return row!;
	},

	async update(
		projectCaseId: number,
		data: Partial<{
			caseName: string;
			isPrimary: boolean;
			description: string | null;
			calculationType: string;
			standardEffortId: number | null;
			startYearMonth: string | null;
			durationMonths: number | null;
			totalManhour: number | null;
		}>,
	): Promise<ProjectCaseRow | undefined> {
		const pool = await getPool();
		const setClauses: string[] = ["updated_at = GETDATE()"];
		const request = pool
			.request()
			.input("projectCaseId", sql.Int, projectCaseId);

		if (data.caseName !== undefined) {
			setClauses.push("case_name = @caseName");
			request.input("caseName", sql.NVarChar, data.caseName);
		}
		if (data.isPrimary !== undefined) {
			setClauses.push("is_primary = @isPrimary");
			request.input("isPrimary", sql.Bit, data.isPrimary);
		}
		if (data.description !== undefined) {
			setClauses.push("description = @description");
			request.input("description", sql.NVarChar, data.description);
		}
		if (data.calculationType !== undefined) {
			setClauses.push("calculation_type = @calculationType");
			request.input("calculationType", sql.VarChar, data.calculationType);
		}
		if (data.standardEffortId !== undefined) {
			setClauses.push("standard_effort_id = @standardEffortId");
			request.input("standardEffortId", sql.Int, data.standardEffortId);
		}
		if (data.startYearMonth !== undefined) {
			setClauses.push("start_year_month = @startYearMonth");
			request.input("startYearMonth", sql.Char(6), data.startYearMonth);
		}
		if (data.durationMonths !== undefined) {
			setClauses.push("duration_months = @durationMonths");
			request.input("durationMonths", sql.Int, data.durationMonths);
		}
		if (data.totalManhour !== undefined) {
			setClauses.push("total_manhour = @totalManhour");
			request.input("totalManhour", sql.Int, data.totalManhour);
		}

		await request.query(
			`UPDATE project_cases
       SET ${setClauses.join(", ")}
       WHERE project_case_id = @projectCaseId AND deleted_at IS NULL`,
		);

		return this.findById(projectCaseId);
	},

	async softDelete(projectCaseId: number): Promise<ProjectCaseRow | undefined> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("projectCaseId", sql.Int, projectCaseId)
			.query<{ project_case_id: number }>(
				`UPDATE project_cases
         SET deleted_at = GETDATE(), updated_at = GETDATE()
         OUTPUT INSERTED.project_case_id
         WHERE project_case_id = @projectCaseId AND deleted_at IS NULL`,
			);

		if (result.recordset.length === 0) return undefined;
		return this.findByIdIncludingDeleted(projectCaseId);
	},

	async restore(projectCaseId: number): Promise<ProjectCaseRow | undefined> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("projectCaseId", sql.Int, projectCaseId)
			.query<{ project_case_id: number }>(
				`UPDATE project_cases
         SET deleted_at = NULL, updated_at = GETDATE()
         OUTPUT INSERTED.project_case_id
         WHERE project_case_id = @projectCaseId AND deleted_at IS NOT NULL`,
			);

		if (result.recordset.length === 0) return undefined;
		return this.findById(projectCaseId);
	},

	async hasReferences(projectCaseId: number): Promise<boolean> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("projectCaseId", sql.Int, projectCaseId)
			.query<{ hasRef: boolean }>(
				`SELECT CASE
           WHEN EXISTS (SELECT 1 FROM project_load WHERE project_case_id = @projectCaseId)
             OR EXISTS (SELECT 1 FROM chart_view_project_items WHERE project_case_id = @projectCaseId)
           THEN CAST(1 AS BIT)
           ELSE CAST(0 AS BIT)
         END AS hasRef`,
			);

		return result.recordset[0].hasRef;
	},

	async projectExists(projectId: number): Promise<boolean> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("projectId", sql.Int, projectId)
			.query<{ exists: boolean }>(
				`SELECT CASE
           WHEN EXISTS (SELECT 1 FROM projects WHERE project_id = @projectId AND deleted_at IS NULL)
           THEN CAST(1 AS BIT)
           ELSE CAST(0 AS BIT)
         END AS [exists]`,
			);

		return result.recordset[0].exists;
	},

	async standardEffortExists(standardEffortId: number): Promise<boolean> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("standardEffortId", sql.Int, standardEffortId)
			.query<{ exists: boolean }>(
				`SELECT CASE
           WHEN EXISTS (SELECT 1 FROM standard_effort_masters WHERE standard_effort_id = @standardEffortId AND deleted_at IS NULL)
           THEN CAST(1 AS BIT)
           ELSE CAST(0 AS BIT)
         END AS [exists]`,
			);

		return result.recordset[0].exists;
	},
};
