import sql from "mssql";
import { getPool } from "@/database/client";
import type {
	CapacityRow,
	IndirectWorkLoadRow,
	ProjectDetailRow,
} from "@/types/chartData";

export const chartDataData = {
	/**
	 * 間接工数 + 種類別内訳（chartViewId未指定時）
	 */
	async getIndirectWorkLoadsByDefault(params: {
		businessUnitCodes: string[];
		startYearMonth: string;
		endYearMonth: string;
		indirectWorkCaseIds?: number[];
	}): Promise<IndirectWorkLoadRow[]> {
		const pool = await getPool();
		const request = pool.request();
		request.input("startYearMonth", sql.Char(6), params.startYearMonth);
		request.input("endYearMonth", sql.Char(6), params.endYearMonth);

		const buPlaceholders = params.businessUnitCodes.map((code, i) => {
			request.input(`bu${i}`, sql.VarChar(20), code);
			return `@bu${i}`;
		});

		let caseFilter: string;
		if (params.indirectWorkCaseIds && params.indirectWorkCaseIds.length > 0) {
			const casePlaceholders = params.indirectWorkCaseIds.map((id, i) => {
				request.input(`caseId${i}`, sql.Int, id);
				return `@caseId${i}`;
			});
			caseFilter = `miwl.indirect_work_case_id IN (${casePlaceholders.join(",")})`;
		} else {
			caseFilter = `iwc.is_primary = 1`;
		}

		const result = await request.query<IndirectWorkLoadRow>(
			`SELECT
        miwl.indirect_work_case_id AS indirectWorkCaseId,
        iwc.case_name AS caseName,
        miwl.business_unit_code AS businessUnitCode,
        miwl.year_month AS yearMonth,
        miwl.manhour,
        miwl.source,
        iwtr.work_type_code AS workTypeCode,
        wt.name AS workTypeName,
        wt.display_order AS workTypeDisplayOrder,
        iwtr.ratio,
        CAST(miwl.manhour * iwtr.ratio AS DECIMAL(10,2)) AS typeManhour
      FROM monthly_indirect_work_load miwl
      JOIN indirect_work_cases iwc ON miwl.indirect_work_case_id = iwc.indirect_work_case_id
      LEFT JOIN indirect_work_type_ratios iwtr
        ON miwl.indirect_work_case_id = iwtr.indirect_work_case_id
        AND iwtr.fiscal_year = CASE
          WHEN CAST(RIGHT(miwl.year_month, 2) AS INT) >= 4
          THEN CAST(LEFT(miwl.year_month, 4) AS INT)
          ELSE CAST(LEFT(miwl.year_month, 4) AS INT) - 1
        END
      LEFT JOIN work_types wt ON iwtr.work_type_code = wt.work_type_code
        AND wt.deleted_at IS NULL
      WHERE ${caseFilter}
        AND miwl.business_unit_code IN (${buPlaceholders.join(",")})
        AND miwl.year_month BETWEEN @startYearMonth AND @endYearMonth
        AND iwc.deleted_at IS NULL
      ORDER BY miwl.indirect_work_case_id, miwl.business_unit_code,
               miwl.year_month, wt.display_order`,
		);

		return result.recordset;
	},

	/**
	 * 間接工数 + 種類別内訳（chartViewId指定時）
	 */
	async getIndirectWorkLoadsByChartView(params: {
		chartViewId: number;
		businessUnitCodes: string[];
		startYearMonth: string;
		endYearMonth: string;
	}): Promise<IndirectWorkLoadRow[]> {
		const pool = await getPool();
		const request = pool.request();
		request.input("chartViewId", sql.Int, params.chartViewId);
		request.input("startYearMonth", sql.Char(6), params.startYearMonth);
		request.input("endYearMonth", sql.Char(6), params.endYearMonth);

		const buPlaceholders = params.businessUnitCodes.map((code, i) => {
			request.input(`bu${i}`, sql.VarChar(20), code);
			return `@bu${i}`;
		});

		const result = await request.query<IndirectWorkLoadRow>(
			`SELECT
        miwl.indirect_work_case_id AS indirectWorkCaseId,
        iwc.case_name AS caseName,
        miwl.business_unit_code AS businessUnitCode,
        miwl.year_month AS yearMonth,
        miwl.manhour,
        miwl.source,
        iwtr.work_type_code AS workTypeCode,
        wt.name AS workTypeName,
        wt.display_order AS workTypeDisplayOrder,
        iwtr.ratio,
        CAST(miwl.manhour * iwtr.ratio AS DECIMAL(10,2)) AS typeManhour
      FROM chart_view_indirect_work_items cviwi
      JOIN indirect_work_cases iwc ON cviwi.indirect_work_case_id = iwc.indirect_work_case_id
      JOIN monthly_indirect_work_load miwl ON iwc.indirect_work_case_id = miwl.indirect_work_case_id
      LEFT JOIN indirect_work_type_ratios iwtr
        ON miwl.indirect_work_case_id = iwtr.indirect_work_case_id
        AND iwtr.fiscal_year = CASE
          WHEN CAST(RIGHT(miwl.year_month, 2) AS INT) >= 4
          THEN CAST(LEFT(miwl.year_month, 4) AS INT)
          ELSE CAST(LEFT(miwl.year_month, 4) AS INT) - 1
        END
      LEFT JOIN work_types wt ON iwtr.work_type_code = wt.work_type_code
        AND wt.deleted_at IS NULL
      WHERE cviwi.chart_view_id = @chartViewId
        AND cviwi.is_visible = 1
        AND miwl.business_unit_code IN (${buPlaceholders.join(",")})
        AND miwl.year_month BETWEEN @startYearMonth AND @endYearMonth
        AND iwc.deleted_at IS NULL
      ORDER BY miwl.indirect_work_case_id, miwl.business_unit_code,
               miwl.year_month, wt.display_order`,
		);

		return result.recordset;
	},

	/**
	 * キャパシティ取得
	 */
	async getCapacities(params: {
		capacityScenarioIds: number[];
		businessUnitCodes: string[];
		startYearMonth: string;
		endYearMonth: string;
	}): Promise<CapacityRow[]> {
		const pool = await getPool();
		const request = pool.request();
		request.input("startYearMonth", sql.Char(6), params.startYearMonth);
		request.input("endYearMonth", sql.Char(6), params.endYearMonth);

		const buPlaceholders = params.businessUnitCodes.map((code, i) => {
			request.input(`bu${i}`, sql.VarChar(20), code);
			return `@bu${i}`;
		});

		const scenarioPlaceholders = params.capacityScenarioIds.map((id, i) => {
			request.input(`scenario${i}`, sql.Int, id);
			return `@scenario${i}`;
		});

		const result = await request.query<CapacityRow>(
			`SELECT
        mc.capacity_scenario_id AS capacityScenarioId,
        cs.scenario_name AS scenarioName,
        mc.business_unit_code AS businessUnitCode,
        mc.year_month AS yearMonth,
        mc.capacity
      FROM monthly_capacity mc
      JOIN capacity_scenarios cs ON mc.capacity_scenario_id = cs.capacity_scenario_id
      WHERE mc.capacity_scenario_id IN (${scenarioPlaceholders.join(",")})
        AND mc.business_unit_code IN (${buPlaceholders.join(",")})
        AND mc.year_month BETWEEN @startYearMonth AND @endYearMonth
        AND cs.deleted_at IS NULL
      ORDER BY mc.capacity_scenario_id, mc.year_month`,
		);

		return result.recordset;
	},

	/**
	 * 個別案件工数（chartViewId未指定時 — isPrimary = true ベース）
	 */
	async getProjectDetailsByDefault(params: {
		businessUnitCodes: string[];
		startYearMonth: string;
		endYearMonth: string;
		projectIds?: number[];
	}): Promise<ProjectDetailRow[]> {
		const pool = await getPool();
		const request = pool.request();
		request.input("startYearMonth", sql.Char(6), params.startYearMonth);
		request.input("endYearMonth", sql.Char(6), params.endYearMonth);

		const buPlaceholders = params.businessUnitCodes.map((code, i) => {
			request.input(`bu${i}`, sql.VarChar(20), code);
			return `@bu${i}`;
		});

		let projectIdFilter = "";
		if (params.projectIds?.length) {
			const pidPlaceholders = params.projectIds.map((id, i) => {
				request.input(`pid${i}`, sql.Int, id);
				return `@pid${i}`;
			});
			projectIdFilter = `AND p.project_id IN (${pidPlaceholders.join(",")})`;
		}

		const result = await request.query<ProjectDetailRow>(
			`SELECT
        p.project_id AS projectId,
        p.name AS projectName,
        p.project_type_code AS projectTypeCode,
        pl.year_month AS yearMonth,
        SUM(pl.manhour) AS manhour
      FROM project_load pl
      JOIN project_cases pc ON pl.project_case_id = pc.project_case_id
      JOIN projects p ON pc.project_id = p.project_id
      WHERE p.business_unit_code IN (${buPlaceholders.join(",")})
        AND pl.year_month BETWEEN @startYearMonth AND @endYearMonth
        AND pc.is_primary = 1
        AND p.deleted_at IS NULL
        AND pc.deleted_at IS NULL
        ${projectIdFilter}
      GROUP BY p.project_id, p.name, p.project_type_code, pl.year_month
      ORDER BY p.project_type_code, p.name, pl.year_month`,
		);

		return result.recordset;
	},

	/**
	 * 個別案件工数（projectCaseIds指定時 — ケースオーバーライド）
	 * 指定されたケースIDのデータを取得し、未指定の案件は isPrimary にフォールバック
	 */
	async getProjectDetailsWithCaseOverrides(params: {
		businessUnitCodes: string[];
		startYearMonth: string;
		endYearMonth: string;
		projectIds?: number[];
		projectCaseIds: number[];
	}): Promise<ProjectDetailRow[]> {
		const pool = await getPool();
		const request = pool.request();
		request.input("startYearMonth", sql.Char(6), params.startYearMonth);
		request.input("endYearMonth", sql.Char(6), params.endYearMonth);

		const buPlaceholders = params.businessUnitCodes.map((code, i) => {
			request.input(`bu${i}`, sql.VarChar(20), code);
			return `@bu${i}`;
		});

		const casePlaceholders = params.projectCaseIds.map((id, i) => {
			request.input(`caseId${i}`, sql.Int, id);
			return `@caseId${i}`;
		});

		let projectIdFilter = "";
		if (params.projectIds?.length) {
			const pidPlaceholders = params.projectIds.map((id, i) => {
				request.input(`pid${i}`, sql.Int, id);
				return `@pid${i}`;
			});
			projectIdFilter = `AND p.project_id IN (${pidPlaceholders.join(",")})`;
		}

		const result = await request.query<ProjectDetailRow>(
			`SELECT
        p.project_id AS projectId,
        p.name AS projectName,
        p.project_type_code AS projectTypeCode,
        pl.year_month AS yearMonth,
        SUM(pl.manhour) AS manhour
      FROM project_load pl
      JOIN project_cases pc ON pl.project_case_id = pc.project_case_id
      JOIN projects p ON pc.project_id = p.project_id
      WHERE p.business_unit_code IN (${buPlaceholders.join(",")})
        AND pl.year_month BETWEEN @startYearMonth AND @endYearMonth
        AND p.deleted_at IS NULL
        AND pc.deleted_at IS NULL
        AND (
          pc.project_case_id IN (${casePlaceholders.join(",")})
          OR (
            pc.is_primary = 1
            AND p.project_id NOT IN (
              SELECT pc2.project_id FROM project_cases pc2
              WHERE pc2.project_case_id IN (${casePlaceholders.join(",")})
              AND pc2.deleted_at IS NULL
            )
          )
        )
        ${projectIdFilter}
      GROUP BY p.project_id, p.name, p.project_type_code, pl.year_month
      ORDER BY p.project_type_code, p.name, pl.year_month`,
		);

		return result.recordset;
	},

	/**
	 * 個別案件工数（chartViewId指定時）
	 */
	async getProjectDetailsByChartView(params: {
		chartViewId: number;
		businessUnitCodes: string[];
		startYearMonth: string;
		endYearMonth: string;
		projectIds?: number[];
	}): Promise<ProjectDetailRow[]> {
		const pool = await getPool();
		const request = pool.request();
		request.input("chartViewId", sql.Int, params.chartViewId);
		request.input("startYearMonth", sql.Char(6), params.startYearMonth);
		request.input("endYearMonth", sql.Char(6), params.endYearMonth);

		const buPlaceholders = params.businessUnitCodes.map((code, i) => {
			request.input(`bu${i}`, sql.VarChar(20), code);
			return `@bu${i}`;
		});

		let projectIdFilter = "";
		if (params.projectIds?.length) {
			const pidPlaceholders = params.projectIds.map((id, i) => {
				request.input(`pid${i}`, sql.Int, id);
				return `@pid${i}`;
			});
			projectIdFilter = `AND p.project_id IN (${pidPlaceholders.join(",")})`;
		}

		const result = await request.query<ProjectDetailRow>(
			`SELECT
        p.project_id AS projectId,
        p.name AS projectName,
        p.project_type_code AS projectTypeCode,
        pl.year_month AS yearMonth,
        SUM(pl.manhour) AS manhour
      FROM chart_view_project_items cvpi
      JOIN projects p ON cvpi.project_id = p.project_id
      JOIN project_cases pc ON p.project_id = pc.project_id
        AND (
          (cvpi.project_case_id IS NOT NULL AND pc.project_case_id = cvpi.project_case_id)
          OR (cvpi.project_case_id IS NULL AND pc.is_primary = 1)
        )
      JOIN project_load pl ON pc.project_case_id = pl.project_case_id
      WHERE cvpi.chart_view_id = @chartViewId
        AND cvpi.is_visible = 1
        AND p.business_unit_code IN (${buPlaceholders.join(",")})
        AND pl.year_month BETWEEN @startYearMonth AND @endYearMonth
        AND p.deleted_at IS NULL
        AND pc.deleted_at IS NULL
        ${projectIdFilter}
      GROUP BY p.project_id, p.name, p.project_type_code, pl.year_month
      ORDER BY p.project_type_code, p.name, pl.year_month`,
		);

		return result.recordset;
	},
};
