import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { ImportPreviewData } from "@/components/shared/ExcelImportDialog";
import { postBulkImport } from "@/features/standard-effort-masters/api/bulk-client";
import { standardEffortMasterKeys } from "@/features/standard-effort-masters/api/queries";
import {
	type BulkImportParseConfig,
	parseBulkImportSheet,
	parseExcelFile,
	type ValidationError,
} from "@/lib/excel-utils";
import { PROGRESS_RATES } from "@/features/standard-effort-masters/types";

export interface UseStandardEffortBulkImportReturn {
	parseFile: (file: File) => Promise<ImportPreviewData>;
	confirmImport: (data: ImportPreviewData) => Promise<void>;
	isImporting: boolean;
}

/** Parse progress rate header like "0%", "5%", ..., "100%" → index */
function parseProgressRateHeader(header: string): string | null {
	const match = header.trim().match(/^(\d+)%$/);
	if (!match) return null;
	const rate = Number(match[1]);
	if (!PROGRESS_RATES.includes(rate)) return null;
	return String(rate);
}

export function useStandardEffortBulkImport(): UseStandardEffortBulkImportReturn {
	const [isImporting, setIsImporting] = useState(false);
	const queryClient = useQueryClient();

	const parseFile = useCallback(
		async (file: File): Promise<ImportPreviewData> => {
			const { headers, rawRows } = await parseExcelFile(file);

			const config: BulkImportParseConfig = {
				fixedColumnCount: 4,
				parseYearMonth: parseProgressRateHeader,
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

			const previewHeaders = result.yearMonths.map((ym) => `${ym}%`);
			const previewRows = result.rows.map((row, idx) => {
				const rowNum = idx + 1;
				const hasError = result.errors.some((e) => e.row === rowNum);
				const keyCode = row.fixedValues[0] ?? "";
				const name = row.fixedValues[1] ?? "";
				const buCode = row.fixedValues[2] ?? "";
				const ptCode = row.fixedValues[3] ?? "";
				return {
					label: `${keyCode} | ${name} (${buCode}/${ptCode})`,
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
		async (data: ImportPreviewData) => {
			setIsImporting(true);
			try {
				const items: Array<{
					standardEffortId: number;
					weights: Array<{ progressRate: number; weight: number }>;
				}> = [];

				for (const row of data.rows) {
					const keyCodeStr = row.label.split(" | ")[0];
					const standardEffortId = Number(keyCodeStr);
					if (Number.isNaN(standardEffortId)) continue;

					const weights: Array<{
						progressRate: number;
						weight: number;
					}> = [];
					for (let i = 0; i < data.headers.length; i++) {
						const headerMatch = data.headers[i].match(/^(\d+)%$/);
						if (!headerMatch) continue;
						const progressRate = Number(headerMatch[1]);
						const value = row.values[i];
						weights.push({
							progressRate,
							weight: value ?? 0,
						});
					}

					items.push({ standardEffortId, weights });
				}

				await postBulkImport(items);

				queryClient.invalidateQueries({
					queryKey: standardEffortMasterKeys.all,
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
