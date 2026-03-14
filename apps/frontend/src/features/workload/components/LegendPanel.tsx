import { Pin, PinOff } from "lucide-react";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type {
	ChartSeriesConfig,
	LegendAction,
	LegendMonthData,
} from "@/features/workload/types";

interface LegendPanelProps {
	data: LegendMonthData | undefined;
	isPinned: boolean;
	dispatch: React.Dispatch<LegendAction>;
	seriesConfig: ChartSeriesConfig;
}

function formatManhour(value: number): string {
	if (value === 0) return "-";
	return Math.round(value).toLocaleString("ja-JP");
}

function LegendPanelInner({
	data,
	isPinned,
	dispatch,
	seriesConfig,
}: LegendPanelProps) {
	if (!data) {
		return (
			<div className="flex h-full min-h-[500px] w-72 flex-col border-l border-border bg-background p-4">
				<p className="text-sm text-muted-foreground">データなし</p>
			</div>
		);
	}

	// シリーズの色を取得
	const getAreaColor = (type: "project" | "indirect", id: string | number) => {
		const key = type === "project" ? `project_${id}` : `indirect_wt_${id}`;
		const area = seriesConfig.areas.find((a) => a.dataKey === key);
		return area?.fill ?? "#6b7280";
	};

	const getLineColor = (
		headcountPlanCaseId: number,
		capacityScenarioId: number,
	) => {
		const key = `capacity_${headcountPlanCaseId}_${capacityScenarioId}`;
		const line = seriesConfig.lines.find((l) => l.dataKey === key);
		return line?.stroke ?? "#3b82f6";
	};

	return (
		<div className="flex h-full min-h-[500px] w-72 flex-col border-l border-border bg-background">
			{/* ヘッダー */}
			<div className="flex items-center justify-between px-4 py-3">
				<span className="text-sm font-semibold">{data.month}</span>
				{isPinned ? (
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7"
						onClick={() => dispatch({ type: "UNPIN" })}
					>
						<Pin className="h-3.5 w-3.5" />
					</Button>
				) : (
					<PinOff className="h-3.5 w-3.5 text-muted-foreground" />
				)}
			</div>

			<Separator />

			{/* コンテンツ */}
			<div className="flex-1 overflow-y-auto px-4 py-3">
				{/* 案件セクション */}
				<p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
					案件
				</p>
				<div className="space-y-1">
					{data.projects.map((proj) => (
						<div
							key={proj.projectId}
							className="flex items-center gap-2 px-1 py-1 text-sm"
						>
							<span
								className="inline-block h-3 w-3 rounded-sm"
								style={{
									backgroundColor: getAreaColor("project", proj.projectId),
								}}
							/>
							<span className="flex-1 truncate">{proj.name}</span>
							<span className="tabular-nums text-muted-foreground">
								{formatManhour(proj.manhour)}
							</span>
						</div>
					))}
				</div>

				<Separator className="my-3" />

				{/* 間接作業セクション */}
				<p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
					間接作業
				</p>
				<div className="space-y-1">
					{data.indirectWorkTypes.map((wt) => (
						<div
							key={wt.workTypeCode}
							className="flex items-center gap-2 px-1 py-1 text-sm"
						>
							<span
								className="inline-block h-3 w-3 rounded-sm"
								style={{
									backgroundColor: getAreaColor("indirect", wt.workTypeCode),
								}}
							/>
							<span className="flex-1 truncate">{wt.workTypeName}</span>
							<span className="tabular-nums text-muted-foreground">
								{formatManhour(wt.manhour)}
							</span>
						</div>
					))}
				</div>

				<Separator className="my-3" />

				{/* キャパシティセクション */}
				<p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
					キャパシティ
				</p>
				<div className="space-y-1">
					{data.capacityLines.map((cl) => (
						<div
							key={`${cl.headcountPlanCaseId}_${cl.capacityScenarioId}`}
							className="flex items-center gap-2 px-1 py-1 text-sm"
						>
							<span
								className="inline-block h-3 w-3 rounded-full border-2"
								style={{
									borderColor: getLineColor(
										cl.headcountPlanCaseId,
										cl.capacityScenarioId,
									),
								}}
							/>
							<span className="flex-1 truncate">{cl.lineName}</span>
							<span className="tabular-nums text-muted-foreground">
								{formatManhour(cl.capacity)}
							</span>
						</div>
					))}
				</div>

				<Separator className="my-3" />

				{/* サマリー */}
				<div className="space-y-1">
					<div className="flex items-center justify-between text-sm font-semibold">
						<span>合計工数</span>
						<span className="tabular-nums">
							{formatManhour(data.totalManhour)}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}

export const LegendPanel = memo(LegendPanelInner);
