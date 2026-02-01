import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { toast } from "sonner";
import {
	ApiError,
	businessUnitQueryOptions,
	useUpdateBusinessUnit,
} from "@/features/business-units";
import { BusinessUnitForm } from "@/features/business-units/components/BusinessUnitForm";

export const Route = createFileRoute(
	"/master/business-units/$businessUnitCode/edit",
)({
	component: BusinessUnitEditPage,
});

function BusinessUnitEditPage() {
	const { businessUnitCode } = Route.useParams();
	const navigate = Route.useNavigate();

	const { data, isLoading } = useQuery(
		businessUnitQueryOptions(businessUnitCode),
	);
	const updateMutation = useUpdateBusinessUnit(businessUnitCode);

	const handleSubmit = async (values: {
		businessUnitCode: string;
		name: string;
		displayOrder: number;
	}) => {
		try {
			await updateMutation.mutateAsync({
				name: values.name,
				displayOrder: values.displayOrder,
			});
			toast.success("保存しました");
			navigate({
				to: "/master/business-units/$businessUnitCode",
				params: { businessUnitCode },
			});
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.problemDetails.status === 404) {
					toast.error("ビジネスユニットが見つかりません", {
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
			<nav className="flex items-center gap-1 text-sm text-muted-foreground">
				<Link
					to="/master/business-units"
					className="hover:text-foreground transition-colors"
				>
					ビジネスユニット一覧
				</Link>
				<ChevronRight className="h-4 w-4" />
				<Link
					to="/master/business-units/$businessUnitCode"
					params={{ businessUnitCode }}
					className="hover:text-foreground transition-colors"
				>
					{bu.name}
				</Link>
				<ChevronRight className="h-4 w-4" />
				<span className="text-foreground font-medium">編集</span>
			</nav>

			<div>
				<h2 className="text-2xl font-bold tracking-tight">
					ビジネスユニット 編集
				</h2>
				<p className="text-sm text-muted-foreground mt-1">
					ビジネスユニット情報を編集します
				</p>
			</div>

			<div className="rounded-2xl border shadow-sm p-6">
				<BusinessUnitForm
					mode="edit"
					defaultValues={{
						businessUnitCode: bu.businessUnitCode,
						name: bu.name,
						displayOrder: bu.displayOrder,
					}}
					onSubmit={handleSubmit}
					isSubmitting={updateMutation.isPending}
				/>
			</div>
		</div>
	);
}
