import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
import type { CreateStandardEffortMasterInput } from "@/features/standard-effort-masters";
import {
	ApiError,
	useCreateStandardEffortMaster,
} from "@/features/standard-effort-masters";
import { StandardEffortMasterForm } from "@/features/standard-effort-masters/components/StandardEffortMasterForm";

export const Route = createFileRoute("/master/standard-effort-masters/new")({
	component: StandardEffortMasterNewPage,
});

function StandardEffortMasterNewPage() {
	const navigate = Route.useNavigate();
	const createMutation = useCreateStandardEffortMaster();

	const handleSubmit = async (values: unknown) => {
		try {
			await createMutation.mutateAsync(
				values as CreateStandardEffortMasterInput,
			);
			toast.success("保存しました");
			navigate({ to: "/master/standard-effort-masters" });
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.problemDetails.status === 409) {
					toast.error("同一パターン名が既に存在します", {
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
					{
						label: "標準工数パターン一覧",
						href: "/master/standard-effort-masters",
					},
					{ label: "新規登録" },
				]}
				title="標準工数パターン 新規登録"
				description="新しい標準工数パターンを登録します"
			/>

			<div className="rounded-3xl border p-6">
				<StandardEffortMasterForm
					mode="create"
					onSubmit={handleSubmit}
					isSubmitting={createMutation.isPending}
				/>
			</div>
		</div>
	);
}
