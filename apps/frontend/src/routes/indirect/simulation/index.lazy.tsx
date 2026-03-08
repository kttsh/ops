import { useQuery } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import { Calculator, Loader2, Play } from "lucide-react";
import { useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { BusinessUnitSingleSelector } from "@/features/indirect-case-study/components/BusinessUnitSingleSelector";
import { ResultPanel } from "@/features/indirect-case-study/components/ResultPanel";
import { useIndirectSimulation } from "@/features/indirect-case-study/hooks/useIndirectSimulation";
import { workTypesQueryOptions } from "@/features/work-types/api/queries";
import { businessUnitsQueryOptions } from "@/features/workload/api/queries";

export const Route = createLazyFileRoute("/indirect/simulation/")({
	component: IndirectSimulationPage,
});

function IndirectSimulationPage() {
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

	const sim = useIndirectSimulation({ businessUnitCode: selectedBu });

	// ケース名取得
	const headcountPlanCaseName = useMemo(
		() =>
			sim.headcountCases.find(
				(c) => c.headcountPlanCaseId === sim.selectedHeadcountPlanCaseId,
			)?.caseName ?? "",
		[sim.headcountCases, sim.selectedHeadcountPlanCaseId],
	);

	const scenarioName = useMemo(
		() =>
			sim.capacityScenarios.find(
				(s) => s.capacityScenarioId === sim.selectedCapacityScenarioId,
			)?.scenarioName ?? "",
		[sim.capacityScenarios, sim.selectedCapacityScenarioId],
	);

	const indirectWorkCaseName = useMemo(
		() =>
			sim.indirectWorkCases.find(
				(c) => c.indirectWorkCaseId === sim.selectedIndirectWorkCaseId,
			)?.caseName ?? "",
		[sim.indirectWorkCases, sim.selectedIndirectWorkCaseId],
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

	const noBu = !selectedBu;

	return (
		<div className="flex h-full flex-col">
			{/* ヘッダー */}
			<div className="flex items-center border-b border-border px-4 py-2">
				<h1 className="text-lg font-semibold">間接工数計算</h1>
			</div>

			{/* BU選択行 */}
			<div className="border-b border-border px-4 py-3">
				<BusinessUnitSingleSelector
					selectedCode={selectedBu}
					onChange={handleBuChange}
				/>
			</div>

			{/* メインコンテンツ - 上下レイアウト */}
			<div className="flex-1 overflow-y-auto space-y-6 p-6">
				{/* 上パネル: 選択コントロール */}
				<div className="rounded-3xl bg-card border border-border shadow-sm p-6 space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<SelectSection
							label="人員計画ケース"
							disabled={noBu || sim.isLoadingCases}
							value={sim.selectedHeadcountPlanCaseId}
							onValueChange={(v) =>
								sim.setSelectedHeadcountPlanCaseId(v ? Number(v) : null)
							}
							placeholder="ケースを選択"
							items={sim.headcountCases.map((c) => ({
								value: String(c.headcountPlanCaseId),
								label: c.caseName,
							}))}
						/>

						<SelectSection
							label="キャパシティシナリオ"
							disabled={noBu || sim.isLoadingCases}
							value={sim.selectedCapacityScenarioId}
							onValueChange={(v) =>
								sim.setSelectedCapacityScenarioId(v ? Number(v) : null)
							}
							placeholder="シナリオを選択"
							items={sim.capacityScenarios.map((s) => ({
								value: String(s.capacityScenarioId),
								label: s.scenarioName,
							}))}
						/>
					</div>

					<Button
						className="w-full"
						disabled={
							noBu || !sim.canCalculateCapacity || sim.isCalculatingCapacity
						}
						onClick={sim.calculateCapacity}
					>
						{sim.isCalculatingCapacity ? (
							<Loader2 className="h-4 w-4 animate-spin mr-2" />
						) : (
							<Calculator className="h-4 w-4 mr-2" />
						)}
						キャパシティ計算
					</Button>

					<div className="border-t border-border pt-4">
						<SelectSection
							label="間接作業ケース"
							disabled={noBu || !sim.capacityResult || sim.isLoadingCases}
							value={sim.selectedIndirectWorkCaseId}
							onValueChange={(v) =>
								sim.setSelectedIndirectWorkCaseId(v ? Number(v) : null)
							}
							placeholder="ケースを選択"
							items={sim.indirectWorkCases.map((c) => ({
								value: String(c.indirectWorkCaseId),
								label: c.caseName,
							}))}
						/>

						<Button
							className="w-full mt-4"
							disabled={noBu || !sim.canCalculateIndirectWork}
							onClick={sim.calculateIndirectWork}
						>
							<Play className="h-4 w-4 mr-2" />
							間接作業計算
						</Button>
					</div>
				</div>

				{/* 下パネル: 結果表示 */}
				<div className="rounded-3xl bg-card border border-border shadow-sm p-6">
					<ResultPanel
						capacityResult={sim.capacityResult}
						indirectWorkResult={sim.indirectWorkResult}
						monthlyHeadcountPlans={sim.monthlyHeadcountPlans}
						ratios={sim.ratios}
						workTypes={workTypes}
						fiscalYear={sim.resultFiscalYear}
						onFiscalYearChange={sim.setResultFiscalYear}
						headcountPlanCaseName={headcountPlanCaseName}
						scenarioName={scenarioName}
						indirectWorkCaseName={indirectWorkCaseName}
						indirectWorkCaseId={sim.selectedIndirectWorkCaseId}
						onSaveIndirectWorkLoads={sim.saveIndirectWorkLoads}
						isSavingResults={sim.isSavingResults}
						indirectWorkResultDirty={sim.indirectWorkResultDirty}
						businessUnitCode={selectedBu}
						businessUnitName={selectedBuName}
					/>
				</div>
			</div>
		</div>
	);
}

function SelectSection({
	label,
	disabled,
	value,
	onValueChange,
	placeholder,
	items,
}: {
	label: string;
	disabled: boolean;
	value: number | null;
	onValueChange: (value: string) => void;
	placeholder: string;
	items: { value: string; label: string }[];
}) {
	return (
		<div className="space-y-2">
			<p className="text-sm font-medium text-muted-foreground">{label}</p>
			<Select
				disabled={disabled}
				value={value !== null ? String(value) : ""}
				onValueChange={onValueChange}
			>
				<SelectTrigger className="w-full h-9">
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>
				<SelectContent>
					{items.map((item) => (
						<SelectItem key={item.value} value={item.value}>
							{item.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
