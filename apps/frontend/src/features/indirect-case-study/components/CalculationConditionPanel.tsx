import { Link } from "@tanstack/react-router";
import { ArrowRight, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CalculationConditionPanelProps {
	headcountPlanCaseName: string | null;
	capacityScenarioName: string | null;
	indirectWorkCaseName: string | null;
	canRecalculate: boolean;
	isRecalculating: boolean;
	onRecalculate: () => void;
}

const CONDITIONS = [
	{
		label: "人員計画",
		nameKey: "headcountPlanCaseName" as const,
		masterPath: "/master/headcount-plans",
	},
	{
		label: "稼働時間",
		nameKey: "capacityScenarioName" as const,
		masterPath: "/master/capacity-scenarios",
	},
	{
		label: "間接作業",
		nameKey: "indirectWorkCaseName" as const,
		masterPath: "/master/indirect-work-cases",
	},
];

export function CalculationConditionPanel({
	headcountPlanCaseName,
	capacityScenarioName,
	indirectWorkCaseName,
	canRecalculate,
	isRecalculating,
	onRecalculate,
}: CalculationConditionPanelProps) {
	const names = {
		headcountPlanCaseName,
		capacityScenarioName,
		indirectWorkCaseName,
	};

	return (
		<div className="rounded-xl border border-border bg-card p-4 space-y-4">
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				{CONDITIONS.map((cond) => {
					const name = names[cond.nameKey];
					const isUnset = name === null;
					return (
						<div key={cond.nameKey} className="space-y-1">
							<p className="text-xs font-medium text-muted-foreground">
								{cond.label}
							</p>
							<div className="flex items-center gap-2">
								<span
									className={cn(
										"text-sm font-medium truncate",
										isUnset && "text-amber-600",
									)}
								>
									{name ?? "未設定"}
								</span>
								<Link
									to={cond.masterPath}
									className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
								>
									<ArrowRight className="h-3.5 w-3.5" />
								</Link>
							</div>
						</div>
					);
				})}
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
