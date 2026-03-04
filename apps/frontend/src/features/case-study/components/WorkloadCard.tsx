import { Pencil, Save, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBulkUpsertProjectLoads } from "@/features/case-study/api/mutations";
import type { ProjectCase, ProjectLoad } from "@/features/case-study/types";

interface WorkloadCardProps {
	projectCase: ProjectCase;
	projectLoads: ProjectLoad[];
	onWorkloadsChange?: (
		workloads: Array<{ yearMonth: string; manhour: number }>,
	) => void;
}

const numFmt = new Intl.NumberFormat("ja-JP");

/**
 * 表示する月の範囲を決定する
 */
export function generateMonthRange(
	projectCase: ProjectCase,
	projectLoads: ProjectLoad[],
): string[] {
	// 1. startYearMonth + durationMonths が設定されている場合
	if (projectCase.startYearMonth && projectCase.durationMonths) {
		const months: string[] = [];
		let y = parseInt(projectCase.startYearMonth.slice(0, 4), 10);
		let m = parseInt(projectCase.startYearMonth.slice(4, 6), 10);
		for (let i = 0; i < projectCase.durationMonths; i++) {
			months.push(`${y}${String(m).padStart(2, "0")}`);
			m++;
			if (m > 12) {
				m = 1;
				y++;
			}
		}
		return months;
	}

	// 2. データが存在する場合はデータ範囲
	if (projectLoads.length > 0) {
		const sorted = [...projectLoads].sort((a, b) =>
			a.yearMonth.localeCompare(b.yearMonth),
		);
		const first = sorted[0].yearMonth;
		const last = sorted[sorted.length - 1].yearMonth;
		const months: string[] = [];
		let y = parseInt(first.slice(0, 4), 10);
		let m = parseInt(first.slice(4, 6), 10);
		const endY = parseInt(last.slice(0, 4), 10);
		const endM = parseInt(last.slice(4, 6), 10);
		while (y < endY || (y === endY && m <= endM)) {
			months.push(`${y}${String(m).padStart(2, "0")}`);
			m++;
			if (m > 12) {
				m = 1;
				y++;
			}
		}
		return months;
	}

	// 3. デフォルト: 現在年の12ヶ月
	const now = new Date();
	const year = now.getFullYear();
	return Array.from(
		{ length: 12 },
		(_, i) => `${year}${String(i + 1).padStart(2, "0")}`,
	);
}

function formatYearMonth(ym: string): string {
	return `${ym.slice(0, 4)}/${ym.slice(4, 6)}`;
}

export function WorkloadCard({
	projectCase,
	projectLoads,
	onWorkloadsChange,
}: WorkloadCardProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [editedValues, setEditedValues] = useState<Map<string, number>>(
		new Map(),
	);
	const bulkMutation = useBulkUpsertProjectLoads();

	const monthRange = useMemo(
		() => generateMonthRange(projectCase, projectLoads),
		[projectCase, projectLoads],
	);

	const loadMap = useMemo(() => {
		const map = new Map<string, number>();
		for (const pl of projectLoads) {
			map.set(pl.yearMonth, pl.manhour);
		}
		return map;
	}, [projectLoads]);

	const getValue = useCallback(
		(ym: string): number => {
			if (isEditing && editedValues.has(ym)) {
				return editedValues.get(ym)!;
			}
			return loadMap.get(ym) ?? 0;
		},
		[isEditing, editedValues, loadMap],
	);

	const handleStartEdit = () => {
		const initial = new Map<string, number>();
		for (const ym of monthRange) {
			initial.set(ym, loadMap.get(ym) ?? 0);
		}
		setEditedValues(initial);
		setIsEditing(true);
	};

	const handleCancel = () => {
		setEditedValues(new Map());
		setIsEditing(false);
	};

	const handleSave = async () => {
		// 変更があるか確認
		const changed: Array<{ yearMonth: string; manhour: number }> = [];
		for (const [ym, val] of editedValues) {
			const original = loadMap.get(ym) ?? 0;
			if (val !== original) {
				changed.push({ yearMonth: ym, manhour: val });
			}
		}

		if (changed.length === 0) {
			toast.info("変更がありません");
			return;
		}

		try {
			await bulkMutation.mutateAsync({
				projectCaseId: projectCase.projectCaseId,
				input: { items: changed },
			});
			toast.success("工数データを保存しました");
			setIsEditing(false);
			setEditedValues(new Map());
		} catch {
			toast.error("工数データの保存に失敗しました");
		}
	};

	const handleValueChange = (ym: string, value: number) => {
		setEditedValues((prev) => {
			const next = new Map(prev);
			next.set(ym, value);
			return next;
		});
		// チャートへのリアルタイム反映
		if (onWorkloadsChange) {
			const workloads = monthRange.map((m) => ({
				yearMonth: m,
				manhour:
					m === ym ? value : (editedValues.get(m) ?? loadMap.get(m) ?? 0),
			}));
			onWorkloadsChange(workloads);
		}
	};

	const handleBlur = (ym: string, rawValue: string) => {
		const parsed = parseInt(rawValue, 10);
		if (Number.isNaN(parsed) || parsed < 0 || parsed > 99999999) {
			// 不正値は元の値に復元
			setEditedValues((prev) => {
				const next = new Map(prev);
				next.set(ym, loadMap.get(ym) ?? 0);
				return next;
			});
		}
	};

	return (
		<div className="rounded-3xl border hover:shadow-[0_20px_25px_-5px_rgb(0_0_0/0.05)] transition-all duration-200 ease-in-out">
			<div className="flex items-center justify-between border-b px-4 py-3">
				<div>
					<h3 className="text-sm font-semibold">工数</h3>
					<p className="text-xs text-muted-foreground">
						{projectCase.caseName}
					</p>
				</div>
				<div className="flex items-center gap-2">
					{isEditing ? (
						<>
							<Button
								variant="outline"
								size="sm"
								className="h-7 gap-1 text-xs"
								onClick={handleCancel}
								disabled={bulkMutation.isPending}
							>
								<X className="h-3 w-3" />
								キャンセル
							</Button>
							<Button
								size="sm"
								className="h-7 gap-1 text-xs"
								onClick={handleSave}
								disabled={bulkMutation.isPending}
							>
								<Save className="h-3 w-3" />
								{bulkMutation.isPending ? "保存中..." : "保存"}
							</Button>
						</>
					) : (
						<Button
							variant="outline"
							size="sm"
							className="h-7 gap-1 text-xs"
							onClick={handleStartEdit}
						>
							<Pencil className="h-3 w-3" />
							編集
						</Button>
					)}
				</div>
			</div>

			<div className="overflow-x-auto p-4">
				<table className="w-full text-sm">
					<thead>
						<tr>
							{monthRange.map((ym) => (
								<th
									key={ym}
									className="whitespace-nowrap px-2 py-1 text-center text-xs font-medium text-muted-foreground"
								>
									{formatYearMonth(ym)}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						<tr>
							{monthRange.map((ym) => (
								<td key={ym} className="px-2 py-1 text-center">
									{isEditing ? (
										<Input
											type="number"
											value={editedValues.get(ym) ?? 0}
											onChange={(e) =>
												handleValueChange(ym, Number(e.target.value))
											}
											onBlur={(e) => handleBlur(ym, e.target.value)}
											min={0}
											max={99999999}
											step={1}
											className="w-20 h-8 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
										/>
									) : (
										<span className="text-sm tabular-nums">
											{numFmt.format(getValue(ym))}
										</span>
									)}
								</td>
							))}
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	);
}
