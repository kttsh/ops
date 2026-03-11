import { useCallback } from "react";
import { normalizeNumericInput } from "@/lib/normalizeNumericInput";

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

interface MonthlyHeadcountTableProps {
	fiscalYears: number[];
	localData: Record<string, number>;
	isCellDirty: (yearMonth: string) => boolean;
	onCellChange: (yearMonth: string, value: number) => void;
	currentFiscalYear: number;
	onOpenBulkInput: () => void;
}

export function MonthlyHeadcountTable({
	fiscalYears,
	localData,
	isCellDirty,
	onCellChange,
	currentFiscalYear,
	onOpenBulkInput,
}: MonthlyHeadcountTableProps) {
	const handleInputChange = useCallback(
		(yearMonth: string, rawValue: string) => {
			const normalized = normalizeNumericInput(rawValue);
			const val = parseInt(normalized, 10);
			onCellChange(yearMonth, Number.isNaN(val) ? 0 : Math.max(0, val));
		},
		[onCellChange],
	);

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<h4 className="text-sm font-medium">月次人員数</h4>
				<button
					type="button"
					className="inline-flex items-center rounded-md border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
					onClick={onOpenBulkInput}
				>
					一括入力
				</button>
			</div>

			<div className="overflow-x-auto">
				<table className="w-full border-collapse text-sm">
					<thead>
						<tr className="border-b border-border">
							<th className="sticky left-0 z-10 bg-card px-3 py-2 text-left text-xs font-medium text-muted-foreground">
								年度
							</th>
							{MONTH_LABELS.map((label) => (
								<th
									key={label}
									className="px-2 py-2 text-center text-xs font-medium text-muted-foreground whitespace-nowrap"
								>
									{label}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{fiscalYears.map((fy) => {
							const isCurrentYear = fy === currentFiscalYear;
							return (
								<tr
									key={fy}
									className={`border-b border-border ${isCurrentYear ? "bg-primary/5" : ""}`}
								>
									<td className="sticky left-0 z-10 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground whitespace-nowrap">
										{isCurrentYear && (
											<span className={isCurrentYear ? "bg-primary/5" : ""}>
												{fy}年度
											</span>
										)}
										{!isCurrentYear && `${fy}年度`}
									</td>
									{MONTHS.map((m) => {
										const ym = getYearMonth(fy, m);
										const dirty = isCellDirty(ym);
										return (
											<td key={m} className="px-1 py-1">
												<input
													type="text"
													inputMode="numeric"
													value={localData[ym] ?? 0}
													onChange={(e) =>
														handleInputChange(ym, e.target.value)
													}
													className={`w-full rounded border border-border px-2 py-1 text-center text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary ${
														dirty ? "bg-amber-50" : "bg-background"
													}`}
												/>
											</td>
										);
									})}
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</div>
	);
}
