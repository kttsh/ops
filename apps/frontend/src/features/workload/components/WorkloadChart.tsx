import { memo, useCallback, useRef } from 'react'
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import type {
  MonthlyDataPoint,
  ChartSeriesConfig,
  LegendAction,
} from '@/features/workload/types'

interface WorkloadChartProps {
  data: MonthlyDataPoint[]
  seriesConfig: ChartSeriesConfig
  activeMonth: string | null
  dispatch: React.Dispatch<LegendAction>
}

function WorkloadChartInner({
  data,
  seriesConfig,
  activeMonth,
  dispatch,
}: WorkloadChartProps) {
  const rafRef = useRef<number | null>(null)

  const handleMouseMove = useCallback(
    (state: { activeLabel?: string }) => {
      if (!state?.activeLabel) return
      // yearMonth を抽出（YYYY/MM → YYYYMM）
      const label = state.activeLabel
      const yearMonth = label.replace('/', '')
      if (rafRef.current !== null) return
      rafRef.current = requestAnimationFrame(() => {
        dispatch({ type: 'HOVER', yearMonth })
        rafRef.current = null
      })
    },
    [dispatch],
  )

  const handleMouseLeave = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    dispatch({ type: 'HOVER_LEAVE' })
  }, [dispatch])

  const handleClick = useCallback(
    (state: { activeLabel?: string } | null) => {
      if (!state?.activeLabel) return
      const yearMonth = state.activeLabel.replace('/', '')
      dispatch({ type: 'CLICK', yearMonth })
    },
    [dispatch],
  )

  const activeLabel = activeMonth
    ? `${activeMonth.slice(0, 4)}/${activeMonth.slice(4, 6)}`
    : undefined

  if (data.length === 0) return null

  return (
    <div className="h-[400px] w-full" style={{ contain: 'content' }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#d1d5db' }}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#d1d5db' }}
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
              stroke={area.stroke}
              fillOpacity={area.fillOpacity}
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
    </div>
  )
}

export const WorkloadChart = memo(WorkloadChartInner)
