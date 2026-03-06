import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import { ApiError, useCreateBusinessUnit } from "@/features/business-units";
import { BusinessUnitForm } from "@/features/business-units/components/BusinessUnitForm";

export const Route = createFileRoute("/master/business-units/new")({
	component: BusinessUnitNewPage,
});

function BusinessUnitNewPage() {
	const navigate = Route.useNavigate();
	const createMutation = useCreateBusinessUnit();

	const handleSubmit = async (values: {
		businessUnitCode: string;
		name: string;
		displayOrder: number;
	}) => {
		try {
			await createMutation.mutateAsync(values);
			toast.success("保存しました");
			navigate({ to: "/master/business-units" });
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.problemDetails.status === 409) {
					toast.error("同一コードのビジネスユニットが既に存在します", {
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
					{ label: "ビジネスユニット一覧", href: "/master/business-units" },
					{ label: "新規登録" },
				]}
				title="ビジネスユニット 新規登録"
				description="新しいビジネスユニットを登録します"
			/>

			<div className="rounded-3xl border p-6">
				<BusinessUnitForm
					mode="create"
					onSubmit={handleSubmit}
					isSubmitting={createMutation.isPending}
				/>
			</div>
		</div>
	);
}
