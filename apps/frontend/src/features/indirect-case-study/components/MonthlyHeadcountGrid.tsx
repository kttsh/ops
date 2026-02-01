import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { monthlyHeadcountPlansQueryOptions } from "@/features/indirect-case-study/api/queries";
import type {
	BulkMonthlyHeadcountInput,
	MonthlyHeadcountPlan,
} from "@/features/indirect-case-study/types";
import { BulkInputDialog } from "./BulkInputDialog";

interface MonthlyHeadcountGridProps {
	headcountPlanCaseId: number;
	businessUnitCode: string;
	fiscalYear: number;
	onFiscalYearChange: (year: number) => void;
	onDirtyChange: (isDirty: boolean) => void;
	onLocalDataChange: (data: BulkMonthlyHeadcountInput) => void;
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
	const current = new Date();
	const fy =
		current.getMonth() >= 3 ? current.getFullYear() : current.getFullYear() - 1;
	const years: number[] = [];
	for (let i = fy - 2; i <= fy + 8; i++) {
		years.push(i);
	}
	return years;
}

export function MonthlyHeadcountGrid({
	headcountPlanCaseId,
	businessUnitCode,
	fiscalYear,
	onFiscalYearChange,
	onDirtyChange,
	onLocalDataChange,
}: MonthlyHeadcountGridProps) {
	const [localData, setLocalData] = useState<Record<string, number>>({});
	const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
	const [prevDataId, setPrevDataId] = useState<unknown>(null);

	const { data, isLoading } = useQuery(
		monthlyHeadcountPlansQueryOptions(headcountPlanCaseId, businessUnitCode),
	);

	// APIデータからローカルデータを初期化（レンダー中に派生stateとして更新）
	if (data?.data && data !== prevDataId) {
		const map: Record<string, number> = {};
		data.data.forEach((item: MonthlyHeadcountPlan) => {
			map[item.yearMonth] = item.headcount;
		});
		setLocalData(map);
		setPrevDataId(data);
		onDirtyChange(false);
	}

	// ローカルデータの変更を親に通知
	const onLocalDataChangeRef = useRef(onLocalDataChange);
	useEffect(() => {
		onLocalDataChangeRef.current = onLocalDataChange;
	});
	useEffect(() => {
		const items = Object.entries(localData).map(([yearMonth, headcount]) => ({
			businessUnitCode,
			yearMonth,
			headcount,
		}));
		onLocalDataChangeRef.current({ items });
	}, [localData, businessUnitCode]);

	const handleChange = useCallback(
		(yearMonth: string, value: number) => {
			setLocalData((prev) => {
				const updated = { ...prev, [yearMonth]: value };
				return updated;
			});
			onDirtyChange(true);
		},
		[onDirtyChange],
	);

	const handleBulkSet = useCallback(
		(year: number, headcount: number) => {
			setLocalData((prev) => {
				const updated = { ...prev };
				MONTHS.forEach((m) => {
					updated[getYearMonth(year, m)] = headcount;
				});
				return updated;
			});
			onDirtyChange(true);
		},
		[onDirtyChange],
	);

	const fyOptions = useMemo(() => generateFiscalYearOptions(), []);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-6">
				<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<h4 className="text-sm font-medium">月次人員数</h4>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setBulkDialogOpen(true)}
					>
						一括入力
					</Button>
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
			</div>

			<div className="grid grid-cols-6 gap-2">
				{MONTHS.map((m, i) => {
					const ym = getYearMonth(fiscalYear, m);
					return (
						<div key={m} className="space-y-1">
							<Label className="text-xs text-muted-foreground">
								{MONTH_LABELS[i]}
							</Label>
							<Input
								type="number"
								min={0}
								step={1}
								value={localData[ym] ?? 0}
								onChange={(e) => {
									const val = parseInt(e.target.value, 10);
									handleChange(ym, Number.isNaN(val) ? 0 : Math.max(0, val));
								}}
								className="h-8 text-sm"
							/>
						</div>
					);
				})}
			</div>

			<BulkInputDialog
				open={bulkDialogOpen}
				onOpenChange={setBulkDialogOpen}
				fiscalYear={fiscalYear}
				fiscalYearOptions={fyOptions}
				onApply={handleBulkSet}
			/>
		</div>
	);
}
