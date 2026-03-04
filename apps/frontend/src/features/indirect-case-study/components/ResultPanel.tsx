import { Download, Loader2, Upload } from "lucide-react";
import { memo, useCallback, useState } from "react";
import { ExcelImportDialog } from "@/components/shared/ExcelImportDialog";
import { Button } from "@/components/ui/button";
import { useExcelExport } from "@/features/indirect-case-study/hooks/useExcelExport";
import { getFiscalYear } from "@/features/indirect-case-study/hooks/useIndirectWorkCalculation";
import { useIndirectWorkLoadExcelExport } from "@/features/indirect-case-study/hooks/useIndirectWorkLoadExcelExport";
import { useIndirectWorkLoadExcelImport } from "@/features/indirect-case-study/hooks/useIndirectWorkLoadExcelImport";
import type {
	CalculateCapacityResult,
	CalculationTableData,
	IndirectWorkCalcResult,
	IndirectWorkTypeRatio,
	MonthlyHeadcountPlan,
} from "@/features/indirect-case-study/types";
import type { WorkType } from "@/features/work-types/types";
import { CalculationResultTable } from "./CalculationResultTable";

interface ResultPanelProps {
	capacityResult: CalculateCapacityResult | null;
	indirectWorkResult: IndirectWorkCalcResult | null;
	monthlyHeadcountPlans: MonthlyHeadcountPlan[];
	ratios: IndirectWorkTypeRatio[];
	workTypes: WorkType[];
	fiscalYear: number;
	onFiscalYearChange: (year: number) => void;
	headcountPlanCaseName: string;
	scenarioName: string;
	indirectWorkCaseName: string;
	indirectWorkCaseId: number | null;
	onSaveIndirectWorkLoads: () => Promise<void>;
	isSavingResults: boolean;
	indirectWorkResultDirty: boolean;
	businessUnitCode: string;
	businessUnitName: string;
}

const MONTHS = [
	"04",
	"05",
	"06",
	"07",
	"08",
	"09",
	"10",
	"11",
	"12",
	"01",
	"02",
	"03",
];

function getYearMonth(fiscalYear: number, monthStr: string): string {
	const month = parseInt(monthStr, 10);
	const year = month >= 4 ? fiscalYear : fiscalYear + 1;
	return `${year}${monthStr}`;
}

export const ResultPanel = memo(function ResultPanel({
	capacityResult,
	indirectWorkResult,
	monthlyHeadcountPlans,
	ratios,
	workTypes,
	fiscalYear,
	onFiscalYearChange,
	headcountPlanCaseName,
	scenarioName,
	indirectWorkCaseName,
	indirectWorkCaseId,
	onSaveIndirectWorkLoads,
	isSavingResults,
	indirectWorkResultDirty,
	businessUnitCode,
	businessUnitName,
}: ResultPanelProps) {
	const { exportToExcel, isExporting } = useExcelExport();
	const { exportToExcel: exportInputData, isExporting: isExportingInput } =
		useIndirectWorkLoadExcelExport();

	// インポート
	const [importDialogOpen, setImportDialogOpen] = useState(false);
	const { parseFile, confirmImport, isImporting } =
		useIndirectWorkLoadExcelImport({
			indirectWorkCaseId: indirectWorkCaseId ?? 0,
			businessUnits: [{ businessUnitName, businessUnitCode }],
		});

	const hasResults = capacityResult !== null;

	const handleExport = useCallback(async () => {
		if (!capacityResult) return;

		const yearMonths = MONTHS.map((m) => getYearMonth(fiscalYear, m));
		const headcountMap = new Map(
			monthlyHeadcountPlans.map((p) => [p.yearMonth, p.headcount]),
		);
		const capacityMap = new Map(
			capacityResult.items.map((c) => [c.yearMonth, c.capacity]),
		);
		const indirectTotalMap = new Map(
			indirectWorkResult?.monthlyLoads.map((l) => [l.yearMonth, l.manhour]) ??
				[],
		);

		const rows: CalculationTableData["rows"] = [];

		// 人員数
		const headcountMonthly: Record<string, number> = {};
		yearMonths.forEach((ym) => {
			headcountMonthly[ym] = headcountMap.get(ym) ?? 0;
		});
		rows.push({
			label: "人員数（人）",
			type: "headcount",
			monthly: headcountMonthly,
			annualTotal: Object.values(headcountMonthly).reduce((a, b) => a + b, 0),
		});

		// キャパシティ
		const capacityMonthly: Record<string, number> = {};
		yearMonths.forEach((ym) => {
			capacityMonthly[ym] = capacityMap.get(ym) ?? 0;
		});
		rows.push({
			label: "キャパシティ（時間）",
			type: "capacity",
			monthly: capacityMonthly,
			annualTotal: Object.values(capacityMonthly).reduce((a, b) => a + b, 0),
		});

		// 間接内訳
		workTypes.forEach((wt) => {
			const monthly: Record<string, number> = {};
			yearMonths.forEach((ym) => {
				const cap = capacityMap.get(ym) ?? 0;
				const fy = getFiscalYear(ym);
				const ratio = ratios.find(
					(r) => r.fiscalYear === fy && r.workTypeCode === wt.workTypeCode,
				);
				monthly[ym] = Math.round(cap * (ratio?.ratio ?? 0));
			});
			rows.push({
				label: wt.name,
				type: "indirect-breakdown",
				workTypeCode: wt.workTypeCode,
				monthly,
				annualTotal: Object.values(monthly).reduce((a, b) => a + b, 0),
			});
		});

		// 間接合計
		const indirectMonthly: Record<string, number> = {};
		yearMonths.forEach((ym) => {
			indirectMonthly[ym] = indirectTotalMap.get(ym) ?? 0;
		});
		rows.push({
			label: "間接合計（時間）",
			type: "indirect-total",
			monthly: indirectMonthly,
			annualTotal: Object.values(indirectMonthly).reduce((a, b) => a + b, 0),
		});

		await exportToExcel({
			headcountPlanCaseName,
			scenarioName,
			indirectWorkCaseName,
			fiscalYear,
			tableData: { rows, months: yearMonths },
		});
	}, [
		capacityResult,
		indirectWorkResult,
		monthlyHeadcountPlans,
		ratios,
		workTypes,
		fiscalYear,
		headcountPlanCaseName,
		scenarioName,
		indirectWorkCaseName,
		exportToExcel,
	]);

	const handleExportInput = useCallback(async () => {
		if (!indirectWorkResult) return;

		// monthlyLoads をグルーピングして yearMonths を抽出
		const yearMonthSet = new Set<string>();
		const loadMap = new Map<
			string,
			Array<{ yearMonth: string; manhour: number }>
		>();

		for (const load of indirectWorkResult.monthlyLoads) {
			yearMonthSet.add(load.yearMonth);
			const existing = loadMap.get(load.businessUnitCode) ?? [];
			existing.push({ yearMonth: load.yearMonth, manhour: load.manhour });
			loadMap.set(load.businessUnitCode, existing);
		}

		const yearMonths = [...yearMonthSet].sort();

		await exportInputData({
			indirectWorkCaseName,
			businessUnits: [
				{
					businessUnitName,
					businessUnitCode,
					loads: loadMap.get(businessUnitCode) ?? [],
				},
			],
			yearMonths,
		});
	}, [
		indirectWorkResult,
		indirectWorkCaseName,
		businessUnitCode,
		businessUnitName,
		exportInputData,
	]);

	if (!hasResults) {
		return (
			<div className="flex items-center justify-center h-full text-muted-foreground">
				<p className="text-sm">
					左パネルでケースとシナリオを選択し、計算を実行してください。
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-4 h-full overflow-y-auto pr-2">
			<div className="flex items-center justify-between">
				<h2 className="text-base font-semibold">計算結果</h2>
				<div className="flex gap-2">
					{indirectWorkResult && (
						<>
							<Button
								size="sm"
								onClick={onSaveIndirectWorkLoads}
								disabled={!indirectWorkResultDirty || isSavingResults}
							>
								{isSavingResults && (
									<Loader2 className="h-4 w-4 animate-spin mr-1" />
								)}
								間接作業工数を保存
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => setImportDialogOpen(true)}
							>
								<Upload className="h-4 w-4 mr-1" />
								インポート
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={handleExportInput}
								disabled={isExportingInput}
							>
								{isExportingInput ? (
									<Loader2 className="h-4 w-4 animate-spin mr-1" />
								) : (
									<Download className="h-4 w-4 mr-1" />
								)}
								入力データ
							</Button>
						</>
					)}
					<Button
						variant="outline"
						size="sm"
						onClick={handleExport}
						disabled={isExporting}
					>
						{isExporting ? (
							<Loader2 className="h-4 w-4 animate-spin mr-1" />
						) : (
							<Download className="h-4 w-4 mr-1" />
						)}
						計算結果
					</Button>
				</div>
			</div>

			<CalculationResultTable
				capacityResult={capacityResult}
				indirectWorkResult={indirectWorkResult}
				monthlyHeadcountPlans={monthlyHeadcountPlans}
				ratios={ratios}
				workTypes={workTypes}
				fiscalYear={fiscalYear}
				onFiscalYearChange={onFiscalYearChange}
				headcountPlanCaseName={headcountPlanCaseName}
				scenarioName={scenarioName}
				indirectWorkCaseName={indirectWorkCaseName}
			/>

			{/* Excel インポートダイアログ */}
			<ExcelImportDialog
				open={importDialogOpen}
				onOpenChange={setImportDialogOpen}
				title="間接工数インポート"
				description="Excel ファイルから間接工数データを一括インポートします。エクスポートしたファイルをそのまま使用できます。"
				onFileParsed={parseFile}
				onConfirm={confirmImport}
				isImporting={isImporting}
			/>
		</div>
	);
});
