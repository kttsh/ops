import { memo } from 'react'
import { Pin, PinOff, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { LegendMonthData, LegendAction, ChartSeriesConfig } from '@/features/workload/types'

interface LegendPanelProps {
  data: LegendMonthData | undefined
  isPinned: boolean
  expandedTypeCode: string | null
  dispatch: React.Dispatch<LegendAction>
  seriesConfig: ChartSeriesConfig
}

function formatManhour(value: number): string {
  if (value === 0) return '-'
  return value.toLocaleString('ja-JP')
}

function LegendPanelInner({
  data,
  isPinned,
  expandedTypeCode,
  dispatch,
  seriesConfig,
}: LegendPanelProps) {
  if (!data) {
    return (
      <div className="flex h-full w-72 flex-col border-l border-border bg-background p-4">
        <p className="text-sm text-muted-foreground">データなし</p>
      </div>
    )
  }

  const utilizationRate =
    data.totalCapacity > 0
      ? ((data.totalManhour / data.totalCapacity) * 100).toFixed(1)
      : '-'

  // シリーズの色を取得
  const getAreaColor = (type: 'project' | 'indirect', code: string | number) => {
    const key = type === 'project' ? `project_${code}` : `indirect_${code}`
    const area = seriesConfig.areas.find((a) => a.dataKey === key)
    return area?.fill ?? '#6b7280'
  }

  const getLineColor = (scenarioId: number) => {
    const key = `capacity_${scenarioId}`
    const line = seriesConfig.lines.find((l) => l.dataKey === key)
    return line?.stroke ?? '#3b82f6'
  }

  return (
    <div className="flex h-full w-72 flex-col border-l border-border bg-background">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm font-semibold">{data.month}</span>
        {isPinned ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => dispatch({ type: 'UNPIN' })}
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
        {/* 案件タイプセクション */}
        <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">案件タイプ</p>
        <div className="space-y-1">
          {data.projectTypes.map((pt) => (
            <div key={pt.code ?? 'none'}>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded px-1 py-1 text-left text-sm hover:bg-accent disabled:hover:bg-transparent"
                disabled={!isPinned}
                onClick={() =>
                  isPinned &&
                  dispatch({ type: 'TOGGLE_DRILLDOWN', typeCode: pt.code ?? 'none' })
                }
              >
                <span
                  className="inline-block h-3 w-3 rounded-sm"
                  style={{ backgroundColor: getAreaColor('project', pt.code ?? 'none') }}
                />
                <span className="flex-1 truncate">{pt.name ?? '未分類'}</span>
                <span className="tabular-nums text-muted-foreground">
                  {formatManhour(pt.manhour)}
                </span>
                {isPinned &&
                  (expandedTypeCode === (pt.code ?? 'none') ? (
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  ))}
              </button>
              {/* ドリルダウン */}
              {isPinned && expandedTypeCode === (pt.code ?? 'none') && pt.projects && (
                <div className="ml-5 space-y-0.5 border-l border-border pl-2">
                  {pt.projects.map((proj) => (
                    <div
                      key={proj.name}
                      className="flex items-center justify-between text-xs text-muted-foreground"
                    >
                      <span className="truncate">{proj.name}</span>
                      <span className="tabular-nums">{formatManhour(proj.manhour)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <Separator className="my-3" />

        {/* 間接作業セクション */}
        <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">間接作業</p>
        <div className="space-y-1">
          {data.indirectWorks.map((iw) => (
            <div key={iw.caseId} className="flex items-center gap-2 px-1 py-1 text-sm">
              <span
                className="inline-block h-3 w-3 rounded-sm"
                style={{ backgroundColor: getAreaColor('indirect', iw.caseId) }}
              />
              <span className="flex-1 truncate">{iw.caseName}</span>
              <span className="tabular-nums text-muted-foreground">
                {formatManhour(iw.manhour)}
              </span>
            </div>
          ))}
        </div>

        <Separator className="my-3" />

        {/* キャパシティセクション */}
        <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">キャパシティ</p>
        <div className="space-y-1">
          {data.capacities.map((cap) => (
            <div key={cap.scenarioId} className="flex items-center gap-2 px-1 py-1 text-sm">
              <span
                className="inline-block h-3 w-3 rounded-full border-2"
                style={{ borderColor: getLineColor(cap.scenarioId) }}
              />
              <span className="flex-1 truncate">{cap.scenarioName}</span>
              <span className="tabular-nums text-muted-foreground">
                {formatManhour(cap.capacity)}
              </span>
            </div>
          ))}
        </div>

        <Separator className="my-3" />

        {/* サマリー */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>合計工数</span>
            <span className="tabular-nums">{formatManhour(data.totalManhour)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>稼働率</span>
            <span className="tabular-nums">{utilizationRate}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export const LegendPanel = memo(LegendPanelInner)
