import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { DetailRow } from "@/components/shared/DetailRow";
import { NotFoundState } from "@/components/shared/NotFoundState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CaseStudySection } from "@/features/case-study/components/CaseStudySection";
import {
	ApiError,
	PROJECT_STATUSES,
	projectQueryOptions,
	useDeleteProject,
} from "@/features/projects";
import { formatDateTime } from "@/lib/format-utils";

export const Route = createFileRoute("/projects/$projectId/")({
	component: ProjectDetailPage,
	notFoundComponent: () => (
		<NotFoundState entityName="案件" backTo="/projects" />
	),
});

function formatYearMonth(ym: string) {
	if (ym.length !== 6) return ym;
	return `${ym.slice(0, 4)}/${ym.slice(4, 6)}`;
}

function getStatusLabel(value: string) {
	const v = value.toLowerCase();
	const status = PROJECT_STATUSES.find((s) => s.value === v);
	return status?.label ?? value;
}

function ProjectDetailPage() {
	const { projectId } = Route.useParams();
	const navigate = Route.useNavigate();
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const id = Number(projectId);

	const { data, isLoading, isError } = useQuery(projectQueryOptions(id));
	const deleteMutation = useDeleteProject();

	const handleDelete = async () => {
		try {
			await deleteMutation.mutateAsync(id);
			toast.success("削除しました");
			navigate({ to: "/projects" });
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.problemDetails.status === 409) {
					toast.error(
						"この案件は他のデータから参照されているため削除できません",
						{
							duration: Infinity,
						},
					);
				} else if (err.problemDetails.status === 404) {
					toast.error("案件が見つかりません", { duration: Infinity });
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
		return <NotFoundState entityName="案件" backTo="/projects" />;
	}

	const project = data.data;
	const statusLabel = getStatusLabel(project.status);

	return (
		<div className="grid grid-cols-1 gap-6">
			<PageHeader
				breadcrumbs={[
					{ label: "案件一覧", href: "/projects" },
					{ label: project.name },
				]}
				title={project.name}
				actions={
					<>
						<Link to="/projects/$projectId/edit" params={{ projectId }}>
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

			<ProjectDetailCard project={project} statusLabel={statusLabel} />

			<CaseStudySection projectId={id} project={project} />

			<DeleteConfirmDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				onConfirm={handleDelete}
				isDeleting={deleteMutation.isPending}
				entityLabel="案件"
				entityName={project.name}
			/>
		</div>
	);
}

function ProjectDetailCard({
	project,
	statusLabel,
}: {
	project: {
		projectCode: string;
		name: string;
		businessUnitName: string;
		projectTypeName: string | null;
		startYearMonth: string;
		totalManhour: number;
		status: string;
		durationMonths: number | null;
		fiscalYear: number | null;
		nickname: string | null;
		customerName: string | null;
		orderNumber: string | null;
		calculationBasis: string | null;
		remarks: string | null;
		region: string | null;
		updatedAt: string;
	};
	statusLabel: string;
}) {
	return (
		<div className="rounded-3xl border bg-white p-6 space-y-4">
			<DetailRow label="案件コード" value={project.projectCode} />
			<DetailRow label="名称" value={project.name} />
			<DetailRow label="事業部" value={project.businessUnitName} />
			<DetailRow label="種別" value={project.projectTypeName ?? "—"} />
			<DetailRow
				label="開始年月"
				value={formatYearMonth(project.startYearMonth)}
			/>
			<DetailRow label="総工数" value={String(project.totalManhour)} />
			<div className="grid grid-cols-3 gap-4">
				<dt className="text-sm font-medium text-muted-foreground">
					ステータス
				</dt>
				<dd className="col-span-2 text-sm">
					{project.status.toLowerCase() === "confirmed" ? (
						<Badge variant="success">{statusLabel}</Badge>
					) : project.status.toLowerCase() === "planning" ? (
						<Badge variant="default">{statusLabel}</Badge>
					) : (
						<Badge variant="secondary">{statusLabel}</Badge>
					)}
				</dd>
			</div>
			<DetailRow
				label="期間月数"
				value={
					project.durationMonths != null
						? `${project.durationMonths} ヶ月`
						: "—"
				}
			/>
			<DetailRow
				label="年度"
				value={project.fiscalYear != null ? String(project.fiscalYear) : "—"}
			/>
			<DetailRow label="通称・略称" value={project.nickname ?? "—"} />
			<DetailRow label="客先名" value={project.customerName ?? "—"} />
			<DetailRow label="オーダー番号" value={project.orderNumber ?? "—"} />
			<DetailRow label="算出根拠" value={project.calculationBasis ?? "—"} />
			<DetailRow label="備考" value={project.remarks ?? "—"} />
			<DetailRow label="地域" value={project.region ?? "—"} />
			<DetailRow label="更新日時" value={formatDateTime(project.updatedAt)} />
		</div>
	);
}
