import { describe, test, expect } from 'vitest'
import {
  weightItemSchema,
  createStandardEffortMasterSchema,
  updateStandardEffortMasterSchema,
  standardEffortMasterListQuerySchema,
} from '@/types/standardEffortMaster'

describe('weightItemSchema', () => {
  test('有効な重み要素を受け付ける', () => {
    const result = weightItemSchema.safeParse({ progressRate: 50, weight: 10 })
    expect(result.success).toBe(true)
  })

  test('progressRate が 0 を受け付ける', () => {
    const result = weightItemSchema.safeParse({ progressRate: 0, weight: 0 })
    expect(result.success).toBe(true)
  })

  test('progressRate が 100 を受け付ける', () => {
    const result = weightItemSchema.safeParse({ progressRate: 100, weight: 5 })
    expect(result.success).toBe(true)
  })

  test('progressRate が 101 以上で失敗する', () => {
    const result = weightItemSchema.safeParse({ progressRate: 101, weight: 5 })
    expect(result.success).toBe(false)
  })

  test('progressRate が負数で失敗する', () => {
    const result = weightItemSchema.safeParse({ progressRate: -1, weight: 5 })
    expect(result.success).toBe(false)
  })

  test('progressRate が小数で失敗する', () => {
    const result = weightItemSchema.safeParse({ progressRate: 50.5, weight: 5 })
    expect(result.success).toBe(false)
  })

  test('weight が負数で失敗する', () => {
    const result = weightItemSchema.safeParse({ progressRate: 50, weight: -1 })
    expect(result.success).toBe(false)
  })

  test('weight が小数で失敗する', () => {
    const result = weightItemSchema.safeParse({ progressRate: 50, weight: 1.5 })
    expect(result.success).toBe(false)
  })

  test('progressRate が欠落で失敗する', () => {
    const result = weightItemSchema.safeParse({ weight: 5 })
    expect(result.success).toBe(false)
  })

  test('weight が欠落で失敗する', () => {
    const result = weightItemSchema.safeParse({ progressRate: 50 })
    expect(result.success).toBe(false)
  })
})

describe('createStandardEffortMasterSchema', () => {
  const validInput = {
    businessUnitCode: 'BU-001',
    projectTypeCode: 'PT-001',
    name: 'Sカーブパターン',
  }

  test('有効な入力を受け付ける（weights なし）', () => {
    const result = createStandardEffortMasterSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  test('有効な入力を受け付ける（weights あり）', () => {
    const result = createStandardEffortMasterSchema.safeParse({
      ...validInput,
      weights: [
        { progressRate: 0, weight: 0 },
        { progressRate: 50, weight: 10 },
        { progressRate: 100, weight: 0 },
      ],
    })
    expect(result.success).toBe(true)
  })

  test('businessUnitCode が空文字で失敗する', () => {
    const result = createStandardEffortMasterSchema.safeParse({
      ...validInput,
      businessUnitCode: '',
    })
    expect(result.success).toBe(false)
  })

  test('businessUnitCode が 20 文字を超えると失敗する', () => {
    const result = createStandardEffortMasterSchema.safeParse({
      ...validInput,
      businessUnitCode: 'A'.repeat(21),
    })
    expect(result.success).toBe(false)
  })

  test('businessUnitCode に不正文字を含むと失敗する', () => {
    const result = createStandardEffortMasterSchema.safeParse({
      ...validInput,
      businessUnitCode: 'BU 001',
    })
    expect(result.success).toBe(false)
  })

  test('businessUnitCode にハイフンとアンダースコアを受け付ける', () => {
    const result = createStandardEffortMasterSchema.safeParse({
      ...validInput,
      businessUnitCode: 'BU_001-A',
    })
    expect(result.success).toBe(true)
  })

  test('projectTypeCode が空文字で失敗する', () => {
    const result = createStandardEffortMasterSchema.safeParse({
      ...validInput,
      projectTypeCode: '',
    })
    expect(result.success).toBe(false)
  })

  test('projectTypeCode が 20 文字を超えると失敗する', () => {
    const result = createStandardEffortMasterSchema.safeParse({
      ...validInput,
      projectTypeCode: 'A'.repeat(21),
    })
    expect(result.success).toBe(false)
  })

  test('projectTypeCode に不正文字を含むと失敗する', () => {
    const result = createStandardEffortMasterSchema.safeParse({
      ...validInput,
      projectTypeCode: 'PT@001',
    })
    expect(result.success).toBe(false)
  })

  test('name が空文字で失敗する', () => {
    const result = createStandardEffortMasterSchema.safeParse({
      ...validInput,
      name: '',
    })
    expect(result.success).toBe(false)
  })

  test('name が 100 文字を超えると失敗する', () => {
    const result = createStandardEffortMasterSchema.safeParse({
      ...validInput,
      name: 'あ'.repeat(101),
    })
    expect(result.success).toBe(false)
  })

  test('name が 100 文字ちょうどは受け付ける', () => {
    const result = createStandardEffortMasterSchema.safeParse({
      ...validInput,
      name: 'あ'.repeat(100),
    })
    expect(result.success).toBe(true)
  })

  test('businessUnitCode が欠落で失敗する', () => {
    const { businessUnitCode, ...rest } = validInput
    const result = createStandardEffortMasterSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  test('projectTypeCode が欠落で失敗する', () => {
    const { projectTypeCode, ...rest } = validInput
    const result = createStandardEffortMasterSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  test('name が欠落で失敗する', () => {
    const { name, ...rest } = validInput
    const result = createStandardEffortMasterSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  test('weights 内の不正要素で失敗する', () => {
    const result = createStandardEffortMasterSchema.safeParse({
      ...validInput,
      weights: [{ progressRate: 200, weight: -1 }],
    })
    expect(result.success).toBe(false)
  })
})

describe('updateStandardEffortMasterSchema', () => {
  test('name のみで受け付ける', () => {
    const result = updateStandardEffortMasterSchema.safeParse({ name: '更新名' })
    expect(result.success).toBe(true)
  })

  test('weights のみで受け付ける', () => {
    const result = updateStandardEffortMasterSchema.safeParse({
      weights: [{ progressRate: 50, weight: 10 }],
    })
    expect(result.success).toBe(true)
  })

  test('name と weights 両方で受け付ける', () => {
    const result = updateStandardEffortMasterSchema.safeParse({
      name: '更新名',
      weights: [{ progressRate: 50, weight: 10 }],
    })
    expect(result.success).toBe(true)
  })

  test('空オブジェクトを受け付ける', () => {
    const result = updateStandardEffortMasterSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  test('name が空文字で失敗する', () => {
    const result = updateStandardEffortMasterSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })

  test('name が 100 文字を超えると失敗する', () => {
    const result = updateStandardEffortMasterSchema.safeParse({
      name: 'あ'.repeat(101),
    })
    expect(result.success).toBe(false)
  })

  test('weights 内の不正要素で失敗する', () => {
    const result = updateStandardEffortMasterSchema.safeParse({
      weights: [{ progressRate: -1, weight: 0 }],
    })
    expect(result.success).toBe(false)
  })
})

describe('standardEffortMasterListQuerySchema', () => {
  test('デフォルト値を適用する', () => {
    const result = standardEffortMasterListQuerySchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data['page[number]']).toBe(1)
      expect(result.data['page[size]']).toBe(20)
      expect(result.data['filter[includeDisabled]']).toBe(false)
    }
  })

  test('ページネーションパラメータを受け付ける', () => {
    const result = standardEffortMasterListQuerySchema.safeParse({
      'page[number]': '2',
      'page[size]': '10',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data['page[number]']).toBe(2)
      expect(result.data['page[size]']).toBe(10)
    }
  })

  test('filter[includeDisabled]=true を受け付ける', () => {
    const result = standardEffortMasterListQuerySchema.safeParse({
      'filter[includeDisabled]': 'true',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data['filter[includeDisabled]']).toBe(true)
    }
  })

  test('filter[businessUnitCode] を受け付ける', () => {
    const result = standardEffortMasterListQuerySchema.safeParse({
      'filter[businessUnitCode]': 'BU-001',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data['filter[businessUnitCode]']).toBe('BU-001')
    }
  })

  test('filter[projectTypeCode] を受け付ける', () => {
    const result = standardEffortMasterListQuerySchema.safeParse({
      'filter[projectTypeCode]': 'PT-001',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data['filter[projectTypeCode]']).toBe('PT-001')
    }
  })

  test('page[number] が 0 以下で失敗する', () => {
    const result = standardEffortMasterListQuerySchema.safeParse({
      'page[number]': '0',
    })
    expect(result.success).toBe(false)
  })

  test('page[size] が 0 以下で失敗する', () => {
    const result = standardEffortMasterListQuerySchema.safeParse({
      'page[size]': '0',
    })
    expect(result.success).toBe(false)
  })
})
