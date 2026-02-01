import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { Button } from "@/components/ui/button";
import {
	ApiError,
	businessUnitQueryOptions,
	useDeleteBusinessUnit,
} from "@/features/business-units";

export const Route = createFileRoute(
	"/master/business-units/$businessUnitCode/",
)({
	component: BusinessUnitDetailPage,
	notFoundComponent: () => (
		<div className="flex flex-col items-center justify-center py-16 space-y-4">
			<p className="text-lg font-medium">ビジネスユニットが見つかりません</p>
			<Link
				to="/master/business-units"
				className="text-sm text-primary hover:underline"
			>
				一覧に戻る
			</Link>
		</div>
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
			<div className="flex flex-col items-center justify-center py-16 space-y-4">
				<p className="text-lg font-medium">ビジネスユニットが見つかりません</p>
				<Link
					to="/master/business-units"
					className="text-sm text-primary hover:underline"
				>
					一覧に戻る
				</Link>
			</div>
		);
	}

	const bu = data.data;

	return (
		<div className="space-y-6">
			{/* Breadcrumb */}
			<nav className="flex items-center gap-1 text-sm text-muted-foreground">
				<Link
					to="/master/business-units"
					className="hover:text-foreground transition-colors"
				>
					ビジネスユニット一覧
				</Link>
				<ChevronRight className="h-4 w-4" />
				<span className="text-foreground font-medium">{bu.name}</span>
			</nav>

			{/* Header */}
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold tracking-tight">{bu.name}</h2>
				<div className="flex items-center gap-2">
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
				</div>
			</div>

			{/* Detail card */}
			<div className="rounded-2xl border shadow-sm p-6 space-y-4">
				<DetailRow label="ビジネスユニットコード" value={bu.businessUnitCode} />
				<DetailRow label="名称" value={bu.name} />
				<DetailRow label="表示順" value={String(bu.displayOrder)} />
				<DetailRow
					label="更新日時"
					value={new Date(bu.updatedAt).toLocaleString("ja-JP")}
				/>
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

function DetailRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="grid grid-cols-3 gap-4">
			<dt className="text-sm font-medium text-muted-foreground">{label}</dt>
			<dd className="col-span-2 text-sm">{value}</dd>
		</div>
	);
}
