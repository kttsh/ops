import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

interface WorkloadChartProps {
  data: Array<{ yearMonth: string; manhour: number }>
}

const numberFormatter = new Intl.NumberFormat('ja-JP')

function formatYearMonth(ym: string): string {
  return `${ym.slice(0, 4)}/${ym.slice(4, 6)}`
}

export function WorkloadChart({ data }: WorkloadChartProps) {
  const chartData = useMemo(
    () =>
      data.map((d) => ({
        label: formatYearMonth(d.yearMonth),
        manhour: d.manhour,
      })),
    [data],
  )

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border shadow-sm p-6">
        <p className="text-sm text-muted-foreground text-center py-8">
          月次工数データがありません
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border shadow-sm p-6">
      <ResponsiveContainer width="100%" height={256}>
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="manhourGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis
            tickFormatter={(value: number) => numberFormatter.format(value)}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(value) => [
              `${numberFormatter.format(value as number)} 工数`,
              '',
            ]}
            labelFormatter={(label) => `年月 ${String(label)}`}
          />
          <Area
            type="monotone"
            dataKey="manhour"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#manhourGradient)"
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
