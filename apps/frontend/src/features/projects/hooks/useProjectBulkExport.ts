import { useCallback, useState } from "react";
import { fetchExportData } from "@/features/projects/api/bulk-client";
import {
	type BulkExportSheetConfig,
	buildBulkExportWorkbook,
	downloadWorkbook,
	formatShortYearMonth,
} from "@/lib/excel-utils";
import { showWarningToast } from "@/lib/toast-utils";

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

			const displayYearMonths = result.yearMonths.map(formatShortYearMonth);

			const config: BulkExportSheetConfig = {
				sheetName: "案件工数一括",
				fixedHeaders: [
					"案件コード",
					"BU",
					"年度",
					"工事種別",
					"案件名",
					"通称・略称",
					"客先名",
					"オーダ",
					"開始時期",
					"案件工数",
					"月数",
					"算出根拠",
					"備考",
					"地域",
					"削除",
					"工数ケースNo",
					"工数ケース名",
				],
				yearMonths: displayYearMonths,
				rows: result.data.map((row) => {
					const loadMap = new Map<string, number>();
					for (const l of row.loads) {
						loadMap.set(l.yearMonth, l.manhour);
					}
					return {
						fixedValues: [
							row.projectCode,
							row.businessUnitCode,
							row.fiscalYear ?? "",
							row.projectTypeCode ?? "",
							row.name,
							row.nickname ?? "",
							row.customerName ?? "",
							row.orderNumber ?? "",
							row.startYearMonth,
							row.totalManhour,
							row.durationMonths ?? "",
							row.calculationBasis ?? "",
							row.remarks ?? "",
							row.region ?? "",
							"",
							row.projectCaseId,
							row.caseName,
						],
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
