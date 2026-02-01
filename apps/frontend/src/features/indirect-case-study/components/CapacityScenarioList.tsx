import { Loader2, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
	useCreateCapacityScenario,
	useDeleteCapacityScenario,
	useRestoreCapacityScenario,
	useUpdateCapacityScenario,
} from "@/features/indirect-case-study/api/mutations";
import type { CapacityScenario } from "@/features/indirect-case-study/types";
import { ScenarioFormSheet } from "./ScenarioFormSheet";

interface CapacityScenarioListProps {
	items: CapacityScenario[];
	selectedId: number | null;
	onSelect: (id: number) => void;
	isLoading: boolean;
	includeDisabled: boolean;
	onIncludeDisabledChange: (value: boolean) => void;
}

export function CapacityScenarioList({
	items,
	selectedId,
	onSelect,
	isLoading,
	includeDisabled,
	onIncludeDisabledChange,
}: CapacityScenarioListProps) {
	const [formOpen, setFormOpen] = useState(false);
	const [formMode, setFormMode] = useState<"create" | "edit">("create");
	const [editTarget, setEditTarget] = useState<CapacityScenario | null>(null);
	const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

	const createMutation = useCreateCapacityScenario();
	const updateMutation = useUpdateCapacityScenario();
	const deleteMutation = useDeleteCapacityScenario();
	const restoreMutation = useRestoreCapacityScenario();

	const handleCreate = () => {
		setFormMode("create");
		setEditTarget(null);
		setFormOpen(true);
	};

	const handleEdit = (item: CapacityScenario) => {
		setFormMode("edit");
		setEditTarget(item);
		setFormOpen(true);
	};

	const handleSubmit = async (values: {
		scenarioName: string;
		description: string;
		hoursPerPerson: number;
		isPrimary: boolean;
	}) => {
		if (formMode === "create") {
			await createMutation.mutateAsync(values);
		} else if (editTarget) {
			await updateMutation.mutateAsync({
				id: editTarget.capacityScenarioId,
				input: values,
			});
		}
	};

	const handleDelete = async () => {
		if (deleteTargetId !== null) {
			await deleteMutation.mutateAsync(deleteTargetId);
			setDeleteTargetId(null);
		}
	};

	const handleRestore = async (id: number) => {
		await restoreMutation.mutateAsync(id);
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-8">
				<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<h3 className="text-sm font-semibold">キャパシティシナリオ</h3>
				<Button variant="outline" size="sm" onClick={handleCreate}>
					<Plus className="h-3.5 w-3.5 mr-1" />
					新規作成
				</Button>
			</div>

			<div className="flex items-center gap-2">
				<Switch
					id="cs-include-disabled"
					checked={includeDisabled}
					onCheckedChange={onIncludeDisabledChange}
				/>
				<Label
					htmlFor="cs-include-disabled"
					className="text-xs text-muted-foreground"
				>
					削除済みを含む
				</Label>
			</div>

			<div className="space-y-1">
				{items.map((item) => {
					const isDeleted = item.deletedAt !== null;
					const isSelected = selectedId === item.capacityScenarioId;
					return (
						<div
							key={item.capacityScenarioId}
							role="button"
							tabIndex={isDeleted ? -1 : 0}
							className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors ${
								isSelected
									? "bg-primary/10 border border-primary/20"
									: "hover:bg-muted/50 border border-transparent"
							} ${isDeleted ? "opacity-60" : ""}`}
							onClick={() => !isDeleted && onSelect(item.capacityScenarioId)}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									!isDeleted && onSelect(item.capacityScenarioId);
								}
							}}
						>
							<input
								type="radio"
								name="capacity-scenario"
								checked={isSelected}
								readOnly
								disabled={isDeleted}
								className="shrink-0"
							/>
							<div className="flex-1 min-w-0">
								<span className="truncate block">{item.scenarioName}</span>
								<span className="text-xs text-muted-foreground">
									{item.hoursPerPerson}h/人月
								</span>
							</div>
							{item.isPrimary && (
								<Badge variant="secondary" className="text-xs shrink-0">
									Primary
								</Badge>
							)}
							{isDeleted ? (
								<Button
									variant="ghost"
									size="icon"
									className="h-7 w-7 shrink-0"
									onClick={(e) => {
										e.stopPropagation();
										handleRestore(item.capacityScenarioId);
									}}
									title="復元"
								>
									<RotateCcw className="h-3.5 w-3.5" />
								</Button>
							) : (
								<div className="flex gap-0.5 shrink-0">
									<Button
										variant="ghost"
										size="icon"
										className="h-7 w-7"
										onClick={(e) => {
											e.stopPropagation();
											handleEdit(item);
										}}
										title="編集"
									>
										<Pencil className="h-3.5 w-3.5" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										className="h-7 w-7 text-destructive"
										onClick={(e) => {
											e.stopPropagation();
											setDeleteTargetId(item.capacityScenarioId);
										}}
										title="削除"
									>
										<Trash2 className="h-3.5 w-3.5" />
									</Button>
								</div>
							)}
						</div>
					);
				})}
				{items.length === 0 && (
					<p className="text-sm text-muted-foreground text-center py-4">
						シナリオがありません
					</p>
				)}
			</div>

			<ScenarioFormSheet
				open={formOpen}
				onOpenChange={setFormOpen}
				mode={formMode}
				defaultValues={
					editTarget
						? {
								scenarioName: editTarget.scenarioName,
								description: editTarget.description ?? "",
								hoursPerPerson: editTarget.hoursPerPerson,
								isPrimary: editTarget.isPrimary,
							}
						: undefined
				}
				onSubmit={handleSubmit}
				isSubmitting={createMutation.isPending || updateMutation.isPending}
			/>

			<AlertDialog
				open={deleteTargetId !== null}
				onOpenChange={(open) => !open && setDeleteTargetId(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>シナリオを削除しますか？</AlertDialogTitle>
						<AlertDialogDescription>
							この操作はシナリオを論理削除します。後から復元できます。
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>キャンセル</AlertDialogCancel>
						<AlertDialogAction onClick={handleDelete}>削除</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
