import { Link } from "@tanstack/react-router";
import { ArrowRight, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type {
	CapacityScenario,
	HeadcountPlanCase,
	IndirectWorkCase,
} from "@/features/indirect-case-study/types";
import { CaseSelect } from "./CaseSelect";

interface CalculationConditionPanelProps {
	/** 人員計画ケース一覧 */
	headcountPlanCases: HeadcountPlanCase[];
	/** 稼働時間シナリオ一覧 */
	capacityScenarios: CapacityScenario[];
	/** 間接作業ケース一覧 */
	indirectWorkCases: IndirectWorkCase[];
	/** 選択中の人員計画ケースID */
	selectedHeadcountCaseId: number;
	/** 選択中の稼働時間シナリオID */
	selectedCapacityScenarioId: number;
	/** 選択中の間接作業ケースID */
	selectedIndirectWorkCaseId: number;
	/** 人員計画ケース変更コールバック */
	onHeadcountCaseChange: (id: number) => void;
	/** 稼働時間シナリオ変更コールバック */
	onCapacityScenarioChange: (id: number) => void;
	/** 間接作業ケース変更コールバック */
	onIndirectWorkCaseChange: (id: number) => void;
	/** 再計算可能フラグ */
	canRecalculate: boolean;
	/** 再計算中フラグ */
	isRecalculating: boolean;
	/** 再計算実行コールバック */
	onRecalculate: () => void;
	/** データローディング中フラグ */
	isLoading?: boolean;
}

export function CalculationConditionPanel({
	headcountPlanCases,
	capacityScenarios,
	indirectWorkCases,
	selectedHeadcountCaseId,
	selectedCapacityScenarioId,
	selectedIndirectWorkCaseId,
	onHeadcountCaseChange,
	onCapacityScenarioChange,
	onIndirectWorkCaseChange,
	canRecalculate,
	isRecalculating,
	onRecalculate,
	isLoading = false,
}: CalculationConditionPanelProps) {
	return (
		<div className="rounded-xl border border-border bg-card p-4 space-y-4">
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				{/* 人員計画ケース */}
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<p className="text-xs font-medium text-muted-foreground">
							人員計画
						</p>
						<Link
							to="/master/headcount-plans"
							className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
						>
							<ArrowRight className="h-3.5 w-3.5" />
						</Link>
					</div>
					<CaseSelect
						items={headcountPlanCases}
						selectedId={selectedHeadcountCaseId}
						onSelect={onHeadcountCaseChange}
						getId={(c) => c.headcountPlanCaseId}
						getLabel={(c) => c.caseName}
						getIsPrimary={(c) => c.isPrimary}
						emptyLabel="人員計画ケースが未登録です"
						isLoading={isLoading}
						disabled={isRecalculating}
					/>
				</div>

				{/* 稼働時間シナリオ */}
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<p className="text-xs font-medium text-muted-foreground">
							稼働時間
						</p>
						<Link
							to="/master/capacity-scenarios"
							className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
						>
							<ArrowRight className="h-3.5 w-3.5" />
						</Link>
					</div>
					<CaseSelect
						items={capacityScenarios}
						selectedId={selectedCapacityScenarioId}
						onSelect={onCapacityScenarioChange}
						getId={(s) => s.capacityScenarioId}
						getLabel={(s) => s.scenarioName}
						getIsPrimary={(s) => s.isPrimary}
						emptyLabel="稼働時間シナリオが未登録です"
						isLoading={isLoading}
						disabled={isRecalculating}
					/>
				</div>

				{/* 間接作業ケース */}
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<p className="text-xs font-medium text-muted-foreground">
							間接作業
						</p>
						<Link
							to="/master/indirect-work-cases"
							className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
						>
							<ArrowRight className="h-3.5 w-3.5" />
						</Link>
					</div>
					<CaseSelect
						items={indirectWorkCases}
						selectedId={selectedIndirectWorkCaseId}
						onSelect={onIndirectWorkCaseChange}
						getId={(c) => c.indirectWorkCaseId}
						getLabel={(c) => c.caseName}
						getIsPrimary={(c) => c.isPrimary}
						emptyLabel="間接作業ケースが未登録です"
						isLoading={isLoading}
						disabled={isRecalculating}
					/>
				</div>
			</div>
			<Button
				className="w-full"
				disabled={!canRecalculate || isRecalculating}
				onClick={onRecalculate}
			>
				{isRecalculating ? (
					<Loader2 className="h-4 w-4 animate-spin mr-2" />
				) : (
					<RefreshCw className="h-4 w-4 mr-2" />
				)}
				再計算
			</Button>
		</div>
	);
}
