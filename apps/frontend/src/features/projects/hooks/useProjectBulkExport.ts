import { useCallback, useState } from "react";
import { fetchExportData } from "@/features/projects/api/bulk-client";
import {
	type BulkExportSheetConfig,
	buildBulkExportWorkbook,
	downloadWorkbook,
} from "@/lib/excel-utils";
import { showWarningToast } from "@/lib/toast-utils";

/** YYYYMM → YYYY-MM */
function formatYearMonth(ym: string): string {
	return `${ym.slice(0, 4)}-${ym.slice(4, 6)}`;
}

function formatDate(): string {
	const now = new Date();
	const y = now.getFullYear();
	const m = String(now.getMonth() + 1).padStart(2, "0");
	const d = String(now.getDate()).padStart(2, "0");
	return `${y}${m}${d}`;
}

export interface UseProjectBulkExportReturn {
	exportToExcel: () => Promise<void>;
	isExporting: boolean;
}

export function useProjectBulkExport(): UseProjectBulkExportReturn {
	const [isExporting, setIsExporting] = useState(false);

	const exportToExcel = useCallback(async () => {
		setIsExporting(true);
		try {
			const result = await fetchExportData();

			if (result.data.length === 0) {
				showWarningToast("エクスポートするデータがありません");
				return;
			}

			const displayYearMonths = result.yearMonths.map(formatYearMonth);

			const config: BulkExportSheetConfig = {
				sheetName: "案件工数一括",
				fixedHeaders: ["キーコード", "案件名", "ケース名"],
				yearMonths: displayYearMonths,
				rows: result.data.map((row) => {
					const loadMap = new Map<string, number>();
					for (const l of row.loads) {
						loadMap.set(l.yearMonth, l.manhour);
					}
					return {
						fixedValues: [row.projectCaseId, row.projectName, row.caseName],
						monthlyValues: result.yearMonths.map((ym) => loadMap.get(ym) ?? 0),
					};
				}),
			};

			const workbook = await buildBulkExportWorkbook(config);
			await downloadWorkbook(workbook, `案件工数一括_${formatDate()}.xlsx`);
		} finally {
			setIsExporting(false);
		}
	}, []);

	return { exportToExcel, isExporting };
}
