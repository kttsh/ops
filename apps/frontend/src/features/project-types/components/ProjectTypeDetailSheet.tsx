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
	useCreateProjectType,
	useDeleteProjectType,
	useRestoreProjectType,
	useUpdateProjectType,
} from "../api/mutations";
import type { ProjectType } from "../types";
import { ProjectTypeForm } from "./ProjectTypeForm";

function getEntityCode(state: MasterSheetState<ProjectType>): string {
	if (state.mode === "view" || state.mode === "edit") {
		return state.entity.projectTypeCode;
	}
	return "";
}

interface ProjectTypeDetailSheetProps {
	sheetState: MasterSheetState<ProjectType>;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	openEdit: () => void;
	openView: (updatedEntity?: ProjectType) => void;
	close: () => void;
	onMutationSuccess: () => void;
}

export function ProjectTypeDetailSheet({
	sheetState,
	isOpen,
	onOpenChange,
	openEdit,
	openView,
	close,
	onMutationSuccess,
}: ProjectTypeDetailSheetProps) {
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);

	const createMutation = useCreateProjectType();
	const updateMutation = useUpdateProjectType(getEntityCode(sheetState));
	const deleteMutation = useDeleteProjectType();
	const restoreMutation = useRestoreProjectType();

	const handleCreate = async (values: {
		projectTypeCode: string;
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
					toast.error("同一コードの案件タイプが既に存在します", {
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
		projectTypeCode: string;
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
					toast.error("案件タイプが見つかりません", { duration: Infinity });
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
			await deleteMutation.mutateAsync(sheetState.entity.projectTypeCode);
			toast.success("削除しました");
			setDeleteDialogOpen(false);
			close();
			onMutationSuccess();
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.problemDetails.status === 409) {
					toast.error(
						"この案件タイプは他のデータから参照されているため削除できません",
						{ duration: Infinity },
					);
				} else if (err.problemDetails.status === 404) {
					toast.error("案件タイプが見つかりません", { duration: Infinity });
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
			await restoreMutation.mutateAsync(sheetState.entity.projectTypeCode);
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
				return "案件タイプ 詳細";
			case "edit":
				return "案件タイプ 編集";
			case "create":
				return "案件タイプ 新規登録";
			default:
				return "";
		}
	};

	const sheetDescription = () => {
		switch (sheetState.mode) {
			case "view":
				return "案件タイプの詳細を表示しています";
			case "edit":
				return "案件タイプ情報を編集します";
			case "create":
				return "新しい案件タイプを登録します";
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
										label="案件タイプコード"
										value={sheetState.entity.projectTypeCode}
									/>
									<DetailRow label="名称" value={sheetState.entity.name} />
									<DetailRow
										label="表示順"
										value={String(sheetState.entity.displayOrder)}
									/>
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
								<ProjectTypeForm
									mode="edit"
									defaultValues={{
										projectTypeCode: sheetState.entity.projectTypeCode,
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
							<ProjectTypeForm
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
						entityLabel="案件タイプ"
						entityName={sheetState.entity.name}
					/>
					<RestoreConfirmDialog
						open={restoreDialogOpen}
						onOpenChange={setRestoreDialogOpen}
						onConfirm={handleRestore}
						entityLabel="案件タイプ"
						isLoading={restoreMutation.isPending}
					/>
				</>
			)}
		</>
	);
}
