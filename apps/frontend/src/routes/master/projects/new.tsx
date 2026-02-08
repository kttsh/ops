import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { ApiError, useCreateProject } from "@/features/projects";
import { ProjectForm } from "@/features/projects/components/ProjectForm";

export const Route = createFileRoute("/master/projects/new")({
	component: ProjectNewPage,
});

function ProjectNewPage() {
	const navigate = Route.useNavigate();
	const createMutation = useCreateProject();

	const handleSubmit = async (values: {
		projectCode: string;
		name: string;
		businessUnitCode: string;
		projectTypeCode: string;
		startYearMonth: string;
		totalManhour: number;
		status: string;
		durationMonths: number | null;
	}) => {
		try {
			await createMutation.mutateAsync({
				...values,
				projectTypeCode: values.projectTypeCode || undefined,
				durationMonths: values.durationMonths ?? undefined,
			});
			toast.success("保存しました");
			navigate({ to: "/master/projects" });
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.problemDetails.status === 409) {
					toast.error("この案件コードは既に使用されています", {
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

	return (
		<div className="space-y-6">
			<PageHeader
				breadcrumbs={[
					{ label: "案件一覧", href: "/master/projects" },
					{ label: "新規登録" },
				]}
				title="案件 新規登録"
				description="新しい案件を登録します"
			/>

			<div className="rounded-2xl border shadow-sm p-6">
				<ProjectForm
					mode="create"
					onSubmit={handleSubmit}
					isSubmitting={createMutation.isPending}
				/>
			</div>
		</div>
	);
}
