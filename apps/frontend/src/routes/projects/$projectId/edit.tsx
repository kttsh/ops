import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import {
	ApiError,
	projectQueryOptions,
	useUpdateProject,
} from "@/features/projects";
import { ProjectForm } from "@/features/projects/components/ProjectForm";

export const Route = createFileRoute("/projects/$projectId/edit")({
	component: ProjectEditPage,
});

function ProjectEditPage() {
	const { projectId } = Route.useParams();
	const navigate = Route.useNavigate();
	const id = Number(projectId);

	const { data, isLoading } = useQuery(projectQueryOptions(id));
	const updateMutation = useUpdateProject(id);

	const handleSubmit = async (values: {
		projectCode: string;
		name: string;
		businessUnitCode: string;
		projectTypeCode: string;
		startYearMonth: string;
		totalManhour: number;
		status: string;
		durationMonths: number | null;
		fiscalYear: number | null;
		nickname: string;
		customerName: string;
		orderNumber: string;
		calculationBasis: string;
		remarks: string;
		region: string;
	}) => {
		try {
			await updateMutation.mutateAsync({
				name: values.name,
				businessUnitCode: values.businessUnitCode,
				projectTypeCode: values.projectTypeCode || null,
				startYearMonth: values.startYearMonth,
				totalManhour: values.totalManhour,
				status: values.status,
				durationMonths: values.durationMonths ?? undefined,
				fiscalYear: values.fiscalYear ?? undefined,
				nickname: values.nickname || undefined,
				customerName: values.customerName || undefined,
				orderNumber: values.orderNumber || undefined,
				calculationBasis: values.calculationBasis || undefined,
				remarks: values.remarks || undefined,
				region: values.region || undefined,
			});
			toast.success("保存しました");
			navigate({
				to: "/projects/$projectId",
				params: { projectId },
			});
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.problemDetails.status === 404) {
					toast.error("案件が見つかりません", { duration: Infinity });
				} else if (err.problemDetails.status === 409) {
					toast.error("同一コードの案件が既に存在します", {
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

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-16">
				<p className="text-sm text-muted-foreground">読み込み中...</p>
			</div>
		);
	}

	if (!data) {
		return (
			<div className="flex flex-col items-center justify-center py-16 space-y-4">
				<p className="text-lg font-medium">案件が見つかりません</p>
				<Link to="/projects" className="text-sm text-primary hover:underline">
					一覧に戻る
				</Link>
			</div>
		);
	}

	const project = data.data;

	return (
		<div className="grid grid-cols-1 gap-6">
			<PageHeader
				breadcrumbs={[
					{ label: "案件一覧", href: "/projects" },
					{
						label: project.name,
						href: "/projects/$projectId",
						params: { projectId },
					},
					{ label: "編集" },
				]}
				title="案件 編集"
				description="案件情報を編集します"
			/>

			<div className="rounded-3xl border bg-white p-6">
				<ProjectForm
					mode="edit"
					defaultValues={{
						projectCode: project.projectCode,
						name: project.name,
						businessUnitCode: project.businessUnitCode,
						projectTypeCode: project.projectTypeCode ?? "",
						startYearMonth: project.startYearMonth,
						totalManhour: project.totalManhour,
						status: project.status,
						durationMonths: project.durationMonths,
						fiscalYear: project.fiscalYear,
						nickname: project.nickname ?? "",
						customerName: project.customerName ?? "",
						orderNumber: project.orderNumber ?? "",
						calculationBasis: project.calculationBasis ?? "",
						remarks: project.remarks ?? "",
						region: project.region ?? "",
					}}
					onSubmit={handleSubmit}
					isSubmitting={updateMutation.isPending}
				/>
			</div>
		</div>
	);
}
