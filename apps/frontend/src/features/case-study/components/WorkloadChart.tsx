import { useMemo } from "react";
import {
	Area,
	AreaChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { ChartFullscreenDialog } from "@/components/shared/ChartFullscreenDialog";

interface WorkloadChartProps {
	data: Array<{ yearMonth: string; manhour: number }>;
}

const numberFormatter = new Intl.NumberFormat("ja-JP");

function formatYearMonth(ym: string): string {
	return `${ym.slice(0, 4)}/${ym.slice(4, 6)}`;
}

export function WorkloadChart({ data }: WorkloadChartProps) {
	const chartData = useMemo(
		() =>
			data.map((d) => ({
				label: formatYearMonth(d.yearMonth),
				manhour: d.manhour,
			})),
		[data],
	);

	if (data.length === 0) {
		return (
			<div className="rounded-3xl border p-6 hover:shadow-[0_20px_25px_-5px_rgb(0_0_0/0.05)] transition-all duration-200 ease-in-out">
				<p className="text-sm text-muted-foreground text-center py-8">
					月次工数データがありません
				</p>
			</div>
		);
	}

	const chartContent = (
		<ResponsiveContainer width="100%" height="100%">
			<AreaChart
				data={chartData}
				margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
			>
				<defs>
					<linearGradient id="manhourGradient" x1="0" y1="0" x2="0" y2="1">
						<stop
							offset="0%"
							stopColor="var(--color-primary)"
							stopOpacity={0.3}
						/>
						<stop
							offset="100%"
							stopColor="var(--color-primary)"
							stopOpacity={0.05}
						/>
					</linearGradient>
				</defs>
				<CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
				<XAxis dataKey="label" tick={{ fontSize: 12 }} />
				<YAxis
					tickFormatter={(value: number) => numberFormatter.format(value)}
					tick={{ fontSize: 12 }}
				/>
				<Tooltip
					formatter={(value) => [
						`${numberFormatter.format(value as number)} 工数`,
						"",
					]}
					labelFormatter={(label) => `年月 ${String(label)}`}
					contentStyle={{
						backdropFilter: "blur(8px)",
						WebkitBackdropFilter: "blur(8px)",
						borderRadius: "12px",
						border: "1px solid #E2E8F0",
						boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
					}}
				/>
				<Area
					type="monotone"
					dataKey="manhour"
					stroke="var(--color-primary)"
					strokeWidth={2}
					fill="url(#manhourGradient)"
					activeDot={{ r: 4 }}
				/>
			</AreaChart>
		</ResponsiveContainer>
	);

	return (
		<div className="rounded-3xl border p-6 hover:shadow-[0_20px_25px_-5px_rgb(0_0_0/0.05)] transition-all duration-200 ease-in-out">
			<div className="flex justify-end mb-2">
				<ChartFullscreenDialog title="月次工数グラフ">
					{chartContent}
				</ChartFullscreenDialog>
			</div>
			<div className="h-[256px]">{chartContent}</div>
		</div>
	);
}
