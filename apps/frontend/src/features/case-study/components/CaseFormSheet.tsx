import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import type { CreateProjectCaseInput } from "@/features/case-study";
import {
	ApiError,
	projectCaseQueryOptions,
	useCreateProjectCase,
	useUpdateProjectCase,
} from "@/features/case-study";
import type { Project } from "@/features/projects";
import { CaseForm } from "./CaseForm";

interface CaseFormSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	mode: "create" | "edit";
	projectId: number;
	project: Project;
	editCaseId: number | null;
	onSuccess: () => void;
}

export function CaseFormSheet({
	open,
	onOpenChange,
	mode,
	projectId,
	project,
	editCaseId,
	onSuccess,
}: CaseFormSheetProps) {
	const { data: caseData, isLoading } = useQuery({
		...projectCaseQueryOptions(projectId, editCaseId ?? 0),
		enabled: open && mode === "edit" && editCaseId != null,
	});

	const createMutation = useCreateProjectCase();
	const updateMutation = useUpdateProjectCase();

	const handleSubmit = async (values: CreateProjectCaseInput) => {
		try {
			if (mode === "create") {
				await createMutation.mutateAsync({ projectId, input: values });
				toast.success("ケースを作成しました");
			} else {
				await updateMutation.mutateAsync({
					projectId,
					projectCaseId: editCaseId!,
					input: values,
				});
				toast.success("ケースを更新しました");
			}
			onSuccess();
			onOpenChange(false);
		} catch (err) {
			if (err instanceof ApiError) {
				if (err.problemDetails.status === 409) {
					toast.error("同一名称のケースが既に存在します", {
						duration: Infinity,
					});
				} else if (err.problemDetails.status === 422) {
					toast.error("入力内容にエラーがあります", { duration: Infinity });
				} else if (err.problemDetails.status === 404) {
					toast.error("ケースが見つかりません", { duration: Infinity });
				} else {
					toast.error(
						mode === "create"
							? "ケースの作成に失敗しました"
							: "ケースの更新に失敗しました",
						{ duration: Infinity },
					);
				}
			}
		}
	};

	const handleCancel = () => onOpenChange(false);

	const isSubmitting = createMutation.isPending || updateMutation.isPending;

	const defaultValues =
		mode === "create"
			? {
					startYearMonth: project.startYearMonth,
					durationMonths: project.durationMonths,
					totalManhour: project.totalManhour as number | null,
				}
			: caseData
				? {
						caseName: caseData.data.caseName,
						calculationType: caseData.data.calculationType,
						standardEffortId: caseData.data.standardEffortId,
						description: caseData.data.description,
						isPrimary: caseData.data.isPrimary,
						startYearMonth: caseData.data.startYearMonth,
						durationMonths: caseData.data.durationMonths,
						totalManhour: caseData.data.totalManhour,
					}
				: undefined;

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
				<SheetHeader>
					<SheetTitle>
						{mode === "create" ? "新規ケース作成" : "ケース編集"}
					</SheetTitle>
					<SheetDescription>
						{mode === "create"
							? "新しいケーススタディを作成します"
							: "ケーススタディの内容を編集します"}
					</SheetDescription>
				</SheetHeader>

				<div className="mt-6">
					{mode === "edit" && isLoading && (
						<div className="flex items-center justify-center py-16">
							<p className="text-sm text-muted-foreground">読み込み中...</p>
						</div>
					)}

					{mode === "edit" && !isLoading && !caseData && editCaseId != null && (
						<div className="flex flex-col items-center justify-center py-16 space-y-4">
							<p className="text-lg font-medium">ケースが見つかりません</p>
						</div>
					)}

					{(mode === "create" || (mode === "edit" && caseData)) && (
						<CaseForm
							mode={mode}
							defaultValues={defaultValues}
							onSubmit={handleSubmit}
							isSubmitting={isSubmitting}
							onCancel={handleCancel}
						/>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}
