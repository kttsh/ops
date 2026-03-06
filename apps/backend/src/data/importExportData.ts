import sql from "mssql";
import { getPool } from "@/database/client";
import type {
	BulkImportItem,
	BulkImportResult,
	ExportDataRow,
} from "@/types/importExport";

export const importExportData = {
	async getExportData(): Promise<ExportDataRow[]> {
		const pool = await getPool();
		const result = await pool.request().query<ExportDataRow>(
			`SELECT
				pc.project_case_id,
				p.name AS project_name,
				pc.case_name,
				pl.year_month,
				pl.manhour
			FROM project_load pl
			INNER JOIN project_cases pc ON pl.project_case_id = pc.project_case_id
			INNER JOIN projects p ON pc.project_id = p.project_id
			WHERE p.deleted_at IS NULL
				AND pc.deleted_at IS NULL
			ORDER BY p.name ASC, pc.case_name ASC, pl.year_month ASC`,
		);

		return result.recordset;
	},

	async getYearMonthRange(): Promise<{
		minYearMonth: string;
		maxYearMonth: string;
	} | null> {
		const pool = await getPool();
		const result = await pool.request().query<{
			min_year_month: string | null;
			max_year_month: string | null;
		}>(
			`SELECT
				MIN(pl.year_month) AS min_year_month,
				MAX(pl.year_month) AS max_year_month
			FROM project_load pl
			INNER JOIN project_cases pc ON pl.project_case_id = pc.project_case_id
			INNER JOIN projects p ON pc.project_id = p.project_id
			WHERE p.deleted_at IS NULL
				AND pc.deleted_at IS NULL`,
		);

		const row = result.recordset[0];
		if (!row.min_year_month || !row.max_year_month) {
			return null;
		}

		return {
			minYearMonth: row.min_year_month,
			maxYearMonth: row.max_year_month,
		};
	},

	async validateProjectCaseIds(ids: number[]): Promise<number[]> {
		if (ids.length === 0) return [];

		const pool = await getPool();
		const uniqueIds = [...new Set(ids)];
		const request = pool.request();

		const inClauses: string[] = [];
		for (let i = 0; i < uniqueIds.length; i++) {
			const paramName = `pcId${i}`;
			request.input(paramName, sql.Int, uniqueIds[i]);
			inClauses.push(`@${paramName}`);
		}

		const countResult = await request.query<{ cnt: number }>(
			`SELECT COUNT(DISTINCT project_case_id) AS cnt
			FROM project_cases
			WHERE project_case_id IN (${inClauses.join(", ")})
				AND deleted_at IS NULL`,
		);

		if (countResult.recordset[0].cnt === uniqueIds.length) {
			return [];
		}

		// 無効な ID を特定する
		const validRequest = pool.request();
		const validInClauses: string[] = [];
		for (let i = 0; i < uniqueIds.length; i++) {
			const paramName = `pcId${i}`;
			validRequest.input(paramName, sql.Int, uniqueIds[i]);
			validInClauses.push(`@${paramName}`);
		}

		const validResult = await validRequest.query<{
			project_case_id: number;
		}>(
			`SELECT project_case_id
			FROM project_cases
			WHERE project_case_id IN (${validInClauses.join(", ")})
				AND deleted_at IS NULL`,
		);

		const validIds = new Set(
			validResult.recordset.map((r) => r.project_case_id),
		);
		return uniqueIds.filter((id) => !validIds.has(id));
	},

	async bulkImportByCase(items: BulkImportItem[]): Promise<BulkImportResult> {
		const pool = await getPool();
		const transaction = new sql.Transaction(pool);

		const caseIds = new Set(items.map((item) => item.projectCaseId));

		try {
			await transaction.begin();

			for (const item of items) {
				const request = new sql.Request(transaction);
				await request
					.input("projectCaseId", sql.Int, item.projectCaseId)
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

		return {
			updatedCases: caseIds.size,
			updatedRecords: items.length,
		};
	},
};
