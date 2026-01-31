import { useState, useCallback } from 'react'
import type {
  MonthlyCapacity,
  IndirectWorkTypeRatio,
  IndirectWorkCalcResult,
  MonthlyBreakdown,
} from '@/features/indirect-case-study/types'

/**
 * 年月文字列（YYYYMM）から会計年度を判定する
 * 4月〜翌3月 → month >= 4 ? year : year - 1
 */
export function getFiscalYear(yearMonth: string): number {
  const year = parseInt(yearMonth.substring(0, 4), 10)
  const month = parseInt(yearMonth.substring(4, 6), 10)
  return month >= 4 ? year : year - 1
}

/**
 * 指定年度の間接作業比率合計を算出する
 */
export function getTotalRatioForFiscalYear(
  ratios: IndirectWorkTypeRatio[],
  fiscalYear: number,
): number {
  return ratios
    .filter((r) => r.fiscalYear === fiscalYear)
    .reduce((sum, r) => sum + r.ratio, 0)
}

/**
 * 指定年度・作業種類別の按分計算
 */
function getBreakdownForMonth(
  capacity: number,
  ratios: IndirectWorkTypeRatio[],
  fiscalYear: number,
): Array<{ workTypeCode: string; manhour: number }> {
  return ratios
    .filter((r) => r.fiscalYear === fiscalYear)
    .map((r) => ({
      workTypeCode: r.workTypeCode,
      manhour: Math.round(capacity * r.ratio),
    }))
}

export function useIndirectWorkCalculation() {
  const [result, setResult] = useState<IndirectWorkCalcResult | null>(null)

  const calculate = useCallback(
    (params: { capacities: MonthlyCapacity[]; ratios: IndirectWorkTypeRatio[] }) => {
      const { capacities, ratios } = params

      const monthlyLoads = capacities.map((cap) => {
        const fy = getFiscalYear(cap.yearMonth)
        const totalRatio = getTotalRatioForFiscalYear(ratios, fy)
        return {
          businessUnitCode: cap.businessUnitCode,
          yearMonth: cap.yearMonth,
          manhour: Math.round(cap.capacity * totalRatio),
          source: 'calculated' as const,
        }
      })

      const breakdown: MonthlyBreakdown[] = capacities.map((cap) => {
        const fy = getFiscalYear(cap.yearMonth)
        const items = getBreakdownForMonth(cap.capacity, ratios, fy)
        const total = items.reduce((sum, item) => sum + item.manhour, 0)
        return {
          yearMonth: cap.yearMonth,
          businessUnitCode: cap.businessUnitCode,
          items,
          total,
        }
      })

      const calcResult: IndirectWorkCalcResult = { monthlyLoads, breakdown }
      setResult(calcResult)
      return calcResult
    },
    [],
  )

  const reset = useCallback(() => {
    setResult(null)
  }, [])

  return { calculate, result, reset }
}
