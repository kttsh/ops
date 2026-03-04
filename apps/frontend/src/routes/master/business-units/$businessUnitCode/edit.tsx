import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/PageHeader";
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
		<div className="grid grid-cols-1 gap-6">
			<PageHeader
				breadcrumbs={[
					{ label: "ビジネスユニット一覧", href: "/master/business-units" },
					{
						label: bu.name,
						href: "/master/business-units/$businessUnitCode",
						params: { businessUnitCode },
					},
					{ label: "編集" },
				]}
				title="ビジネスユニット 編集"
				description="ビジネスユニット情報を編集します"
			/>

			<div className="rounded-3xl border p-6 hover:shadow-[0_20px_25px_-5px_rgb(0_0_0/0.05)] transition-all duration-200 ease-in-out">
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
