import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { ImportPreviewData } from "@/components/shared/ExcelImportDialog";
import { useBulkSaveMonthlyIndirectWorkLoads } from "@/features/indirect-case-study/api/mutations";
import {
	convertYearMonthHeader,
	type ImportParseConfig,
	type ImportRow,
	parseExcelFile,
	parseImportSheet,
	type ValidationError,
} from "@/lib/excel-utils";

export interface IndirectWorkLoadImportContext {
	indirectWorkCaseId: number;
	/** BU 名 → businessUnitCode の解決に必要 */
	businessUnits: Array<{ businessUnitName: string; businessUnitCode: string }>;
}

export interface UseIndirectWorkLoadExcelImportReturn {
	parseFile: (file: File) => Promise<ImportPreviewData>;
	confirmImport: (data: ImportPreviewData) => Promise<void>;
	isImporting: boolean;
}

/** YYYYMM → YYYY-MM */
function formatYearMonth(ym: string): string {
	return `${ym.slice(0, 4)}-${ym.slice(4, 6)}`;
}

export function useIndirectWorkLoadExcelImport(
	context: IndirectWorkLoadImportContext,
): UseIndirectWorkLoadExcelImportReturn {
	const [isImporting, setIsImporting] = useState(false);
	const bulkMutation = useBulkSaveMonthlyIndirectWorkLoads();

	// BU名 → BUコード のマップを構築
	const buNameToCode = new Map(
		context.businessUnits.map((bu) => [
			bu.businessUnitName,
			bu.businessUnitCode,
		]),
	);

	const parseFile = useCallback(
		async (file: File): Promise<ImportPreviewData> => {
			const { headers, rawRows } = await parseExcelFile(file);

			const config: ImportParseConfig = {
				minColumns: 2,
				parseYearMonth: convertYearMonthHeader,
				validateRow: (row: ImportRow, rowIndex: number): ValidationError[] => {
					const rowErrors: ValidationError[] = [];

					// BU名の存在チェック
					if (!buNameToCode.has(row.rowLabel)) {
						rowErrors.push({
							row: rowIndex,
							field: "businessUnitName",
							message: `BU名 "${row.rowLabel}" が見つかりません`,
							value: row.rowLabel,
						});
					}

					return rowErrors;
				},
			};

			const result = parseImportSheet(headers, rawRows, config);

			// businessUnitCode + yearMonth の重複チェック
			const seen = new Set<string>();
			for (let rowIdx = 0; rowIdx < result.rows.length; rowIdx++) {
				const row = result.rows[rowIdx];
				const buCode = buNameToCode.get(row.rowLabel);
				if (!buCode) continue;

				for (const ym of row.monthlyValues.keys()) {
					const key = `${buCode}:${ym}`;
					if (seen.has(key)) {
						result.errors.push({
							row: rowIdx + 1,
							field: "duplicate",
							message: `BU "${row.rowLabel}" の年月 "${formatYearMonth(ym)}" が重複しています`,
							value: key,
						});
					}
					seen.add(key);
				}
			}

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

			// 総レコード数 = BU × yearMonth の組み合わせ数
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
		[buNameToCode],
	);

	const confirmImport = useCallback(
		async (data: ImportPreviewData) => {
			setIsImporting(true);
			try {
				// ImportPreviewData からバルク API 用のデータを再構築
				const yearMonths = data.headers.map((h) => {
					const ym = convertYearMonthHeader(h);
					return ym ?? "";
				});

				const items: Array<{
					businessUnitCode: string;
					yearMonth: string;
					manhour: number;
					source: "calculated" | "manual";
				}> = [];

				for (const row of data.rows) {
					const buCode = buNameToCode.get(row.label);
					if (!buCode) continue;

					for (let i = 0; i < yearMonths.length; i++) {
						const ym = yearMonths[i];
						const value = row.values[i];
						if (ym && value != null) {
							items.push({
								businessUnitCode: buCode,
								yearMonth: ym,
								manhour: value,
								source: "manual",
							});
						}
					}
				}

				await bulkMutation.mutateAsync({
					caseId: context.indirectWorkCaseId,
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
		[context.indirectWorkCaseId, buNameToCode, bulkMutation],
	);

	return { parseFile, confirmImport, isImporting };
}
