import { useCallback, useRef, useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { toYearMonth } from "@/features/indirect-case-study/hooks/useMonthlyLoadsPage";
import { normalizeNumericInput } from "@/lib/normalizeNumericInput";

const MONTHS = [
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

interface MonthlyLoadsMatrixProps {
	localData: Record<string, number>;
	originalSources: Record<string, string>;
	dirtyKeys: Set<string>;
	fiscalYears: number[];
	onChange: (yearMonth: string, value: number) => void;
	onCalculatedEditAttempt: () => boolean;
	onConfirmCalculatedEdit?: () => void;
	validationErrors: Record<string, string>;
}

export function MonthlyLoadsMatrix({
	localData,
	originalSources,
	dirtyKeys,
	fiscalYears,
	onChange,
	onCalculatedEditAttempt,
	onConfirmCalculatedEdit: onConfirmCalculatedEditProp,
	validationErrors,
}: MonthlyLoadsMatrixProps) {
	const tableRef = useRef<HTMLTableElement>(null);
	const [pendingEdit, setPendingEdit] = useState<{
		yearMonth: string;
		value: number;
	} | null>(null);

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
			if (normalized === "") {
				onChange(yearMonth, 0);
				return;
			}
			const num = Number(normalized);
			if (Number.isNaN(num)) return;

			// calculated セルの初回編集チェック
			if (
				originalSources[yearMonth] === "calculated" &&
				!dirtyKeys.has(yearMonth)
			) {
				if (!onCalculatedEditAttempt()) {
					setPendingEdit({ yearMonth, value: num });
					return;
				}
			}

			onChange(yearMonth, num);
		},
		[onChange, originalSources, dirtyKeys, onCalculatedEditAttempt],
	);

	const handleConfirmCalculatedEdit = useCallback(() => {
		if (pendingEdit) {
			onChange(pendingEdit.yearMonth, pendingEdit.value);
			setPendingEdit(null);
			onConfirmCalculatedEditProp?.();
		}
	}, [pendingEdit, onChange, onConfirmCalculatedEditProp]);

	return (
		<>
			<div className="overflow-x-auto rounded-lg border border-border">
				<table ref={tableRef} className="w-full text-sm">
					<thead>
						<tr className="border-b border-border bg-muted/50">
							<th className="sticky left-0 z-10 bg-muted/50 px-3 py-2 text-left font-medium">
								年度
							</th>
							{MONTHS.map((m) => (
								<th
									key={m}
									className="min-w-[90px] px-2 py-2 text-right font-medium"
								>
									{m}
								</th>
							))}
							<th className="min-w-[100px] px-3 py-2 text-right font-medium">
								合計
							</th>
						</tr>
					</thead>
					<tbody>
						{fiscalYears.map((fy, rowIndex) => {
							let rowTotal = 0;
							return (
								<tr key={fy} className="border-b border-border last:border-b-0">
									<td className="sticky left-0 z-10 bg-background px-3 py-1.5 font-medium">
										FY{fy}
									</td>
									{MONTHS.map((_, colIndex) => {
										const ym = toYearMonth(fy, colIndex);
										const value = localData[ym] ?? 0;
										rowTotal += value;
										const isDirtyCell = dirtyKeys.has(ym);
										const source = originalSources[ym];
										const error = validationErrors[ym];

										let cellBg = "";
										if (isDirtyCell) {
											cellBg = "bg-amber-50";
										} else if (source === "manual") {
											cellBg = "bg-blue-50";
										}

										return (
											<td key={ym} className={`px-1 py-1 ${cellBg}`}>
												<Input
													type="text"
													inputMode="numeric"
													data-row={rowIndex}
													data-col={colIndex}
													className={`h-8 w-full text-right tabular-nums ${
														isDirtyCell ? "ring-1 ring-amber-400" : ""
													} ${error ? "border-destructive ring-1 ring-destructive" : ""}`}
													value={
														value === 0 && !isDirtyCell ? "" : String(value)
													}
													onChange={(e) =>
														handleInputChange(ym, e.target.value)
													}
													onFocus={(e) => e.target.select()}
													onKeyDown={handleKeyDown}
												/>
												{error && (
													<p className="mt-0.5 text-[10px] text-destructive">
														{error}
													</p>
												)}
											</td>
										);
									})}
									<td className="px-3 py-1.5 text-right font-medium tabular-nums">
										{rowTotal.toLocaleString()}
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			{/* calculated 上書き確認ダイアログ */}
			<AlertDialog
				open={pendingEdit !== null}
				onOpenChange={(open) => {
					if (!open) setPendingEdit(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>計算値を上書きしますか？</AlertDialogTitle>
						<AlertDialogDescription>
							このセルは計算によって生成された値です。手動で編集すると、計算値が上書きされます。
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>キャンセル</AlertDialogCancel>
						<AlertDialogAction onClick={handleConfirmCalculatedEdit}>
							上書きする
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
