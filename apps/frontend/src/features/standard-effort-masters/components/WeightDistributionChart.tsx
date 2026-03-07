import {
	Area,
	AreaChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

interface WeightDistributionChartProps {
	weights: Array<{ progressRate: number; weight: number }>;
}

export function WeightDistributionChart({
	weights,
}: WeightDistributionChartProps) {
	const chartData = weights.map((w) => ({
		label: `${w.progressRate}%`,
		weight: w.weight,
	}));

	return (
		<div className="rounded-3xl border bg-white p-6">
			<div className="h-[256px]">
				<ResponsiveContainer width="100%" height="100%">
					<AreaChart
						data={chartData}
						margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
					>
						<defs>
							<linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
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
						<YAxis tick={{ fontSize: 12 }} />
						<Tooltip
							formatter={(value) => [`${String(value)}`, "重み"]}
							labelFormatter={(label) => `進捗率: ${String(label)}`}
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
							dataKey="weight"
							stroke="var(--color-primary)"
							strokeWidth={2}
							fill="url(#weightGradient)"
							activeDot={{ r: 4 }}
						/>
					</AreaChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}
