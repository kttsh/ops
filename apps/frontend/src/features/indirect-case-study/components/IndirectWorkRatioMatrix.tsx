import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { indirectWorkTypeRatiosQueryOptions } from "@/features/indirect-case-study/api/queries";
import type {
	BulkIndirectWorkRatioInput,
	IndirectWorkTypeRatio,
} from "@/features/indirect-case-study/types";
import { workTypesQueryOptions } from "@/features/work-types/api/queries";
import type { WorkType } from "@/features/work-types/types";
import { normalizeNumericInput } from "@/lib/normalizeNumericInput";

interface IndirectWorkRatioMatrixProps {
	indirectWorkCaseId: number;
	onDirtyChange: (isDirty: boolean) => void;
	onLocalDataChange: (data: BulkIndirectWorkRatioInput) => void;
}

function generateFiscalYears(): number[] {
	const now = new Date();
	const fy = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
	const years: number[] = [];
	for (let i = fy - 1; i <= fy + 5; i++) {
		years.push(i);
	}
	return years;
}

export function IndirectWorkRatioMatrix({
	indirectWorkCaseId,
	onDirtyChange,
	onLocalDataChange,
}: IndirectWorkRatioMatrixProps) {
	// key: `${fiscalYear}-${workTypeCode}`, value: ratio (0-100 for display)
	const [localData, setLocalData] = useState<Record<string, number>>({});
	const [prevDataId, setPrevDataId] = useState<unknown>(null);

	const { data: ratiosData, isLoading: ratiosLoading } = useQuery(
		indirectWorkTypeRatiosQueryOptions(indirectWorkCaseId),
	);

	const { data: workTypesData, isLoading: workTypesLoading } = useQuery(
		workTypesQueryOptions({ includeDisabled: false }),
	);

	const fiscalYears = useMemo(() => generateFiscalYears(), []);

	// APIデータからローカルデータを初期化（レンダー中に派生stateとして更新）
	if (ratiosData?.data && ratiosData !== prevDataId) {
		const map: Record<string, number> = {};
		ratiosData.data.forEach((item: IndirectWorkTypeRatio) => {
			map[`${item.fiscalYear}-${item.workTypeCode}`] =
				Math.round(item.ratio * 10000) / 100;
		});
		setLocalData(map);
		setPrevDataId(ratiosData);
		onDirtyChange(false);
	}

	// ローカルデータ変更時に親に通知
	const onLocalDataChangeRef = useRef(onLocalDataChange);
	useEffect(() => {
		onLocalDataChangeRef.current = onLocalDataChange;
	});
	useEffect(() => {
		const items = Object.entries(localData).map(([key, ratioPercent]) => {
			const [fyStr, workTypeCode] = key.split("-");
			return {
				workTypeCode,
				fiscalYear: parseInt(fyStr, 10),
				ratio: ratioPercent / 100, // 0-1に変換
			};
		});
		onLocalDataChangeRef.current({ items });
	}, [localData]);

	const handleChange = useCallback(
		(fiscalYear: number, workTypeCode: string, value: number) => {
			const key = `${fiscalYear}-${workTypeCode}`;
			setLocalData((prev) => ({ ...prev, [key]: value }));
			onDirtyChange(true);
		},
		[onDirtyChange],
	);

	const getTotal = useCallback(
		(fiscalYear: number): number => {
			if (!workTypesData?.data) return 0;
			return workTypesData.data.reduce((sum: number, wt: WorkType) => {
				const key = `${fiscalYear}-${wt.workTypeCode}`;
				return sum + (localData[key] ?? 0);
			}, 0);
		},
		[localData, workTypesData],
	);

	if (ratiosLoading || workTypesLoading) {
		return (
			<div className="flex items-center justify-center py-6">
				<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
			</div>
		);
	}

	const workTypes = workTypesData?.data ?? [];

	return (
		<div className="space-y-3">
			<h4 className="text-sm font-medium">間接作業比率（%）</h4>
			<div className="overflow-x-auto">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b">
							<th className="text-left py-2 pr-3 font-medium text-muted-foreground">
								作業種類
							</th>
							{fiscalYears.map((fy) => (
								<th
									key={fy}
									className="text-center py-2 px-2 font-medium text-muted-foreground"
								>
									{fy}年度
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{workTypes.map((wt: WorkType) => (
							<tr key={wt.workTypeCode} className="border-b">
								<td className="py-1.5 pr-3 whitespace-nowrap">{wt.name}</td>
								{fiscalYears.map((fy) => {
									const key = `${fy}-${wt.workTypeCode}`;
									return (
										<td key={fy} className="py-1.5 px-1">
											<Input
												type="text"
												inputMode="decimal"
												min={0}
												max={100}
												step={0.1}
												value={localData[key] ?? 0}
												onChange={(e) => {
													const normalized = normalizeNumericInput(
														e.target.value,
														{ allowDecimal: true },
													);
													const val = parseFloat(normalized);
													handleChange(
														fy,
														wt.workTypeCode,
														Number.isNaN(val)
															? 0
															: Math.min(100, Math.max(0, val)),
													);
												}}
												className="h-7 w-20 text-sm text-center"
											/>
										</td>
									);
								})}
							</tr>
						))}
						<tr className="border-t-2 font-semibold">
							<td className="py-1.5 pr-3">合計</td>
							{fiscalYears.map((fy) => (
								<td key={fy} className="py-1.5 px-1 text-center">
									{getTotal(fy).toFixed(1)}%
								</td>
							))}
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	);
}
