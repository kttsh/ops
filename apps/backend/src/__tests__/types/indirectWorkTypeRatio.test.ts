import { describe, test, expect } from 'vitest'
import {
  createIndirectWorkTypeRatioSchema,
  updateIndirectWorkTypeRatioSchema,
  bulkUpsertIndirectWorkTypeRatioSchema,
} from '@/types/indirectWorkTypeRatio'

// =============================================================================
// createIndirectWorkTypeRatioSchema
// =============================================================================
describe('createIndirectWorkTypeRatioSchema', () => {
  test('正常値を受け付ける', () => {
    const result = createIndirectWorkTypeRatioSchema.safeParse({
      workTypeCode: 'DESIGN',
      fiscalYear: 2026,
      ratio: 0.5,
    })
    expect(result.success).toBe(true)
  })

  test('ratio の下限値 0.0000 を受け付ける', () => {
    const result = createIndirectWorkTypeRatioSchema.safeParse({
      workTypeCode: 'DESIGN',
      fiscalYear: 2026,
      ratio: 0,
    })
    expect(result.success).toBe(true)
  })

  test('ratio の上限値 1.0000 を受け付ける', () => {
    const result = createIndirectWorkTypeRatioSchema.safeParse({
      workTypeCode: 'DESIGN',
      fiscalYear: 2026,
      ratio: 1,
    })
    expect(result.success).toBe(true)
  })

  test('ratio が負値の場合はエラーを返す', () => {
    const result = createIndirectWorkTypeRatioSchema.safeParse({
      workTypeCode: 'DESIGN',
      fiscalYear: 2026,
      ratio: -0.001,
    })
    expect(result.success).toBe(false)
  })

  test('ratio が 1 を超える場合はエラーを返す', () => {
    const result = createIndirectWorkTypeRatioSchema.safeParse({
      workTypeCode: 'DESIGN',
      fiscalYear: 2026,
      ratio: 1.001,
    })
    expect(result.success).toBe(false)
  })

  test('workTypeCode が 20 文字を超える場合はエラーを返す', () => {
    const result = createIndirectWorkTypeRatioSchema.safeParse({
      workTypeCode: 'A'.repeat(21),
      fiscalYear: 2026,
      ratio: 0.5,
    })
    expect(result.success).toBe(false)
  })

  test('workTypeCode が 20 文字ちょうどの場合は受け付ける', () => {
    const result = createIndirectWorkTypeRatioSchema.safeParse({
      workTypeCode: 'A'.repeat(20),
      fiscalYear: 2026,
      ratio: 0.5,
    })
    expect(result.success).toBe(true)
  })

  test('fiscalYear が小数の場合はエラーを返す', () => {
    const result = createIndirectWorkTypeRatioSchema.safeParse({
      workTypeCode: 'DESIGN',
      fiscalYear: 2026.5,
      ratio: 0.5,
    })
    expect(result.success).toBe(false)
  })

  test('workTypeCode が欠落している場合はエラーを返す', () => {
    const result = createIndirectWorkTypeRatioSchema.safeParse({
      fiscalYear: 2026,
      ratio: 0.5,
    })
    expect(result.success).toBe(false)
  })

  test('fiscalYear が欠落している場合はエラーを返す', () => {
    const result = createIndirectWorkTypeRatioSchema.safeParse({
      workTypeCode: 'DESIGN',
      ratio: 0.5,
    })
    expect(result.success).toBe(false)
  })

  test('ratio が欠落している場合はエラーを返す', () => {
    const result = createIndirectWorkTypeRatioSchema.safeParse({
      workTypeCode: 'DESIGN',
      fiscalYear: 2026,
    })
    expect(result.success).toBe(false)
  })
})

// =============================================================================
// updateIndirectWorkTypeRatioSchema
// =============================================================================
describe('updateIndirectWorkTypeRatioSchema', () => {
  test('全フィールドを受け付ける', () => {
    const result = updateIndirectWorkTypeRatioSchema.safeParse({
      workTypeCode: 'REVIEW',
      fiscalYear: 2027,
      ratio: 0.3,
    })
    expect(result.success).toBe(true)
  })

  test('部分更新（ratio のみ）を受け付ける', () => {
    const result = updateIndirectWorkTypeRatioSchema.safeParse({
      ratio: 0.8,
    })
    expect(result.success).toBe(true)
  })

  test('空オブジェクトを受け付ける', () => {
    const result = updateIndirectWorkTypeRatioSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  test('ratio が範囲外の場合はエラーを返す', () => {
    const result = updateIndirectWorkTypeRatioSchema.safeParse({
      ratio: 1.5,
    })
    expect(result.success).toBe(false)
  })
})

// =============================================================================
// bulkUpsertIndirectWorkTypeRatioSchema
// =============================================================================
describe('bulkUpsertIndirectWorkTypeRatioSchema', () => {
  test('複数アイテムを受け付ける', () => {
    const result = bulkUpsertIndirectWorkTypeRatioSchema.safeParse({
      items: [
        { workTypeCode: 'DESIGN', fiscalYear: 2026, ratio: 0.5 },
        { workTypeCode: 'REVIEW', fiscalYear: 2026, ratio: 0.3 },
      ],
    })
    expect(result.success).toBe(true)
  })

  test('1 アイテムを受け付ける', () => {
    const result = bulkUpsertIndirectWorkTypeRatioSchema.safeParse({
      items: [{ workTypeCode: 'DESIGN', fiscalYear: 2026, ratio: 0.5 }],
    })
    expect(result.success).toBe(true)
  })

  test('空配列の場合はエラーを返す', () => {
    const result = bulkUpsertIndirectWorkTypeRatioSchema.safeParse({
      items: [],
    })
    expect(result.success).toBe(false)
  })

  test('アイテム内のバリデーションが効く', () => {
    const result = bulkUpsertIndirectWorkTypeRatioSchema.safeParse({
      items: [{ workTypeCode: 'DESIGN', fiscalYear: 2026, ratio: 2.0 }],
    })
    expect(result.success).toBe(false)
  })
})
