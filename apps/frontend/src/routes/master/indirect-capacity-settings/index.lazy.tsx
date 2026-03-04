import { useQuery } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import { Building2, Loader2 } from "lucide-react";
import { useCallback, useMemo } from "react";
import { UnsavedChangesDialog } from "@/components/shared/UnsavedChangesDialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ResultPanel } from "@/features/indirect-case-study/components/ResultPanel";
import { SettingsPanel } from "@/features/indirect-case-study/components/SettingsPanel";
import { useIndirectCaseStudyPage } from "@/features/indirect-case-study/hooks/useIndirectCaseStudyPage";
import { workTypesQueryOptions } from "@/features/work-types/api/queries";
import { businessUnitsQueryOptions } from "@/features/workload/api/queries";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";

export const Route = createLazyFileRoute("/master/indirect-capacity-settings/")(
	{
		component: IndirectCapacitySettingsPage,
	},
);

function IndirectCapacitySettingsPage() {
	const search = Route.useSearch();
	const navigate = Route.useNavigate();

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
			navigate({ search: { bu: code } });
		},
		[navigate],
	);

	const page = useIndirectCaseStudyPage({ businessUnitCode: selectedBu });

	const unsaved = useUnsavedChanges({
		isDirty: page.isDirty,
		onSave: page.saveAll,
	});

	// ケース名取得
	const headcountPlanCaseName = useMemo(
		() =>
			page.headcountCases.find(
				(c) => c.headcountPlanCaseId === page.selectedHeadcountPlanCaseId,
			)?.caseName ?? "",
		[page.headcountCases, page.selectedHeadcountPlanCaseId],
	);

	const scenarioName = useMemo(
		() =>
			page.capacityScenarios.find(
				(s) => s.capacityScenarioId === page.selectedCapacityScenarioId,
			)?.scenarioName ?? "",
		[page.capacityScenarios, page.selectedCapacityScenarioId],
	);

	const indirectWorkCaseName = useMemo(
		() =>
			page.indirectWorkCases.find(
				(c) => c.indirectWorkCaseId === page.selectedIndirectWorkCaseId,
			)?.caseName ?? "",
		[page.indirectWorkCases, page.selectedIndirectWorkCaseId],
	);

	const selectedBuName = useMemo(
		() =>
			businessUnits.find((bu) => bu.businessUnitCode === selectedBu)?.name ??
			"",
		[businessUnits, selectedBu],
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
				<h1 className="text-lg font-semibold">間接作業・キャパシティ設定</h1>
				<div className="flex items-center gap-2">
					<Building2 className="h-4 w-4 text-muted-foreground" />
					<Select value={selectedBu} onValueChange={handleBuChange}>
						<SelectTrigger className="w-[200px] h-8">
							<SelectValue placeholder="BUを選択" />
						</SelectTrigger>
						<SelectContent>
							{businessUnits.map((bu) => (
								<SelectItem
									key={bu.businessUnitCode}
									value={bu.businessUnitCode}
								>
									{bu.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* メインコンテンツ - 2カラムレスポンシブ */}
			<div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-[60fr_40fr] lg:grid-cols-2 gap-4 p-4">
				<div className="overflow-y-auto">
					<SettingsPanel
						businessUnitCode={selectedBu}
						headcountCases={page.headcountCases}
						capacityScenarios={page.capacityScenarios}
						indirectWorkCases={page.indirectWorkCases}
						isLoadingCases={page.isLoadingCases}
						selectedHeadcountPlanCaseId={page.selectedHeadcountPlanCaseId}
						onSelectHeadcountPlanCase={page.setSelectedHeadcountPlanCaseId}
						selectedCapacityScenarioId={page.selectedCapacityScenarioId}
						onSelectCapacityScenario={page.setSelectedCapacityScenarioId}
						selectedIndirectWorkCaseId={page.selectedIndirectWorkCaseId}
						onSelectIndirectWorkCase={page.setSelectedIndirectWorkCaseId}
						settingsFiscalYear={page.settingsFiscalYear}
						onSettingsFiscalYearChange={page.setSettingsFiscalYear}
						onCalculateCapacity={page.calculateCapacity}
						isCalculatingCapacity={page.isCalculatingCapacity}
						canCalculateCapacity={page.canCalculateCapacity}
						onCalculateIndirectWork={page.calculateIndirectWork}
						canCalculateIndirectWork={page.canCalculateIndirectWork}
						onSaveHeadcount={page.saveHeadcountPlans}
						isSavingHeadcount={page.isSavingHeadcount}
						onSaveRatios={page.saveRatios}
						isSavingRatios={page.isSavingRatios}
						onHeadcountDirtyChange={page.setHeadcountDirty}
						onRatioDirtyChange={page.setRatioDirty}
						headcountDirty={page.headcountDirty}
						ratioDirty={page.ratioDirty}
						onHeadcountLocalDataChange={page.setHeadcountLocalData}
						onRatioLocalDataChange={page.setRatioLocalData}
						hpcIncludeDisabled={page.hpcIncludeDisabled}
						onHpcIncludeDisabledChange={page.setHpcIncludeDisabled}
						csIncludeDisabled={page.csIncludeDisabled}
						onCsIncludeDisabledChange={page.setCsIncludeDisabled}
						iwcIncludeDisabled={page.iwcIncludeDisabled}
						onIwcIncludeDisabledChange={page.setIwcIncludeDisabled}
					/>
				</div>
				<div className="overflow-y-auto">
					<ResultPanel
						capacityResult={page.capacityResult}
						indirectWorkResult={page.indirectWorkResult}
						monthlyHeadcountPlans={page.monthlyHeadcountPlans}
						ratios={page.ratios}
						workTypes={workTypes}
						fiscalYear={page.resultFiscalYear}
						onFiscalYearChange={page.setResultFiscalYear}
						headcountPlanCaseName={headcountPlanCaseName}
						scenarioName={scenarioName}
						indirectWorkCaseName={indirectWorkCaseName}
						indirectWorkCaseId={page.selectedIndirectWorkCaseId}
						onSaveIndirectWorkLoads={page.saveIndirectWorkLoads}
						isSavingResults={page.isSavingResults}
						indirectWorkResultDirty={page.indirectWorkResultDirty}
						businessUnitCode={selectedBu}
						businessUnitName={selectedBuName}
					/>
				</div>
			</div>

			{/* 未保存警告ダイアログ */}
			<UnsavedChangesDialog
				open={unsaved.showDialog}
				onCancel={unsaved.handleCancelLeave}
				onConfirmLeave={unsaved.handleConfirmLeave}
				onSaveAndLeave={unsaved.handleSaveAndLeave}
				isSaving={
					page.isSavingResults || page.isSavingHeadcount || page.isSavingRatios
				}
			/>
		</div>
	);
}
