import sql from "mssql";
import { getPool } from "@/database/client";
import type { ProjectLoadRow } from "@/types/projectLoad";

const SELECT_COLUMNS = `
  pl.project_load_id, pl.project_case_id, pl.year_month,
  pl.manhour, pl.created_at, pl.updated_at
`;

export const projectLoadData = {
	async findAll(projectCaseId: number): Promise<ProjectLoadRow[]> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("projectCaseId", sql.Int, projectCaseId)
			.query<ProjectLoadRow>(
				`SELECT ${SELECT_COLUMNS}
         FROM project_load pl
         WHERE pl.project_case_id = @projectCaseId
         ORDER BY pl.year_month ASC`,
			);

		return result.recordset;
	},

	async findById(projectLoadId: number): Promise<ProjectLoadRow | undefined> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("projectLoadId", sql.Int, projectLoadId)
			.query<ProjectLoadRow>(
				`SELECT ${SELECT_COLUMNS}
         FROM project_load pl
         WHERE pl.project_load_id = @projectLoadId`,
			);

		return result.recordset[0];
	},

	async create(data: {
		projectCaseId: number;
		yearMonth: string;
		manhour: number;
	}): Promise<ProjectLoadRow> {
		const pool = await getPool();
		const insertResult = await pool
			.request()
			.input("projectCaseId", sql.Int, data.projectCaseId)
			.input("yearMonth", sql.Char(6), data.yearMonth)
			.input("manhour", sql.Int, data.manhour)
			.query<{ project_load_id: number }>(
				`INSERT INTO project_load (
           project_case_id, year_month, manhour
         )
         OUTPUT INSERTED.project_load_id
         VALUES (
           @projectCaseId, @yearMonth, @manhour
         )`,
			);

		const newId = insertResult.recordset[0].project_load_id;
		const row = await this.findById(newId);
		return row!;
	},

	async update(
		projectLoadId: number,
		data: Partial<{
			yearMonth: string;
			manhour: number;
		}>,
	): Promise<ProjectLoadRow | undefined> {
		const pool = await getPool();
		const setClauses: string[] = ["updated_at = GETDATE()"];
		const request = pool
			.request()
			.input("projectLoadId", sql.Int, projectLoadId);

		if (data.yearMonth !== undefined) {
			setClauses.push("year_month = @yearMonth");
			request.input("yearMonth", sql.Char(6), data.yearMonth);
		}
		if (data.manhour !== undefined) {
			setClauses.push("manhour = @manhour");
			request.input("manhour", sql.Int, data.manhour);
		}

		await request.query(
			`UPDATE project_load
       SET ${setClauses.join(", ")}
       WHERE project_load_id = @projectLoadId`,
		);

		return this.findById(projectLoadId);
	},

	async deleteById(projectLoadId: number): Promise<boolean> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("projectLoadId", sql.Int, projectLoadId)
			.query(
				`DELETE FROM project_load
         WHERE project_load_id = @projectLoadId`,
			);

		return result.rowsAffected[0] > 0;
	},

	async bulkUpsert(
		projectCaseId: number,
		items: Array<{ yearMonth: string; manhour: number }>,
	): Promise<ProjectLoadRow[]> {
		const pool = await getPool();
		const transaction = new sql.Transaction(pool);

		try {
			await transaction.begin();

			for (const item of items) {
				const request = new sql.Request(transaction);
				await request
					.input("projectCaseId", sql.Int, projectCaseId)
					.input("yearMonth", sql.Char(6), item.yearMonth)
					.input("manhour", sql.Int, item.manhour)
					.query(
						`MERGE project_load AS target
             USING (SELECT @projectCaseId AS project_case_id, @yearMonth AS year_month) AS source
             ON target.project_case_id = source.project_case_id
                AND target.year_month = source.year_month
             WHEN MATCHED THEN
               UPDATE SET manhour = @manhour, updated_at = GETDATE()
             WHEN NOT MATCHED THEN
               INSERT (project_case_id, year_month, manhour)
               VALUES (@projectCaseId, @yearMonth, @manhour);`,
					);
			}

			await transaction.commit();
		} catch (err) {
			await transaction.rollback();
			throw err;
		}

		return this.findAll(projectCaseId);
	},

	async projectCaseExists(projectCaseId: number): Promise<boolean> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("projectCaseId", sql.Int, projectCaseId)
			.query<{ exists: boolean }>(
				`SELECT CASE
           WHEN EXISTS (SELECT 1 FROM project_cases WHERE project_case_id = @projectCaseId AND deleted_at IS NULL)
           THEN CAST(1 AS BIT)
           ELSE CAST(0 AS BIT)
         END AS [exists]`,
			);

		return result.recordset[0].exists;
	},

	async yearMonthExists(
		projectCaseId: number,
		yearMonth: string,
		excludeId?: number,
	): Promise<boolean> {
		const pool = await getPool();
		const request = pool
			.request()
			.input("projectCaseId", sql.Int, projectCaseId)
			.input("yearMonth", sql.Char(6), yearMonth);

		let excludeClause = "";
		if (excludeId !== undefined) {
			excludeClause = "AND project_load_id <> @excludeId";
			request.input("excludeId", sql.Int, excludeId);
		}

		const result = await request.query<{ exists: boolean }>(
			`SELECT CASE
         WHEN EXISTS (
           SELECT 1 FROM project_load
           WHERE project_case_id = @projectCaseId
             AND year_month = @yearMonth
             ${excludeClause}
         )
         THEN CAST(1 AS BIT)
         ELSE CAST(0 AS BIT)
       END AS [exists]`,
		);

		return result.recordset[0].exists;
	},
};
