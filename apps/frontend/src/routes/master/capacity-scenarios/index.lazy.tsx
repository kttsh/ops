import { createLazyFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import {
	CapacityScenarioList,
	MonthlyCapacityTable,
} from "@/features/indirect-case-study";
import { useCapacityScenariosPage } from "@/features/indirect-case-study/hooks/useCapacityScenariosPage";

export const Route = createLazyFileRoute("/master/capacity-scenarios/")({
	component: CapacityScenariosPage,
});

function getCurrentFiscalYear(): number {
	const now = new Date();
	return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
}

function CapacityScenariosPage() {
	const page = useCapacityScenariosPage();
	const [fiscalYear] = useState(getCurrentFiscalYear());

	if (page.isLoadingScenarios) {
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
				<h1 className="text-lg font-semibold">キャパシティシナリオ</h1>
			</div>

			{/* メインコンテンツ - 2カラムレイアウト */}
			<div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-4 p-4">
				{/* 左パネル: シナリオ一覧 */}
				<div className="overflow-y-auto rounded-xl bg-card border border-border shadow-sm p-4">
					<CapacityScenarioList
						items={page.scenarios}
						selectedId={page.selectedScenarioId}
						onSelect={page.setSelectedScenarioId}
						isLoading={page.isLoadingScenarios}
						includeDisabled={page.includeDisabled}
						onIncludeDisabledChange={page.setIncludeDisabled}
					/>
				</div>

				{/* 右パネル: 月別キャパシティテーブル */}
				<div className="overflow-y-auto rounded-xl bg-card border border-border shadow-sm p-4">
					{page.selectedScenarioId ? (
						<MonthlyCapacityTable
							capacities={page.monthlyCapacities}
							isLoading={page.isLoadingCapacities}
							fiscalYear={fiscalYear}
						/>
					) : (
						<div className="flex h-full items-center justify-center text-muted-foreground">
							左のリストからシナリオを選択してください
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
