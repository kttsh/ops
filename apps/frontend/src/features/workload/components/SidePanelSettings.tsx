import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { PeriodSelector } from './PeriodSelector'
import { ProfileManager } from './ProfileManager'
import {
  projectsQueryOptions,
  capacityScenariosQueryOptions,
} from '@/features/workload/api/queries'
import { useBulkUpsertColorSettings } from '@/features/workload/api/mutations'

const PROJECT_TYPE_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
]

const CAPACITY_COLORS = [
  '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd',
]

interface SidePanelSettingsProps {
  from: string | undefined
  months: number
  businessUnitCodes: string[]
  onPeriodChange: (from: string | undefined, months: number) => void
  onProjectColorsChange?: (colors: Record<number, string>) => void
}

export function SidePanelSettings({
  from,
  months,
  businessUnitCodes,
  onPeriodChange,
  onProjectColorsChange,
}: SidePanelSettingsProps) {
  const { data: projData } = useQuery(projectsQueryOptions(businessUnitCodes))
  const { data: csData } = useQuery(capacityScenariosQueryOptions())
  const projects = projData?.data ?? []
  const capacityScenarios = csData?.data ?? []

  const colorMutation = useBulkUpsertColorSettings()

  // 期間設定からYYYYMM形式を算出
  const { startYearMonth, endYearMonth } = useMemo(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    const fiscalStartYear = currentMonth >= 4 ? currentYear : currentYear - 1
    const defaultFrom = `${fiscalStartYear}04`

    const start = from ?? defaultFrom
    const startY = parseInt(start.slice(0, 4), 10)
    const startM = parseInt(start.slice(4, 6), 10)
    let endM = startM + months - 1
    let endY = startY
    while (endM > 12) {
      endM -= 12
      endY++
    }
    return {
      startYearMonth: start,
      endYearMonth: `${endY}${String(endM).padStart(2, '0')}`,
    }
  }, [from, months])

  // 案件色設定
  const [projColors, setProjColors] = useState<Record<number, string>>({})
  const [projOrder, setProjOrder] = useState<number[]>([])

  // 初期化
  if (projects.length > 0 && projOrder.length === 0) {
    const ids = projects.map((p) => p.projectId)
    setProjOrder(ids)
    const colors: Record<number, string> = {}
    ids.forEach((id, i) => {
      colors[id] = PROJECT_TYPE_COLORS[i % PROJECT_TYPE_COLORS.length]
    })
    setProjColors(colors)
    onProjectColorsChange?.(colors)
  }

  // キャパシティ表示設定
  const [capVisible, setCapVisible] = useState<Record<number, boolean>>({})
  const [capColors, setCapColors] = useState<Record<number, string>>({})

  if (capacityScenarios.length > 0 && Object.keys(capColors).length === 0) {
    const vis: Record<number, boolean> = {}
    const cols: Record<number, string> = {}
    capacityScenarios.forEach((cs, i) => {
      vis[cs.capacityScenarioId] = true
      cols[cs.capacityScenarioId] = CAPACITY_COLORS[i % CAPACITY_COLORS.length]
    })
    setCapVisible(vis)
    setCapColors(cols)
  }

  const moveProjUp = (index: number) => {
    if (index === 0) return
    setProjOrder((prev) => {
      const next = [...prev]
      const temp = next[index - 1]
      next[index - 1] = next[index]
      next[index] = temp
      return next
    })
  }

  const moveProjDown = (index: number) => {
    setProjOrder((prev) => {
      if (index >= prev.length - 1) return prev
      const next = [...prev]
      const temp = next[index + 1]
      next[index + 1] = next[index]
      next[index] = temp
      return next
    })
  }

  const setProjColor = (projectId: number, color: string) => {
    setProjColors((prev) => {
      const updated = { ...prev, [projectId]: color }
      colorMutation.mutate(
        Object.entries(updated).map(([id, col]) => ({
          targetType: 'project',
          targetCode: id,
          color: col,
        })),
      )
      onProjectColorsChange?.(updated)
      return updated
    })
  }

  return (
    <div className="space-y-6">
      {/* 期間設定 */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">期間設定</h3>
        <PeriodSelector from={from} months={months} onChange={onPeriodChange} />
      </div>

      <Separator />

      {/* 案件表示設定 */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">案件設定</h3>
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {projOrder.map((id, index) => {
            const proj = projects.find((p) => p.projectId === id)
            if (!proj) return null
            return (
              <div
                key={id}
                className="flex items-center gap-3 rounded-lg border border-border p-2"
              >
                <div className="flex gap-1">
                  {PROJECT_TYPE_COLORS.slice(0, 6).map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`h-4 w-4 rounded-sm border-2 ${
                        projColors[id] === color ? 'border-primary' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setProjColor(id, color)}
                    />
                  ))}
                </div>
                <Label className="flex-1 truncate text-sm">{proj.name}</Label>
                <div className="flex gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    disabled={index === 0}
                    onClick={() => moveProjUp(index)}
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    disabled={index === projOrder.length - 1}
                    onClick={() => moveProjDown(index)}
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <Separator />

      {/* キャパシティ表示設定 */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">キャパシティ設定</h3>
        <div className="space-y-2">
          {capacityScenarios.map((cs) => (
            <div
              key={cs.capacityScenarioId}
              className="flex items-center gap-3 rounded-lg border border-border p-2"
            >
              <Switch
                checked={capVisible[cs.capacityScenarioId] ?? true}
                onCheckedChange={(checked) =>
                  setCapVisible((prev) => ({
                    ...prev,
                    [cs.capacityScenarioId]: checked,
                  }))
                }
              />
              <div className="flex gap-1">
                {CAPACITY_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-4 w-4 rounded-full border-2 ${
                      capColors[cs.capacityScenarioId] === color
                        ? 'border-primary'
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() =>
                      setCapColors((prev) => ({
                        ...prev,
                        [cs.capacityScenarioId]: color,
                      }))
                    }
                  />
                ))}
              </div>
              <Label className="flex-1 truncate text-sm">{cs.scenarioName}</Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* プロファイル管理 */}
      <ProfileManager
        chartType="stacked-area"
        startYearMonth={startYearMonth}
        endYearMonth={endYearMonth}
      />
    </div>
  )
}
