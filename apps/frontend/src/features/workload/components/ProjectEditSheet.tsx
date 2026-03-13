import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import {
	ApiError,
	projectKeys,
	projectQueryOptions,
	useUpdateProject,
} from "@/features/projects";
import { ProjectForm } from "@/features/projects/components/ProjectForm";
import { workloadKeys } from "@/features/workload/api/queries";

interface ProjectEditSheetProps {
	projectId: number | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function ProjectEditSheet({
	projectId,
	open,
	onOpenChange,
}: ProjectEditSheetProps) {
	const queryClient = useQueryClient();
	const { data, isLoading } = useQuery({
		...projectQueryOptions(projectId ?? 0),
		enabled: projectId != null && open,
	});
	const updateMutation = useUpdateProject(projectId ?? 0);

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
			// workload 関連のキャッシュも無効化
			queryClient.invalidateQueries({ queryKey: workloadKeys.all });
			queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
			toast.success("保存しました");
			onOpenChange(false);
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

	const project = data?.data;

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
				<SheetHeader>
					<SheetTitle>案件 編集</SheetTitle>
					<SheetDescription>案件情報を編集します</SheetDescription>
				</SheetHeader>

				<div className="mt-6">
					{isLoading && (
						<div className="flex items-center justify-center py-16">
							<p className="text-sm text-muted-foreground">読み込み中...</p>
						</div>
					)}

					{!isLoading && !project && projectId != null && (
						<div className="flex flex-col items-center justify-center py-16 space-y-4">
							<p className="text-lg font-medium">案件が見つかりません</p>
						</div>
					)}

					{project && (
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
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}
