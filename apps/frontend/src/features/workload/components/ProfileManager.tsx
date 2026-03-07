import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Save, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	bulkUpsertChartViewCapacityItems,
	fetchChartViewCapacityItems,
	fetchChartViewProjectItems,
} from "@/features/workload/api/api-client";
import {
	useBulkUpsertChartViewProjectItems,
	useCreateChartView,
	useDeleteChartView,
	useUpdateChartView,
} from "@/features/workload/api/mutations";
import { chartViewsQueryOptions } from "@/features/workload/api/queries";
import type {
	BulkUpsertCapacityItemInput,
	BulkUpsertProjectItemInput,
	ChartView,
	ChartViewCapacityItem,
} from "@/features/workload/types";

interface ProfileManagerProps {
	chartType: string;
	startYearMonth: string;
	endYearMonth: string;
	projectItems: BulkUpsertProjectItemInput[];
	businessUnitCodes: string[];
	capVisible?: Record<number, boolean>;
	capColors?: Record<number, string>;
	onApply?: (profile: {
		chartViewId: number;
		startYearMonth: string;
		endYearMonth: string;
		projectItems: BulkUpsertProjectItemInput[];
		businessUnitCodes: string[] | null;
		capacityItems?: ChartViewCapacityItem[];
	}) => void;
}

export function ProfileManager({
	chartType,
	startYearMonth,
	endYearMonth,
	projectItems,
	businessUnitCodes,
	capVisible,
	capColors,
	onApply,
}: ProfileManagerProps) {
	const { data: viewsData } = useQuery(chartViewsQueryOptions());
	const views = viewsData?.data ?? [];

	const createMutation = useCreateChartView();
	const updateMutation = useUpdateChartView();
	const deleteMutation = useDeleteChartView();
	const bulkUpsertMutation = useBulkUpsertChartViewProjectItems();

	const [newName, setNewName] = useState("");
	const [activeViewId, setActiveViewId] = useState<number | null>(null);
	const [overwriteTarget, setOverwriteTarget] = useState<ChartView | null>(
		null,
	);

	const buildCapacityItems = useCallback((): BulkUpsertCapacityItemInput[] => {
		return Object.entries(capVisible ?? {}).map(([id, visible]) => ({
			capacityScenarioId: Number(id),
			isVisible: visible,
			colorCode: capColors?.[Number(id)] ?? null,
		}));
	}, [capVisible, capColors]);

	const handleSave = useCallback(() => {
		if (!newName.trim()) return;
		createMutation.mutate(
			{
				viewName: newName.trim(),
				chartType,
				startYearMonth,
				endYearMonth,
				businessUnitCodes,
			},
			{
				onSuccess: async (result) => {
					const chartViewId = result.data.chartViewId;
					try {
						bulkUpsertMutation.mutate(
							{ chartViewId, items: projectItems },
							{
								onError: () => {
									toast.error("プロジェクトアイテムの保存に失敗しました");
								},
							},
						);
						const capacityItems = buildCapacityItems();
						if (capacityItems.length > 0) {
							await bulkUpsertChartViewCapacityItems(
								chartViewId,
								capacityItems,
							);
						}
						setNewName("");
					} catch {
						toast.error("キャパシティアイテムの保存に失敗しました");
					}
				},
			},
		);
	}, [
		newName,
		createMutation,
		bulkUpsertMutation,
		chartType,
		startYearMonth,
		endYearMonth,
		projectItems,
		businessUnitCodes,
		buildCapacityItems,
	]);

	const handleDelete = useCallback(
		(id: number) => {
			deleteMutation.mutate(id);
			if (activeViewId === id) {
				setActiveViewId(null);
			}
		},
		[deleteMutation, activeViewId],
	);

	const handleApply = useCallback(
		async (view: ChartView) => {
			setActiveViewId(view.chartViewId);
			try {
				const [projectItemsRes, capacityItemsRes] = await Promise.all([
					fetchChartViewProjectItems(view.chartViewId),
					fetchChartViewCapacityItems(view.chartViewId).catch(() => ({
						data: [] as ChartViewCapacityItem[],
					})),
				]);
				const items = projectItemsRes.data;
				onApply?.({
					chartViewId: view.chartViewId,
					startYearMonth: view.startYearMonth,
					endYearMonth: view.endYearMonth,
					projectItems: items.map((item) => ({
						projectId: item.projectId,
						projectCaseId: item.projectCaseId,
						displayOrder: item.displayOrder,
						isVisible: item.isVisible,
						color: item.color,
					})),
					businessUnitCodes: view.businessUnitCodes,
					capacityItems: capacityItemsRes.data,
				});
			} catch (error) {
				console.error("プロファイル読み込みエラー:", error);
				toast.error("プロファイルの読み込みに失敗しました");
			}
		},
		[onApply],
	);

	const handleOverwriteConfirm = useCallback(() => {
		if (!overwriteTarget) return;
		const targetId = overwriteTarget.chartViewId;

		updateMutation.mutate(
			{
				id: targetId,
				input: { chartType, startYearMonth, endYearMonth, businessUnitCodes },
			},
			{
				onSuccess: async () => {
					try {
						bulkUpsertMutation.mutate(
							{ chartViewId: targetId, items: projectItems },
							{
								onError: () => {
									toast.error("プロジェクトアイテムの上書きに失敗しました");
								},
							},
						);
						const capacityItems = buildCapacityItems();
						if (capacityItems.length > 0) {
							await bulkUpsertChartViewCapacityItems(targetId, capacityItems);
						}
						toast.success("上書き保存しました");
						setOverwriteTarget(null);
					} catch {
						toast.error("キャパシティアイテムの上書きに失敗しました");
						setOverwriteTarget(null);
					}
				},
				onError: () => {
					toast.error("上書き保存に失敗しました");
					setOverwriteTarget(null);
				},
			},
		);
	}, [
		overwriteTarget,
		updateMutation,
		bulkUpsertMutation,
		chartType,
		startYearMonth,
		endYearMonth,
		projectItems,
		businessUnitCodes,
		buildCapacityItems,
	]);

	return (
		<div>
			<h3 className="mb-3 text-sm font-semibold">プロファイル管理</h3>

			{/* 保存 */}
			<div className="mb-3 flex gap-2">
				<Input
					placeholder="プロファイル名"
					value={newName}
					onChange={(e) => setNewName(e.target.value)}
					className="h-8 bg-white text-sm"
				/>
				<Button
					variant="outline"
					size="sm"
					className="h-8 gap-1"
					onClick={handleSave}
					disabled={
						createMutation.isPending ||
						bulkUpsertMutation.isPending ||
						!newName.trim()
					}
				>
					<Save className="h-3.5 w-3.5" />
					保存
				</Button>
			</div>

			{/* 一覧 */}
			<div className="space-y-1">
				{views.map((view) => (
					<div
						key={view.chartViewId}
						className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
							activeViewId === view.chartViewId
								? "border-primary bg-white"
								: "border-border bg-white"
						}`}
					>
						<button
							type="button"
							className="flex-1 text-left text-sm hover:text-primary"
							onClick={() => handleApply(view)}
						>
							{view.viewName}
						</button>
						<div className="flex gap-0.5">
							<Button
								variant="ghost"
								size="icon"
								className="h-6 w-6 text-muted-foreground hover:text-primary"
								onClick={() => setOverwriteTarget(view)}
							>
								<RefreshCw className="h-3.5 w-3.5" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								className="h-6 w-6 text-muted-foreground hover:text-destructive"
								onClick={() => handleDelete(view.chartViewId)}
							>
								<Trash2 className="h-3.5 w-3.5" />
							</Button>
						</div>
					</div>
				))}
				{views.length === 0 && (
					<p className="py-2 text-center text-xs text-muted-foreground">
						保存済みプロファイルはありません
					</p>
				)}
			</div>

			{/* 上書き保存確認ダイアログ */}
			<AlertDialog
				open={overwriteTarget !== null}
				onOpenChange={(open) => {
					if (!open) setOverwriteTarget(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>プロファイルの上書き保存</AlertDialogTitle>
						<AlertDialogDescription>
							「{overwriteTarget?.viewName}
							」を現在の画面状態で上書きします。この操作は元に戻せません。
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>キャンセル</AlertDialogCancel>
						<AlertDialogAction onClick={handleOverwriteConfirm}>
							保存
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
