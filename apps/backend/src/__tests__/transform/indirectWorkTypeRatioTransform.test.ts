import { describe, test, expect } from 'vitest'
import { toIndirectWorkTypeRatioResponse } from '@/transform/indirectWorkTypeRatioTransform'
import type { IndirectWorkTypeRatioRow } from '@/types/indirectWorkTypeRatio'

describe('toIndirectWorkTypeRatioResponse', () => {
  const sampleRow: IndirectWorkTypeRatioRow = {
    indirect_work_type_ratio_id: 1,
    indirect_work_case_id: 10,
    work_type_code: 'DESIGN',
    fiscal_year: 2026,
    ratio: 0.5,
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-15T00:00:00.000Z'),
  }

  test('snake_case から camelCase に変換する', () => {
    const result = toIndirectWorkTypeRatioResponse(sampleRow)

    expect(result.indirectWorkTypeRatioId).toBe(1)
    expect(result.indirectWorkCaseId).toBe(10)
    expect(result.workTypeCode).toBe('DESIGN')
    expect(result.fiscalYear).toBe(2026)
  })

  test('Date 型を ISO 8601 文字列に変換する', () => {
    const result = toIndirectWorkTypeRatioResponse(sampleRow)

    expect(result.createdAt).toBe('2026-01-01T00:00:00.000Z')
    expect(result.updatedAt).toBe('2026-01-15T00:00:00.000Z')
  })

  test('ratio を数値型のまま維持する', () => {
    const result = toIndirectWorkTypeRatioResponse(sampleRow)

    expect(result.ratio).toBe(0.5)
    expect(typeof result.ratio).toBe('number')
  })

  test('ratio が 0 の場合も数値型で維持する', () => {
    const row: IndirectWorkTypeRatioRow = { ...sampleRow, ratio: 0 }
    const result = toIndirectWorkTypeRatioResponse(row)

    expect(result.ratio).toBe(0)
    expect(typeof result.ratio).toBe('number')
  })

  test('ratio が 1 の場合も数値型で維持する', () => {
    const row: IndirectWorkTypeRatioRow = { ...sampleRow, ratio: 1 }
    const result = toIndirectWorkTypeRatioResponse(row)

    expect(result.ratio).toBe(1)
    expect(typeof result.ratio).toBe('number')
  })
})
