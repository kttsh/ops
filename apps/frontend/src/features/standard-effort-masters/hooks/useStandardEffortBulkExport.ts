import { useCallback, useState } from "react";
import { fetchExportData } from "@/features/standard-effort-masters/api/bulk-client";
import { PROGRESS_RATES } from "@/features/standard-effort-masters/types";
import {
	type BulkExportSheetConfig,
	buildBulkExportWorkbook,
	downloadWorkbook,
} from "@/lib/excel-utils";
import { showWarningToast } from "@/lib/toast-utils";

function formatDate(): string {
	const now = new Date();
	const y = now.getFullYear();
	const m = String(now.getMonth() + 1).padStart(2, "0");
	const d = String(now.getDate()).padStart(2, "0");
	return `${y}${m}${d}`;
}

export interface UseStandardEffortBulkExportReturn {
	exportToExcel: (businessUnitCode?: string) => Promise<void>;
	isExporting: boolean;
}

export function useStandardEffortBulkExport(): UseStandardEffortBulkExportReturn {
	const [isExporting, setIsExporting] = useState(false);

	const exportToExcel = useCallback(async (businessUnitCode?: string) => {
		setIsExporting(true);
		try {
			const result = await fetchExportData(
				businessUnitCode ? { businessUnitCode } : undefined,
			);

			if (result.data.length === 0) {
				showWarningToast("エクスポートするデータがありません");
				return;
			}

			const progressHeaders = PROGRESS_RATES.map((rate) => `${rate}%`);

			const config: BulkExportSheetConfig = {
				sheetName: "標準工数パターン一括",
				fixedHeaders: [
					"キーコード",
					"パターン名",
					"BUコード",
					"案件タイプコード",
				],
				yearMonths: progressHeaders,
				rows: result.data.map((row) => {
					const weightMap = new Map<number, number>();
					for (const w of row.weights) {
						weightMap.set(w.progressRate, w.weight);
					}
					return {
						fixedValues: [
							row.standardEffortId,
							row.name,
							row.businessUnitCode,
							row.projectTypeCode,
						],
						monthlyValues: PROGRESS_RATES.map(
							(rate) => weightMap.get(rate) ?? 0,
						),
					};
				}),
			};

			const workbook = await buildBulkExportWorkbook(config);
			await downloadWorkbook(
				workbook,
				`標準工数パターン一括_${formatDate()}.xlsx`,
			);
		} finally {
			setIsExporting(false);
		}
	}, []);

	return { exportToExcel, isExporting };
}
