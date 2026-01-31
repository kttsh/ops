import { describe, test, expect } from 'vitest'
import {
  toSummaryResponse,
  toDetailResponse,
  toWeightResponse,
} from '@/transform/standardEffortMasterTransform'
import type {
  StandardEffortMasterRow,
  StandardEffortWeightRow,
} from '@/types/standardEffortMaster'

const sampleMasterRow: StandardEffortMasterRow = {
  standard_effort_id: 1,
  business_unit_code: 'BU-001',
  project_type_code: 'PT-001',
  name: 'Sカーブパターン',
  created_at: new Date('2026-01-01T00:00:00Z'),
  updated_at: new Date('2026-01-15T00:00:00Z'),
  deleted_at: null,
}

const sampleWeightRows: StandardEffortWeightRow[] = [
  {
    standard_effort_weight_id: 1,
    standard_effort_id: 1,
    progress_rate: 0,
    weight: 0,
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
  },
  {
    standard_effort_weight_id: 2,
    standard_effort_id: 1,
    progress_rate: 50,
    weight: 10,
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
  },
  {
    standard_effort_weight_id: 3,
    standard_effort_id: 1,
    progress_rate: 100,
    weight: 0,
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
  },
]

describe('toSummaryResponse', () => {
  test('snake_case から camelCase に変換する', () => {
    const result = toSummaryResponse(sampleMasterRow)

    expect(result).toEqual({
      standardEffortId: 1,
      businessUnitCode: 'BU-001',
      projectTypeCode: 'PT-001',
      name: 'Sカーブパターン',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-15T00:00:00.000Z',
    })
  })

  test('日時を ISO 8601 形式の文字列に変換する', () => {
    const result = toSummaryResponse(sampleMasterRow)

    expect(typeof result.createdAt).toBe('string')
    expect(typeof result.updatedAt).toBe('string')
    expect(result.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    expect(result.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  })

  test('deleted_at はレスポンスに含まれない', () => {
    const result = toSummaryResponse(sampleMasterRow)
    expect(result).not.toHaveProperty('deletedAt')
    expect(result).not.toHaveProperty('deleted_at')
  })
})

describe('toWeightResponse', () => {
  test('snake_case から camelCase に変換する', () => {
    const result = toWeightResponse(sampleWeightRows[1])

    expect(result).toEqual({
      standardEffortWeightId: 2,
      progressRate: 50,
      weight: 10,
    })
  })

  test('created_at / updated_at はレスポンスに含まれない', () => {
    const result = toWeightResponse(sampleWeightRows[0])
    expect(result).not.toHaveProperty('createdAt')
    expect(result).not.toHaveProperty('created_at')
    expect(result).not.toHaveProperty('updatedAt')
    expect(result).not.toHaveProperty('updated_at')
  })

  test('weight が 0 の場合も正しく変換する', () => {
    const result = toWeightResponse(sampleWeightRows[0])
    expect(result.weight).toBe(0)
    expect(result.progressRate).toBe(0)
  })
})

describe('toDetailResponse', () => {
  test('マスタと weights を結合して詳細レスポンスに変換する', () => {
    const result = toDetailResponse(sampleMasterRow, sampleWeightRows)

    expect(result).toEqual({
      standardEffortId: 1,
      businessUnitCode: 'BU-001',
      projectTypeCode: 'PT-001',
      name: 'Sカーブパターン',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-15T00:00:00.000Z',
      weights: [
        { standardEffortWeightId: 1, progressRate: 0, weight: 0 },
        { standardEffortWeightId: 2, progressRate: 50, weight: 10 },
        { standardEffortWeightId: 3, progressRate: 100, weight: 0 },
      ],
    })
  })

  test('weights が空配列の場合も正しく変換する', () => {
    const result = toDetailResponse(sampleMasterRow, [])

    expect(result.weights).toEqual([])
    expect(result.standardEffortId).toBe(1)
  })
})
