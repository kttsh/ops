import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { ImportPreviewData } from "@/components/shared/ExcelImportDialog";
import { postBulkImport } from "@/features/projects/api/bulk-client";
import { projectKeys } from "@/features/projects/api/queries";
import {
	type BulkImportParseConfig,
	convertYearMonthHeader,
	parseBulkImportSheet,
	parseExcelFile,
	type ValidationError,
} from "@/lib/excel-utils";

export interface UseProjectBulkImportReturn {
	parseFile: (file: File) => Promise<ImportPreviewData>;
	confirmImport: (data: ImportPreviewData) => Promise<void>;
	isImporting: boolean;
}

/** YYYYMM → YYYY-MM */
function formatYearMonth(ym: string): string {
	return `${ym.slice(0, 4)}-${ym.slice(4, 6)}`;
}

export function useProjectBulkImport(): UseProjectBulkImportReturn {
	const [isImporting, setIsImporting] = useState(false);
	const queryClient = useQueryClient();

	const parseFile = useCallback(
		async (file: File): Promise<ImportPreviewData> => {
			const { headers, rawRows } = await parseExcelFile(file);

			const config: BulkImportParseConfig = {
				fixedColumnCount: 3,
				parseYearMonth: convertYearMonthHeader,
				validateRow: (row, rowIndex): ValidationError[] => {
					const rowErrors: ValidationError[] = [];
					const keyCode = row.fixedValues[0];
					if (keyCode == null || keyCode === "") {
						rowErrors.push({
							row: rowIndex,
							field: "keyCode",
							message: "キーコードは必須です",
						});
					} else if (
						typeof keyCode !== "number" &&
						Number.isNaN(Number(keyCode))
					) {
						rowErrors.push({
							row: rowIndex,
							field: "keyCode",
							message: `キーコード "${keyCode}" は数値である必要があります`,
							value: keyCode,
						});
					}
					return rowErrors;
				},
			};

			const result = parseBulkImportSheet(headers, rawRows, config);

			// ImportPreviewData に変換
			const previewHeaders = result.yearMonths.map(formatYearMonth);
			const previewRows = result.rows.map((row, idx) => {
				const rowNum = idx + 1;
				const hasError = result.errors.some((e) => e.row === rowNum);
				const keyCode = row.fixedValues[0] ?? "";
				const projectName = row.fixedValues[1] ?? "";
				const caseName = row.fixedValues[2] ?? "";
				return {
					label: `${keyCode} | ${projectName} / ${caseName}`,
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

			// warnings を errors に含める（ExcelImportDialog は warnings を知らないため表示用に追加）
			// ただし hasErrors は errors のみで判定する
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
		async (data: ImportPreviewData) => {
			setIsImporting(true);
			try {
				// ImportPreviewData から API リクエストを構築
				const yearMonths = data.headers.map((h) => {
					const ym = convertYearMonthHeader(h);
					return ym ?? "";
				});

				const items: Array<{
					projectCaseId: number;
					yearMonth: string;
					manhour: number;
				}> = [];

				for (const row of data.rows) {
					// label format: "keyCode | projectName / caseName"
					const keyCodeStr = row.label.split(" | ")[0];
					const projectCaseId = Number(keyCodeStr);
					if (Number.isNaN(projectCaseId)) continue;

					for (let i = 0; i < yearMonths.length; i++) {
						const ym = yearMonths[i];
						const value = row.values[i];
						if (ym && value != null) {
							items.push({ projectCaseId, yearMonth: ym, manhour: value });
						}
					}
				}

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
