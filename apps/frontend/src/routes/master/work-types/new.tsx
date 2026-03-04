import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { ApiError, useCreateWorkType } from "@/features/work-types";
import { WorkTypeForm } from "@/features/work-types/components/WorkTypeForm";

export const Route = createFileRoute("/master/work-types/new")({
	component: WorkTypeNewPage,
});

function WorkTypeNewPage() {
	const navigate = Route.useNavigate();
	const createMutation = useCreateWorkType();

	const handleSubmit = async (values: {
		workTypeCode: string;
		name: string;
		displayOrder: number;
		color: string | null;
	}) => {
		try {
			await createMutation.mutateAsync(values);
			toast.success("保存しました");
			navigate({ to: "/master/work-types" });
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.problemDetails.status === 409) {
					toast.error("同一コードの作業種類が既に存在します", {
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
		<div className="grid grid-cols-1 gap-6">
			<PageHeader
				breadcrumbs={[
					{ label: "作業種類一覧", href: "/master/work-types" },
					{ label: "新規登録" },
				]}
				title="作業種類 新規登録"
				description="新しい作業種類を登録します"
			/>

			<div className="rounded-3xl border p-6 hover:shadow-[0_20px_25px_-5px_rgb(0_0_0/0.05)] transition-all duration-200 ease-in-out">
				<WorkTypeForm
					mode="create"
					onSubmit={handleSubmit}
					isSubmitting={createMutation.isPending}
				/>
			</div>
		</div>
	);
}
