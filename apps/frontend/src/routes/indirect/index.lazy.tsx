import { useQuery } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BusinessUnitSingleSelector } from "@/features/indirect-case-study/components/BusinessUnitSingleSelector";
import { CalculationConditionPanel } from "@/features/indirect-case-study/components/CalculationConditionPanel";
import { IndirectOverviewTable } from "@/features/indirect-case-study/components/IndirectOverviewTable";
import { useIndirectSimulation } from "@/features/indirect-case-study/hooks/useIndirectSimulation";
import { workTypesQueryOptions } from "@/features/work-types/api/queries";
import { businessUnitsQueryOptions } from "@/features/workload/api/queries";

export const Route = createLazyFileRoute("/indirect/")({
	component: IndirectPage,
});

function getCurrentFiscalYear(): number {
	const now = new Date();
	return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
}

function IndirectPage() {
	const search = Route.useSearch();
	const navigate = Route.useNavigate();

	const [dialogOpen, setDialogOpen] = useState(false);
	const [fiscalYear, setFiscalYear] = useState(getCurrentFiscalYear());

	const { data: buData, isLoading: buLoading } = useQuery(
		businessUnitsQueryOptions(),
	);
	const { data: wtData } = useQuery(
		workTypesQueryOptions({ includeDisabled: false }),
	);

	const businessUnits = useMemo(() => buData?.data ?? [], [buData]);
	const workTypes = useMemo(() => wtData?.data ?? [], [wtData]);

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
			// BU変更時はBU依存のケースIDをリセット（稼働時間はグローバルのため維持）
			navigate({
				search: {
					bu: code,
					headcountCaseId: 0,
					capacityScenarioId: search.capacityScenarioId,
					indirectWorkCaseId: 0,
				},
			});
		},
		[navigate, search.capacityScenarioId],
	);

	const sim = useIndirectSimulation({
		businessUnitCode: selectedBu,
		selectedHeadcountCaseId: search.headcountCaseId,
		selectedCapacityScenarioId: search.capacityScenarioId,
		selectedIndirectWorkCaseId: search.indirectWorkCaseId,
	});

	// ケースセレクタ変更ハンドラ
	const handleHeadcountCaseChange = useCallback(
		(id: number) => {
			navigate({
				search: (prev) => ({ ...prev, headcountCaseId: id }),
			});
		},
		[navigate],
	);

	const handleCapacityScenarioChange = useCallback(
		(id: number) => {
			navigate({
				search: (prev) => ({ ...prev, capacityScenarioId: id }),
			});
		},
		[navigate],
	);

	const handleIndirectWorkCaseChange = useCallback(
		(id: number) => {
			navigate({
				search: (prev) => ({ ...prev, indirectWorkCaseId: id }),
			});
		},
		[navigate],
	);

	// 再計算確認ダイアログ
	const handleRecalculateClick = useCallback(() => {
		setDialogOpen(true);
	}, []);

	const handleRecalculateConfirm = useCallback(async () => {
		setDialogOpen(false);
		await sim.recalculate();
	}, [sim]);

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
			<div className="flex items-center border-b border-border px-4 py-2">
				<h1 className="text-lg font-semibold">間接工数</h1>
			</div>

			{/* BU選択行 */}
			<div className="border-b border-border px-4 py-3">
				<BusinessUnitSingleSelector
					selectedCode={selectedBu}
					onChange={handleBuChange}
				/>
			</div>

			{/* メインコンテンツ */}
			<div className="flex-1 overflow-y-auto space-y-6 p-6">
				{/* 計算条件パネル */}
				<CalculationConditionPanel
					headcountPlanCases={sim.headcountCases}
					capacityScenarios={sim.capacityScenarios}
					indirectWorkCases={sim.indirectWorkCases}
					selectedHeadcountCaseId={sim.resolvedHeadcountCaseId}
					selectedCapacityScenarioId={sim.resolvedCapacityScenarioId}
					selectedIndirectWorkCaseId={sim.resolvedIndirectWorkCaseId}
					onHeadcountCaseChange={handleHeadcountCaseChange}
					onCapacityScenarioChange={handleCapacityScenarioChange}
					onIndirectWorkCaseChange={handleIndirectWorkCaseChange}
					canRecalculate={sim.canRecalculate}
					isRecalculating={sim.isRecalculating}
					onRecalculate={handleRecalculateClick}
					isLoading={sim.isLoadingData}
				/>

				{/* 統合テーブル */}
				<div className="rounded-xl bg-card border border-border shadow-sm p-6">
					{sim.isLoadingData ? (
						<div className="flex items-center justify-center py-12">
							<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
						</div>
					) : (
						<IndirectOverviewTable
							monthlyHeadcountPlans={sim.monthlyHeadcountPlans}
							monthlyCapacities={sim.monthlyCapacities}
							monthlyIndirectWorkLoads={sim.monthlyIndirectWorkLoads}
							ratios={sim.ratios}
							workTypes={workTypes}
							availableFiscalYears={sim.availableFiscalYears}
							fiscalYear={fiscalYear}
							onFiscalYearChange={setFiscalYear}
							lastCalculatedAt={sim.lastCalculatedAt}
							hasPrimaryCase={sim.canRecalculate}
						/>
					)}
				</div>
			</div>

			{/* 再計算確認ダイアログ */}
			<AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>再計算の確認</AlertDialogTitle>
						<AlertDialogDescription>
							現在の間接工数データを再計算した値で上書きします。この操作は元に戻せません。
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>キャンセル</AlertDialogCancel>
						<AlertDialogAction onClick={handleRecalculateConfirm}>
							確認
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
