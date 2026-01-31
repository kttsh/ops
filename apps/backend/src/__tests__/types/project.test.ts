import { describe, it, expect } from 'vitest'
import {
  createProjectSchema,
  updateProjectSchema,
  projectListQuerySchema,
} from '@/types/project'

describe('createProjectSchema', () => {
  const validData = {
    projectCode: 'PRJ-001',
    name: 'テスト案件',
    businessUnitCode: 'BU-001',
    startYearMonth: '202601',
    totalManhour: 100,
    status: 'ACTIVE',
  }

  it('有効な入力を受け付ける（必須フィールドのみ）', () => {
    const result = createProjectSchema.safeParse(validData)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(validData)
    }
  })

  it('有効な入力を受け付ける（任意フィールド含む）', () => {
    const result = createProjectSchema.safeParse({
      ...validData,
      projectTypeCode: 'PT-001',
      durationMonths: 12,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.projectTypeCode).toBe('PT-001')
      expect(result.data.durationMonths).toBe(12)
    }
  })

  describe('projectCode のバリデーション', () => {
    it('空文字を拒否する', () => {
      const result = createProjectSchema.safeParse({ ...validData, projectCode: '' })
      expect(result.success).toBe(false)
    })

    it('121文字以上を拒否する', () => {
      const result = createProjectSchema.safeParse({
        ...validData,
        projectCode: 'a'.repeat(121),
      })
      expect(result.success).toBe(false)
    })

    it('120文字を受け付ける', () => {
      const result = createProjectSchema.safeParse({
        ...validData,
        projectCode: 'a'.repeat(120),
      })
      expect(result.success).toBe(true)
    })

    it('1文字を受け付ける', () => {
      const result = createProjectSchema.safeParse({
        ...validData,
        projectCode: 'P',
      })
      expect(result.success).toBe(true)
    })

    it('未指定を拒否する', () => {
      const { projectCode: _, ...rest } = validData
      const result = createProjectSchema.safeParse(rest)
      expect(result.success).toBe(false)
    })
  })

  describe('name のバリデーション', () => {
    it('空文字を拒否する', () => {
      const result = createProjectSchema.safeParse({ ...validData, name: '' })
      expect(result.success).toBe(false)
    })

    it('121文字以上を拒否する', () => {
      const result = createProjectSchema.safeParse({
        ...validData,
        name: 'あ'.repeat(121),
      })
      expect(result.success).toBe(false)
    })

    it('120文字を受け付ける', () => {
      const result = createProjectSchema.safeParse({
        ...validData,
        name: 'あ'.repeat(120),
      })
      expect(result.success).toBe(true)
    })

    it('未指定を拒否する', () => {
      const { name: _, ...rest } = validData
      const result = createProjectSchema.safeParse(rest)
      expect(result.success).toBe(false)
    })
  })

  describe('businessUnitCode のバリデーション', () => {
    it('空文字を拒否する', () => {
      const result = createProjectSchema.safeParse({ ...validData, businessUnitCode: '' })
      expect(result.success).toBe(false)
    })

    it('21文字以上を拒否する', () => {
      const result = createProjectSchema.safeParse({
        ...validData,
        businessUnitCode: 'a'.repeat(21),
      })
      expect(result.success).toBe(false)
    })

    it('20文字を受け付ける', () => {
      const result = createProjectSchema.safeParse({
        ...validData,
        businessUnitCode: 'a'.repeat(20),
      })
      expect(result.success).toBe(true)
    })

    it('英数字・ハイフン・アンダースコアを受け付ける', () => {
      const result = createProjectSchema.safeParse({
        ...validData,
        businessUnitCode: 'BU_test-01',
      })
      expect(result.success).toBe(true)
    })

    it('スペースを含む文字列を拒否する', () => {
      const result = createProjectSchema.safeParse({
        ...validData,
        businessUnitCode: 'BU 001',
      })
      expect(result.success).toBe(false)
    })

    it('日本語文字を拒否する', () => {
      const result = createProjectSchema.safeParse({
        ...validData,
        businessUnitCode: 'テスト',
      })
      expect(result.success).toBe(false)
    })

    it('特殊文字を拒否する', () => {
      const result = createProjectSchema.safeParse({
        ...validData,
        businessUnitCode: 'BU@001',
      })
      expect(result.success).toBe(false)
    })

    it('未指定を拒否する', () => {
      const { businessUnitCode: _, ...rest } = validData
      const result = createProjectSchema.safeParse(rest)
      expect(result.success).toBe(false)
    })
  })

  describe('startYearMonth のバリデーション', () => {
    it('YYYYMM 形式の6桁数字を受け付ける', () => {
      const result = createProjectSchema.safeParse({ ...validData, startYearMonth: '202601' })
      expect(result.success).toBe(true)
    })

    it('5桁を拒否する', () => {
      const result = createProjectSchema.safeParse({ ...validData, startYearMonth: '20261' })
      expect(result.success).toBe(false)
    })

    it('7桁を拒否する', () => {
      const result = createProjectSchema.safeParse({ ...validData, startYearMonth: '2026010' })
      expect(result.success).toBe(false)
    })

    it('英字を含む場合を拒否する', () => {
      const result = createProjectSchema.safeParse({ ...validData, startYearMonth: '2026ab' })
      expect(result.success).toBe(false)
    })

    it('空文字を拒否する', () => {
      const result = createProjectSchema.safeParse({ ...validData, startYearMonth: '' })
      expect(result.success).toBe(false)
    })

    it('未指定を拒否する', () => {
      const { startYearMonth: _, ...rest } = validData
      const result = createProjectSchema.safeParse(rest)
      expect(result.success).toBe(false)
    })
  })

  describe('totalManhour のバリデーション', () => {
    it('正の整数を受け付ける', () => {
      const result = createProjectSchema.safeParse({ ...validData, totalManhour: 1 })
      expect(result.success).toBe(true)
    })

    it('0 を拒否する', () => {
      const result = createProjectSchema.safeParse({ ...validData, totalManhour: 0 })
      expect(result.success).toBe(false)
    })

    it('負の数を拒否する', () => {
      const result = createProjectSchema.safeParse({ ...validData, totalManhour: -1 })
      expect(result.success).toBe(false)
    })

    it('小数を拒否する', () => {
      const result = createProjectSchema.safeParse({ ...validData, totalManhour: 1.5 })
      expect(result.success).toBe(false)
    })

    it('未指定を拒否する', () => {
      const { totalManhour: _, ...rest } = validData
      const result = createProjectSchema.safeParse(rest)
      expect(result.success).toBe(false)
    })
  })

  describe('status のバリデーション', () => {
    it('空文字を拒否する', () => {
      const result = createProjectSchema.safeParse({ ...validData, status: '' })
      expect(result.success).toBe(false)
    })

    it('21文字以上を拒否する', () => {
      const result = createProjectSchema.safeParse({
        ...validData,
        status: 'a'.repeat(21),
      })
      expect(result.success).toBe(false)
    })

    it('20文字を受け付ける', () => {
      const result = createProjectSchema.safeParse({
        ...validData,
        status: 'a'.repeat(20),
      })
      expect(result.success).toBe(true)
    })

    it('未指定を拒否する', () => {
      const { status: _, ...rest } = validData
      const result = createProjectSchema.safeParse(rest)
      expect(result.success).toBe(false)
    })
  })

  describe('projectTypeCode のバリデーション（任意）', () => {
    it('省略できる', () => {
      const result = createProjectSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.projectTypeCode).toBeUndefined()
      }
    })

    it('空文字を拒否する', () => {
      const result = createProjectSchema.safeParse({ ...validData, projectTypeCode: '' })
      expect(result.success).toBe(false)
    })

    it('21文字以上を拒否する', () => {
      const result = createProjectSchema.safeParse({
        ...validData,
        projectTypeCode: 'a'.repeat(21),
      })
      expect(result.success).toBe(false)
    })

    it('20文字を受け付ける', () => {
      const result = createProjectSchema.safeParse({
        ...validData,
        projectTypeCode: 'a'.repeat(20),
      })
      expect(result.success).toBe(true)
    })

    it('英数字・ハイフン・アンダースコアを受け付ける', () => {
      const result = createProjectSchema.safeParse({
        ...validData,
        projectTypeCode: 'PT_test-01',
      })
      expect(result.success).toBe(true)
    })

    it('特殊文字を拒否する', () => {
      const result = createProjectSchema.safeParse({
        ...validData,
        projectTypeCode: 'PT@001',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('durationMonths のバリデーション（任意）', () => {
    it('省略できる', () => {
      const result = createProjectSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.durationMonths).toBeUndefined()
      }
    })

    it('正の整数を受け付ける', () => {
      const result = createProjectSchema.safeParse({ ...validData, durationMonths: 6 })
      expect(result.success).toBe(true)
    })

    it('0 を拒否する', () => {
      const result = createProjectSchema.safeParse({ ...validData, durationMonths: 0 })
      expect(result.success).toBe(false)
    })

    it('負の数を拒否する', () => {
      const result = createProjectSchema.safeParse({ ...validData, durationMonths: -1 })
      expect(result.success).toBe(false)
    })

    it('小数を拒否する', () => {
      const result = createProjectSchema.safeParse({ ...validData, durationMonths: 1.5 })
      expect(result.success).toBe(false)
    })
  })
})

describe('updateProjectSchema', () => {
  it('有効な入力を受け付ける（単一フィールド）', () => {
    const result = updateProjectSchema.safeParse({ name: '更新後の名前' })
    expect(result.success).toBe(true)
  })

  it('有効な入力を受け付ける（複数フィールド）', () => {
    const result = updateProjectSchema.safeParse({
      projectCode: 'PRJ-002',
      name: '更新後の名前',
      totalManhour: 200,
    })
    expect(result.success).toBe(true)
  })

  it('空のボディを拒否する', () => {
    const result = updateProjectSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('projectTypeCode に null を許容する（値の解除）', () => {
    const result = updateProjectSchema.safeParse({ projectTypeCode: null })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.projectTypeCode).toBeNull()
    }
  })

  it('durationMonths に null を許容する（値の解除）', () => {
    const result = updateProjectSchema.safeParse({ durationMonths: null })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.durationMonths).toBeNull()
    }
  })

  it('projectCode の空文字を拒否する', () => {
    const result = updateProjectSchema.safeParse({ projectCode: '' })
    expect(result.success).toBe(false)
  })

  it('projectCode の121文字以上を拒否する', () => {
    const result = updateProjectSchema.safeParse({ projectCode: 'a'.repeat(121) })
    expect(result.success).toBe(false)
  })

  it('name の空文字を拒否する', () => {
    const result = updateProjectSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })

  it('businessUnitCode の不正文字を拒否する', () => {
    const result = updateProjectSchema.safeParse({ businessUnitCode: 'BU@001' })
    expect(result.success).toBe(false)
  })

  it('startYearMonth の不正形式を拒否する', () => {
    const result = updateProjectSchema.safeParse({ startYearMonth: '2026' })
    expect(result.success).toBe(false)
  })

  it('totalManhour の 0 を拒否する', () => {
    const result = updateProjectSchema.safeParse({ totalManhour: 0 })
    expect(result.success).toBe(false)
  })

  it('totalManhour の負の数を拒否する', () => {
    const result = updateProjectSchema.safeParse({ totalManhour: -1 })
    expect(result.success).toBe(false)
  })

  it('status の空文字を拒否する', () => {
    const result = updateProjectSchema.safeParse({ status: '' })
    expect(result.success).toBe(false)
  })
})

describe('projectListQuerySchema', () => {
  it('デフォルト値を設定する', () => {
    const result = projectListQuerySchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({
        'page[number]': 1,
        'page[size]': 20,
        'filter[includeDisabled]': false,
      })
    }
  })

  it('指定された値を受け付ける', () => {
    const result = projectListQuerySchema.safeParse({
      'page[number]': '2',
      'page[size]': '50',
      'filter[includeDisabled]': 'true',
      'filter[businessUnitCode]': 'BU-001',
      'filter[status]': 'ACTIVE',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({
        'page[number]': 2,
        'page[size]': 50,
        'filter[includeDisabled]': true,
        'filter[businessUnitCode]': 'BU-001',
        'filter[status]': 'ACTIVE',
      })
    }
  })

  it('page[number] が 0 以下を拒否する', () => {
    const result = projectListQuerySchema.safeParse({ 'page[number]': '0' })
    expect(result.success).toBe(false)
  })

  it('page[size] が 0 以下を拒否する', () => {
    const result = projectListQuerySchema.safeParse({ 'page[size]': '0' })
    expect(result.success).toBe(false)
  })

  it('page[size] が 1000 を超える場合を拒否する', () => {
    const result = projectListQuerySchema.safeParse({ 'page[size]': '1001' })
    expect(result.success).toBe(false)
  })

  it('page[size] が 1000 を受け付ける', () => {
    const result = projectListQuerySchema.safeParse({ 'page[size]': '1000' })
    expect(result.success).toBe(true)
  })

  it('filter[businessUnitCode] が省略可能', () => {
    const result = projectListQuerySchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data['filter[businessUnitCode]']).toBeUndefined()
    }
  })

  it('filter[status] が省略可能', () => {
    const result = projectListQuerySchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data['filter[status]']).toBeUndefined()
    }
  })
})
