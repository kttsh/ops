import { describe, it, expect } from 'vitest'
import {
  createProjectSchema,
  updateProjectSchema,
  projectSearchSchema,
  PROJECT_STATUSES,
} from '../types'

describe('createProjectSchema', () => {
  const validInput = {
    projectCode: 'PRJ001',
    name: 'テストプロジェクト',
    businessUnitCode: 'BU001',
    startYearMonth: '202601',
    totalManhour: 100,
    status: 'planning',
  }

  it('有効な入力を受け入れる', () => {
    const result = createProjectSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('任意フィールド付きの入力を受け入れる', () => {
    const result = createProjectSchema.safeParse({
      ...validInput,
      projectTypeCode: 'PT001',
      durationMonths: 12,
    })
    expect(result.success).toBe(true)
  })

  it('案件コードが空の場合エラー', () => {
    const result = createProjectSchema.safeParse({
      ...validInput,
      projectCode: '',
    })
    expect(result.success).toBe(false)
  })

  it('案件コードが20文字を超える場合エラー', () => {
    const result = createProjectSchema.safeParse({
      ...validInput,
      projectCode: 'A'.repeat(21),
    })
    expect(result.success).toBe(false)
  })

  it('案件コードに不正な文字が含まれる場合エラー', () => {
    const result = createProjectSchema.safeParse({
      ...validInput,
      projectCode: 'PRJ 001',
    })
    expect(result.success).toBe(false)
  })

  it('名称が空の場合エラー', () => {
    const result = createProjectSchema.safeParse({
      ...validInput,
      name: '',
    })
    expect(result.success).toBe(false)
  })

  it('名称が200文字を超える場合エラー', () => {
    const result = createProjectSchema.safeParse({
      ...validInput,
      name: 'あ'.repeat(201),
    })
    expect(result.success).toBe(false)
  })

  it('事業部コードが空の場合エラー', () => {
    const result = createProjectSchema.safeParse({
      ...validInput,
      businessUnitCode: '',
    })
    expect(result.success).toBe(false)
  })

  it('開始年月が空の場合エラー', () => {
    const result = createProjectSchema.safeParse({
      ...validInput,
      startYearMonth: '',
    })
    expect(result.success).toBe(false)
  })

  it('開始年月がYYYYMM形式でない場合エラー', () => {
    const result = createProjectSchema.safeParse({
      ...validInput,
      startYearMonth: '2026-01',
    })
    expect(result.success).toBe(false)
  })

  it('開始年月が6桁数字の場合受け入れる', () => {
    const result = createProjectSchema.safeParse({
      ...validInput,
      startYearMonth: '202612',
    })
    expect(result.success).toBe(true)
  })

  it('総工数が0以下の場合エラー', () => {
    const result = createProjectSchema.safeParse({
      ...validInput,
      totalManhour: 0,
    })
    expect(result.success).toBe(false)
  })

  it('総工数が正の数の場合受け入れる', () => {
    const result = createProjectSchema.safeParse({
      ...validInput,
      totalManhour: 0.5,
    })
    expect(result.success).toBe(true)
  })

  it('ステータスが空の場合エラー', () => {
    const result = createProjectSchema.safeParse({
      ...validInput,
      status: '',
    })
    expect(result.success).toBe(false)
  })

  it('期間月数がnullの場合受け入れる', () => {
    const result = createProjectSchema.safeParse({
      ...validInput,
      durationMonths: null,
    })
    expect(result.success).toBe(true)
  })

  it('期間月数が正の整数の場合受け入れる', () => {
    const result = createProjectSchema.safeParse({
      ...validInput,
      durationMonths: 12,
    })
    expect(result.success).toBe(true)
  })

  it('期間月数が0以下の場合エラー', () => {
    const result = createProjectSchema.safeParse({
      ...validInput,
      durationMonths: 0,
    })
    expect(result.success).toBe(false)
  })

  it('期間月数が小数の場合エラー', () => {
    const result = createProjectSchema.safeParse({
      ...validInput,
      durationMonths: 1.5,
    })
    expect(result.success).toBe(false)
  })
})

describe('updateProjectSchema', () => {
  it('少なくとも1つのフィールドがあれば受け入れる', () => {
    const result = updateProjectSchema.safeParse({ name: '更新名称' })
    expect(result.success).toBe(true)
  })

  it('複数フィールドの部分更新を受け入れる', () => {
    const result = updateProjectSchema.safeParse({
      name: '更新名称',
      totalManhour: 200,
    })
    expect(result.success).toBe(true)
  })

  it('空オブジェクトの場合エラー', () => {
    const result = updateProjectSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('projectTypeCodeにnullを設定可能', () => {
    const result = updateProjectSchema.safeParse({
      projectTypeCode: null,
    })
    expect(result.success).toBe(true)
  })
})

describe('projectSearchSchema', () => {
  it('デフォルト値が正しく設定される', () => {
    const result = projectSearchSchema.parse({})
    expect(result).toEqual({
      page: 1,
      pageSize: 20,
      search: '',
      includeDisabled: false,
    })
  })

  it('不正な値がcatchでデフォルトに置換される', () => {
    const result = projectSearchSchema.parse({
      page: 'invalid',
      pageSize: -1,
      search: 123,
      includeDisabled: 'yes',
    })
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(20)
    expect(result.search).toBe('')
    expect(result.includeDisabled).toBe(false)
  })

  it('有効な値を保持する', () => {
    const result = projectSearchSchema.parse({
      page: 3,
      pageSize: 50,
      search: 'テスト',
      includeDisabled: true,
    })
    expect(result).toEqual({
      page: 3,
      pageSize: 50,
      search: 'テスト',
      includeDisabled: true,
    })
  })
})

describe('PROJECT_STATUSES', () => {
  it('計画と確定のステータスが定義されている', () => {
    expect(PROJECT_STATUSES).toHaveLength(2)
    expect(PROJECT_STATUSES[0]).toEqual({ value: 'planning', label: '計画' })
    expect(PROJECT_STATUSES[1]).toEqual({ value: 'confirmed', label: '確定' })
  })
})
