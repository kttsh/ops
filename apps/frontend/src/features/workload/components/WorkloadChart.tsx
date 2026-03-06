import { memo, useCallback, useRef } from "react";
import {
	Area,
	CartesianGrid,
	ComposedChart,
	Line,
	ReferenceLine,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { ChartFullscreenDialog } from "@/components/shared/ChartFullscreenDialog";
import type {
	ChartSeriesConfig,
	LegendAction,
	MonthlyDataPoint,
} from "@/features/workload/types";

/** Recharts ComposedChart のマウスイベントハンドラに渡される状態 */
interface ChartMouseState {
	activeLabel?: string | number;
}

interface WorkloadChartProps {
	data: MonthlyDataPoint[];
	seriesConfig: ChartSeriesConfig;
	activeMonth: string | null;
	dispatch: React.Dispatch<LegendAction>;
	isFetching?: boolean;
	fullHeight?: boolean;
}

function WorkloadChartInner({
	data,
	seriesConfig,
	activeMonth,
	dispatch,
	isFetching,
	fullHeight,
}: WorkloadChartProps) {
	const rafRef = useRef<number | null>(null);

	const handleMouseMove = useCallback(
		(state: ChartMouseState) => {
			if (!state?.activeLabel) return;
			// yearMonth を抽出（YYYY/MM → YYYYMM）
			const label = String(state.activeLabel);
			const yearMonth = label.replace("/", "");
			if (rafRef.current !== null) return;
			rafRef.current = requestAnimationFrame(() => {
				dispatch({ type: "HOVER", yearMonth });
				rafRef.current = null;
			});
		},
		[dispatch],
	);

	const handleMouseLeave = useCallback(() => {
		if (rafRef.current !== null) {
			cancelAnimationFrame(rafRef.current);
			rafRef.current = null;
		}
		dispatch({ type: "HOVER_LEAVE" });
	}, [dispatch]);

	const handleClick = useCallback(
		(state: ChartMouseState) => {
			if (!state?.activeLabel) return;
			const yearMonth = String(state.activeLabel).replace("/", "");
			dispatch({ type: "CLICK", yearMonth });
		},
		[dispatch],
	);

	const activeLabel = activeMonth
		? `${activeMonth.slice(0, 4)}/${activeMonth.slice(4, 6)}`
		: undefined;

	if (data.length === 0) return null;

	const chartContent = (
		<ResponsiveContainer width="100%" height="100%">
			<ComposedChart
				data={data}
				onMouseMove={handleMouseMove}
				onMouseLeave={handleMouseLeave}
				onClick={handleClick}
				margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
				accessibilityLayer={false}
				style={{ outline: "none" }}
			>
				<CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
				<XAxis
					dataKey="month"
					tick={{ fontSize: 12 }}
					tickLine={false}
					axisLine={{ stroke: "#d1d5db" }}
				/>
				<YAxis
					tick={{ fontSize: 12 }}
					tickLine={false}
					axisLine={{ stroke: "#d1d5db" }}
					tickFormatter={(value: number) =>
						value >= 1000 ? `${(value / 1000).toFixed(0)}k` : String(value)
					}
				/>
				<Tooltip content={() => null} />

				{/* 間接作業 → 案件タイプ の順でエリア描画 */}
				{seriesConfig.areas.map((area) => (
					<Area
						key={area.dataKey}
						type="monotone"
						dataKey={area.dataKey}
						stackId={area.stackId}
						fill={area.fill}
						stroke="none"
						fillOpacity={1}
						name={area.name}
						isAnimationActive={false}
						animationDuration={0}
						dot={false}
						activeDot={false}
					/>
				))}

				{/* キャパシティライン */}
				{seriesConfig.lines.map((line) => (
					<Line
						key={line.dataKey}
						type="monotone"
						dataKey={line.dataKey}
						stroke={line.stroke}
						strokeDasharray={line.strokeDasharray}
						strokeWidth={2}
						name={line.name}
						isAnimationActive={false}
						animationDuration={0}
						dot={false}
						activeDot={false}
					/>
				))}

				{/* アクティブ月のカーソル線 */}
				{activeLabel && (
					<ReferenceLine
						x={activeLabel}
						stroke="#6b7280"
						strokeDasharray="3 3"
						strokeWidth={1}
					/>
				)}
			</ComposedChart>
		</ResponsiveContainer>
	);

	return (
		<div
			className={
				fullHeight
					? "relative h-full flex-1 w-full"
					: "relative h-[400px] w-full"
			}
			style={{ contain: "content" }}
		>
			<div className="absolute top-1 right-1 z-10">
				<ChartFullscreenDialog title="山積グラフ">
					{chartContent}
				</ChartFullscreenDialog>
			</div>
			{isFetching && (
				<div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
					<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
				</div>
			)}
			{chartContent}
		</div>
	);
}

export const WorkloadChart = memo(WorkloadChartInner);
