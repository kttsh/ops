import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { workTypesQueryOptions } from "@/features/work-types/api/queries";
import {
	useBulkUpsertColorSettings,
	useBulkUpsertStackOrderSettings,
} from "@/features/workload/api/mutations";
import { INDIRECT_COLORS } from "@/lib/chart-colors";
import { ColorPickerPopover } from "./ColorPickerPopover";

interface IndirectWorkTypeSettingsItem {
	workTypeCode: string;
	workTypeName: string;
	isVisible: boolean;
	color: string;
	displayOrder: number;
}

interface SidePanelIndirectProps {
	initialOrder?: string[];
	onColorsChange?: (colors: Record<string, string>) => void;
	onOrderChange?: (order: string[]) => void;
}

export function SidePanelIndirect({
	initialOrder,
	onColorsChange,
	onOrderChange,
}: SidePanelIndirectProps = {}) {
	const { data: workTypesData } = useQuery(
		workTypesQueryOptions({ includeDisabled: false }),
	);
	const workTypes = workTypesData?.data ?? [];

	const [items, setItems] = useState<IndirectWorkTypeSettingsItem[]>(() =>
		workTypes.map((wt, i) => ({
			workTypeCode: wt.workTypeCode,
			workTypeName: wt.name,
			isVisible: true,
			color:
				wt.color && (INDIRECT_COLORS as readonly string[]).includes(wt.color)
					? wt.color
					: INDIRECT_COLORS[i % INDIRECT_COLORS.length],
			displayOrder: i,
		})),
	);

	// workTypes が変わったら items を同期（初回 or データ再取得時）
	if (workTypes.length > 0 && items.length === 0) {
		const newItems = workTypes.map((wt, i) => ({
			workTypeCode: wt.workTypeCode,
			workTypeName: wt.name,
			isVisible: true,
			color:
				wt.color && (INDIRECT_COLORS as readonly string[]).includes(wt.color)
					? wt.color
					: INDIRECT_COLORS[i % INDIRECT_COLORS.length],
			displayOrder: i,
		}));
		setItems(newItems);
	}

	// 保存済み順序をサイドパネルの items に一度だけ適用
	const initialOrderAppliedRef = useRef(false);
	useEffect(() => {
		if (
			!initialOrderAppliedRef.current &&
			initialOrder &&
			initialOrder.length > 0 &&
			items.length > 0
		) {
			initialOrderAppliedRef.current = true;
			const orderMap = new Map(initialOrder.map((code, idx) => [code, idx]));
			const sorted = [...items].sort((a, b) => {
				const orderA = orderMap.get(a.workTypeCode) ?? Number.MAX_SAFE_INTEGER;
				const orderB = orderMap.get(b.workTypeCode) ?? Number.MAX_SAFE_INTEGER;
				return orderA - orderB;
			});
			setItems(sorted.map((it, i) => ({ ...it, displayOrder: i })));
		}
	}, [initialOrder, items]);

	const colorMutation = useBulkUpsertColorSettings();
	const orderMutation = useBulkUpsertStackOrderSettings();

	const toggleVisibility = useCallback(
		(workTypeCode: string) => {
			setItems((prev) => {
				const updated = prev.map((item) =>
					item.workTypeCode === workTypeCode
						? { ...item, isVisible: !item.isVisible }
						: item,
				);
				orderMutation.mutate(
					updated.map((it) => ({
						targetType: "indirect_work_type",
						targetCode: it.workTypeCode,
						stackOrder: it.displayOrder,
					})),
				);
				onOrderChange?.(updated.map((it) => it.workTypeCode));
				return updated;
			});
		},
		[orderMutation, onOrderChange],
	);

	const moveUp = useCallback(
		(index: number) => {
			if (index === 0) return;
			setItems((prev) => {
				const previousItems = [...prev];
				const next = [...prev];
				const temp = next[index - 1];
				next[index - 1] = next[index];
				next[index] = temp;
				const reordered = next.map((it, i) => ({ ...it, displayOrder: i }));
				orderMutation.mutate(
					reordered.map((it) => ({
						targetType: "indirect_work_type",
						targetCode: it.workTypeCode,
						stackOrder: it.displayOrder,
					})),
					{
						onError: () => {
							setItems(previousItems);
							onOrderChange?.(previousItems.map((it) => it.workTypeCode));
							toast.error("表示順の保存に失敗しました");
						},
					},
				);
				onOrderChange?.(reordered.map((it) => it.workTypeCode));
				return reordered;
			});
		},
		[orderMutation, onOrderChange],
	);

	const moveDown = useCallback(
		(index: number) => {
			setItems((prev) => {
				if (index >= prev.length - 1) return prev;
				const previousItems = [...prev];
				const next = [...prev];
				const temp = next[index + 1];
				next[index + 1] = next[index];
				next[index] = temp;
				const reordered = next.map((it, i) => ({ ...it, displayOrder: i }));
				orderMutation.mutate(
					reordered.map((it) => ({
						targetType: "indirect_work_type",
						targetCode: it.workTypeCode,
						stackOrder: it.displayOrder,
					})),
					{
						onError: () => {
							setItems(previousItems);
							onOrderChange?.(previousItems.map((it) => it.workTypeCode));
							toast.error("表示順の保存に失敗しました");
						},
					},
				);
				onOrderChange?.(reordered.map((it) => it.workTypeCode));
				return reordered;
			});
		},
		[orderMutation, onOrderChange],
	);

	const setColor = useCallback(
		(workTypeCode: string, color: string) => {
			setItems((prev) => {
				const updated = prev.map((item) =>
					item.workTypeCode === workTypeCode ? { ...item, color } : item,
				);
				colorMutation.mutate(
					updated.map((it) => ({
						targetType: "indirect_work_type",
						targetCode: it.workTypeCode,
						colorCode: it.color,
					})),
				);
				onColorsChange?.(
					Object.fromEntries(updated.map((it) => [it.workTypeCode, it.color])),
				);
				return updated;
			});
		},
		[colorMutation, onColorsChange],
	);

	const resetColors = useCallback(() => {
		setItems((prev) => {
			const updated = prev.map((item, i) => ({
				...item,
				color: INDIRECT_COLORS[i % INDIRECT_COLORS.length],
			}));
			colorMutation.mutate(
				updated.map((it) => ({
					targetType: "indirect_work_type",
					targetCode: it.workTypeCode,
					colorCode: it.color,
				})),
			);
			onColorsChange?.(
				Object.fromEntries(updated.map((it) => [it.workTypeCode, it.color])),
			);
			return updated;
		});
	}, [colorMutation, onColorsChange]);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-semibold">間接作業</h3>
				<Button
					variant="ghost"
					size="sm"
					className="h-7 gap-1 text-xs"
					onClick={resetColors}
				>
					<RotateCcw className="h-3 w-3" />
					色リセット
				</Button>
			</div>

			<div className="space-y-2">
				{items.map((item, index) => (
					<div
						key={item.workTypeCode}
						className="flex items-center gap-3 rounded-lg border border-border p-3"
					>
						{/* 表示/非表示 */}
						<Switch
							checked={item.isVisible}
							onCheckedChange={() => toggleVisibility(item.workTypeCode)}
						/>

						{/* 色 */}
						<ColorPickerPopover
							colors={INDIRECT_COLORS}
							value={item.color}
							onChange={(color) => setColor(item.workTypeCode, color)}
						/>

						{/* 名称 */}
						<Label className="flex-1 truncate text-sm">
							{item.workTypeName}
						</Label>

						{/* 上下移動 */}
						<div className="flex gap-0.5">
							<Button
								variant="ghost"
								size="icon"
								className="h-6 w-6"
								disabled={index === 0}
								onClick={() => moveUp(index)}
							>
								<ArrowUp className="h-3 w-3" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								className="h-6 w-6"
								disabled={index === items.length - 1}
								onClick={() => moveDown(index)}
							>
								<ArrowDown className="h-3 w-3" />
							</Button>
						</div>
					</div>
				))}
			</div>

			{items.length === 0 && (
				<p className="py-4 text-center text-sm text-muted-foreground">
					間接作業種類がありません
				</p>
			)}
		</div>
	);
}
