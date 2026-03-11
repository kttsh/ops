import { Loader2, Pencil, RotateCcw, Trash2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
	useCreateHeadcountPlanCase,
	useDeleteHeadcountPlanCase,
	useRestoreHeadcountPlanCase,
	useUpdateHeadcountPlanCase,
} from "@/features/indirect-case-study/api/mutations";
import type { HeadcountPlanCase } from "@/features/indirect-case-study/types";
import { CaseFormSheet } from "./CaseFormSheet";

interface HeadcountPlanCaseChipsProps {
	cases: HeadcountPlanCase[];
	selectedCaseId: number | null;
	onSelect: (id: number) => void;
	businessUnitCode: string;
	isLoading: boolean;
	includeDisabled: boolean;
	onIncludeDisabledChange: (value: boolean) => void;
}

export function HeadcountPlanCaseChips({
	cases,
	selectedCaseId,
	onSelect,
	businessUnitCode,
	isLoading,
	includeDisabled,
	onIncludeDisabledChange,
}: HeadcountPlanCaseChipsProps) {
	const [formOpen, setFormOpen] = useState(false);
	const [formMode, setFormMode] = useState<"create" | "edit">("create");
	const [editTarget, setEditTarget] = useState<HeadcountPlanCase | null>(null);
	const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

	const createMutation = useCreateHeadcountPlanCase();
	const updateMutation = useUpdateHeadcountPlanCase();
	const deleteMutation = useDeleteHeadcountPlanCase();
	const restoreMutation = useRestoreHeadcountPlanCase();

	const handleCreate = () => {
		setFormMode("create");
		setEditTarget(null);
		setFormOpen(true);
	};

	const handleEdit = (item: HeadcountPlanCase) => {
		setFormMode("edit");
		setEditTarget(item);
		setFormOpen(true);
	};

	const handleSubmit = async (values: {
		caseName: string;
		description: string;
		isPrimary: boolean;
	}) => {
		if (formMode === "create") {
			const result = await createMutation.mutateAsync({
				...values,
				businessUnitCode,
			});
			// 作成後自動選択
			if (result?.data?.headcountPlanCaseId) {
				onSelect(result.data.headcountPlanCaseId);
			}
		} else if (editTarget) {
			await updateMutation.mutateAsync({
				id: editTarget.headcountPlanCaseId,
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
			<div className="flex items-center gap-2 py-1">
				<Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
				<span className="text-sm text-muted-foreground">
					ケース読み込み中...
				</span>
			</div>
		);
	}

	const selectedCase = cases.find(
		(c) => c.headcountPlanCaseId === selectedCaseId,
	);

	return (
		<div className="space-y-2">
			<div className="flex flex-wrap items-center gap-1.5">
				<span className="mr-1 text-xs font-medium text-muted-foreground">
					ケース
				</span>
				{cases.map((c) => {
					const isSelected = c.headcountPlanCaseId === selectedCaseId;
					const isDeleted = c.deletedAt !== null;

					return (
						<div
							key={c.headcountPlanCaseId}
							className={`inline-flex items-center gap-1 ${isDeleted ? "opacity-50" : ""}`}
						>
							<button
								type="button"
								disabled={isDeleted}
								className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-sm transition-colors ${
									isSelected
										? "border-primary bg-primary/10 text-primary"
										: "border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
								} ${isDeleted ? "cursor-default" : "cursor-pointer"}`}
								onClick={() => !isDeleted && onSelect(c.headcountPlanCaseId)}
							>
								{c.caseName}
								{c.isPrimary && (
									<span className="ml-1.5 rounded bg-primary/20 px-1 py-0.5 text-[10px] font-medium leading-none text-primary">
										★
									</span>
								)}
							</button>
							{isDeleted && (
								<Button
									variant="ghost"
									size="icon"
									className="h-6 w-6"
									onClick={() => handleRestore(c.headcountPlanCaseId)}
									title="復元"
								>
									<RotateCcw className="h-3 w-3" />
								</Button>
							)}
						</div>
					);
				})}

				{/* 新規作成ボタン */}
				<button
					type="button"
					className="inline-flex items-center rounded-lg border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
					onClick={handleCreate}
				>
					+新規
				</button>

				{/* 選択中ケースの編集・削除ボタン */}
				{selectedCase && !selectedCase.deletedAt && (
					<div className="ml-2 flex items-center gap-0.5">
						<Button
							variant="ghost"
							size="icon"
							className="h-7 w-7"
							onClick={() => handleEdit(selectedCase)}
							title="編集"
						>
							<Pencil className="h-3.5 w-3.5" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="h-7 w-7 text-destructive"
							onClick={() =>
								setDeleteTargetId(selectedCase.headcountPlanCaseId)
							}
							title="削除"
						>
							<Trash2 className="h-3.5 w-3.5" />
						</Button>
					</div>
				)}

				{/* 削除済みスイッチ */}
				<div className="ml-auto flex items-center gap-2">
					<Switch
						id="hpc-include-disabled"
						checked={includeDisabled}
						onCheckedChange={onIncludeDisabledChange}
					/>
					<Label
						htmlFor="hpc-include-disabled"
						className="text-xs text-muted-foreground"
					>
						削除済みを含む
					</Label>
				</div>
			</div>

			{cases.length === 0 && (
				<p className="text-sm text-muted-foreground">ケースがありません</p>
			)}

			{/* CaseFormSheet */}
			<CaseFormSheet
				open={formOpen}
				onOpenChange={setFormOpen}
				mode={formMode}
				caseType="headcountPlan"
				defaultValues={
					editTarget
						? {
								caseName: editTarget.caseName,
								description: editTarget.description ?? "",
								isPrimary: editTarget.isPrimary,
							}
						: undefined
				}
				onSubmit={handleSubmit}
				isSubmitting={createMutation.isPending || updateMutation.isPending}
			/>

			{/* 削除確認ダイアログ */}
			<AlertDialog
				open={deleteTargetId !== null}
				onOpenChange={(open) => !open && setDeleteTargetId(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>ケースを削除しますか？</AlertDialogTitle>
						<AlertDialogDescription>
							この操作はケースを論理削除します。後から復元できます。
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
