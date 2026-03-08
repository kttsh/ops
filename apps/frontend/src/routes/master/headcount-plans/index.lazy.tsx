import { useQuery } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import { Loader2, Save } from "lucide-react";
import { useCallback, useMemo } from "react";
import { UnsavedChangesDialog } from "@/components/shared/UnsavedChangesDialog";
import { Button } from "@/components/ui/button";
import {
	BusinessUnitSingleSelector,
	HeadcountPlanCaseList,
	MonthlyHeadcountGrid,
} from "@/features/indirect-case-study";
import { useHeadcountPlansPage } from "@/features/indirect-case-study/hooks/useHeadcountPlansPage";
import { businessUnitsQueryOptions } from "@/features/workload/api/queries";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";

export const Route = createLazyFileRoute("/master/headcount-plans/")({
	component: HeadcountPlansPage,
});

function HeadcountPlansPage() {
	const search = Route.useSearch();
	const navigate = Route.useNavigate();

	const { data: buData, isLoading: buLoading } = useQuery(
		businessUnitsQueryOptions(),
	);
	const businessUnits = useMemo(() => buData?.data ?? [], [buData]);

	// BU選択: URLパラメータ or 先頭BU
	const selectedBu = useMemo(() => {
		if (
			search.bu &&
			businessUnits.some((bu) => bu.businessUnitCode === search.bu)
		) {
			return search.bu;
		}
		return businessUnits[0]?.businessUnitCode ?? "";
	}, [search.bu, businessUnits]);

	const handleBuChange = useCallback(
		(code: string) => {
			navigate({ search: { bu: code } });
		},
		[navigate],
	);

	const page = useHeadcountPlansPage({ businessUnitCode: selectedBu });

	const unsaved = useUnsavedChanges({
		isDirty: page.isDirty,
		onSave: page.saveHeadcountPlans,
	});

	if (buLoading) {
		return (
			<div className="flex h-full items-center justify-center">
				<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col">
			{/* ヘッダー */}
			<div className="flex items-center justify-between border-b border-border px-4 py-2">
				<h1 className="text-lg font-semibold">人員計画ケース</h1>
				<Button
					size="sm"
					onClick={page.saveHeadcountPlans}
					disabled={!page.isDirty || page.isSaving}
				>
					{page.isSaving ? (
						<Loader2 className="mr-1 h-4 w-4 animate-spin" />
					) : (
						<Save className="mr-1 h-4 w-4" />
					)}
					保存
				</Button>
			</div>

			{/* BU選択行 */}
			<div className="border-b border-border px-4 py-3">
				<BusinessUnitSingleSelector
					selectedCode={selectedBu}
					onChange={handleBuChange}
				/>
			</div>

			{/* メインコンテンツ - 2カラムレイアウト */}
			<div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-4 p-4">
				{/* 左パネル: ケース一覧 */}
				<div className="overflow-y-auto rounded-xl bg-card border border-border shadow-sm p-4">
					<HeadcountPlanCaseList
						items={page.cases}
						selectedId={page.selectedCaseId}
						onSelect={page.setSelectedCaseId}
						businessUnitCode={selectedBu}
						isLoading={page.isLoadingCases}
						includeDisabled={page.includeDisabled}
						onIncludeDisabledChange={page.setIncludeDisabled}
					/>
				</div>

				{/* 右パネル: 月別入力グリッド */}
				<div className="overflow-y-auto rounded-xl bg-card border border-border shadow-sm p-4">
					{page.selectedCaseId ? (
						<MonthlyHeadcountGrid
							headcountPlanCaseId={page.selectedCaseId}
							businessUnitCode={selectedBu}
							fiscalYear={page.fiscalYear}
							onFiscalYearChange={page.setFiscalYear}
							onDirtyChange={page.setHeadcountDirty}
							onLocalDataChange={page.setHeadcountLocalData}
						/>
					) : (
						<div className="flex h-full items-center justify-center text-muted-foreground">
							左のリストからケースを選択してください
						</div>
					)}
				</div>
			</div>

			{/* 未保存警告ダイアログ */}
			<UnsavedChangesDialog
				open={unsaved.showDialog}
				onCancel={unsaved.handleCancelLeave}
				onConfirmLeave={unsaved.handleConfirmLeave}
				onSaveAndLeave={unsaved.handleSaveAndLeave}
				isSaving={page.isSaving}
			/>
		</div>
	);
}
