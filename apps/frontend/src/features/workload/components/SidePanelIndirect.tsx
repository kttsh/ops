import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowUp, ArrowDown, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { indirectWorkCasesQueryOptions } from '@/features/workload/api/queries'
import {
  useBulkUpsertColorSettings,
  useBulkUpsertStackOrderSettings,
} from '@/features/workload/api/mutations'

const GREY_PALETTE = [
  '#6b7280', '#9ca3af', '#4b5563', '#d1d5db',
  '#374151', '#a3a3a3', '#737373', '#525252',
]

interface IndirectSettingsItem {
  caseId: number
  caseName: string
  isVisible: boolean
  color: string
  displayOrder: number
}

export function SidePanelIndirect() {
  const { data: casesData } = useQuery(indirectWorkCasesQueryOptions())
  const cases = casesData?.data ?? []

  const [items, setItems] = useState<IndirectSettingsItem[]>(() =>
    cases.map((c, i) => ({
      caseId: c.indirectWorkCaseId,
      caseName: c.caseName,
      isVisible: true,
      color: GREY_PALETTE[i % GREY_PALETTE.length],
      displayOrder: i,
    })),
  )

  // cases が変わったら items を同期（初回 or データ再取得時）
  if (cases.length > 0 && items.length === 0) {
    const newItems = cases.map((c, i) => ({
      caseId: c.indirectWorkCaseId,
      caseName: c.caseName,
      isVisible: true,
      color: GREY_PALETTE[i % GREY_PALETTE.length],
      displayOrder: i,
    }))
    setItems(newItems)
  }

  const colorMutation = useBulkUpsertColorSettings()
  const orderMutation = useBulkUpsertStackOrderSettings()

  const toggleVisibility = useCallback(
    (caseId: number) => {
      setItems((prev) => {
        const updated = prev.map((item) =>
          item.caseId === caseId ? { ...item, isVisible: !item.isVisible } : item,
        )
        orderMutation.mutate(
          updated.map((it) => ({
            targetType: 'indirect_work_case',
            targetCode: String(it.caseId),
            displayOrder: it.displayOrder,
            isVisible: it.isVisible,
          })),
        )
        return updated
      })
    },
    [orderMutation],
  )

  const moveUp = useCallback(
    (index: number) => {
      if (index === 0) return
      setItems((prev) => {
        const next = [...prev]
        const temp = next[index - 1]
        next[index - 1] = next[index]
        next[index] = temp
        const reordered = next.map((it, i) => ({ ...it, displayOrder: i }))
        orderMutation.mutate(
          reordered.map((it) => ({
            targetType: 'indirect_work_case',
            targetCode: String(it.caseId),
            displayOrder: it.displayOrder,
            isVisible: it.isVisible,
          })),
        )
        return reordered
      })
    },
    [orderMutation],
  )

  const moveDown = useCallback(
    (index: number) => {
      setItems((prev) => {
        if (index >= prev.length - 1) return prev
        const next = [...prev]
        const temp = next[index + 1]
        next[index + 1] = next[index]
        next[index] = temp
        const reordered = next.map((it, i) => ({ ...it, displayOrder: i }))
        orderMutation.mutate(
          reordered.map((it) => ({
            targetType: 'indirect_work_case',
            targetCode: String(it.caseId),
            displayOrder: it.displayOrder,
            isVisible: it.isVisible,
          })),
        )
        return reordered
      })
    },
    [orderMutation],
  )

  const setColor = useCallback(
    (caseId: number, color: string) => {
      setItems((prev) => {
        const updated = prev.map((item) =>
          item.caseId === caseId ? { ...item, color } : item,
        )
        colorMutation.mutate(
          updated.map((it) => ({
            targetType: 'indirect_work_case',
            targetCode: String(it.caseId),
            color: it.color,
          })),
        )
        return updated
      })
    },
    [colorMutation],
  )

  const resetColors = useCallback(() => {
    setItems((prev) => {
      const updated = prev.map((item, i) => ({
        ...item,
        color: GREY_PALETTE[i % GREY_PALETTE.length],
      }))
      colorMutation.mutate(
        updated.map((it) => ({
          targetType: 'indirect_work_case',
          targetCode: String(it.caseId),
          color: it.color,
        })),
      )
      return updated
    })
  }, [colorMutation])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">間接作業設定</h3>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={resetColors}>
          <RotateCcw className="h-3 w-3" />
          色リセット
        </Button>
      </div>

      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={item.caseId}
            className="flex items-center gap-3 rounded-lg border border-border p-3"
          >
            {/* 表示/非表示 */}
            <Switch
              checked={item.isVisible}
              onCheckedChange={() => toggleVisibility(item.caseId)}
            />

            {/* 色 */}
            <div className="flex gap-1">
              {GREY_PALETTE.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`h-5 w-5 rounded-sm border-2 ${
                    item.color === color ? 'border-primary' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setColor(item.caseId, color)}
                />
              ))}
            </div>

            {/* 名称 */}
            <Label className="flex-1 truncate text-sm">{item.caseName}</Label>

            {/* 上下移動 */}
            <div className="flex gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                disabled={index === 0}
                onClick={() => moveUp(index)}
              >
                <ArrowUp className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                disabled={index === items.length - 1}
                onClick={() => moveDown(index)}
              >
                <ArrowDown className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <p className="py-4 text-center text-sm text-muted-foreground">
          間接作業ケースがありません
        </p>
      )}
    </div>
  )
}
