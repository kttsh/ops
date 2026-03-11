import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useBulkUpsertColorSettings } from "@/features/workload/api/mutations";
import { projectsQueryOptions } from "@/features/workload/api/queries";
import type {
	AvailableCapacityLine,
	BulkUpsertProjectItemInput,
} from "@/features/workload/types";
import { CAPACITY_COLORS, PROJECT_TYPE_COLORS } from "@/lib/chart-colors";
import { ColorPickerPopover } from "./ColorPickerPopover";
import { PeriodSelector } from "./PeriodSelector";
import { ProfileManager } from "./ProfileManager";

interface SidePanelSettingsProps {
	from: string | undefined;
	months: number;
	businessUnitCodes: string[];
	selectedProjectIds: Set<number>;
	onPeriodChange: (from: string | undefined, months: number) => void;
	onProjectColorsChange?: (colors: Record<number, string>) => void;
	onProjectOrderChange?: (order: number[]) => void;
	availableCapacityLines?: AvailableCapacityLine[];
	capLineVisible?: Record<string, boolean>;
	capLineColors?: Record<string, string>;
	onCapLineVisibleChange?: (visible: Record<string, boolean>) => void;
	onCapLineColorsChange?: (colors: Record<string, string>) => void;
	onProfileApply?: (profile: {
		chartViewId: number;
		startYearMonth: string;
		endYearMonth: string;
		projectItems: BulkUpsertProjectItemInput[];
		businessUnitCodes: string[] | null;
	}) => void;
}

export function SidePanelSettings({
	from,
	months,
	businessUnitCodes,
	selectedProjectIds,
	onPeriodChange,
	onProjectColorsChange,
	onProjectOrderChange,
	availableCapacityLines = [],
	capLineVisible = {},
	capLineColors = {},
	onCapLineVisibleChange,
	onCapLineColorsChange,
	onProfileApply,
}: SidePanelSettingsProps) {
	const { data: projData } = useQuery(projectsQueryOptions(businessUnitCodes));
	const projects = projData?.data ?? [];

	const colorMutation = useBulkUpsertColorSettings();

	// 期間設定からYYYYMM形式を算出
	const { startYearMonth, endYearMonth } = useMemo(() => {
		const now = new Date();
		const currentYear = now.getFullYear();
		const currentMonth = now.getMonth() + 1;
		const fiscalStartYear = currentMonth >= 4 ? currentYear : currentYear - 1;
		const defaultFrom = `${fiscalStartYear}04`;

		const start = from ?? defaultFrom;
		const startY = parseInt(start.slice(0, 4), 10);
		const startM = parseInt(start.slice(4, 6), 10);
		let endM = startM + months - 1;
		let endY = startY;
		while (endM > 12) {
			endM -= 12;
			endY++;
		}
		return {
			startYearMonth: start,
			endYearMonth: `${endY}${String(endM).padStart(2, "0")}`,
		};
	}, [from, months]);

	// 案件色設定
	const [projColors, setProjColors] = useState<Record<number, string>>({});
	const [projOrder, setProjOrder] = useState<number[]>([]);

	// selectedProjectIds のシリアライズ値を依存配列に使用（Set参照変更による不要な再実行を回避）
	const selectedIdsKey = useMemo(
		() => [...selectedProjectIds].sort((a, b) => a - b).join(","),
		[selectedProjectIds],
	);

	// onProjectColorsChange の最新参照を保持（useEffect の依存配列を安定化）
	const onProjectColorsChangeRef = useRef(onProjectColorsChange);
	onProjectColorsChangeRef.current = onProjectColorsChange;

	// onProjectOrderChange の最新参照を保持（useEffect の依存配列を安定化）
	const onProjectOrderChangeRef = useRef(onProjectOrderChange);
	onProjectOrderChangeRef.current = onProjectOrderChange;

	// 選択案件の変更を監視し、projOrder / projColors を差分更新する
	useEffect(() => {
		const selectedIds = new Set(
			selectedIdsKey.split(",").filter(Boolean).map(Number),
		);
		if (selectedIds.size === 0) {
			setProjOrder([]);
			return;
		}

		setProjOrder((prev) => {
			// 既存の並び順を維持しつつ、選択外の案件を除外
			const kept = prev.filter((id) => selectedIds.has(id));
			// 新たに選択された案件を末尾に追加
			const existing = new Set(kept);
			const added = [...selectedIds].filter((id) => !existing.has(id));
			return [...kept, ...added];
		});

		setProjColors((prev) => {
			const updated = { ...prev };
			// 新たに選択された案件にデフォルト色を割り当て
			let index = Object.keys(updated).length;
			for (const id of selectedIds) {
				if (!(id in updated)) {
					updated[id] = PROJECT_TYPE_COLORS[index % PROJECT_TYPE_COLORS.length];
					index++;
				}
			}
			// 色設定変更を親コンポーネントに通知
			const filtered: Record<number, string> = {};
			for (const id of selectedIds) {
				if (id in updated) {
					filtered[id] = updated[id];
				}
			}
			onProjectColorsChangeRef.current?.(filtered);
			return updated;
		});
	}, [selectedIdsKey]);

	// projOrder の変更を親に通知（全変更契機を一箇所でカバー）
	useEffect(() => {
		onProjectOrderChangeRef.current?.(projOrder);
	}, [projOrder]);

	const moveProjUp = (index: number) => {
		if (index === 0) return;
		setProjOrder((prev) => {
			const next = [...prev];
			const temp = next[index - 1];
			next[index - 1] = next[index];
			next[index] = temp;
			return next;
		});
	};

	const moveProjDown = (index: number) => {
		setProjOrder((prev) => {
			if (index >= prev.length - 1) return prev;
			const next = [...prev];
			const temp = next[index + 1];
			next[index + 1] = next[index];
			next[index] = temp;
			return next;
		});
	};

	const setProjColor = (projectId: number, color: string) => {
		setProjColors((prev) => {
			const updated = { ...prev, [projectId]: color };
			colorMutation.mutate(
				Object.entries(updated).map(([id, col]) => ({
					targetType: "project",
					targetCode: id,
					colorCode: col,
				})),
			);
			onProjectColorsChange?.(updated);
			return updated;
		});
	};

	// ProfileManager に渡す projectItems を構築
	const profileProjectItems: BulkUpsertProjectItemInput[] = useMemo(() => {
		return projOrder.map((id, index) => ({
			projectId: id,
			projectCaseId: null,
			displayOrder: index,
			isVisible: true,
			color: projColors[id] ?? null,
		}));
	}, [projOrder, projColors]);

	// プロファイル適用コールバック
	const handleProfileApply = useCallback(
		(profile: {
			chartViewId: number;
			startYearMonth: string;
			endYearMonth: string;
			projectItems: BulkUpsertProjectItemInput[];
			businessUnitCodes: string[] | null;
		}) => {
			if (profile.projectItems.length > 0) {
				// 選択中の案件に限定してプロファイルを適用
				const selectedItems = profile.projectItems.filter((item) =>
					selectedProjectIds.has(item.projectId),
				);

				if (selectedItems.length > 0) {
					// 色・並び順・表示状態を復元
					const newColors: Record<number, string> = {};
					const newOrder: number[] = [];

					const sortedItems = [...selectedItems].sort(
						(a, b) => a.displayOrder - b.displayOrder,
					);

					for (const item of sortedItems) {
						newOrder.push(item.projectId);
						if (item.color) {
							newColors[item.projectId] = item.color;
						} else {
							// color が null の場合、現在のグローバル色設定からフォールバック
							const currentColor = projColors[item.projectId];
							if (currentColor) {
								newColors[item.projectId] = currentColor;
							} else {
								const idx = newOrder.length - 1;
								newColors[item.projectId] =
									PROJECT_TYPE_COLORS[idx % PROJECT_TYPE_COLORS.length];
							}
						}
					}

					setProjColors(newColors);
					setProjOrder(newOrder);
					onProjectColorsChange?.(newColors);
				}
			}

			onProfileApply?.(profile);
		},
		[selectedProjectIds, projColors, onProjectColorsChange, onProfileApply],
	);

	return (
		<div className="space-y-6">
			{/* 期間設定 */}
			<div>
				<h3 className="mb-3 text-sm font-semibold">期間設定</h3>
				<PeriodSelector from={from} months={months} onChange={onPeriodChange} />
			</div>

			<Separator />

			{/* 案件表示設定 */}
			<div>
				<h3 className="mb-3 text-sm font-semibold">案件設定</h3>
				<div className="space-y-2">
					{projOrder.map((id, index) => {
						const proj = projects.find((p) => p.projectId === id);
						if (!proj) return null;
						return (
							<div
								key={id}
								className="flex items-center gap-3 rounded-lg border border-border bg-white p-2"
							>
								<ColorPickerPopover
									colors={PROJECT_TYPE_COLORS}
									value={projColors[id] ?? PROJECT_TYPE_COLORS[0]}
									onChange={(color) => setProjColor(id, color)}
								/>
								<Label className="flex-1 truncate text-sm">{proj.name}</Label>
								<div className="flex gap-0.5">
									<Button
										variant="ghost"
										size="icon"
										className="h-6 w-6"
										disabled={index === 0}
										onClick={() => moveProjUp(index)}
									>
										<ArrowUp className="h-3 w-3" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										className="h-6 w-6"
										disabled={index === projOrder.length - 1}
										onClick={() => moveProjDown(index)}
									>
										<ArrowDown className="h-3 w-3" />
									</Button>
								</div>
							</div>
						);
					})}
				</div>
			</div>

			<Separator />

			{/* キャパシティライン表示設定 */}
			<div>
				<h3 className="mb-3 text-sm font-semibold">キャパシティ設定</h3>
				<div className="space-y-2">
					{availableCapacityLines.map((cl, idx) => (
						<div
							key={cl.key}
							className="flex items-center gap-3 rounded-lg border border-border bg-white p-2"
						>
							<Switch
								checked={capLineVisible[cl.key] ?? false}
								onCheckedChange={(checked) =>
									onCapLineVisibleChange?.({
										...capLineVisible,
										[cl.key]: checked,
									})
								}
							/>
							<ColorPickerPopover
								colors={CAPACITY_COLORS}
								value={
									capLineColors[cl.key] ??
									CAPACITY_COLORS[idx % CAPACITY_COLORS.length]
								}
								onChange={(color) =>
									onCapLineColorsChange?.({
										...capLineColors,
										[cl.key]: color,
									})
								}
							/>
							<Label className="flex-1 truncate text-sm">{cl.lineName}</Label>
						</div>
					))}
					{availableCapacityLines.length === 0 && (
						<p className="py-2 text-center text-xs text-muted-foreground">
							人員計画ケースまたはキャパシティシナリオがありません
						</p>
					)}
				</div>
			</div>

			<Separator />

			{/* プロファイル管理 */}
			<ProfileManager
				chartType="stacked-area"
				startYearMonth={startYearMonth}
				endYearMonth={endYearMonth}
				projectItems={profileProjectItems}
				businessUnitCodes={businessUnitCodes}
				onApply={handleProfileApply}
			/>
		</div>
	);
}
