import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { DetailRow } from "@/components/shared/DetailRow";
import { NotFoundState } from "@/components/shared/NotFoundState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import {
	ApiError,
	businessUnitQueryOptions,
	useDeleteBusinessUnit,
} from "@/features/business-units";
import { formatDateTime } from "@/lib/format-utils";

export const Route = createFileRoute(
	"/master/business-units/$businessUnitCode/",
)({
	component: BusinessUnitDetailPage,
	notFoundComponent: () => (
		<NotFoundState
			entityName="ビジネスユニット"
			backTo="/master/business-units"
		/>
	),
});

function BusinessUnitDetailPage() {
	const { businessUnitCode } = Route.useParams();
	const navigate = Route.useNavigate();
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

	const { data, isLoading, isError } = useQuery(
		businessUnitQueryOptions(businessUnitCode),
	);

	const deleteMutation = useDeleteBusinessUnit();

	const handleDelete = async () => {
		try {
			await deleteMutation.mutateAsync(businessUnitCode);
			toast.success("削除しました");
			navigate({ to: "/master/business-units" });
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.problemDetails.status === 409) {
					toast.error(
						"このビジネスユニットは他のデータから参照されているため削除できません",
						{
							duration: Infinity,
						},
					);
				} else if (err.problemDetails.status === 404) {
					toast.error("ビジネスユニットが見つかりません", {
						duration: Infinity,
					});
				} else {
					toast.error(err.message, { duration: Infinity });
				}
			}
			setDeleteDialogOpen(false);
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
				entityName="ビジネスユニット"
				backTo="/master/business-units"
			/>
		);
	}

	const bu = data.data;

	return (
		<div className="space-y-6">
			<PageHeader
				breadcrumbs={[
					{ label: "ビジネスユニット一覧", href: "/master/business-units" },
					{ label: bu.name },
				]}
				title={bu.name}
				actions={
					<>
						<Link
							to="/master/business-units/$businessUnitCode/edit"
							params={{ businessUnitCode }}
						>
							<Button variant="outline">
								<Pencil className="h-4 w-4" />
								編集
							</Button>
						</Link>
						<Button
							variant="destructive"
							onClick={() => setDeleteDialogOpen(true)}
						>
							<Trash2 className="h-4 w-4" />
							削除
						</Button>
					</>
				}
			/>

			{/* Detail card */}
			<div className="rounded-2xl border shadow-sm p-6 space-y-4">
				<DetailRow label="ビジネスユニットコード" value={bu.businessUnitCode} />
				<DetailRow label="名称" value={bu.name} />
				<DetailRow label="表示順" value={String(bu.displayOrder)} />
				<DetailRow label="更新日時" value={formatDateTime(bu.updatedAt)} />
			</div>

			<DeleteConfirmDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				onConfirm={handleDelete}
				isDeleting={deleteMutation.isPending}
				entityLabel="ビジネスユニット"
				entityName={bu.name}
			/>
		</div>
	);
}
