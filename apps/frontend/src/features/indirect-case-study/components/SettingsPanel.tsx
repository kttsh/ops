import { useState, useCallback } from 'react'
import { Loader2, Calculator } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { HeadcountPlanCaseList } from './HeadcountPlanCaseList'
import { CapacityScenarioList } from './CapacityScenarioList'
import { IndirectWorkCaseList } from './IndirectWorkCaseList'
import { MonthlyHeadcountGrid } from './MonthlyHeadcountGrid'
import { IndirectWorkRatioMatrix } from './IndirectWorkRatioMatrix'
import type {
  HeadcountPlanCase,
  CapacityScenario,
  IndirectWorkCase,
  BulkMonthlyHeadcountInput,
  BulkIndirectWorkRatioInput,
} from '@/features/indirect-case-study/types'

interface SettingsPanelProps {
  businessUnitCode: string

  // ケースデータ
  headcountCases: HeadcountPlanCase[]
  capacityScenarios: CapacityScenario[]
  indirectWorkCases: IndirectWorkCase[]
  isLoadingCases: boolean

  // 選択状態
  selectedHeadcountPlanCaseId: number | null
  onSelectHeadcountPlanCase: (id: number) => void
  selectedCapacityScenarioId: number | null
  onSelectCapacityScenario: (id: number) => void
  selectedIndirectWorkCaseId: number | null
  onSelectIndirectWorkCase: (id: number) => void

  // 年度
  settingsFiscalYear: number
  onSettingsFiscalYearChange: (year: number) => void

  // 計算
  onCalculateCapacity: () => Promise<void>
  isCalculatingCapacity: boolean
  canCalculateCapacity: boolean
  onCalculateIndirectWork: () => void
  canCalculateIndirectWork: boolean

  // 保存
  onSaveHeadcount: () => Promise<void>
  isSavingHeadcount: boolean
  onSaveRatios: () => Promise<void>
  isSavingRatios: boolean

  // Dirty
  onHeadcountDirtyChange: (dirty: boolean) => void
  onRatioDirtyChange: (dirty: boolean) => void
  headcountDirty: boolean
  ratioDirty: boolean

  // ローカルデータ
  onHeadcountLocalDataChange: (data: BulkMonthlyHeadcountInput) => void
  onRatioLocalDataChange: (data: BulkIndirectWorkRatioInput) => void
}

export function SettingsPanel({
  businessUnitCode,
  headcountCases,
  capacityScenarios,
  indirectWorkCases,
  isLoadingCases,
  selectedHeadcountPlanCaseId,
  onSelectHeadcountPlanCase,
  selectedCapacityScenarioId,
  onSelectCapacityScenario,
  selectedIndirectWorkCaseId,
  onSelectIndirectWorkCase,
  settingsFiscalYear,
  onSettingsFiscalYearChange,
  onCalculateCapacity,
  isCalculatingCapacity,
  canCalculateCapacity,
  onCalculateIndirectWork,
  canCalculateIndirectWork,
  onSaveHeadcount,
  isSavingHeadcount,
  onSaveRatios,
  isSavingRatios,
  onHeadcountDirtyChange,
  onRatioDirtyChange,
  headcountDirty,
  ratioDirty,
  onHeadcountLocalDataChange,
  onRatioLocalDataChange,
}: SettingsPanelProps) {
  const [hpcIncludeDisabled, setHpcIncludeDisabled] = useState(false)
  const [csIncludeDisabled, setCsIncludeDisabled] = useState(false)
  const [iwcIncludeDisabled, setIwcIncludeDisabled] = useState(false)

  const handleHeadcountDirtyChange = useCallback(
    (dirty: boolean) => onHeadcountDirtyChange(dirty),
    [onHeadcountDirtyChange],
  )

  const handleRatioDirtyChange = useCallback(
    (dirty: boolean) => onRatioDirtyChange(dirty),
    [onRatioDirtyChange],
  )

  return (
    <div className="space-y-6 overflow-y-auto h-full pr-2">
      {/* キャパシティ設定セクション */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">キャパシティ設定</h2>

        <HeadcountPlanCaseList
          items={headcountCases}
          selectedId={selectedHeadcountPlanCaseId}
          onSelect={onSelectHeadcountPlanCase}
          businessUnitCode={businessUnitCode}
          isLoading={isLoadingCases}
          includeDisabled={hpcIncludeDisabled}
          onIncludeDisabledChange={setHpcIncludeDisabled}
        />

        {selectedHeadcountPlanCaseId && (
          <MonthlyHeadcountGrid
            headcountPlanCaseId={selectedHeadcountPlanCaseId}
            businessUnitCode={businessUnitCode}
            fiscalYear={settingsFiscalYear}
            onFiscalYearChange={onSettingsFiscalYearChange}
            onDirtyChange={handleHeadcountDirtyChange}
            onLocalDataChange={onHeadcountLocalDataChange}
          />
        )}

        <CapacityScenarioList
          items={capacityScenarios}
          selectedId={selectedCapacityScenarioId}
          onSelect={onSelectCapacityScenario}
          isLoading={isLoadingCases}
          includeDisabled={csIncludeDisabled}
          onIncludeDisabledChange={setCsIncludeDisabled}
        />

        <div className="flex gap-2">
          <Button
            onClick={onCalculateCapacity}
            disabled={!canCalculateCapacity || isCalculatingCapacity}
            size="sm"
          >
            {isCalculatingCapacity ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Calculator className="h-4 w-4 mr-1" />
            )}
            キャパシティ計算
          </Button>
          {selectedHeadcountPlanCaseId && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSaveHeadcount}
              disabled={!headcountDirty || isSavingHeadcount}
            >
              {isSavingHeadcount && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              人員計画を保存
            </Button>
          )}
        </div>
      </section>

      <Separator />

      {/* 間接作業設定セクション */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">間接作業設定</h2>

        <IndirectWorkCaseList
          items={indirectWorkCases}
          selectedId={selectedIndirectWorkCaseId}
          onSelect={onSelectIndirectWorkCase}
          businessUnitCode={businessUnitCode}
          isLoading={isLoadingCases}
          includeDisabled={iwcIncludeDisabled}
          onIncludeDisabledChange={setIwcIncludeDisabled}
        />

        {selectedIndirectWorkCaseId && (
          <IndirectWorkRatioMatrix
            indirectWorkCaseId={selectedIndirectWorkCaseId}
            onDirtyChange={handleRatioDirtyChange}
            onLocalDataChange={onRatioLocalDataChange}
          />
        )}

        <div className="flex gap-2">
          <Button
            onClick={onCalculateIndirectWork}
            disabled={!canCalculateIndirectWork}
            size="sm"
          >
            <Calculator className="h-4 w-4 mr-1" />
            間接作業計算
          </Button>
          {selectedIndirectWorkCaseId && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSaveRatios}
              disabled={!ratioDirty || isSavingRatios}
            >
              {isSavingRatios && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              間接作業設定を保存
            </Button>
          )}
        </div>
      </section>
    </div>
  )
}
