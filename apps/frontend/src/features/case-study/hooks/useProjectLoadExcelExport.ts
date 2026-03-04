import { useCallback, useState } from "react";
import {
	buildExportWorkbook,
	downloadWorkbook,
	type ExportSheetConfig,
} from "@/lib/excel-utils";
import { showWarningToast } from "@/lib/toast-utils";

export interface ProjectLoadExportParams {
	/** 選択中のケース名（Excel の行ラベルおよびファイル名に使用） */
	caseName: string;
	/** 選択中のケースの月別工数データ */
	loads: Array<{ yearMonth: string; manhour: number }>;
	/** 年月リスト（YYYYMM 形式） */
	yearMonths: string[];
}

export interface UseProjectLoadExcelExportReturn {
	exportToExcel: (params: ProjectLoadExportParams) => Promise<void>;
	isExporting: boolean;
}

/** YYYYMM → YYYY-MM */
function formatYearMonth(ym: string): string {
	return `${ym.slice(0, 4)}-${ym.slice(4, 6)}`;
}

export function useProjectLoadExcelExport(): UseProjectLoadExcelExportReturn {
	const [isExporting, setIsExporting] = useState(false);

	const exportToExcel = useCallback(async (params: ProjectLoadExportParams) => {
		const { caseName, loads, yearMonths } = params;

		if (loads.length === 0) {
			showWarningToast("エクスポートするデータがありません");
			return;
		}

		setIsExporting(true);
		try {
			// 工数を Map 化
			const loadMap = new Map<string, number>();
			for (const l of loads) {
				loadMap.set(l.yearMonth, l.manhour);
			}

			const config: ExportSheetConfig = {
				sheetName: "案件工数",
				rowHeaderLabel: "ケース名",
				yearMonths: yearMonths.map(formatYearMonth),
				rows: [
					{
						label: caseName,
						values: yearMonths.map((ym) => loadMap.get(ym) ?? 0),
					},
				],
			};

			const workbook = await buildExportWorkbook(config);
			await downloadWorkbook(workbook, `案件工数_${caseName}.xlsx`);
		} finally {
			setIsExporting(false);
		}
	}, []);

	return { exportToExcel, isExporting };
}
