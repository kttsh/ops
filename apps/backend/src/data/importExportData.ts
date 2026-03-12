import sql from "mssql";
import { getPool } from "@/database/client";
import type {
	CreateImportProjectData,
	ExportDataRow,
	ImportProjectLookupRow,
	UpdateImportProjectData,
} from "@/types/importExport";

export const importExportData = {
	// =========================================================================
	// エクスポート（2.1 拡張: 案件メタデータ付き）
	// =========================================================================

	async getExportData(): Promise<ExportDataRow[]> {
		const pool = await getPool();
		const result = await pool.request().query<ExportDataRow>(
			`SELECT
				p.project_code,
				p.business_unit_code,
				p.fiscal_year,
				p.project_type_code,
				p.name AS project_name,
				p.nickname,
				p.customer_name,
				p.order_number,
				p.start_year_month,
				p.total_manhour,
				p.duration_months,
				p.calculation_basis,
				p.remarks,
				p.region,
				pc.project_case_id,
				pc.case_name,
				pl.year_month,
				pl.manhour
			FROM project_load pl
			INNER JOIN project_cases pc ON pl.project_case_id = pc.project_case_id
			INNER JOIN projects p ON pc.project_id = p.project_id
			WHERE p.deleted_at IS NULL
				AND pc.deleted_at IS NULL
			ORDER BY p.project_code ASC, pc.project_case_id ASC, pl.year_month ASC`,
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

	// =========================================================================
	// 既存バリデーション（維持）
	// =========================================================================

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

	// =========================================================================
	// 2.2: マスタ存在チェックのバッチ検証
	// =========================================================================

	async validateBusinessUnitCodes(codes: string[]): Promise<string[]> {
		if (codes.length === 0) return [];

		const pool = await getPool();
		const uniqueCodes = [...new Set(codes)];
		const request = pool.request();

		const inClauses: string[] = [];
		for (let i = 0; i < uniqueCodes.length; i++) {
			const paramName = `bu${i}`;
			request.input(paramName, sql.VarChar, uniqueCodes[i]);
			inClauses.push(`@${paramName}`);
		}

		const result = await request.query<{ business_unit_code: string }>(
			`SELECT business_unit_code
			FROM business_units
			WHERE business_unit_code IN (${inClauses.join(", ")})
				AND deleted_at IS NULL`,
		);

		const validCodes = new Set(
			result.recordset.map((r) => r.business_unit_code),
		);
		return uniqueCodes.filter((code) => !validCodes.has(code));
	},

	async validateProjectTypeCodes(codes: string[]): Promise<string[]> {
		if (codes.length === 0) return [];

		const pool = await getPool();
		const uniqueCodes = [...new Set(codes)];
		const request = pool.request();

		const inClauses: string[] = [];
		for (let i = 0; i < uniqueCodes.length; i++) {
			const paramName = `pt${i}`;
			request.input(paramName, sql.VarChar, uniqueCodes[i]);
			inClauses.push(`@${paramName}`);
		}

		const result = await request.query<{ project_type_code: string }>(
			`SELECT project_type_code
			FROM project_types
			WHERE project_type_code IN (${inClauses.join(", ")})
				AND deleted_at IS NULL`,
		);

		const validCodes = new Set(
			result.recordset.map((r) => r.project_type_code),
		);
		return uniqueCodes.filter((code) => !validCodes.has(code));
	},

	// =========================================================================
	// 2.3: 案件コード自動生成と案件 CRUD
	// =========================================================================

	async findProjectsByProjectCodes(
		codes: string[],
	): Promise<Map<string, ImportProjectLookupRow>> {
		if (codes.length === 0) return new Map();

		const pool = await getPool();
		const uniqueCodes = [...new Set(codes)];
		const request = pool.request();

		const inClauses: string[] = [];
		for (let i = 0; i < uniqueCodes.length; i++) {
			const paramName = `pc${i}`;
			request.input(paramName, sql.NVarChar, uniqueCodes[i]);
			inClauses.push(`@${paramName}`);
		}

		const result = await request.query<ImportProjectLookupRow>(
			`SELECT project_id, project_code
			FROM projects
			WHERE project_code IN (${inClauses.join(", ")})
				AND deleted_at IS NULL`,
		);

		const map = new Map<string, ImportProjectLookupRow>();
		for (const row of result.recordset) {
			map.set(row.project_code, row);
		}
		return map;
	},

	async generateNextAutoCode(transaction: sql.Transaction): Promise<string> {
		const request = new sql.Request(transaction);
		const result = await request.query<{ max_code: string | null }>(
			`SELECT MAX(project_code) AS max_code
			FROM projects
			WHERE project_code LIKE 'AUTO-%'`,
		);

		const maxCode = result.recordset[0].max_code;
		let nextNumber = 1;
		if (maxCode) {
			const numPart = maxCode.replace("AUTO-", "");
			nextNumber = parseInt(numPart, 10) + 1;
		}

		return `AUTO-${String(nextNumber).padStart(6, "0")}`;
	},

	async createProject(
		data: CreateImportProjectData,
		transaction: sql.Transaction,
	): Promise<number> {
		const request = new sql.Request(transaction);
		const result = await request
			.input("projectCode", sql.NVarChar, data.projectCode)
			.input("name", sql.NVarChar, data.name)
			.input("businessUnitCode", sql.VarChar, data.businessUnitCode)
			.input("projectTypeCode", sql.VarChar, data.projectTypeCode)
			.input("startYearMonth", sql.Char(6), data.startYearMonth)
			.input("totalManhour", sql.Int, data.totalManhour)
			.input("status", sql.VarChar, data.status)
			.input("durationMonths", sql.Int, data.durationMonths)
			.input("fiscalYear", sql.Int, data.fiscalYear)
			.input("nickname", sql.NVarChar, data.nickname)
			.input("customerName", sql.NVarChar, data.customerName)
			.input("orderNumber", sql.NVarChar, data.orderNumber)
			.input("calculationBasis", sql.NVarChar, data.calculationBasis)
			.input("remarks", sql.NVarChar, data.remarks)
			.input("region", sql.NVarChar, data.region)
			.query<{ project_id: number }>(
				`INSERT INTO projects (project_code, name, business_unit_code, project_type_code, start_year_month, total_manhour, status, duration_months, fiscal_year, nickname, customer_name, order_number, calculation_basis, remarks, region)
				OUTPUT INSERTED.project_id
				VALUES (@projectCode, @name, @businessUnitCode, @projectTypeCode, @startYearMonth, @totalManhour, @status, @durationMonths, @fiscalYear, @nickname, @customerName, @orderNumber, @calculationBasis, @remarks, @region)`,
			);

		return result.recordset[0].project_id;
	},

	async updateProject(
		projectId: number,
		data: UpdateImportProjectData,
		transaction: sql.Transaction,
	): Promise<void> {
		const request = new sql.Request(transaction);
		await request
			.input("projectId", sql.Int, projectId)
			.input("name", sql.NVarChar, data.name)
			.input("businessUnitCode", sql.VarChar, data.businessUnitCode)
			.input("projectTypeCode", sql.VarChar, data.projectTypeCode)
			.input("startYearMonth", sql.Char(6), data.startYearMonth)
			.input("totalManhour", sql.Int, data.totalManhour)
			.input("durationMonths", sql.Int, data.durationMonths)
			.input("fiscalYear", sql.Int, data.fiscalYear)
			.input("nickname", sql.NVarChar, data.nickname)
			.input("customerName", sql.NVarChar, data.customerName)
			.input("orderNumber", sql.NVarChar, data.orderNumber)
			.input("calculationBasis", sql.NVarChar, data.calculationBasis)
			.input("remarks", sql.NVarChar, data.remarks)
			.input("region", sql.NVarChar, data.region)
			.query(
				`UPDATE projects
				SET name = @name,
					business_unit_code = @businessUnitCode,
					project_type_code = @projectTypeCode,
					start_year_month = @startYearMonth,
					total_manhour = @totalManhour,
					duration_months = @durationMonths,
					fiscal_year = @fiscalYear,
					nickname = @nickname,
					customer_name = @customerName,
					order_number = @orderNumber,
					calculation_basis = @calculationBasis,
					remarks = @remarks,
					region = @region,
					updated_at = GETDATE()
				WHERE project_id = @projectId AND deleted_at IS NULL`,
			);
	},

	async softDeleteProject(
		projectId: number,
		transaction: sql.Transaction,
	): Promise<void> {
		const request = new sql.Request(transaction);
		await request.input("projectId", sql.Int, projectId).query(
			`UPDATE projects
			SET deleted_at = GETDATE(), updated_at = GETDATE()
			WHERE project_id = @projectId AND deleted_at IS NULL`,
		);
	},

	// =========================================================================
	// 2.4: ケース CRUD と月次データ MERGE
	// =========================================================================

	async createProjectCase(
		projectId: number,
		caseName: string,
		transaction: sql.Transaction,
	): Promise<number> {
		const request = new sql.Request(transaction);
		const result = await request
			.input("projectId", sql.Int, projectId)
			.input("caseName", sql.NVarChar, caseName)
			.query<{ project_case_id: number }>(
				`INSERT INTO project_cases (project_id, case_name)
				OUTPUT INSERTED.project_case_id
				VALUES (@projectId, @caseName)`,
			);

		return result.recordset[0].project_case_id;
	},

	async mergeProjectLoad(
		projectCaseId: number,
		yearMonth: string,
		manhour: number,
		transaction: sql.Transaction,
	): Promise<void> {
		const request = new sql.Request(transaction);
		await request
			.input("projectCaseId", sql.Int, projectCaseId)
			.input("yearMonth", sql.Char(6), yearMonth)
			.input("manhour", sql.Int, manhour)
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
	},
};
