import { ChevronDown, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { getFiscalYear } from "@/features/indirect-case-study/hooks/useIndirectWorkCalculation";
import type {
	CalculateCapacityResult,
	IndirectWorkCalcResult,
	IndirectWorkTypeRatio,
	MonthlyHeadcountPlan,
} from "@/features/indirect-case-study/types";
import type { WorkType } from "@/features/work-types/types";

interface CalculationResultTableProps {
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
const MONTH_LABELS = [
	"4月",
	"5月",
	"6月",
	"7月",
	"8月",
	"9月",
	"10月",
	"11月",
	"12月",
	"1月",
	"2月",
	"3月",
];

function getYearMonth(fiscalYear: number, monthStr: string): string {
	const month = parseInt(monthStr, 10);
	const year = month >= 4 ? fiscalYear : fiscalYear + 1;
	return `${year}${monthStr}`;
}

function generateFiscalYearOptions(): number[] {
	const now = new Date();
	const fy = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
	const years: number[] = [];
	for (let i = fy - 2; i <= fy + 8; i++) {
		years.push(i);
	}
	return years;
}

export function CalculationResultTable({
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
}: CalculationResultTableProps) {
	const [isBreakdownExpanded, setIsBreakdownExpanded] = useState(true);
	const fyOptions = useMemo(() => generateFiscalYearOptions(), []);

	const yearMonths = useMemo(
		() => MONTHS.map((m) => getYearMonth(fiscalYear, m)),
		[fiscalYear],
	);

	// 各月のデータを集計
	const rowData = useMemo(() => {
		// 人員数
		const headcountMap = new Map<string, number>();
		monthlyHeadcountPlans.forEach((p) => {
			headcountMap.set(p.yearMonth, p.headcount);
		});

		// キャパシティ
		const capacityMap = new Map<string, number>();
		capacityResult?.items.forEach((c) => {
			capacityMap.set(c.yearMonth, c.capacity);
		});

		// 間接合計
		const indirectTotalMap = new Map<string, number>();
		indirectWorkResult?.monthlyLoads.forEach((l) => {
			indirectTotalMap.set(l.yearMonth, l.manhour);
		});

		// 間接内訳
		const breakdownMap = new Map<string, Map<string, number>>();
		indirectWorkResult?.breakdown.forEach((b) => {
			const wtMap = new Map<string, number>();
			b.items.forEach((item) => {
				wtMap.set(item.workTypeCode, item.manhour);
			});
			breakdownMap.set(b.yearMonth, wtMap);
		});

		// 人員数行
		const headcountRow = {
			label: "人員数（人）",
			values: yearMonths.map((ym) => headcountMap.get(ym) ?? 0),
		};

		// キャパシティ行
		const capacityRow = {
			label: "キャパシティ（時間）",
			values: yearMonths.map((ym) => capacityMap.get(ym) ?? 0),
		};

		// 間接内訳行（作業種類ごと）
		const breakdownRows = workTypes.map((wt) => ({
			label: `  ${wt.name}`,
			workTypeCode: wt.workTypeCode,
			values: yearMonths.map((ym) => {
				// 按分計算: capacity × ratio[year][workType]
				const capacity = capacityMap.get(ym) ?? 0;
				const fy = getFiscalYear(ym);
				const ratio = ratios.find(
					(r) => r.fiscalYear === fy && r.workTypeCode === wt.workTypeCode,
				);
				return Math.round(capacity * (ratio?.ratio ?? 0));
			}),
		}));

		// 間接合計行
		const indirectTotalRow = {
			label: "間接合計（時間）",
			values: yearMonths.map((ym) => indirectTotalMap.get(ym) ?? 0),
		};

		return { headcountRow, capacityRow, breakdownRows, indirectTotalRow };
	}, [
		yearMonths,
		monthlyHeadcountPlans,
		capacityResult,
		indirectWorkResult,
		workTypes,
		ratios,
	]);

	const getAnnualTotal = (values: number[]) =>
		values.reduce((sum, v) => sum + v, 0);

	return (
		<div className="space-y-4">
			{/* 条件サマリー */}
			<div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
				<span>人員計画: {headcountPlanCaseName || "未選択"}</span>
				<span>|</span>
				<span>シナリオ: {scenarioName || "未選択"}</span>
				<span>|</span>
				<span>間接作業: {indirectWorkCaseName || "未選択"}</span>
			</div>

			{/* 年度選択 */}
			<div className="flex justify-end">
				<Select
					value={String(fiscalYear)}
					onValueChange={(v) => onFiscalYearChange(Number(v))}
				>
					<SelectTrigger className="w-[130px] h-8">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{fyOptions.map((y) => (
							<SelectItem key={y} value={String(y)}>
								{y}年度
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* テーブル */}
			<div className="overflow-x-auto">
				<table className="w-full text-sm border-collapse">
					<thead>
						<tr className="border-b-2">
							<th className="text-left py-2 pr-3 font-medium text-muted-foreground sticky left-0 bg-background">
								項目
							</th>
							{MONTH_LABELS.map((label) => (
								<th
									key={label}
									className="text-right py-2 px-2 font-medium text-muted-foreground whitespace-nowrap"
								>
									{label}
								</th>
							))}
							<th className="text-right py-2 pl-3 font-semibold text-muted-foreground whitespace-nowrap border-l">
								年間合計
							</th>
						</tr>
					</thead>
					<tbody>
						{/* 人員数 */}
						<tr className="border-b hover:bg-muted/30">
							<td className="py-1.5 pr-3 whitespace-nowrap font-medium sticky left-0 bg-background">
								{rowData.headcountRow.label}
							</td>
							{rowData.headcountRow.values.map((v, i) => (
								<td key={i} className="py-1.5 px-2 text-right tabular-nums">
									{v.toLocaleString()}
								</td>
							))}
							<td className="py-1.5 pl-3 text-right font-semibold tabular-nums border-l">
								{getAnnualTotal(rowData.headcountRow.values).toLocaleString()}
							</td>
						</tr>

						{/* キャパシティ */}
						<tr className="border-b hover:bg-muted/30">
							<td className="py-1.5 pr-3 whitespace-nowrap font-medium sticky left-0 bg-background">
								{rowData.capacityRow.label}
							</td>
							{rowData.capacityRow.values.map((v, i) => (
								<td key={i} className="py-1.5 px-2 text-right tabular-nums">
									{v.toLocaleString()}
								</td>
							))}
							<td className="py-1.5 pl-3 text-right font-semibold tabular-nums border-l">
								{getAnnualTotal(rowData.capacityRow.values).toLocaleString()}
							</td>
						</tr>

						{/* 間接内訳ヘッダー */}
						<tr className="border-b bg-muted/20">
							<td
								colSpan={MONTH_LABELS.length + 2}
								className="py-1.5 pr-3 sticky left-0"
							>
								<Button
									variant="ghost"
									size="sm"
									className="h-6 px-1 -ml-1"
									onClick={() => setIsBreakdownExpanded(!isBreakdownExpanded)}
								>
									{isBreakdownExpanded ? (
										<ChevronDown className="h-3.5 w-3.5 mr-1" />
									) : (
										<ChevronRight className="h-3.5 w-3.5 mr-1" />
									)}
									間接内訳
								</Button>
							</td>
						</tr>

						{/* 間接内訳行 */}
						{isBreakdownExpanded &&
							rowData.breakdownRows.map((row) => (
								<tr
									key={row.workTypeCode}
									className="border-b hover:bg-muted/30"
								>
									<td className="py-1.5 pr-3 whitespace-nowrap text-muted-foreground sticky left-0 bg-background">
										{row.label}
									</td>
									{row.values.map((v, i) => (
										<td key={i} className="py-1.5 px-2 text-right tabular-nums">
											{v.toLocaleString()}
										</td>
									))}
									<td className="py-1.5 pl-3 text-right tabular-nums border-l">
										{getAnnualTotal(row.values).toLocaleString()}
									</td>
								</tr>
							))}

						{/* 間接合計 */}
						<tr className="border-b-2 hover:bg-muted/30 font-semibold">
							<td className="py-1.5 pr-3 whitespace-nowrap sticky left-0 bg-background">
								{rowData.indirectTotalRow.label}
							</td>
							{rowData.indirectTotalRow.values.map((v, i) => (
								<td key={i} className="py-1.5 px-2 text-right tabular-nums">
									{v.toLocaleString()}
								</td>
							))}
							<td className="py-1.5 pl-3 text-right tabular-nums border-l">
								{getAnnualTotal(
									rowData.indirectTotalRow.values,
								).toLocaleString()}
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	);
}
