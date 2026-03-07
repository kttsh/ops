import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { NotFoundState } from "@/components/shared/NotFoundState";
import { PageHeader } from "@/components/shared/PageHeader";
import { RestoreConfirmDialog } from "@/components/shared/RestoreConfirmDialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import type { UpdateStandardEffortMasterInput } from "@/features/standard-effort-masters";
import {
	ApiError,
	businessUnitsForSelectQueryOptions,
	projectTypesForSelectQueryOptions,
	standardEffortMasterQueryOptions,
	useDeleteStandardEffortMaster,
	useRestoreStandardEffortMaster,
	useUpdateStandardEffortMaster,
} from "@/features/standard-effort-masters";
import { StandardEffortMasterDetail } from "@/features/standard-effort-masters/components/StandardEffortMasterDetail";

export const Route = createFileRoute(
	"/projects/standard-efforts/$standardEffortId/",
)({
	component: StandardEffortMasterDetailPage,
	notFoundComponent: () => (
		<NotFoundState
			entityName="標準工数パターン"
			backTo="/projects/standard-efforts"
		/>
	),
});

function StandardEffortMasterDetailPage() {
	const { standardEffortId } = Route.useParams();
	const navigate = Route.useNavigate();
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
	const id = Number(standardEffortId);

	const { data, isLoading, isError } = useQuery(
		standardEffortMasterQueryOptions(id),
	);
	const buQuery = useQuery(businessUnitsForSelectQueryOptions());
	const ptQuery = useQuery(projectTypesForSelectQueryOptions());
	const deleteMutation = useDeleteStandardEffortMaster();
	const restoreMutation = useRestoreStandardEffortMaster();
	const updateMutation = useUpdateStandardEffortMaster(id);

	const handleDelete = async () => {
		try {
			await deleteMutation.mutateAsync(id);
			toast.success("削除しました");
			navigate({ to: "/projects/standard-efforts" });
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.problemDetails.status === 409) {
					toast.error(
						"このパターンは他のデータから参照されているため削除できません",
						{ duration: Infinity },
					);
				} else if (err.problemDetails.status === 404) {
					toast.error("標準工数パターンが見つかりません", {
						duration: Infinity,
					});
				} else {
					toast.error(err.message, { duration: Infinity });
				}
			}
			setDeleteDialogOpen(false);
		}
	};

	const handleRestore = async () => {
		try {
			await restoreMutation.mutateAsync(id);
			toast.success("復元しました");
			setRestoreDialogOpen(false);
		} catch (err) {
			if (err instanceof ApiError) {
				toast.error(err.message, { duration: Infinity });
			}
			setRestoreDialogOpen(false);
		}
	};

	const handleSave = async (values: UpdateStandardEffortMasterInput) => {
		try {
			await updateMutation.mutateAsync(values);
			toast.success("保存しました");
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.problemDetails.status === 409) {
					toast.error("同一パターン名が既に存在します", {
						duration: Infinity,
					});
				} else if (err.problemDetails.status === 404) {
					toast.error("標準工数パターンが見つかりません", {
						duration: Infinity,
					});
				} else {
					toast.error(err.message, { duration: Infinity });
				}
			}
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-16">
				<p className="text-sm text-muted-foreground">読み込み中...</p>
			</div>
		);
	}

	if (isError || !data) {
		return (
			<NotFoundState
				entityName="標準工数パターン"
				backTo="/projects/standard-efforts"
			/>
		);
	}

	const master = data.data;
	const isDeleted = !!master.deletedAt;

	const buName =
		buQuery.data?.find((bu) => bu.value === master.businessUnitCode)?.label ??
		master.businessUnitCode;
	const ptName =
		ptQuery.data?.find((pt) => pt.value === master.projectTypeCode)?.label ??
		master.projectTypeCode;

	return (
		<div className="grid grid-cols-1 gap-6">
			<PageHeader
				breadcrumbs={[
					{
						label: "標準工数パターン一覧",
						href: "/projects/standard-efforts",
					},
					{ label: master.name },
				]}
				title={master.name}
				actions={
					isDeleted ? (
						<>
							<StatusBadge isDeleted />
							<Button
								variant="outline"
								onClick={() => setRestoreDialogOpen(true)}
							>
								<RotateCcw className="h-4 w-4" />
								復元
							</Button>
						</>
					) : (
						<Button
							variant="destructive"
							onClick={() => setDeleteDialogOpen(true)}
						>
							<Trash2 className="h-4 w-4" />
							削除
						</Button>
					)
				}
			/>

			<StandardEffortMasterDetail
				data={master}
				buName={buName}
				ptName={ptName}
				onSave={handleSave}
				isSaving={updateMutation.isPending}
			/>

			<DeleteConfirmDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				onConfirm={handleDelete}
				isDeleting={deleteMutation.isPending}
				entityLabel="標準工数パターン"
				entityName={master.name}
			/>

			<RestoreConfirmDialog
				open={restoreDialogOpen}
				onOpenChange={setRestoreDialogOpen}
				onConfirm={handleRestore}
				entityLabel="標準工数パターン"
				isLoading={restoreMutation.isPending}
			/>
		</div>
	);
}
