import { describe, it, expect } from 'vitest'
import {
  createHeadcountPlanCaseSchema,
  updateHeadcountPlanCaseSchema,
  createCapacityScenarioSchema,
  updateCapacityScenarioSchema,
  createIndirectWorkCaseSchema,
  updateIndirectWorkCaseSchema,
  monthlyHeadcountSchema,
  indirectWorkRatioInputSchema,
} from '@/features/indirect-case-study/types'

// ============================================================
// 人員計画ケース
// ============================================================

describe('createHeadcountPlanCaseSchema', () => {
  it('正常値を受け入れる', () => {
    const result = createHeadcountPlanCaseSchema.safeParse({
      caseName: '標準ケース',
      description: 'テスト説明',
      isPrimary: true,
    })
    expect(result.success).toBe(true)
  })

  it('空のケース名を拒否する', () => {
    const result = createHeadcountPlanCaseSchema.safeParse({
      caseName: '',
    })
    expect(result.success).toBe(false)
  })

  it('101文字以上のケース名を拒否する', () => {
    const result = createHeadcountPlanCaseSchema.safeParse({
      caseName: 'A'.repeat(101),
    })
    expect(result.success).toBe(false)
  })

  it('100文字のケース名を受け入れる', () => {
    const result = createHeadcountPlanCaseSchema.safeParse({
      caseName: 'A'.repeat(100),
    })
    expect(result.success).toBe(true)
  })

  it('501文字以上の説明を拒否する', () => {
    const result = createHeadcountPlanCaseSchema.safeParse({
      caseName: 'テスト',
      description: 'A'.repeat(501),
    })
    expect(result.success).toBe(false)
  })

  it('500文字の説明を受け入れる', () => {
    const result = createHeadcountPlanCaseSchema.safeParse({
      caseName: 'テスト',
      description: 'A'.repeat(500),
    })
    expect(result.success).toBe(true)
  })

  it('isPrimaryのデフォルトはfalse', () => {
    const result = createHeadcountPlanCaseSchema.safeParse({
      caseName: 'テスト',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.isPrimary).toBe(false)
    }
  })
})

describe('updateHeadcountPlanCaseSchema', () => {
  it('正常値を受け入れる', () => {
    const result = updateHeadcountPlanCaseSchema.safeParse({
      caseName: '更新ケース',
      isPrimary: true,
    })
    expect(result.success).toBe(true)
  })

  it('空のケース名を拒否する', () => {
    const result = updateHeadcountPlanCaseSchema.safeParse({
      caseName: '',
    })
    expect(result.success).toBe(false)
  })
})

// ============================================================
// キャパシティシナリオ
// ============================================================

describe('createCapacityScenarioSchema', () => {
  it('正常値を受け入れる', () => {
    const result = createCapacityScenarioSchema.safeParse({
      scenarioName: '定時ベース',
      hoursPerPerson: 160,
      isPrimary: false,
    })
    expect(result.success).toBe(true)
  })

  it('デフォルト労働時間は160', () => {
    const result = createCapacityScenarioSchema.safeParse({
      scenarioName: 'テスト',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.hoursPerPerson).toBe(160)
    }
  })

  it('空のシナリオ名を拒否する', () => {
    const result = createCapacityScenarioSchema.safeParse({
      scenarioName: '',
    })
    expect(result.success).toBe(false)
  })

  it('101文字以上のシナリオ名を拒否する', () => {
    const result = createCapacityScenarioSchema.safeParse({
      scenarioName: 'A'.repeat(101),
    })
    expect(result.success).toBe(false)
  })

  it('労働時間0を拒否する', () => {
    const result = createCapacityScenarioSchema.safeParse({
      scenarioName: 'テスト',
      hoursPerPerson: 0,
    })
    expect(result.success).toBe(false)
  })

  it('労働時間-1を拒否する', () => {
    const result = createCapacityScenarioSchema.safeParse({
      scenarioName: 'テスト',
      hoursPerPerson: -1,
    })
    expect(result.success).toBe(false)
  })

  it('労働時間744を受け入れる', () => {
    const result = createCapacityScenarioSchema.safeParse({
      scenarioName: 'テスト',
      hoursPerPerson: 744,
    })
    expect(result.success).toBe(true)
  })

  it('労働時間745を拒否する', () => {
    const result = createCapacityScenarioSchema.safeParse({
      scenarioName: 'テスト',
      hoursPerPerson: 745,
    })
    expect(result.success).toBe(false)
  })

  it('労働時間0.01を受け入れる', () => {
    const result = createCapacityScenarioSchema.safeParse({
      scenarioName: 'テスト',
      hoursPerPerson: 0.01,
    })
    expect(result.success).toBe(true)
  })
})

describe('updateCapacityScenarioSchema', () => {
  it('正常値を受け入れる', () => {
    const result = updateCapacityScenarioSchema.safeParse({
      scenarioName: '残業ベース',
      hoursPerPerson: 200,
    })
    expect(result.success).toBe(true)
  })

  it('労働時間0以下を拒否する', () => {
    const result = updateCapacityScenarioSchema.safeParse({
      scenarioName: 'テスト',
      hoursPerPerson: 0,
    })
    expect(result.success).toBe(false)
  })

  it('労働時間744超を拒否する', () => {
    const result = updateCapacityScenarioSchema.safeParse({
      scenarioName: 'テスト',
      hoursPerPerson: 744.01,
    })
    expect(result.success).toBe(false)
  })
})

// ============================================================
// 間接作業ケース
// ============================================================

describe('createIndirectWorkCaseSchema', () => {
  it('正常値を受け入れる', () => {
    const result = createIndirectWorkCaseSchema.safeParse({
      caseName: '間接ケース',
      isPrimary: false,
    })
    expect(result.success).toBe(true)
  })

  it('空のケース名を拒否する', () => {
    const result = createIndirectWorkCaseSchema.safeParse({
      caseName: '',
    })
    expect(result.success).toBe(false)
  })

  it('101文字以上のケース名を拒否する', () => {
    const result = createIndirectWorkCaseSchema.safeParse({
      caseName: 'A'.repeat(101),
    })
    expect(result.success).toBe(false)
  })
})

describe('updateIndirectWorkCaseSchema', () => {
  it('正常値を受け入れる', () => {
    const result = updateIndirectWorkCaseSchema.safeParse({
      caseName: '更新間接ケース',
    })
    expect(result.success).toBe(true)
  })
})

// ============================================================
// 月次人員数
// ============================================================

describe('monthlyHeadcountSchema', () => {
  it('正常値を受け入れる', () => {
    const result = monthlyHeadcountSchema.safeParse({
      yearMonth: '202504',
      headcount: 10,
    })
    expect(result.success).toBe(true)
  })

  it('人員数0を受け入れる', () => {
    const result = monthlyHeadcountSchema.safeParse({
      yearMonth: '202504',
      headcount: 0,
    })
    expect(result.success).toBe(true)
  })

  it('負の人員数を拒否する', () => {
    const result = monthlyHeadcountSchema.safeParse({
      yearMonth: '202504',
      headcount: -1,
    })
    expect(result.success).toBe(false)
  })

  it('小数の人員数を拒否する', () => {
    const result = monthlyHeadcountSchema.safeParse({
      yearMonth: '202504',
      headcount: 1.5,
    })
    expect(result.success).toBe(false)
  })
})

// ============================================================
// 間接作業比率
// ============================================================

describe('indirectWorkRatioInputSchema', () => {
  it('正常値を受け入れる（UI上0-100%）', () => {
    const result = indirectWorkRatioInputSchema.safeParse({
      workTypeCode: 'EDU',
      fiscalYear: 2025,
      ratio: 15.5,
    })
    expect(result.success).toBe(true)
  })

  it('比率0%を受け入れる', () => {
    const result = indirectWorkRatioInputSchema.safeParse({
      workTypeCode: 'EDU',
      fiscalYear: 2025,
      ratio: 0,
    })
    expect(result.success).toBe(true)
  })

  it('比率100%を受け入れる', () => {
    const result = indirectWorkRatioInputSchema.safeParse({
      workTypeCode: 'EDU',
      fiscalYear: 2025,
      ratio: 100,
    })
    expect(result.success).toBe(true)
  })

  it('比率-1%を拒否する', () => {
    const result = indirectWorkRatioInputSchema.safeParse({
      workTypeCode: 'EDU',
      fiscalYear: 2025,
      ratio: -1,
    })
    expect(result.success).toBe(false)
  })

  it('比率101%を拒否する', () => {
    const result = indirectWorkRatioInputSchema.safeParse({
      workTypeCode: 'EDU',
      fiscalYear: 2025,
      ratio: 101,
    })
    expect(result.success).toBe(false)
  })
})
