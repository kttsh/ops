import { describe, it, expect } from 'vitest'
import {
  createWorkTypeSchema,
  updateWorkTypeSchema,
  workTypeSearchSchema,
} from '@/features/work-types/types'

describe('createWorkTypeSchema', () => {
  it('正常値を受け入れる', () => {
    const result = createWorkTypeSchema.safeParse({
      workTypeCode: 'WT-001',
      name: 'テスト作業種類',
      displayOrder: 1,
      color: '#FF5733',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.workTypeCode).toBe('WT-001')
      expect(result.data.name).toBe('テスト作業種類')
      expect(result.data.displayOrder).toBe(1)
      expect(result.data.color).toBe('#FF5733')
    }
  })

  it('displayOrderのデフォルト値が0', () => {
    const result = createWorkTypeSchema.safeParse({
      workTypeCode: 'WT-001',
      name: 'テスト作業種類',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.displayOrder).toBe(0)
    }
  })

  it('colorがnullを受け入れる', () => {
    const result = createWorkTypeSchema.safeParse({
      workTypeCode: 'WT-001',
      name: 'テスト作業種類',
      color: null,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.color).toBeNull()
    }
  })

  it('colorが省略可能', () => {
    const result = createWorkTypeSchema.safeParse({
      workTypeCode: 'WT-001',
      name: 'テスト作業種類',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.color).toBeUndefined()
    }
  })

  it('正しい#RRGGBB形式のcolorを受け入れる', () => {
    const validColors = ['#000000', '#FFFFFF', '#ff5733', '#AbCdEf']
    for (const color of validColors) {
      const result = createWorkTypeSchema.safeParse({
        workTypeCode: 'WT-001',
        name: 'テスト',
        color,
      })
      expect(result.success).toBe(true)
    }
  })

  it('不正な形式のcolorを拒否する', () => {
    const invalidColors = ['#FFF', 'FF5733', '#GGGGGG', 'red', '#FF573', '#FF57331']
    for (const color of invalidColors) {
      const result = createWorkTypeSchema.safeParse({
        workTypeCode: 'WT-001',
        name: 'テスト',
        color,
      })
      expect(result.success).toBe(false)
    }
  })

  it('空のworkTypeCodeを拒否する', () => {
    const result = createWorkTypeSchema.safeParse({
      workTypeCode: '',
      name: 'テスト作業種類',
    })
    expect(result.success).toBe(false)
  })

  it('21文字以上のworkTypeCodeを拒否する', () => {
    const result = createWorkTypeSchema.safeParse({
      workTypeCode: 'A'.repeat(21),
      name: 'テスト作業種類',
    })
    expect(result.success).toBe(false)
  })

  it('日本語を含むworkTypeCodeを拒否する', () => {
    const result = createWorkTypeSchema.safeParse({
      workTypeCode: 'テスト',
      name: 'テスト作業種類',
    })
    expect(result.success).toBe(false)
  })

  it('英数字・ハイフン・アンダースコアのworkTypeCodeを受け入れる', () => {
    const result = createWorkTypeSchema.safeParse({
      workTypeCode: 'WT_test-01',
      name: 'テスト作業種類',
    })
    expect(result.success).toBe(true)
  })

  it('空の名称を拒否する', () => {
    const result = createWorkTypeSchema.safeParse({
      workTypeCode: 'WT-001',
      name: '',
    })
    expect(result.success).toBe(false)
  })

  it('101文字以上の名称を拒否する', () => {
    const result = createWorkTypeSchema.safeParse({
      workTypeCode: 'WT-001',
      name: 'A'.repeat(101),
    })
    expect(result.success).toBe(false)
  })

  it('負の表示順を拒否する', () => {
    const result = createWorkTypeSchema.safeParse({
      workTypeCode: 'WT-001',
      name: 'テスト',
      displayOrder: -1,
    })
    expect(result.success).toBe(false)
  })

  it('小数の表示順を拒否する', () => {
    const result = createWorkTypeSchema.safeParse({
      workTypeCode: 'WT-001',
      name: 'テスト',
      displayOrder: 1.5,
    })
    expect(result.success).toBe(false)
  })
})

describe('updateWorkTypeSchema', () => {
  it('正常値を受け入れる', () => {
    const result = updateWorkTypeSchema.safeParse({
      name: '更新済み作業種類',
      displayOrder: 5,
      color: '#00FF00',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('更新済み作業種類')
      expect(result.data.displayOrder).toBe(5)
      expect(result.data.color).toBe('#00FF00')
    }
  })

  it('displayOrderは省略可能', () => {
    const result = updateWorkTypeSchema.safeParse({
      name: '更新済み作業種類',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.displayOrder).toBeUndefined()
    }
  })

  it('colorがnullを受け入れる', () => {
    const result = updateWorkTypeSchema.safeParse({
      name: '更新済み作業種類',
      color: null,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.color).toBeNull()
    }
  })

  it('colorが省略可能', () => {
    const result = updateWorkTypeSchema.safeParse({
      name: '更新済み作業種類',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.color).toBeUndefined()
    }
  })

  it('空の名称を拒否する', () => {
    const result = updateWorkTypeSchema.safeParse({
      name: '',
    })
    expect(result.success).toBe(false)
  })

  it('101文字以上の名称を拒否する', () => {
    const result = updateWorkTypeSchema.safeParse({
      name: 'A'.repeat(101),
    })
    expect(result.success).toBe(false)
  })
})

describe('workTypeSearchSchema', () => {
  it('デフォルト値を提供する', () => {
    const result = workTypeSearchSchema.parse({})
    expect(result.search).toBe('')
    expect(result.includeDisabled).toBe(false)
  })

  it('指定した値を受け入れる', () => {
    const result = workTypeSearchSchema.parse({
      search: 'テスト',
      includeDisabled: true,
    })
    expect(result.search).toBe('テスト')
    expect(result.includeDisabled).toBe(true)
  })

  it('不正なincludeDisabled値をフォールバックする', () => {
    const result = workTypeSearchSchema.parse({
      includeDisabled: 'invalid',
    })
    expect(result.includeDisabled).toBe(false)
  })

  it('不正なsearch値をフォールバックする', () => {
    const result = workTypeSearchSchema.parse({
      search: 123,
    })
    expect(result.search).toBe('')
  })
})
