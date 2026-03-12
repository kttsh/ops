import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import type { ImportPreviewData } from "@/components/shared/ExcelImportDialog";
import {
	type BulkImportRow as BulkImportApiRow,
	postBulkImport,
} from "@/features/projects/api/bulk-client";
import { projectKeys } from "@/features/projects/api/queries";
import {
	type BulkImportParseConfig,
	type BulkImportParseResult,
	type BulkImportRow,
	convertShortYearMonthHeader,
	formatShortYearMonth,
	parseBulkImportSheet,
	parseExcelFile,
	type ValidationError,
} from "@/lib/excel-utils";

export interface UseProjectBulkImportReturn {
	parseFile: (file: File) => Promise<ImportPreviewData>;
	confirmImport: (data: ImportPreviewData) => Promise<void>;
	isImporting: boolean;
}

export function useProjectBulkImport(): UseProjectBulkImportReturn {
	const [isImporting, setIsImporting] = useState(false);
	const queryClient = useQueryClient();
	const parsedResultRef = useRef<BulkImportParseResult | null>(null);

	const parseFile = useCallback(
		async (file: File): Promise<ImportPreviewData> => {
			const { headers, rawRows } = await parseExcelFile(file);

			const config: BulkImportParseConfig = {
				fixedColumnCount: 17,
				parseYearMonth: convertShortYearMonthHeader,
				validateRow: (
					row: BulkImportRow,
					rowIndex: number,
				): ValidationError[] => {
					const rowErrors: ValidationError[] = [];
					const projectCode = row.fixedValues[0];
					const buCode = row.fixedValues[1];
					const projectName = row.fixedValues[4];
					const startYearMonth = row.fixedValues[8];
					const totalManhour = row.fixedValues[9];
					const projectCaseId = row.fixedValues[15];
					const caseName = row.fixedValues[16];

					// B列（BU）: 必須チェック
					if (buCode == null || buCode === "") {
						rowErrors.push({
							row: rowIndex,
							column: 1,
							field: "businessUnitCode",
							message: "BU（B列）は必須です",
						});
					}

					const isNewProject = projectCode == null || projectCode === "";

					// E列（案件名）: 案件コード空欄時に必須
					if (isNewProject && (projectName == null || projectName === "")) {
						rowErrors.push({
							row: rowIndex,
							column: 4,
							field: "name",
							message: "新規案件の場合、案件名（E列）は必須です",
						});
					}

					// I列（開始時期）: YYYYMM 形式チェック、案件コード空欄時に必須
					if (
						isNewProject &&
						(startYearMonth == null || startYearMonth === "")
					) {
						rowErrors.push({
							row: rowIndex,
							column: 8,
							field: "startYearMonth",
							message: "新規案件の場合、開始時期（I列）は必須です",
						});
					} else if (startYearMonth != null && startYearMonth !== "") {
						const sym = String(startYearMonth);
						if (!/^\d{6}$/.test(sym)) {
							rowErrors.push({
								row: rowIndex,
								column: 8,
								field: "startYearMonth",
								message: "開始時期（I列）はYYYYMM形式で入力してください",
								value: sym,
							});
						}
					}

					// J列（全体工数）: 数値・範囲チェック、案件コード空欄時に必須
					if (isNewProject && (totalManhour == null || totalManhour === "")) {
						rowErrors.push({
							row: rowIndex,
							column: 9,
							field: "totalManhour",
							message: "新規案件の場合、案件工数（J列）は必須です",
						});
					} else if (totalManhour != null && totalManhour !== "") {
						const num =
							typeof totalManhour === "number"
								? totalManhour
								: Number(totalManhour);
						if (
							Number.isNaN(num) ||
							num < 0 ||
							num > 99_999_999 ||
							!Number.isInteger(num)
						) {
							rowErrors.push({
								row: rowIndex,
								column: 9,
								field: "totalManhour",
								message:
									"案件工数（J列）は0以上99,999,999以下の整数で入力してください",
								value: totalManhour as string | number,
							});
						}
					}

					// Q列（ケース名）: ケースNo空欄時に必須
					const isNewCase = projectCaseId == null || projectCaseId === "";
					if (isNewCase && (caseName == null || caseName === "")) {
						rowErrors.push({
							row: rowIndex,
							column: 16,
							field: "caseName",
							message: "新規ケースの場合、工数ケース名（Q列）は必須です",
						});
					}

					return rowErrors;
				},
			};

			const result = parseBulkImportSheet(headers, rawRows, config);
			parsedResultRef.current = result;

			// ImportPreviewData に変換
			const previewHeaders = result.yearMonths.map(formatShortYearMonth);
			const previewRows = result.rows.map((row, idx) => {
				const rowNum = idx + 1;
				const hasError = result.errors.some((e) => e.row === rowNum);
				const projectCode = row.fixedValues[0] ?? "";
				const projectName = row.fixedValues[4] ?? "";
				const caseName = row.fixedValues[16] ?? "";
				return {
					label: `${projectCode} | ${projectName} / ${caseName}`,
					values: result.yearMonths.map(
						(ym) => row.monthlyValues.get(ym) ?? null,
					),
					hasError,
				};
			});

			let totalRecords = 0;
			for (const row of result.rows) {
				totalRecords += row.monthlyValues.size;
			}

			const allIssues = [...result.errors, ...result.warnings];

			return {
				headers: previewHeaders,
				rows: previewRows,
				errors: result.errors.length > 0 ? allIssues : result.warnings,
				totalRecords,
			};
		},
		[],
	);

	const confirmImport = useCallback(
		async (_data: ImportPreviewData) => {
			setIsImporting(true);
			try {
				const parsed = parsedResultRef.current;
				if (!parsed) {
					throw new Error("パースデータがありません");
				}

				const items: BulkImportApiRow[] = parsed.rows.map((row) => {
					const fv = row.fixedValues;
					const projectCodeRaw = fv[0];
					const buCodeRaw = fv[1];
					const fiscalYearRaw = fv[2];
					const ptCodeRaw = fv[3];
					const nameRaw = fv[4];
					const nicknameRaw = fv[5];
					const customerNameRaw = fv[6];
					const orderNumberRaw = fv[7];
					const startYmRaw = fv[8];
					const totalMhRaw = fv[9];
					const durationRaw = fv[10];
					const calcBasisRaw = fv[11];
					const remarksRaw = fv[12];
					const regionRaw = fv[13];
					const deleteFlagRaw = fv[14];
					const caseIdRaw = fv[15];
					const caseNameRaw = fv[16];

					const toStr = (v: string | number | null): string | null =>
						v == null || v === "" ? null : String(v);
					const toNum = (v: string | number | null): number | null => {
						if (v == null || v === "") return null;
						const n = typeof v === "number" ? v : Number(v);
						return Number.isNaN(n) ? null : n;
					};

					const deleteFlag =
						deleteFlagRaw === 1 ||
						deleteFlagRaw === "1" ||
						deleteFlagRaw === "削除";

					const loads: Array<{ yearMonth: string; manhour: number }> = [];
					for (const ym of parsed.yearMonths) {
						loads.push({
							yearMonth: ym,
							manhour: row.monthlyValues.get(ym) ?? 0,
						});
					}

					return {
						projectCode: toStr(projectCodeRaw),
						businessUnitCode: String(buCodeRaw ?? ""),
						fiscalYear: toNum(fiscalYearRaw),
						projectTypeCode: toStr(ptCodeRaw),
						name: String(nameRaw ?? ""),
						nickname: toStr(nicknameRaw),
						customerName: toStr(customerNameRaw),
						orderNumber: toStr(orderNumberRaw),
						startYearMonth: String(startYmRaw ?? ""),
						totalManhour: toNum(totalMhRaw) ?? 0,
						durationMonths: toNum(durationRaw),
						calculationBasis: toStr(calcBasisRaw),
						remarks: toStr(remarksRaw),
						region: toStr(regionRaw),
						deleteFlag,
						projectCaseId: toNum(caseIdRaw),
						caseName: String(caseNameRaw ?? ""),
						loads,
					};
				});

				await postBulkImport(items);

				queryClient.invalidateQueries({
					queryKey: projectKeys.all,
				});

				toast.success("インポートが完了しました");
			} catch {
				toast.error("インポートに失敗しました");
				throw new Error("インポートに失敗しました");
			} finally {
				setIsImporting(false);
			}
		},
		[queryClient],
	);

	return { parseFile, confirmImport, isImporting };
}
