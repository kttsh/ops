import { describe, it, expect } from 'vitest'
import {
  createProjectCaseSchema,
  updateProjectCaseSchema,
  bulkProjectLoadSchema,
} from '../types'

describe('createProjectCaseSchema', () => {
  const validInput = {
    caseName: 'テストケース',
    calculationType: 'MANUAL' as const,
    standardEffortId: null,
    description: null,
    isPrimary: false,
    startYearMonth: null,
    durationMonths: null,
    totalManhour: null,
  }

  it('有効な入力を受け入れる', () => {
    const result = createProjectCaseSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('STANDARDモードでstandardEffortIdありの入力を受け入れる', () => {
    const result = createProjectCaseSchema.safeParse({
      ...validInput,
      calculationType: 'STANDARD',
      standardEffortId: 1,
    })
    expect(result.success).toBe(true)
  })

  it('全フィールド設定済みの入力を受け入れる', () => {
    const result = createProjectCaseSchema.safeParse({
      ...validInput,
      description: 'テスト説明',
      isPrimary: true,
      startYearMonth: '202601',
      durationMonths: 12,
      totalManhour: 100,
    })
    expect(result.success).toBe(true)
  })

  // ケース名バリデーション
  it('ケース名が空の場合エラー', () => {
    const result = createProjectCaseSchema.safeParse({
      ...validInput,
      caseName: '',
    })
    expect(result.success).toBe(false)
  })

  it('ケース名が100文字を超える場合エラー', () => {
    const result = createProjectCaseSchema.safeParse({
      ...validInput,
      caseName: 'あ'.repeat(101),
    })
    expect(result.success).toBe(false)
  })

  it('ケース名が100文字の場合受け入れる', () => {
    const result = createProjectCaseSchema.safeParse({
      ...validInput,
      caseName: 'あ'.repeat(100),
    })
    expect(result.success).toBe(true)
  })

  // STANDARDモード必須条件
  it('STANDARDモードでstandardEffortIdがnullの場合エラー', () => {
    const result = createProjectCaseSchema.safeParse({
      ...validInput,
      calculationType: 'STANDARD',
      standardEffortId: null,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issues = result.error.issues
      expect(issues.some((i) => i.path.includes('standardEffortId'))).toBe(true)
    }
  })

  it('MANUALモードでstandardEffortIdがnullの場合受け入れる', () => {
    const result = createProjectCaseSchema.safeParse({
      ...validInput,
      calculationType: 'MANUAL',
      standardEffortId: null,
    })
    expect(result.success).toBe(true)
  })

  // 説明バリデーション
  it('説明が500文字を超える場合エラー', () => {
    const result = createProjectCaseSchema.safeParse({
      ...validInput,
      description: 'あ'.repeat(501),
    })
    expect(result.success).toBe(false)
  })

  it('説明が500文字の場合受け入れる', () => {
    const result = createProjectCaseSchema.safeParse({
      ...validInput,
      description: 'あ'.repeat(500),
    })
    expect(result.success).toBe(true)
  })

  // 開始年月バリデーション
  it('開始年月がYYYYMM形式の場合受け入れる', () => {
    const result = createProjectCaseSchema.safeParse({
      ...validInput,
      startYearMonth: '202612',
    })
    expect(result.success).toBe(true)
  })

  it('開始年月がYYYYMM形式でない場合エラー', () => {
    const result = createProjectCaseSchema.safeParse({
      ...validInput,
      startYearMonth: '2026-01',
    })
    expect(result.success).toBe(false)
  })

  it('開始年月が5桁の場合エラー', () => {
    const result = createProjectCaseSchema.safeParse({
      ...validInput,
      startYearMonth: '20261',
    })
    expect(result.success).toBe(false)
  })

  // 期間月数バリデーション
  it('期間月数が正の整数の場合受け入れる', () => {
    const result = createProjectCaseSchema.safeParse({
      ...validInput,
      durationMonths: 12,
    })
    expect(result.success).toBe(true)
  })

  it('期間月数が0の場合エラー', () => {
    const result = createProjectCaseSchema.safeParse({
      ...validInput,
      durationMonths: 0,
    })
    expect(result.success).toBe(false)
  })

  it('期間月数が負の場合エラー', () => {
    const result = createProjectCaseSchema.safeParse({
      ...validInput,
      durationMonths: -1,
    })
    expect(result.success).toBe(false)
  })

  it('期間月数が小数の場合エラー', () => {
    const result = createProjectCaseSchema.safeParse({
      ...validInput,
      durationMonths: 1.5,
    })
    expect(result.success).toBe(false)
  })

  // 総工数バリデーション
  it('総工数が0の場合受け入れる', () => {
    const result = createProjectCaseSchema.safeParse({
      ...validInput,
      totalManhour: 0,
    })
    expect(result.success).toBe(true)
  })

  it('総工数が負の場合エラー', () => {
    const result = createProjectCaseSchema.safeParse({
      ...validInput,
      totalManhour: -1,
    })
    expect(result.success).toBe(false)
  })

  it('総工数が小数の場合エラー', () => {
    const result = createProjectCaseSchema.safeParse({
      ...validInput,
      totalManhour: 1.5,
    })
    expect(result.success).toBe(false)
  })
})

describe('updateProjectCaseSchema', () => {
  it('caseNameのみの部分更新を受け入れる', () => {
    const result = updateProjectCaseSchema.safeParse({
      caseName: '更新名',
    })
    expect(result.success).toBe(true)
  })

  it('calculationTypeのみの部分更新を受け入れる', () => {
    const result = updateProjectCaseSchema.safeParse({
      calculationType: 'STANDARD',
      standardEffortId: 1,
    })
    expect(result.success).toBe(true)
  })

  it('STANDARDモードに切替時にstandardEffortIdがnullでも部分更新を受け入れる', () => {
    // 更新スキーマにはrefineなし（整合性チェックはフォーム側で実施）
    const result = updateProjectCaseSchema.safeParse({
      calculationType: 'STANDARD',
      standardEffortId: null,
    })
    expect(result.success).toBe(true)
  })

  it('calculationType未指定時はstandardEffortIdのrefineをスキップ', () => {
    const result = updateProjectCaseSchema.safeParse({
      caseName: 'テスト',
    })
    expect(result.success).toBe(true)
  })
})

describe('bulkProjectLoadSchema', () => {
  it('有効な入力を受け入れる', () => {
    const result = bulkProjectLoadSchema.safeParse({
      items: [
        { yearMonth: '202601', manhour: 100 },
        { yearMonth: '202602', manhour: 200 },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('空の配列の場合エラー', () => {
    const result = bulkProjectLoadSchema.safeParse({
      items: [],
    })
    expect(result.success).toBe(false)
  })

  it('yearMonthがYYYYMM形式でない場合エラー', () => {
    const result = bulkProjectLoadSchema.safeParse({
      items: [{ yearMonth: '2026-01', manhour: 100 }],
    })
    expect(result.success).toBe(false)
  })

  it('manhourが負の場合エラー', () => {
    const result = bulkProjectLoadSchema.safeParse({
      items: [{ yearMonth: '202601', manhour: -1 }],
    })
    expect(result.success).toBe(false)
  })

  it('manhourが99999999を超える場合エラー', () => {
    const result = bulkProjectLoadSchema.safeParse({
      items: [{ yearMonth: '202601', manhour: 100000000 }],
    })
    expect(result.success).toBe(false)
  })

  it('manhourが99999999の場合受け入れる', () => {
    const result = bulkProjectLoadSchema.safeParse({
      items: [{ yearMonth: '202601', manhour: 99999999 }],
    })
    expect(result.success).toBe(true)
  })
})
