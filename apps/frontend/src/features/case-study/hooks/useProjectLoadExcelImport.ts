import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { ImportPreviewData } from "@/components/shared/ExcelImportDialog";
import { useBulkUpsertProjectLoads } from "@/features/case-study/api/mutations";
import {
	convertYearMonthHeader,
	type ImportParseConfig,
	parseExcelFile,
	parseImportSheet,
	type ValidationError,
} from "@/lib/excel-utils";

export interface ProjectLoadImportContext {
	projectCaseId: number;
}

export interface UseProjectLoadExcelImportReturn {
	parseFile: (file: File) => Promise<ImportPreviewData>;
	confirmImport: (data: ImportPreviewData) => Promise<void>;
	isImporting: boolean;
}

/** YYYYMM → YYYY-MM */
function formatYearMonth(ym: string): string {
	return `${ym.slice(0, 4)}-${ym.slice(4, 6)}`;
}

export function useProjectLoadExcelImport(
	context: ProjectLoadImportContext,
): UseProjectLoadExcelImportReturn {
	const [isImporting, setIsImporting] = useState(false);
	const bulkMutation = useBulkUpsertProjectLoads();

	const parseFile = useCallback(
		async (file: File): Promise<ImportPreviewData> => {
			const { headers, rawRows } = await parseExcelFile(file);

			const config: ImportParseConfig = {
				minColumns: 2,
				parseYearMonth: convertYearMonthHeader,
				validateRow: (): ValidationError[] => {
					// 案件工数: yearMonth 重複チェックはヘッダー解析で検出済み
					// manhour のバリデーションは parseImportSheet 内で実施
					return [];
				},
			};

			const result = parseImportSheet(headers, rawRows, config);

			// ImportPreviewData に変換
			const previewHeaders = result.yearMonths.map(formatYearMonth);
			const previewRows = result.rows.map((row, idx) => {
				const rowNum = idx + 1;
				const hasError = result.errors.some((e) => e.row === rowNum);
				return {
					label: row.rowLabel,
					values: result.yearMonths.map(
						(ym) => row.monthlyValues.get(ym) ?? null,
					),
					hasError,
				};
			});

			// 総レコード数 = yearMonth の数（1行 × N列）
			let totalRecords = 0;
			for (const row of result.rows) {
				totalRecords += row.monthlyValues.size;
			}

			return {
				headers: previewHeaders,
				rows: previewRows,
				errors: result.errors,
				totalRecords,
			};
		},
		[],
	);

	const confirmImport = useCallback(
		async (data: ImportPreviewData) => {
			setIsImporting(true);
			try {
				// ImportPreviewData からバルク API 用のデータを再構築
				// ヘッダー（YYYY-MM）を YYYYMM に変換
				const yearMonths = data.headers.map((h) => {
					const ym = convertYearMonthHeader(h);
					return ym ?? "";
				});

				const items: Array<{ yearMonth: string; manhour: number }> = [];
				for (const row of data.rows) {
					for (let i = 0; i < yearMonths.length; i++) {
						const ym = yearMonths[i];
						const value = row.values[i];
						if (ym && value != null) {
							items.push({ yearMonth: ym, manhour: value });
						}
					}
				}

				await bulkMutation.mutateAsync({
					projectCaseId: context.projectCaseId,
					input: { items },
				});

				toast.success("インポートが完了しました");
			} catch {
				toast.error("インポートに失敗しました");
				throw new Error("インポートに失敗しました");
			} finally {
				setIsImporting(false);
			}
		},
		[context.projectCaseId, bulkMutation],
	);

	return { parseFile, confirmImport, isImporting };
}
