import { describe, it, expect } from 'vitest'
import {
  createWorkTypeSchema,
  updateWorkTypeSchema,
  workTypeListQuerySchema,
} from '@/types/workType'

describe('createWorkTypeSchema', () => {
  it('有効な入力を受け付ける', () => {
    const result = createWorkTypeSchema.safeParse({
      workTypeCode: 'WT-001',
      name: 'テスト作業種類',
      displayOrder: 1,
      color: '#FF5733',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({
        workTypeCode: 'WT-001',
        name: 'テスト作業種類',
        displayOrder: 1,
        color: '#FF5733',
      })
    }
  })

  it('displayOrder 省略時にデフォルト値 0 を設定する', () => {
    const result = createWorkTypeSchema.safeParse({
      workTypeCode: 'WT-001',
      name: 'テスト作業種類',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.displayOrder).toBe(0)
    }
  })

  it('color 省略時も有効である', () => {
    const result = createWorkTypeSchema.safeParse({
      workTypeCode: 'WT-001',
      name: 'テスト作業種類',
    })
    expect(result.success).toBe(true)
  })

  it('color に null を受け付ける', () => {
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

  describe('workTypeCode のバリデーション', () => {
    it('空文字を拒否する', () => {
      const result = createWorkTypeSchema.safeParse({
        workTypeCode: '',
        name: 'テスト作業種類',
      })
      expect(result.success).toBe(false)
    })

    it('21文字以上を拒否する', () => {
      const result = createWorkTypeSchema.safeParse({
        workTypeCode: 'a'.repeat(21),
        name: 'テスト作業種類',
      })
      expect(result.success).toBe(false)
    })

    it('20文字を受け付ける', () => {
      const result = createWorkTypeSchema.safeParse({
        workTypeCode: 'a'.repeat(20),
        name: 'テスト作業種類',
      })
      expect(result.success).toBe(true)
    })

    it('英数字・ハイフン・アンダースコアを受け付ける', () => {
      const result = createWorkTypeSchema.safeParse({
        workTypeCode: 'WT_test-01',
        name: 'テスト作業種類',
      })
      expect(result.success).toBe(true)
    })

    it('スペースを含む文字列を拒否する', () => {
      const result = createWorkTypeSchema.safeParse({
        workTypeCode: 'WT 001',
        name: 'テスト作業種類',
      })
      expect(result.success).toBe(false)
    })

    it('日本語文字を拒否する', () => {
      const result = createWorkTypeSchema.safeParse({
        workTypeCode: 'テスト',
        name: 'テスト作業種類',
      })
      expect(result.success).toBe(false)
    })

    it('特殊文字を拒否する', () => {
      const result = createWorkTypeSchema.safeParse({
        workTypeCode: 'WT@001',
        name: 'テスト作業種類',
      })
      expect(result.success).toBe(false)
    })

    it('未指定を拒否する', () => {
      const result = createWorkTypeSchema.safeParse({
        name: 'テスト作業種類',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('name のバリデーション', () => {
    it('空文字を拒否する', () => {
      const result = createWorkTypeSchema.safeParse({
        workTypeCode: 'WT-001',
        name: '',
      })
      expect(result.success).toBe(false)
    })

    it('101文字以上を拒否する', () => {
      const result = createWorkTypeSchema.safeParse({
        workTypeCode: 'WT-001',
        name: 'あ'.repeat(101),
      })
      expect(result.success).toBe(false)
    })

    it('100文字を受け付ける', () => {
      const result = createWorkTypeSchema.safeParse({
        workTypeCode: 'WT-001',
        name: 'あ'.repeat(100),
      })
      expect(result.success).toBe(true)
    })

    it('未指定を拒否する', () => {
      const result = createWorkTypeSchema.safeParse({
        workTypeCode: 'WT-001',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('displayOrder のバリデーション', () => {
    it('負の数を拒否する', () => {
      const result = createWorkTypeSchema.safeParse({
        workTypeCode: 'WT-001',
        name: 'テスト作業種類',
        displayOrder: -1,
      })
      expect(result.success).toBe(false)
    })

    it('小数を拒否する', () => {
      const result = createWorkTypeSchema.safeParse({
        workTypeCode: 'WT-001',
        name: 'テスト作業種類',
        displayOrder: 1.5,
      })
      expect(result.success).toBe(false)
    })

    it('0 を受け付ける', () => {
      const result = createWorkTypeSchema.safeParse({
        workTypeCode: 'WT-001',
        name: 'テスト作業種類',
        displayOrder: 0,
      })
      expect(result.success).toBe(true)
    })
  })

  describe('color のバリデーション', () => {
    it('有効な #RRGGBB 形式を受け付ける', () => {
      const result = createWorkTypeSchema.safeParse({
        workTypeCode: 'WT-001',
        name: 'テスト作業種類',
        color: '#FF5733',
      })
      expect(result.success).toBe(true)
    })

    it('小文字の16進数を受け付ける', () => {
      const result = createWorkTypeSchema.safeParse({
        workTypeCode: 'WT-001',
        name: 'テスト作業種類',
        color: '#ff5733',
      })
      expect(result.success).toBe(true)
    })

    it('# なしの値を拒否する', () => {
      const result = createWorkTypeSchema.safeParse({
        workTypeCode: 'WT-001',
        name: 'テスト作業種類',
        color: 'FF5733',
      })
      expect(result.success).toBe(false)
    })

    it('短い形式（#RGB）を拒否する', () => {
      const result = createWorkTypeSchema.safeParse({
        workTypeCode: 'WT-001',
        name: 'テスト作業種類',
        color: '#F53',
      })
      expect(result.success).toBe(false)
    })

    it('不正な16進文字を拒否する', () => {
      const result = createWorkTypeSchema.safeParse({
        workTypeCode: 'WT-001',
        name: 'テスト作業種類',
        color: '#GGGGGG',
      })
      expect(result.success).toBe(false)
    })
  })
})

describe('updateWorkTypeSchema', () => {
  it('有効な入力を受け付ける', () => {
    const result = updateWorkTypeSchema.safeParse({
      name: '更新後の名前',
      displayOrder: 5,
      color: '#00FF00',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({
        name: '更新後の名前',
        displayOrder: 5,
        color: '#00FF00',
      })
    }
  })

  it('displayOrder を省略できる', () => {
    const result = updateWorkTypeSchema.safeParse({
      name: '更新後の名前',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.displayOrder).toBeUndefined()
    }
  })

  it('name が必須である', () => {
    const result = updateWorkTypeSchema.safeParse({
      displayOrder: 5,
    })
    expect(result.success).toBe(false)
  })

  it('name の空文字を拒否する', () => {
    const result = updateWorkTypeSchema.safeParse({
      name: '',
    })
    expect(result.success).toBe(false)
  })

  it('name の101文字以上を拒否する', () => {
    const result = updateWorkTypeSchema.safeParse({
      name: 'あ'.repeat(101),
    })
    expect(result.success).toBe(false)
  })

  it('displayOrder の負の数を拒否する', () => {
    const result = updateWorkTypeSchema.safeParse({
      name: 'テスト',
      displayOrder: -1,
    })
    expect(result.success).toBe(false)
  })

  it('displayOrder の小数を拒否する', () => {
    const result = updateWorkTypeSchema.safeParse({
      name: 'テスト',
      displayOrder: 1.5,
    })
    expect(result.success).toBe(false)
  })

  it('color に null を受け付ける', () => {
    const result = updateWorkTypeSchema.safeParse({
      name: 'テスト',
      color: null,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.color).toBeNull()
    }
  })

  it('color に有効な #RRGGBB を受け付ける', () => {
    const result = updateWorkTypeSchema.safeParse({
      name: 'テスト',
      color: '#AABBCC',
    })
    expect(result.success).toBe(true)
  })

  it('color の不正な形式を拒否する', () => {
    const result = updateWorkTypeSchema.safeParse({
      name: 'テスト',
      color: 'invalid',
    })
    expect(result.success).toBe(false)
  })
})

describe('workTypeListQuerySchema', () => {
  it('デフォルト値を設定する', () => {
    const result = workTypeListQuerySchema.safeParse({})
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
    const result = workTypeListQuerySchema.safeParse({
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
    const result = workTypeListQuerySchema.safeParse({
      'page[number]': '0',
    })
    expect(result.success).toBe(false)
  })

  it('page[size] が 0 以下を拒否する', () => {
    const result = workTypeListQuerySchema.safeParse({
      'page[size]': '0',
    })
    expect(result.success).toBe(false)
  })

  it('page[size] が 1000 を超える場合を拒否する', () => {
    const result = workTypeListQuerySchema.safeParse({
      'page[size]': '1001',
    })
    expect(result.success).toBe(false)
  })

  it('page[size] が 1000 を受け付ける', () => {
    const result = workTypeListQuerySchema.safeParse({
      'page[size]': '1000',
    })
    expect(result.success).toBe(true)
  })
})
