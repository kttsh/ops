import { Pencil, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { DetailRow } from "@/components/shared/DetailRow";
import { RestoreConfirmDialog } from "@/components/shared/RestoreConfirmDialog";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import type { MasterSheetState } from "@/hooks/useMasterSheet";
import { formatDateTime } from "@/lib/format-utils";
import { ApiError } from "../api/api-client";
import {
	useCreateWorkType,
	useDeleteWorkType,
	useRestoreWorkType,
	useUpdateWorkType,
} from "../api/mutations";
import type { WorkType } from "../types";
import { WorkTypeForm } from "./WorkTypeForm";

function getEntityCode(state: MasterSheetState<WorkType>): string {
	if (state.mode === "view" || state.mode === "edit") {
		return state.entity.workTypeCode;
	}
	return "";
}

interface WorkTypeDetailSheetProps {
	sheetState: MasterSheetState<WorkType>;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	openEdit: () => void;
	openView: (updatedEntity?: WorkType) => void;
	close: () => void;
	onMutationSuccess: () => void;
}

export function WorkTypeDetailSheet({
	sheetState,
	isOpen,
	onOpenChange,
	openEdit,
	openView,
	close,
	onMutationSuccess,
}: WorkTypeDetailSheetProps) {
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);

	const createMutation = useCreateWorkType();
	const updateMutation = useUpdateWorkType(getEntityCode(sheetState));
	const deleteMutation = useDeleteWorkType();
	const restoreMutation = useRestoreWorkType();

	const handleCreate = async (values: {
		workTypeCode: string;
		name: string;
		displayOrder: number;
	}) => {
		try {
			await createMutation.mutateAsync(values);
			toast.success("登録しました");
			close();
			onMutationSuccess();
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.problemDetails.status === 409) {
					toast.error("同一コードの作業種類が既に存在します", {
						duration: Infinity,
					});
				} else if (err.problemDetails.status === 422) {
					toast.error("入力内容にエラーがあります", { duration: Infinity });
				} else {
					toast.error(err.message, { duration: Infinity });
				}
			}
		}
	};

	const handleUpdate = async (values: {
		workTypeCode: string;
		name: string;
		displayOrder: number;
	}) => {
		try {
			const result = await updateMutation.mutateAsync({
				name: values.name,
				displayOrder: values.displayOrder,
			});
			toast.success("保存しました");
			openView(result.data);
			onMutationSuccess();
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.problemDetails.status === 404) {
					toast.error("作業種類が見つかりません", { duration: Infinity });
				} else if (err.problemDetails.status === 422) {
					toast.error("入力内容にエラーがあります", { duration: Infinity });
				} else {
					toast.error(err.message, { duration: Infinity });
				}
			}
		}
	};

	const handleDelete = async () => {
		if (sheetState.mode !== "view" && sheetState.mode !== "edit") return;
		try {
			await deleteMutation.mutateAsync(sheetState.entity.workTypeCode);
			toast.success("削除しました");
			setDeleteDialogOpen(false);
			close();
			onMutationSuccess();
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.problemDetails.status === 409) {
					toast.error(
						"この作業種類は他のデータから参照されているため削除できません",
						{ duration: Infinity },
					);
				} else if (err.problemDetails.status === 404) {
					toast.error("作業種類が見つかりません", { duration: Infinity });
				} else {
					toast.error(err.message, { duration: Infinity });
				}
			}
			setDeleteDialogOpen(false);
		}
	};

	const handleRestore = async () => {
		if (sheetState.mode !== "view" && sheetState.mode !== "edit") return;
		try {
			await restoreMutation.mutateAsync(sheetState.entity.workTypeCode);
			toast.success("復元しました");
			setRestoreDialogOpen(false);
			close();
			onMutationSuccess();
		} catch (err) {
			if (err instanceof ApiError) {
				toast.error(err.message, { duration: Infinity });
			}
			setRestoreDialogOpen(false);
		}
	};

	const sheetTitle = () => {
		switch (sheetState.mode) {
			case "view":
				return "作業種類 詳細";
			case "edit":
				return "作業種類 編集";
			case "create":
				return "作業種類 新規登録";
			default:
				return "";
		}
	};

	const sheetDescription = () => {
		switch (sheetState.mode) {
			case "view":
				return "作業種類の詳細を表示しています";
			case "edit":
				return "作業種類情報を編集します";
			case "create":
				return "新しい作業種類を登録します";
			default:
				return "";
		}
	};

	return (
		<>
			<Sheet open={isOpen} onOpenChange={onOpenChange}>
				<SheetContent
					side="right"
					className="w-full sm:max-w-lg overflow-y-auto"
				>
					<SheetHeader>
						<SheetTitle>{sheetTitle()}</SheetTitle>
						<SheetDescription>{sheetDescription()}</SheetDescription>
					</SheetHeader>

					<div className="mt-6">
						{sheetState.mode === "view" && (
							<div className="space-y-6">
								<div className="space-y-4">
									<DetailRow
										label="作業種類コード"
										value={sheetState.entity.workTypeCode}
									/>
									<DetailRow label="名称" value={sheetState.entity.name} />
									<DetailRow
										label="表示順"
										value={String(sheetState.entity.displayOrder)}
									/>
									{sheetState.entity.color && (
										<div className="grid grid-cols-3 gap-4">
											<dt className="text-sm font-medium text-muted-foreground">
												カラー
											</dt>
											<dd className="col-span-2 flex items-center gap-2 text-sm">
												<span
													className="inline-block h-4 w-4 rounded-full border"
													style={{
														backgroundColor: sheetState.entity.color,
													}}
												/>
												{sheetState.entity.color}
											</dd>
										</div>
									)}
									<DetailRow
										label="更新日時"
										value={formatDateTime(sheetState.entity.updatedAt)}
									/>
								</div>
								<div className="flex gap-3 pt-4">
									<Button variant="outline" onClick={openEdit}>
										<Pencil className="h-4 w-4" />
										編集
									</Button>
									{sheetState.entity.deletedAt ? (
										<Button
											variant="outline"
											onClick={() => setRestoreDialogOpen(true)}
										>
											<RotateCcw className="h-4 w-4" />
											復元
										</Button>
									) : (
										<Button
											variant="destructive"
											onClick={() => setDeleteDialogOpen(true)}
										>
											<Trash2 className="h-4 w-4" />
											削除
										</Button>
									)}
								</div>
							</div>
						)}

						{sheetState.mode === "edit" && (
							<div className="space-y-4">
								<WorkTypeForm
									mode="edit"
									defaultValues={{
										workTypeCode: sheetState.entity.workTypeCode,
										name: sheetState.entity.name,
										displayOrder: sheetState.entity.displayOrder,
									}}
									onSubmit={handleUpdate}
									isSubmitting={updateMutation.isPending}
								/>
								<div className="flex gap-3">
									<Button variant="outline" onClick={() => openView()}>
										キャンセル
									</Button>
								</div>
							</div>
						)}

						{sheetState.mode === "create" && (
							<WorkTypeForm
								mode="create"
								onSubmit={handleCreate}
								isSubmitting={createMutation.isPending}
							/>
						)}
					</div>
				</SheetContent>
			</Sheet>

			{(sheetState.mode === "view" || sheetState.mode === "edit") && (
				<>
					<DeleteConfirmDialog
						open={deleteDialogOpen}
						onOpenChange={setDeleteDialogOpen}
						onConfirm={handleDelete}
						isDeleting={deleteMutation.isPending}
						entityLabel="作業種類"
						entityName={sheetState.entity.name}
					/>
					<RestoreConfirmDialog
						open={restoreDialogOpen}
						onOpenChange={setRestoreDialogOpen}
						onConfirm={handleRestore}
						entityLabel="作業種類"
						isLoading={restoreMutation.isPending}
					/>
				</>
			)}
		</>
	);
}
