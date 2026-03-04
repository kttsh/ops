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
	useDeleteWorkType,
	workTypeQueryOptions,
} from "@/features/work-types";
import { formatDateTime } from "@/lib/format-utils";

export const Route = createFileRoute("/master/work-types/$workTypeCode/")({
	component: WorkTypeDetailPage,
	notFoundComponent: () => (
		<NotFoundState entityName="作業種類" backTo="/master/work-types" />
	),
});

function WorkTypeDetailPage() {
	const { workTypeCode } = Route.useParams();
	const navigate = Route.useNavigate();
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

	const { data, isLoading, isError } = useQuery(
		workTypeQueryOptions(workTypeCode),
	);

	const deleteMutation = useDeleteWorkType();

	const handleDelete = async () => {
		try {
			await deleteMutation.mutateAsync(workTypeCode);
			toast.success("削除しました");
			navigate({ to: "/master/work-types" });
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.problemDetails.status === 409) {
					toast.error(
						"この作業種類は他のデータから参照されているため削除できません",
						{
							duration: Infinity,
						},
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

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-16">
				<p className="text-sm text-muted-foreground">読み込み中...</p>
			</div>
		);
	}

	if (isError || !data) {
		return <NotFoundState entityName="作業種類" backTo="/master/work-types" />;
	}

	const wt = data.data;

	return (
		<div className="grid grid-cols-1 gap-6">
			<PageHeader
				breadcrumbs={[
					{ label: "作業種類一覧", href: "/master/work-types" },
					{ label: wt.name },
				]}
				title={wt.name}
				actions={
					<>
						<Link
							to="/master/work-types/$workTypeCode/edit"
							params={{ workTypeCode }}
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
			<div className="rounded-3xl border p-6 space-y-4 hover:shadow-[0_20px_25px_-5px_rgb(0_0_0/0.05)] transition-all duration-200 ease-in-out">
				<DetailRow label="作業種類コード" value={wt.workTypeCode} />
				<DetailRow label="名称" value={wt.name} />
				<div className="grid grid-cols-3 gap-4">
					<dt className="text-sm font-medium text-muted-foreground">カラー</dt>
					<dd className="col-span-2 text-sm">
						{wt.color ? (
							<div className="flex items-center gap-2">
								<div
									className="w-6 h-6 rounded-full border border-border"
									style={{ backgroundColor: wt.color }}
								/>
								<span>{wt.color}</span>
							</div>
						) : (
							<span className="text-muted-foreground">未設定</span>
						)}
					</dd>
				</div>
				<DetailRow label="表示順" value={String(wt.displayOrder)} />
				<DetailRow label="更新日時" value={formatDateTime(wt.updatedAt)} />
			</div>

			<DeleteConfirmDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				onConfirm={handleDelete}
				isDeleting={deleteMutation.isPending}
				entityLabel="作業種類"
				entityName={wt.name}
			/>
		</div>
	);
}
