import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { ApiError, useCreateProjectType } from "@/features/project-types";
import { ProjectTypeForm } from "@/features/project-types/components/ProjectTypeForm";

export const Route = createFileRoute("/master/project-types/new")({
	component: ProjectTypeNewPage,
});

function ProjectTypeNewPage() {
	const navigate = Route.useNavigate();
	const createMutation = useCreateProjectType();

	const handleSubmit = async (values: {
		projectTypeCode: string;
		name: string;
		displayOrder: number;
	}) => {
		try {
			await createMutation.mutateAsync(values);
			toast.success("保存しました");
			navigate({ to: "/master/project-types" });
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

	return (
		<div className="space-y-6">
			<PageHeader
				breadcrumbs={[
					{ label: "案件タイプ一覧", href: "/master/project-types" },
					{ label: "新規登録" },
				]}
				title="案件タイプ 新規登録"
				description="新しい案件タイプを登録します"
			/>

			<div className="rounded-2xl border shadow-sm p-6">
				<ProjectTypeForm
					mode="create"
					onSubmit={handleSubmit}
					isSubmitting={createMutation.isPending}
				/>
			</div>
		</div>
	);
}
