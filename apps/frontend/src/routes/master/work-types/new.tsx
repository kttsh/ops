import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { toast } from "sonner";
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
		<div className="space-y-6">
			<nav className="flex items-center gap-1 text-sm text-muted-foreground">
				<Link
					to="/master/work-types"
					className="hover:text-foreground transition-colors"
				>
					作業種類一覧
				</Link>
				<ChevronRight className="h-4 w-4" />
				<span className="text-foreground font-medium">新規登録</span>
			</nav>

			<div>
				<h2 className="text-2xl font-bold tracking-tight">作業種類 新規登録</h2>
				<p className="text-sm text-muted-foreground mt-1">
					新しい作業種類を登録します
				</p>
			</div>

			<div className="rounded-2xl border shadow-sm p-6">
				<WorkTypeForm
					mode="create"
					onSubmit={handleSubmit}
					isSubmitting={createMutation.isPending}
				/>
			</div>
		</div>
	);
}
