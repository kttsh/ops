import { Loader2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CalculationResultTable } from './CalculationResultTable'
import type {
  CalculateCapacityResult,
  IndirectWorkCalcResult,
  MonthlyHeadcountPlan,
  IndirectWorkTypeRatio,
  CalculationTableData,
} from '@/features/indirect-case-study/types'
import type { WorkType } from '@/features/work-types/types'
import { useExcelExport } from '@/features/indirect-case-study/hooks/useExcelExport'
import { getFiscalYear } from '@/features/indirect-case-study/hooks/useIndirectWorkCalculation'

interface ResultPanelProps {
  capacityResult: CalculateCapacityResult | null
  indirectWorkResult: IndirectWorkCalcResult | null
  monthlyHeadcountPlans: MonthlyHeadcountPlan[]
  ratios: IndirectWorkTypeRatio[]
  workTypes: WorkType[]
  fiscalYear: number
  onFiscalYearChange: (year: number) => void
  headcountPlanCaseName: string
  scenarioName: string
  indirectWorkCaseName: string
  onSaveIndirectWorkLoads: () => Promise<void>
  isSavingResults: boolean
  indirectWorkResultDirty: boolean
}

const MONTHS = ['04', '05', '06', '07', '08', '09', '10', '11', '12', '01', '02', '03']

function getYearMonth(fiscalYear: number, monthStr: string): string {
  const month = parseInt(monthStr, 10)
  const year = month >= 4 ? fiscalYear : fiscalYear + 1
  return `${year}${monthStr}`
}

export function ResultPanel({
  capacityResult,
  indirectWorkResult,
  monthlyHeadcountPlans,
  ratios,
  workTypes,
  fiscalYear,
  onFiscalYearChange,
  headcountPlanCaseName,
  scenarioName,
  indirectWorkCaseName,
  onSaveIndirectWorkLoads,
  isSavingResults,
  indirectWorkResultDirty,
}: ResultPanelProps) {
  const { exportToExcel, isExporting } = useExcelExport()

  const hasResults = capacityResult !== null

  const handleExport = async () => {
    if (!capacityResult) return

    const yearMonths = MONTHS.map((m) => getYearMonth(fiscalYear, m))
    const headcountMap = new Map(monthlyHeadcountPlans.map((p) => [p.yearMonth, p.headcount]))
    const capacityMap = new Map(capacityResult.items.map((c) => [c.yearMonth, c.capacity]))
    const indirectTotalMap = new Map(
      indirectWorkResult?.monthlyLoads.map((l) => [l.yearMonth, l.manhour]) ?? [],
    )

    const rows: CalculationTableData['rows'] = []

    // 人員数
    const headcountMonthly: Record<string, number> = {}
    yearMonths.forEach((ym) => {
      headcountMonthly[ym] = headcountMap.get(ym) ?? 0
    })
    rows.push({
      label: '人員数（人）',
      type: 'headcount',
      monthly: headcountMonthly,
      annualTotal: Object.values(headcountMonthly).reduce((a, b) => a + b, 0),
    })

    // キャパシティ
    const capacityMonthly: Record<string, number> = {}
    yearMonths.forEach((ym) => {
      capacityMonthly[ym] = capacityMap.get(ym) ?? 0
    })
    rows.push({
      label: 'キャパシティ（時間）',
      type: 'capacity',
      monthly: capacityMonthly,
      annualTotal: Object.values(capacityMonthly).reduce((a, b) => a + b, 0),
    })

    // 間接内訳
    workTypes.forEach((wt) => {
      const monthly: Record<string, number> = {}
      yearMonths.forEach((ym) => {
        const cap = capacityMap.get(ym) ?? 0
        const fy = getFiscalYear(ym)
        const ratio = ratios.find(
          (r) => r.fiscalYear === fy && r.workTypeCode === wt.workTypeCode,
        )
        monthly[ym] = Math.round(cap * (ratio?.ratio ?? 0))
      })
      rows.push({
        label: wt.name,
        type: 'indirect-breakdown',
        workTypeCode: wt.workTypeCode,
        monthly,
        annualTotal: Object.values(monthly).reduce((a, b) => a + b, 0),
      })
    })

    // 間接合計
    const indirectMonthly: Record<string, number> = {}
    yearMonths.forEach((ym) => {
      indirectMonthly[ym] = indirectTotalMap.get(ym) ?? 0
    })
    rows.push({
      label: '間接合計（時間）',
      type: 'indirect-total',
      monthly: indirectMonthly,
      annualTotal: Object.values(indirectMonthly).reduce((a, b) => a + b, 0),
    })

    // 直接作業可能時間
    const directMonthly: Record<string, number> = {}
    yearMonths.forEach((ym) => {
      directMonthly[ym] = (capacityMap.get(ym) ?? 0) - (indirectTotalMap.get(ym) ?? 0)
    })
    rows.push({
      label: '直接作業可能時間（時間）',
      type: 'direct',
      monthly: directMonthly,
      annualTotal: Object.values(directMonthly).reduce((a, b) => a + b, 0),
    })

    await exportToExcel({
      headcountPlanCaseName,
      scenarioName,
      indirectWorkCaseName,
      fiscalYear,
      tableData: { rows, months: yearMonths },
    })
  }

  if (!hasResults) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p className="text-sm">
          左パネルでケースとシナリオを選択し、計算を実行してください。
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 h-full overflow-y-auto pr-2">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">計算結果</h2>
        <div className="flex gap-2">
          {indirectWorkResult && (
            <Button
              size="sm"
              onClick={onSaveIndirectWorkLoads}
              disabled={!indirectWorkResultDirty || isSavingResults}
            >
              {isSavingResults && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              間接作業工数を保存
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Download className="h-4 w-4 mr-1" />
            )}
            Excelエクスポート
          </Button>
        </div>
      </div>

      <CalculationResultTable
        capacityResult={capacityResult}
        indirectWorkResult={indirectWorkResult}
        monthlyHeadcountPlans={monthlyHeadcountPlans}
        ratios={ratios}
        workTypes={workTypes}
        fiscalYear={fiscalYear}
        onFiscalYearChange={onFiscalYearChange}
        headcountPlanCaseName={headcountPlanCaseName}
        scenarioName={scenarioName}
        indirectWorkCaseName={indirectWorkCaseName}
      />
    </div>
  )
}
