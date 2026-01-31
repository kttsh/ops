import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { PeriodSelector } from './PeriodSelector'
import { ProfileManager } from './ProfileManager'
import {
  projectTypesQueryOptions,
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
  onPeriodChange: (from: string | undefined, months: number) => void
}

export function SidePanelSettings({
  from,
  months,
  onPeriodChange,
}: SidePanelSettingsProps) {
  const { data: ptData } = useQuery(projectTypesQueryOptions())
  const { data: csData } = useQuery(capacityScenariosQueryOptions())
  const projectTypes = ptData?.data ?? []
  const capacityScenarios = csData?.data ?? []

  const colorMutation = useBulkUpsertColorSettings()

  // 案件タイプ色設定
  const [ptColors, setPtColors] = useState<Record<string, string>>({})
  const [ptOrder, setPtOrder] = useState<string[]>([])

  // 初期化
  if (projectTypes.length > 0 && ptOrder.length === 0) {
    const codes = projectTypes.map((pt) => pt.projectTypeCode)
    setPtOrder(codes)
    const colors: Record<string, string> = {}
    codes.forEach((code, i) => {
      colors[code] = PROJECT_TYPE_COLORS[i % PROJECT_TYPE_COLORS.length]
    })
    setPtColors(colors)
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

  const movePtUp = (index: number) => {
    if (index === 0) return
    setPtOrder((prev) => {
      const next = [...prev]
      const temp = next[index - 1]
      next[index - 1] = next[index]
      next[index] = temp
      return next
    })
  }

  const movePtDown = (index: number) => {
    setPtOrder((prev) => {
      if (index >= prev.length - 1) return prev
      const next = [...prev]
      const temp = next[index + 1]
      next[index + 1] = next[index]
      next[index] = temp
      return next
    })
  }

  const setPtColor = (code: string, color: string) => {
    setPtColors((prev) => {
      const updated = { ...prev, [code]: color }
      colorMutation.mutate(
        Object.entries(updated).map(([c, col]) => ({
          targetType: 'project_type',
          targetCode: c,
          color: col,
        })),
      )
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

      {/* 案件タイプ表示設定 */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">案件タイプ設定</h3>
        <div className="space-y-2">
          {ptOrder.map((code, index) => {
            const pt = projectTypes.find((p) => p.projectTypeCode === code)
            if (!pt) return null
            return (
              <div
                key={code}
                className="flex items-center gap-3 rounded-lg border border-border p-2"
              >
                <div className="flex gap-1">
                  {PROJECT_TYPE_COLORS.slice(0, 6).map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`h-4 w-4 rounded-sm border-2 ${
                        ptColors[code] === color ? 'border-primary' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setPtColor(code, color)}
                    />
                  ))}
                </div>
                <Label className="flex-1 truncate text-sm">{pt.name}</Label>
                <div className="flex gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    disabled={index === 0}
                    onClick={() => movePtUp(index)}
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    disabled={index === ptOrder.length - 1}
                    onClick={() => movePtDown(index)}
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
      <ProfileManager />
    </div>
  )
}
