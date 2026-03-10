import { useQuery } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import { Loader2, Save } from "lucide-react";
import { useCallback, useMemo } from "react";
import { UnsavedChangesDialog } from "@/components/shared/UnsavedChangesDialog";
import { Button } from "@/components/ui/button";
import { BusinessUnitSingleSelector } from "@/features/indirect-case-study/components/BusinessUnitSingleSelector";
import { IndirectWorkCaseChips } from "@/features/indirect-case-study/components/IndirectWorkCaseChips";
import { MonthlyLoadsMatrix } from "@/features/indirect-case-study/components/MonthlyLoadsMatrix";
import { useMonthlyLoadsPage } from "@/features/indirect-case-study/hooks/useMonthlyLoadsPage";
import { businessUnitsQueryOptions } from "@/features/workload/api/queries";

export const Route = createLazyFileRoute("/indirect/monthly-loads/")({
	component: MonthlyLoadsPage,
});

function MonthlyLoadsPage() {
	const search = Route.useSearch();
	const navigate = Route.useNavigate();

	const { data: buData, isLoading: buLoading } = useQuery(
		businessUnitsQueryOptions(),
	);
	const businessUnits = useMemo(() => buData?.data ?? [], [buData]);

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

	const page = useMonthlyLoadsPage({ businessUnitCode: selectedBu });

	const handleCaseSelect = useCallback(
		(caseId: number) => {
			page.unsaved.guardAction(() => page.setSelectedCaseId(caseId));
		},
		[page],
	);

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
				<h1 className="text-lg font-semibold">月次間接工数</h1>
				<Button
					size="sm"
					disabled={!page.isDirty || page.hasValidationErrors || page.isSaving}
					onClick={page.save}
				>
					{page.isSaving ? (
						<Loader2 className="h-4 w-4 animate-spin mr-1" />
					) : (
						<Save className="h-4 w-4 mr-1" />
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

			{/* メインコンテンツ */}
			<div className="flex-1 overflow-y-auto p-6 space-y-4">
				{/* ケースチップ */}
				<IndirectWorkCaseChips
					cases={page.cases}
					selectedCaseId={page.selectedCaseId}
					onSelect={handleCaseSelect}
					isLoading={page.isLoadingCases}
				/>

				{/* マトリクステーブル */}
				{page.isLoadingLoads ? (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
					</div>
				) : page.selectedCaseId === null ? (
					<div className="flex items-center justify-center py-12 text-muted-foreground">
						ケースを選択してください
					</div>
				) : page.monthlyLoads.length === 0 ? (
					<div className="flex items-center justify-center py-12 text-muted-foreground">
						データがありません
					</div>
				) : (
					<MonthlyLoadsMatrix
						localData={page.localData}
						originalSources={page.originalSources}
						dirtyKeys={page.dirtyKeys}
						fiscalYears={page.fiscalYears}
						onChange={page.handleChange}
						onCalculatedEditAttempt={() =>
							page.hasAcknowledgedCalculatedWarning
						}
						onConfirmCalculatedEdit={() =>
							page.setHasAcknowledgedCalculatedWarning(true)
						}
						validationErrors={page.validationErrors}
					/>
				)}
			</div>

			{/* 未保存警告ダイアログ */}
			<UnsavedChangesDialog
				open={page.unsaved.showDialog}
				onCancel={page.unsaved.handleCancelLeave}
				onConfirmLeave={page.unsaved.handleConfirmLeave}
				onSaveAndLeave={page.unsaved.handleSaveAndLeave}
				isSaving={page.isSaving}
			/>
		</div>
	);
}
