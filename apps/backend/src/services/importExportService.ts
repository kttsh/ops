import { HTTPException } from "hono/http-exception";
import sql from "mssql";
import { importExportData } from "@/data/importExportData";
import { getPool } from "@/database/client";
import type {
	BulkImportInput,
	BulkImportResult,
	ExportDataResponse,
	ExportRow,
} from "@/types/importExport";

function generateYearMonths(min: string, max: string): string[] {
	const result: string[] = [];
	let year = parseInt(min.slice(0, 4), 10);
	let month = parseInt(min.slice(4, 6), 10);
	const endYear = parseInt(max.slice(0, 4), 10);
	const endMonth = parseInt(max.slice(4, 6), 10);

	while (year < endYear || (year === endYear && month <= endMonth)) {
		result.push(`${year}${String(month).padStart(2, "0")}`);
		month++;
		if (month > 12) {
			month = 1;
			year++;
		}
	}

	return result;
}

export const importExportService = {
	async getExportData(): Promise<ExportDataResponse> {
		const [rows, range] = await Promise.all([
			importExportData.getExportData(),
			importExportData.getYearMonthRange(),
		]);

		if (rows.length === 0 || !range) {
			return { data: [], yearMonths: [] };
		}

		const yearMonths = generateYearMonths(
			range.minYearMonth,
			range.maxYearMonth,
		);

		// ケース単位でグループ化（案件メタデータ付き）
		const caseMap = new Map<number, ExportRow>();
		for (const row of rows) {
			let exportRow = caseMap.get(row.project_case_id);
			if (!exportRow) {
				exportRow = {
					projectCode: row.project_code,
					businessUnitCode: row.business_unit_code,
					fiscalYear: row.fiscal_year,
					projectTypeCode: row.project_type_code,
					name: row.project_name,
					nickname: row.nickname,
					customerName: row.customer_name,
					orderNumber: row.order_number,
					startYearMonth: row.start_year_month,
					totalManhour: row.total_manhour,
					durationMonths: row.duration_months,
					calculationBasis: row.calculation_basis,
					remarks: row.remarks,
					region: row.region,
					projectCaseId: row.project_case_id,
					caseName: row.case_name,
					loads: [],
				};
				caseMap.set(row.project_case_id, exportRow);
			}
			exportRow.loads.push({
				yearMonth: row.year_month,
				manhour: row.manhour,
			});
		}

		return {
			data: Array.from(caseMap.values()),
			yearMonths,
		};
	},

	async bulkImport(input: BulkImportInput): Promise<BulkImportResult> {
		// 1. 一意な BU コード・PT コードを抽出
		const buCodes = [
			...new Set(input.items.map((item) => item.businessUnitCode)),
		];
		const ptCodes = [
			...new Set(
				input.items
					.map((item) => item.projectTypeCode)
					.filter((c): c is string => c !== null),
			),
		];

		// 2. マスタ存在チェック（トランザクション外）
		const invalidBuCodes =
			await importExportData.validateBusinessUnitCodes(buCodes);
		if (invalidBuCodes.length > 0) {
			throw new HTTPException(422, {
				message: `Invalid business unit codes: ${invalidBuCodes.join(", ")}`,
			});
		}

		if (ptCodes.length > 0) {
			const invalidPtCodes =
				await importExportData.validateProjectTypeCodes(ptCodes);
			if (invalidPtCodes.length > 0) {
				throw new HTTPException(422, {
					message: `Invalid project type codes: ${invalidPtCodes.join(", ")}`,
				});
			}
		}

		// 3. 案件コードで既存案件をバッチ検索
		const existingCodes = input.items
			.map((item) => item.projectCode)
			.filter((c): c is string => c !== null);
		const existingProjects =
			await importExportData.findProjectsByProjectCodes(existingCodes);

		// 4. トランザクション開始
		const pool = await getPool();
		const transaction = new sql.Transaction(pool);

		const result: BulkImportResult = {
			createdProjects: 0,
			updatedProjects: 0,
			deletedProjects: 0,
			createdCases: 0,
			updatedCases: 0,
			updatedRecords: 0,
		};

		try {
			await transaction.begin();

			// 案件コード → projectId のマップ（重複更新防止）
			const processedProjects = new Map<string, number>();

			for (const item of input.items) {
				let projectId: number;
				let projectCode = item.projectCode;

				if (projectCode === null) {
					// 案件コード空欄 → AUTO 採番で新規作成
					projectCode =
						await importExportData.generateNextAutoCode(transaction);
					projectId = await importExportData.createProject(
						{
							projectCode,
							name: item.name,
							businessUnitCode: item.businessUnitCode,
							projectTypeCode: item.projectTypeCode,
							startYearMonth: item.startYearMonth,
							totalManhour: item.totalManhour,
							status: "ACTIVE",
							durationMonths: item.durationMonths,
							fiscalYear: item.fiscalYear,
							nickname: item.nickname,
							customerName: item.customerName,
							orderNumber: item.orderNumber,
							calculationBasis: item.calculationBasis,
							remarks: item.remarks,
							region: item.region,
						},
						transaction,
					);
					result.createdProjects++;
					processedProjects.set(projectCode, projectId);
				} else {
					const existing = existingProjects.get(projectCode);
					if (existing) {
						projectId = existing.project_id;
						// 案件メタデータ更新（同一コード初回のみ）
						if (!processedProjects.has(projectCode)) {
							await importExportData.updateProject(
								projectId,
								{
									name: item.name,
									businessUnitCode: item.businessUnitCode,
									projectTypeCode: item.projectTypeCode,
									startYearMonth: item.startYearMonth,
									totalManhour: item.totalManhour,
									durationMonths: item.durationMonths,
									fiscalYear: item.fiscalYear,
									nickname: item.nickname,
									customerName: item.customerName,
									orderNumber: item.orderNumber,
									calculationBasis: item.calculationBasis,
									remarks: item.remarks,
									region: item.region,
								},
								transaction,
							);
							result.updatedProjects++;
							processedProjects.set(projectCode, projectId);
						} else {
							projectId = processedProjects.get(projectCode) as number;
						}
					} else {
						// 案件コードありだが DB に未存在 → 新規作成
						projectId = await importExportData.createProject(
							{
								projectCode,
								name: item.name,
								businessUnitCode: item.businessUnitCode,
								projectTypeCode: item.projectTypeCode,
								startYearMonth: item.startYearMonth,
								totalManhour: item.totalManhour,
								status: "ACTIVE",
								durationMonths: item.durationMonths,
								fiscalYear: item.fiscalYear,
								nickname: item.nickname,
								customerName: item.customerName,
								orderNumber: item.orderNumber,
								calculationBasis: item.calculationBasis,
								remarks: item.remarks,
								region: item.region,
							},
							transaction,
						);
						result.createdProjects++;
						processedProjects.set(projectCode, projectId);
					}
				}

				// 削除フラグ → ソフトデリート
				if (item.deleteFlag) {
					await importExportData.softDeleteProject(projectId, transaction);
					result.deletedProjects++;
					continue;
				}

				// ケース処理
				let projectCaseId: number;
				if (item.projectCaseId === null) {
					// 新規ケース
					projectCaseId = await importExportData.createProjectCase(
						projectId,
						item.caseName,
						transaction,
					);
					result.createdCases++;
				} else {
					projectCaseId = item.projectCaseId;
					result.updatedCases++;
				}

				// 月次データ MERGE
				for (const load of item.loads) {
					await importExportData.mergeProjectLoad(
						projectCaseId,
						load.yearMonth,
						load.manhour,
						transaction,
					);
					result.updatedRecords++;
				}
			}

			await transaction.commit();
		} catch (err) {
			await transaction.rollback();
			throw err;
		}

		return result;
	},
};
