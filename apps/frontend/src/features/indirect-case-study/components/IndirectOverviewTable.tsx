import { ChevronDown, ChevronRight, Info } from "lucide-react";
import { memo, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { getFiscalYear } from "@/features/indirect-case-study/hooks/useIndirectWorkCalculation";
import type {
	IndirectWorkTypeRatio,
	MonthlyCapacity,
	MonthlyHeadcountPlan,
	MonthlyIndirectWorkLoad,
} from "@/features/indirect-case-study/types";
import type { WorkType } from "@/features/work-types/types";
import { cn } from "@/lib/utils";

interface IndirectOverviewTableProps {
	monthlyHeadcountPlans: MonthlyHeadcountPlan[];
	monthlyCapacities: MonthlyCapacity[];
	monthlyIndirectWorkLoads: MonthlyIndirectWorkLoad[];
	ratios: IndirectWorkTypeRatio[];
	workTypes: WorkType[];
	availableFiscalYears: number[];
	fiscalYear: number;
	onFiscalYearChange: (year: number) => void;
	lastCalculatedAt: string | null;
	hasPrimaryCase: boolean;
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

function formatDateTime(isoString: string): string {
	const d = new Date(isoString);
	const yyyy = d.getFullYear();
	const mm = String(d.getMonth() + 1).padStart(2, "0");
	const dd = String(d.getDate()).padStart(2, "0");
	const hh = String(d.getHours()).padStart(2, "0");
	const min = String(d.getMinutes()).padStart(2, "0");
	return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

export const IndirectOverviewTable = memo(function IndirectOverviewTable({
	monthlyHeadcountPlans,
	monthlyCapacities,
	monthlyIndirectWorkLoads,
	ratios,
	workTypes,
	availableFiscalYears,
	fiscalYear,
	onFiscalYearChange,
	lastCalculatedAt,
	hasPrimaryCase,
}: IndirectOverviewTableProps) {
	const [isBreakdownExpanded, setIsBreakdownExpanded] = useState(true);

	const yearMonths = useMemo(
		() => MONTHS.map((m) => getYearMonth(fiscalYear, m)),
		[fiscalYear],
	);

	// 空状態の判定
	const isEmpty =
		monthlyCapacities.length === 0 && monthlyIndirectWorkLoads.length === 0;

	// 各月のデータを集計
	const rowData = useMemo(() => {
		const headcountMap = new Map<string, number>();
		monthlyHeadcountPlans.forEach((p) => {
			headcountMap.set(p.yearMonth, p.headcount);
		});

		const capacityMap = new Map<string, number>();
		monthlyCapacities.forEach((c) => {
			capacityMap.set(c.yearMonth, c.capacity);
		});

		const indirectTotalMap = new Map<string, number>();
		monthlyIndirectWorkLoads.forEach((l) => {
			indirectTotalMap.set(l.yearMonth, l.manhour);
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

		// 間接内訳行
		const breakdownRows = workTypes.map((wt) => ({
			label: `  ${wt.name}`,
			workTypeCode: wt.workTypeCode,
			values: yearMonths.map((ym) => {
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
			label: "間接計（時間）",
			values: yearMonths.map((ym) => indirectTotalMap.get(ym) ?? 0),
		};

		// 直接行 = キャパシティ - 間接計
		const directRow = {
			label: "直接（時間）",
			values: yearMonths.map((ym) => {
				const cap = capacityMap.get(ym) ?? 0;
				const ind = indirectTotalMap.get(ym) ?? 0;
				return cap - ind;
			}),
		};

		return {
			headcountRow,
			capacityRow,
			breakdownRows,
			indirectTotalRow,
			directRow,
		};
	}, [
		yearMonths,
		monthlyHeadcountPlans,
		monthlyCapacities,
		monthlyIndirectWorkLoads,
		workTypes,
		ratios,
	]);

	const getAnnualTotal = (values: number[]) =>
		values.reduce((sum, v) => sum + v, 0);

	return (
		<div className="space-y-4">
			{/* 年度チップセレクタ */}
			<div className="flex items-center gap-2 flex-wrap">
				{(availableFiscalYears.length > 0
					? availableFiscalYears
					: [fiscalYear]
				).map((y) => (
					<Button
						key={y}
						variant={y === fiscalYear ? "default" : "outline"}
						size="sm"
						className="h-7 px-3 text-xs"
						onClick={() => onFiscalYearChange(y)}
					>
						{y}年度
					</Button>
				))}
			</div>

			{/* 空状態 */}
			{isEmpty ? (
				<div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
					{hasPrimaryCase
						? "再計算を実行してデータを生成してください"
						: "計算条件のケースを設定してください"}
				</div>
			) : (
				<>
					{/* テーブル */}
					<div className="overflow-x-auto rounded-lg border border-border">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b border-border bg-muted/50">
									<th className="text-left py-2 pr-3 font-medium sticky left-0 bg-muted/50 min-w-[160px]">
										項目
									</th>
									{MONTH_LABELS.map((label) => (
										<th
											key={label}
											className="text-right py-2 px-2 font-medium whitespace-nowrap"
										>
											{label}
										</th>
									))}
									<th className="text-right py-2 pl-3 font-semibold whitespace-nowrap border-l">
										年間合計
									</th>
								</tr>
							</thead>
							<tbody>
								{/* 人員数 */}
								<tr className="border-b border-border bg-white hover:bg-muted/30">
									<td className="py-1.5 pr-3 whitespace-nowrap font-medium sticky left-0 bg-white">
										{rowData.headcountRow.label}
									</td>
									{rowData.headcountRow.values.map((v, i) => (
										<td key={i} className="py-1.5 px-2 text-right tabular-nums">
											{v.toLocaleString()}
										</td>
									))}
									<td className="py-1.5 pl-3 text-right font-semibold tabular-nums border-l text-muted-foreground">
										-
									</td>
								</tr>

								{/* キャパシティ */}
								<tr className="border-b border-border bg-white hover:bg-muted/30">
									<td className="py-1.5 pr-3 whitespace-nowrap font-medium sticky left-0 bg-white">
										{rowData.capacityRow.label}
									</td>
									{rowData.capacityRow.values.map((v, i) => (
										<td key={i} className="py-1.5 px-2 text-right tabular-nums">
											{v.toLocaleString()}
										</td>
									))}
									<td className="py-1.5 pl-3 text-right font-semibold tabular-nums border-l">
										{getAnnualTotal(
											rowData.capacityRow.values,
										).toLocaleString()}
									</td>
								</tr>

								{/* 間接内訳ヘッダー */}
								<tr className="border-b border-border bg-muted/30">
									<td
										colSpan={MONTH_LABELS.length + 2}
										className="py-1.5 pr-3 sticky left-0"
									>
										<Button
											variant="ghost"
											size="sm"
											className="h-6 px-1 -ml-1"
											onClick={() =>
												setIsBreakdownExpanded(!isBreakdownExpanded)
											}
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
											className="border-b border-border bg-white hover:bg-muted/30"
										>
											<td className="py-1.5 pr-3 whitespace-nowrap text-muted-foreground sticky left-0 bg-white">
												{row.label}
											</td>
											{row.values.map((v, i) => (
												<td
													key={i}
													className="py-1.5 px-2 text-right tabular-nums"
												>
													{v.toLocaleString()}
												</td>
											))}
											<td className="py-1.5 pl-3 text-right tabular-nums border-l">
												{getAnnualTotal(row.values).toLocaleString()}
											</td>
										</tr>
									))}

								{/* 間接計 */}
								<tr className="border-t border-border bg-white hover:bg-muted/30 font-semibold">
									<td className="py-1.5 pr-3 whitespace-nowrap sticky left-0 bg-white">
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

								{/* 直接 */}
								<tr
									className={cn(
										"border-t border-border bg-white hover:bg-muted/30 font-semibold",
									)}
								>
									<td className="py-1.5 pr-3 whitespace-nowrap sticky left-0 bg-white">
										{rowData.directRow.label}
									</td>
									{rowData.directRow.values.map((v, i) => (
										<td
											key={i}
											className={cn(
												"py-1.5 px-2 text-right tabular-nums",
												v < 0 && "text-red-600",
											)}
										>
											{v.toLocaleString()}
										</td>
									))}
									<td
										className={cn(
											"py-1.5 pl-3 text-right tabular-nums border-l",
											getAnnualTotal(rowData.directRow.values) < 0 &&
												"text-red-600",
										)}
									>
										{getAnnualTotal(rowData.directRow.values).toLocaleString()}
									</td>
								</tr>
							</tbody>
						</table>
					</div>

					{/* 最終計算日時 */}
					{lastCalculatedAt && (
						<p className="flex items-center gap-1 text-xs text-muted-foreground">
							<Info className="h-3 w-3" />
							最終計算: {formatDateTime(lastCalculatedAt)}
						</p>
					)}
				</>
			)}
		</div>
	);
});
