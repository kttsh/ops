import { useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
	const tableRef = useRef<HTMLTableElement>(null);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "Enter") {
				e.preventDefault();
				const el = e.currentTarget;
				const row = Number(el.dataset.row);
				const col = Number(el.dataset.col);
				const nextRow = row + 1;
				const target = tableRef.current?.querySelector<HTMLInputElement>(
					`input[data-row="${nextRow}"][data-col="${col}"]`,
				);
				target?.focus();
				target?.select();
			}
		},
		[],
	);

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
				<Button
					type="button"
					variant="default"
					size="sm"
					className="h-8 px-3 font-medium shadow-sm"
					onClick={onOpenBulkInput}
				>
					一括入力
				</Button>
			</div>

			<div className="overflow-x-auto rounded-lg border border-border">
				<table ref={tableRef} className="w-full text-sm">
					<thead>
						<tr className="border-b border-border bg-muted/50">
							<th className="sticky left-0 z-10 bg-muted/50 px-3 py-2 text-left font-medium">
								年度
							</th>
							{MONTH_LABELS.map((label) => (
								<th
									key={label}
									className="min-w-[90px] px-2 py-2 text-center font-medium whitespace-nowrap"
								>
									{label}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{fiscalYears.map((fy, rowIndex) => {
							const isCurrentYear = fy === currentFiscalYear;
							return (
								<tr
									key={fy}
									className={`border-b border-border last:border-b-0 ${isCurrentYear ? "bg-primary/5" : "bg-white"}`}
								>
									<td
										className={`sticky left-0 z-10 px-3 py-1.5 font-medium whitespace-nowrap ${isCurrentYear ? "bg-primary/5" : "bg-white"}`}
									>
										FY{fy}
									</td>
									{MONTHS.map((m, colIndex) => {
										const ym = getYearMonth(fy, m);
										const dirty = isCellDirty(ym);
										return (
											<td
												key={m}
												className={`px-1 py-1 ${dirty ? "bg-amber-50" : ""}`}
											>
												<Input
													type="text"
													inputMode="numeric"
													data-row={rowIndex}
													data-col={colIndex}
													value={localData[ym] ?? 0}
													onChange={(e) =>
														handleInputChange(ym, e.target.value)
													}
													onFocus={(e) => e.target.select()}
													onKeyDown={handleKeyDown}
													className={`h-8 w-full bg-white disabled:bg-muted text-right tabular-nums ${
														dirty ? "ring-1 ring-amber-400" : ""
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
