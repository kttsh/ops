import sql from "mssql";
import { getPool } from "@/database/client";
import type { IndirectWorkTypeRatioRow } from "@/types/indirectWorkTypeRatio";

const SELECT_COLUMNS = `
  r.indirect_work_type_ratio_id, r.indirect_work_case_id, r.work_type_code,
  r.fiscal_year, r.ratio, r.created_at, r.updated_at
`;

export const indirectWorkTypeRatioData = {
	async findAll(
		indirectWorkCaseId: number,
	): Promise<IndirectWorkTypeRatioRow[]> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("indirectWorkCaseId", sql.Int, indirectWorkCaseId)
			.query<IndirectWorkTypeRatioRow>(
				`SELECT ${SELECT_COLUMNS}
         FROM indirect_work_type_ratios r
         WHERE r.indirect_work_case_id = @indirectWorkCaseId
         ORDER BY r.fiscal_year ASC, r.work_type_code ASC`,
			);

		return result.recordset;
	},

	async findById(
		indirectWorkTypeRatioId: number,
	): Promise<IndirectWorkTypeRatioRow | undefined> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("indirectWorkTypeRatioId", sql.Int, indirectWorkTypeRatioId)
			.query<IndirectWorkTypeRatioRow>(
				`SELECT ${SELECT_COLUMNS}
         FROM indirect_work_type_ratios r
         WHERE r.indirect_work_type_ratio_id = @indirectWorkTypeRatioId`,
			);

		return result.recordset[0];
	},

	async create(data: {
		indirectWorkCaseId: number;
		workTypeCode: string;
		fiscalYear: number;
		ratio: number;
	}): Promise<IndirectWorkTypeRatioRow> {
		const pool = await getPool();
		const insertResult = await pool
			.request()
			.input("indirectWorkCaseId", sql.Int, data.indirectWorkCaseId)
			.input("workTypeCode", sql.VarChar(20), data.workTypeCode)
			.input("fiscalYear", sql.Int, data.fiscalYear)
			.input("ratio", sql.Decimal(5, 4), data.ratio)
			.query<{ indirect_work_type_ratio_id: number }>(
				`INSERT INTO indirect_work_type_ratios (
           indirect_work_case_id, work_type_code, fiscal_year, ratio
         )
         OUTPUT INSERTED.indirect_work_type_ratio_id
         VALUES (
           @indirectWorkCaseId, @workTypeCode, @fiscalYear, @ratio
         )`,
			);

		const newId = insertResult.recordset[0].indirect_work_type_ratio_id;
		const row = await this.findById(newId);
		return row!;
	},

	async update(
		indirectWorkTypeRatioId: number,
		data: Partial<{
			workTypeCode: string;
			fiscalYear: number;
			ratio: number;
		}>,
	): Promise<IndirectWorkTypeRatioRow | undefined> {
		const pool = await getPool();
		const setClauses: string[] = ["updated_at = GETDATE()"];
		const request = pool
			.request()
			.input("indirectWorkTypeRatioId", sql.Int, indirectWorkTypeRatioId);

		if (data.workTypeCode !== undefined) {
			setClauses.push("work_type_code = @workTypeCode");
			request.input("workTypeCode", sql.VarChar(20), data.workTypeCode);
		}
		if (data.fiscalYear !== undefined) {
			setClauses.push("fiscal_year = @fiscalYear");
			request.input("fiscalYear", sql.Int, data.fiscalYear);
		}
		if (data.ratio !== undefined) {
			setClauses.push("ratio = @ratio");
			request.input("ratio", sql.Decimal(5, 4), data.ratio);
		}

		await request.query(
			`UPDATE indirect_work_type_ratios
       SET ${setClauses.join(", ")}
       WHERE indirect_work_type_ratio_id = @indirectWorkTypeRatioId`,
		);

		return this.findById(indirectWorkTypeRatioId);
	},

	async deleteById(indirectWorkTypeRatioId: number): Promise<boolean> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("indirectWorkTypeRatioId", sql.Int, indirectWorkTypeRatioId)
			.query(
				`DELETE FROM indirect_work_type_ratios
         WHERE indirect_work_type_ratio_id = @indirectWorkTypeRatioId`,
			);

		return result.rowsAffected[0] > 0;
	},

	async bulkUpsert(
		indirectWorkCaseId: number,
		items: Array<{ workTypeCode: string; fiscalYear: number; ratio: number }>,
	): Promise<IndirectWorkTypeRatioRow[]> {
		const pool = await getPool();
		const transaction = new sql.Transaction(pool);

		try {
			await transaction.begin();

			for (const item of items) {
				const request = new sql.Request(transaction);
				await request
					.input("indirectWorkCaseId", sql.Int, indirectWorkCaseId)
					.input("workTypeCode", sql.VarChar(20), item.workTypeCode)
					.input("fiscalYear", sql.Int, item.fiscalYear)
					.input("ratio", sql.Decimal(5, 4), item.ratio)
					.query(
						`MERGE indirect_work_type_ratios AS target
             USING (SELECT @indirectWorkCaseId AS indirect_work_case_id, @workTypeCode AS work_type_code, @fiscalYear AS fiscal_year) AS source
             ON target.indirect_work_case_id = source.indirect_work_case_id
                AND target.work_type_code = source.work_type_code
                AND target.fiscal_year = source.fiscal_year
             WHEN MATCHED THEN
               UPDATE SET ratio = @ratio, updated_at = GETDATE()
             WHEN NOT MATCHED THEN
               INSERT (indirect_work_case_id, work_type_code, fiscal_year, ratio)
               VALUES (@indirectWorkCaseId, @workTypeCode, @fiscalYear, @ratio);`,
					);
			}

			await transaction.commit();
		} catch (err) {
			await transaction.rollback();
			throw err;
		}

		return this.findAll(indirectWorkCaseId);
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

	async workTypeExists(workTypeCode: string): Promise<boolean> {
		const pool = await getPool();
		const result = await pool
			.request()
			.input("workTypeCode", sql.VarChar(20), workTypeCode)
			.query<{ exists: boolean }>(
				`SELECT CASE
           WHEN EXISTS (SELECT 1 FROM work_types WHERE work_type_code = @workTypeCode AND deleted_at IS NULL)
           THEN CAST(1 AS BIT)
           ELSE CAST(0 AS BIT)
         END AS [exists]`,
			);

		return result.recordset[0].exists;
	},

	async compositeKeyExists(
		indirectWorkCaseId: number,
		workTypeCode: string,
		fiscalYear: number,
		excludeId?: number,
	): Promise<boolean> {
		const pool = await getPool();
		const request = pool
			.request()
			.input("indirectWorkCaseId", sql.Int, indirectWorkCaseId)
			.input("workTypeCode", sql.VarChar(20), workTypeCode)
			.input("fiscalYear", sql.Int, fiscalYear);

		let excludeClause = "";
		if (excludeId !== undefined) {
			excludeClause = "AND indirect_work_type_ratio_id <> @excludeId";
			request.input("excludeId", sql.Int, excludeId);
		}

		const result = await request.query<{ exists: boolean }>(
			`SELECT CASE
         WHEN EXISTS (
           SELECT 1 FROM indirect_work_type_ratios
           WHERE indirect_work_case_id = @indirectWorkCaseId
             AND work_type_code = @workTypeCode
             AND fiscal_year = @fiscalYear
             ${excludeClause}
         )
         THEN CAST(1 AS BIT)
         ELSE CAST(0 AS BIT)
       END AS [exists]`,
		);

		return result.recordset[0].exists;
	},
};
