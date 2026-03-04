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
	projectTypeQueryOptions,
	useDeleteProjectType,
} from "@/features/project-types";
import { formatDateTime } from "@/lib/format-utils";

export const Route = createFileRoute("/master/project-types/$projectTypeCode/")(
	{
		component: ProjectTypeDetailPage,
		notFoundComponent: () => (
			<NotFoundState entityName="案件タイプ" backTo="/master/project-types" />
		),
	},
);

function ProjectTypeDetailPage() {
	const { projectTypeCode } = Route.useParams();
	const navigate = Route.useNavigate();
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

	const { data, isLoading, isError } = useQuery(
		projectTypeQueryOptions(projectTypeCode),
	);

	const deleteMutation = useDeleteProjectType();

	const handleDelete = async () => {
		try {
			await deleteMutation.mutateAsync(projectTypeCode);
			toast.success("削除しました");
			navigate({ to: "/master/project-types" });
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.problemDetails.status === 409) {
					toast.error(
						"この案件タイプは他のデータから参照されているため削除できません",
						{
							duration: Infinity,
						},
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

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-16">
				<p className="text-sm text-muted-foreground">読み込み中...</p>
			</div>
		);
	}

	if (isError || !data) {
		return (
			<NotFoundState entityName="案件タイプ" backTo="/master/project-types" />
		);
	}

	const pt = data.data;

	return (
		<div className="grid grid-cols-1 gap-6">
			<PageHeader
				breadcrumbs={[
					{ label: "案件タイプ一覧", href: "/master/project-types" },
					{ label: pt.name },
				]}
				title={pt.name}
				actions={
					<>
						<Link
							to="/master/project-types/$projectTypeCode/edit"
							params={{ projectTypeCode }}
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

			<div className="rounded-3xl border p-6 space-y-4 hover:shadow-[0_20px_25px_-5px_rgb(0_0_0/0.05)] transition-all duration-200 ease-in-out">
				<DetailRow label="案件タイプコード" value={pt.projectTypeCode} />
				<DetailRow label="名称" value={pt.name} />
				<DetailRow label="表示順" value={String(pt.displayOrder)} />
				<DetailRow label="更新日時" value={formatDateTime(pt.updatedAt)} />
			</div>

			<DeleteConfirmDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				onConfirm={handleDelete}
				isDeleting={deleteMutation.isPending}
				entityLabel="案件タイプ"
				entityName={pt.name}
			/>
		</div>
	);
}
