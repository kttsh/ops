import { describe, it, expect } from 'vitest'
import {
  createBusinessUnitSchema,
  updateBusinessUnitSchema,
  businessUnitListQuerySchema,
} from '@/types/businessUnit'

describe('createBusinessUnitSchema', () => {
  it('有効な入力を受け付ける', () => {
    const result = createBusinessUnitSchema.safeParse({
      businessUnitCode: 'BU-001',
      name: 'テスト部門',
      displayOrder: 1,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({
        businessUnitCode: 'BU-001',
        name: 'テスト部門',
        displayOrder: 1,
      })
    }
  })

  it('displayOrder 省略時にデフォルト値 0 を設定する', () => {
    const result = createBusinessUnitSchema.safeParse({
      businessUnitCode: 'BU-001',
      name: 'テスト部門',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.displayOrder).toBe(0)
    }
  })

  describe('businessUnitCode のバリデーション', () => {
    it('空文字を拒否する', () => {
      const result = createBusinessUnitSchema.safeParse({
        businessUnitCode: '',
        name: 'テスト部門',
      })
      expect(result.success).toBe(false)
    })

    it('21文字以上を拒否する', () => {
      const result = createBusinessUnitSchema.safeParse({
        businessUnitCode: 'a'.repeat(21),
        name: 'テスト部門',
      })
      expect(result.success).toBe(false)
    })

    it('20文字を受け付ける', () => {
      const result = createBusinessUnitSchema.safeParse({
        businessUnitCode: 'a'.repeat(20),
        name: 'テスト部門',
      })
      expect(result.success).toBe(true)
    })

    it('英数字・ハイフン・アンダースコアを受け付ける', () => {
      const result = createBusinessUnitSchema.safeParse({
        businessUnitCode: 'BU_test-01',
        name: 'テスト部門',
      })
      expect(result.success).toBe(true)
    })

    it('スペースを含む文字列を拒否する', () => {
      const result = createBusinessUnitSchema.safeParse({
        businessUnitCode: 'BU 001',
        name: 'テスト部門',
      })
      expect(result.success).toBe(false)
    })

    it('日本語文字を拒否する', () => {
      const result = createBusinessUnitSchema.safeParse({
        businessUnitCode: 'テスト',
        name: 'テスト部門',
      })
      expect(result.success).toBe(false)
    })

    it('特殊文字を拒否する', () => {
      const result = createBusinessUnitSchema.safeParse({
        businessUnitCode: 'BU@001',
        name: 'テスト部門',
      })
      expect(result.success).toBe(false)
    })

    it('未指定を拒否する', () => {
      const result = createBusinessUnitSchema.safeParse({
        name: 'テスト部門',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('name のバリデーション', () => {
    it('空文字を拒否する', () => {
      const result = createBusinessUnitSchema.safeParse({
        businessUnitCode: 'BU-001',
        name: '',
      })
      expect(result.success).toBe(false)
    })

    it('101文字以上を拒否する', () => {
      const result = createBusinessUnitSchema.safeParse({
        businessUnitCode: 'BU-001',
        name: 'あ'.repeat(101),
      })
      expect(result.success).toBe(false)
    })

    it('100文字を受け付ける', () => {
      const result = createBusinessUnitSchema.safeParse({
        businessUnitCode: 'BU-001',
        name: 'あ'.repeat(100),
      })
      expect(result.success).toBe(true)
    })

    it('未指定を拒否する', () => {
      const result = createBusinessUnitSchema.safeParse({
        businessUnitCode: 'BU-001',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('displayOrder のバリデーション', () => {
    it('負の数を拒否する', () => {
      const result = createBusinessUnitSchema.safeParse({
        businessUnitCode: 'BU-001',
        name: 'テスト部門',
        displayOrder: -1,
      })
      expect(result.success).toBe(false)
    })

    it('小数を拒否する', () => {
      const result = createBusinessUnitSchema.safeParse({
        businessUnitCode: 'BU-001',
        name: 'テスト部門',
        displayOrder: 1.5,
      })
      expect(result.success).toBe(false)
    })

    it('0 を受け付ける', () => {
      const result = createBusinessUnitSchema.safeParse({
        businessUnitCode: 'BU-001',
        name: 'テスト部門',
        displayOrder: 0,
      })
      expect(result.success).toBe(true)
    })
  })
})

describe('updateBusinessUnitSchema', () => {
  it('有効な入力を受け付ける', () => {
    const result = updateBusinessUnitSchema.safeParse({
      name: '更新後の名前',
      displayOrder: 5,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({
        name: '更新後の名前',
        displayOrder: 5,
      })
    }
  })

  it('displayOrder を省略できる', () => {
    const result = updateBusinessUnitSchema.safeParse({
      name: '更新後の名前',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.displayOrder).toBeUndefined()
    }
  })

  it('name が必須である', () => {
    const result = updateBusinessUnitSchema.safeParse({
      displayOrder: 5,
    })
    expect(result.success).toBe(false)
  })

  it('name の空文字を拒否する', () => {
    const result = updateBusinessUnitSchema.safeParse({
      name: '',
    })
    expect(result.success).toBe(false)
  })

  it('name の101文字以上を拒否する', () => {
    const result = updateBusinessUnitSchema.safeParse({
      name: 'あ'.repeat(101),
    })
    expect(result.success).toBe(false)
  })

  it('displayOrder の負の数を拒否する', () => {
    const result = updateBusinessUnitSchema.safeParse({
      name: 'テスト',
      displayOrder: -1,
    })
    expect(result.success).toBe(false)
  })

  it('displayOrder の小数を拒否する', () => {
    const result = updateBusinessUnitSchema.safeParse({
      name: 'テスト',
      displayOrder: 1.5,
    })
    expect(result.success).toBe(false)
  })
})

describe('businessUnitListQuerySchema', () => {
  it('デフォルト値を設定する', () => {
    const result = businessUnitListQuerySchema.safeParse({})
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
    const result = businessUnitListQuerySchema.safeParse({
      'page[number]': '2',
      'page[size]': '50',
      'filter[includeDisabled]': 'true',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({
        'page[number]': 2,
        'page[size]': 50,
        'filter[includeDisabled]': true,
      })
    }
  })

  it('page[number] が 0 以下を拒否する', () => {
    const result = businessUnitListQuerySchema.safeParse({
      'page[number]': '0',
    })
    expect(result.success).toBe(false)
  })

  it('page[size] が 0 以下を拒否する', () => {
    const result = businessUnitListQuerySchema.safeParse({
      'page[size]': '0',
    })
    expect(result.success).toBe(false)
  })

  it('page[size] が 1000 を超える場合を拒否する', () => {
    const result = businessUnitListQuerySchema.safeParse({
      'page[size]': '1001',
    })
    expect(result.success).toBe(false)
  })

  it('page[size] が 1000 を受け付ける', () => {
    const result = businessUnitListQuerySchema.safeParse({
      'page[size]': '1000',
    })
    expect(result.success).toBe(true)
  })
})
