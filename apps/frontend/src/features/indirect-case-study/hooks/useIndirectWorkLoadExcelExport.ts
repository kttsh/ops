import { useCallback, useState } from "react";
import {
	buildExportWorkbook,
	downloadWorkbook,
	type ExportSheetConfig,
} from "@/lib/excel-utils";
import { showWarningToast } from "@/lib/toast-utils";

export interface IndirectWorkLoadExportParams {
	indirectWorkCaseName: string;
	businessUnits: Array<{
		businessUnitName: string;
		businessUnitCode: string;
		loads: Array<{ yearMonth: string; manhour: number }>;
	}>;
	yearMonths: string[];
}

export interface UseIndirectWorkLoadExcelExportReturn {
	exportToExcel: (params: IndirectWorkLoadExportParams) => Promise<void>;
	isExporting: boolean;
}

/** YYYYMM → YYYY-MM */
function formatYearMonth(ym: string): string {
	return `${ym.slice(0, 4)}-${ym.slice(4, 6)}`;
}

export function useIndirectWorkLoadExcelExport(): UseIndirectWorkLoadExcelExportReturn {
	const [isExporting, setIsExporting] = useState(false);

	const exportToExcel = useCallback(
		async (params: IndirectWorkLoadExportParams) => {
			const { indirectWorkCaseName, businessUnits, yearMonths } = params;

			if (businessUnits.length === 0) {
				showWarningToast("エクスポートするデータがありません");
				return;
			}

			setIsExporting(true);
			try {
				const config: ExportSheetConfig = {
					sheetName: "間接工数",
					rowHeaderLabel: "BU名",
					yearMonths: yearMonths.map(formatYearMonth),
					rows: businessUnits.map((bu) => {
						const loadMap = new Map<string, number>();
						for (const l of bu.loads) {
							loadMap.set(l.yearMonth, l.manhour);
						}
						return {
							label: bu.businessUnitName,
							values: yearMonths.map((ym) => loadMap.get(ym) ?? 0),
						};
					}),
				};

				const workbook = await buildExportWorkbook(config);
				await downloadWorkbook(
					workbook,
					`間接工数_${indirectWorkCaseName}.xlsx`,
				);
			} finally {
				setIsExporting(false);
			}
		},
		[],
	);

	return { exportToExcel, isExporting };
}
