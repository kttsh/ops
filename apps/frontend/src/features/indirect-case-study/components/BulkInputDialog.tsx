import { useMemo, useState } from "react";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Switch } from "@/components/ui/switch";
import { linearInterpolate } from "@/features/indirect-case-study/utils/linearInterpolate";
import { normalizeNumericInput } from "@/lib/normalizeNumericInput";

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

type BulkInputMode = "uniform" | "interpolation";

interface BulkInputDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	fiscalYear: number;
	fiscalYearOptions: number[];
	onApply: (year: number, headcount: number) => void;
	onApplyInterpolation: (year: number, monthlyValues: number[]) => void;
}

export function BulkInputDialog({
	open,
	onOpenChange,
	fiscalYear,
	fiscalYearOptions,
	onApply,
	onApplyInterpolation,
}: BulkInputDialogProps) {
	const [year, setYear] = useState(fiscalYear);
	const [headcount, setHeadcount] = useState(0);
	const [mode, setMode] = useState<BulkInputMode>("uniform");
	const [startValue, setStartValue] = useState<number | null>(null);
	const [endValue, setEndValue] = useState<number | null>(null);

	const preview = useMemo(() => {
		if (startValue === null || endValue === null) return null;
		return linearInterpolate(startValue, endValue);
	}, [startValue, endValue]);

	const isInterpolationValid = startValue !== null && endValue !== null;

	const handleApply = () => {
		if (mode === "uniform") {
			onApply(year, headcount);
		} else if (preview) {
			onApplyInterpolation(year, preview);
		}
		onOpenChange(false);
	};

	const isApplyDisabled = mode === "interpolation" && !isInterpolationValid;

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>一括入力</AlertDialogTitle>
					<AlertDialogDescription>
						{mode === "uniform"
							? "選択した年度の全月（4月〜翌3月）に同じ人員数を設定します。"
							: "開始値（4月）と到達値（3月）を指定して、中間月を線形補間で算出します。"}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<div className="space-y-4 py-2">
					<div className="flex items-center gap-2">
						<Switch
							id="interpolation-mode"
							checked={mode === "interpolation"}
							onCheckedChange={(checked) =>
								setMode(checked ? "interpolation" : "uniform")
							}
						/>
						<Label htmlFor="interpolation-mode">按分入力</Label>
					</div>

					<div className="space-y-2">
						<Label>対象年度</Label>
						<Select
							value={String(year)}
							onValueChange={(v) => setYear(Number(v))}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{fiscalYearOptions.map((y) => (
									<SelectItem key={y} value={String(y)}>
										{y}年度
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{mode === "uniform" ? (
						<div className="space-y-2">
							<Label>人員数</Label>
							<Input
								type="text"
								inputMode="numeric"
								min={0}
								step={1}
								value={headcount}
								onChange={(e) => {
									const normalized = normalizeNumericInput(e.target.value);
									const val = parseInt(normalized, 10);
									setHeadcount(Number.isNaN(val) ? 0 : Math.max(0, val));
								}}
							/>
						</div>
					) : (
						<>
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label>開始値（4月）</Label>
									<Input
										type="text"
										inputMode="numeric"
										min={0}
										step={1}
										value={startValue ?? ""}
										onChange={(e) => {
											const normalized = normalizeNumericInput(e.target.value);
											if (normalized === "") {
												setStartValue(null);
												return;
											}
											const val = parseInt(normalized, 10);
											setStartValue(
												Number.isNaN(val) ? null : Math.max(0, val),
											);
										}}
									/>
								</div>
								<div className="space-y-2">
									<Label>到達値（3月）</Label>
									<Input
										type="text"
										inputMode="numeric"
										min={0}
										step={1}
										value={endValue ?? ""}
										onChange={(e) => {
											const normalized = normalizeNumericInput(e.target.value);
											if (normalized === "") {
												setEndValue(null);
												return;
											}
											const val = parseInt(normalized, 10);
											setEndValue(Number.isNaN(val) ? null : Math.max(0, val));
										}}
									/>
								</div>
							</div>

							{preview && (
								<div className="space-y-2">
									<Label className="text-xs text-muted-foreground">
										プレビュー
									</Label>
									<div className="grid grid-cols-6 gap-2">
										{preview.map((value, i) => (
											<div key={MONTH_LABELS[i]} className="text-center">
												<div className="text-xs text-muted-foreground">
													{MONTH_LABELS[i]}
												</div>
												<div className="text-sm font-medium">{value}</div>
											</div>
										))}
									</div>
								</div>
							)}
						</>
					)}
				</div>
				<AlertDialogFooter>
					<AlertDialogCancel>キャンセル</AlertDialogCancel>
					<Button onClick={handleApply} disabled={isApplyDisabled}>
						設定
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
