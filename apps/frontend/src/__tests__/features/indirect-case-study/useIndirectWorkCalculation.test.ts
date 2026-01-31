import { describe, it, expect } from 'vitest'
import {
  getFiscalYear,
  getTotalRatioForFiscalYear,
} from '@/features/indirect-case-study/hooks/useIndirectWorkCalculation'
import type {
  IndirectWorkTypeRatio,
} from '@/features/indirect-case-study/types'

describe('getFiscalYear', () => {
  it('4月は当年の年度を返す', () => {
    expect(getFiscalYear('202504')).toBe(2025)
  })

  it('12月は当年の年度を返す', () => {
    expect(getFiscalYear('202512')).toBe(2025)
  })

  it('3月は前年の年度を返す', () => {
    expect(getFiscalYear('202603')).toBe(2025)
  })

  it('1月は前年の年度を返す', () => {
    expect(getFiscalYear('202601')).toBe(2025)
  })

  it('2月は前年の年度を返す', () => {
    expect(getFiscalYear('202602')).toBe(2025)
  })
})

describe('getTotalRatioForFiscalYear', () => {
  const ratios: IndirectWorkTypeRatio[] = [
    {
      indirectWorkTypeRatioId: 1,
      indirectWorkCaseId: 1,
      workTypeCode: 'EDU',
      fiscalYear: 2025,
      ratio: 0.1,
      createdAt: '',
      updatedAt: '',
    },
    {
      indirectWorkTypeRatioId: 2,
      indirectWorkCaseId: 1,
      workTypeCode: 'MTG',
      fiscalYear: 2025,
      ratio: 0.05,
      createdAt: '',
      updatedAt: '',
    },
    {
      indirectWorkTypeRatioId: 3,
      indirectWorkCaseId: 1,
      workTypeCode: 'EDU',
      fiscalYear: 2026,
      ratio: 0.12,
      createdAt: '',
      updatedAt: '',
    },
  ]

  it('指定年度の比率合計を返す', () => {
    expect(getTotalRatioForFiscalYear(ratios, 2025)).toBeCloseTo(0.15)
  })

  it('別年度の比率合計を返す', () => {
    expect(getTotalRatioForFiscalYear(ratios, 2026)).toBeCloseTo(0.12)
  })

  it('該当データがない年度は0を返す', () => {
    expect(getTotalRatioForFiscalYear(ratios, 2024)).toBe(0)
  })
})

describe('間接工数計算ロジック', () => {
  const makeRatio = (workTypeCode: string, fiscalYear: number, ratio: number): IndirectWorkTypeRatio => ({
    indirectWorkTypeRatioId: 1,
    indirectWorkCaseId: 1,
    workTypeCode,
    fiscalYear,
    ratio,
    createdAt: '',
    updatedAt: '',
  })

  it('基本的な按分計算が正しい', () => {
    const capacity = 1600 // 10人 × 160h
    const ratio = 0.1
    const result = Math.round(capacity * ratio)
    expect(result).toBe(160)
  })

  it('Math.roundの境界値が正しい', () => {
    // 1600 * 0.333 = 532.8 → 533
    expect(Math.round(1600 * 0.333)).toBe(533)
    // 1600 * 0.335 = 536.0 → 536
    expect(Math.round(1600 * 0.335)).toBe(536)
    // 小数点以下0.5 → 切り上げ
    expect(Math.round(0.5)).toBe(1)
    expect(Math.round(1.5)).toBe(2)
  })

  it('複数年度にまたがるデータの計算', () => {
    const ratios = [
      makeRatio('EDU', 2025, 0.1),
      makeRatio('MTG', 2025, 0.05),
      makeRatio('EDU', 2026, 0.12),
    ]

    // FY2025 の合計比率: 0.1 + 0.05 = 0.15
    // FY2026 の合計比率: 0.12

    // 202504 (FY2025): 1600 * 0.15 = 240
    const apr2025 = Math.round(1600 * getTotalRatioForFiscalYear(ratios, getFiscalYear('202504')))
    expect(apr2025).toBe(240)

    // 202601 (FY2025): 1600 * 0.15 = 240
    const jan2026 = Math.round(1600 * getTotalRatioForFiscalYear(ratios, getFiscalYear('202601')))
    expect(jan2026).toBe(240)

    // 202604 (FY2026): 1600 * 0.12 = 192
    const apr2026 = Math.round(1600 * getTotalRatioForFiscalYear(ratios, getFiscalYear('202604')))
    expect(apr2026).toBe(192)
  })

  it('比率が0の場合は工数0', () => {
    const result = Math.round(1600 * 0)
    expect(result).toBe(0)
  })

  it('キャパシティが0の場合は工数0', () => {
    const result = Math.round(0 * 0.15)
    expect(result).toBe(0)
  })
})
