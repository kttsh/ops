import { describe, it, expect } from 'vitest'
import {
  createProjectTypeSchema,
  updateProjectTypeSchema,
  projectTypeListQuerySchema,
} from '@/types/projectType'

describe('createProjectTypeSchema', () => {
  it('有効な入力を受け付ける', () => {
    const result = createProjectTypeSchema.safeParse({
      projectTypeCode: 'PT-001',
      name: 'テスト案件タイプ',
      displayOrder: 1,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({
        projectTypeCode: 'PT-001',
        name: 'テスト案件タイプ',
        displayOrder: 1,
      })
    }
  })

  it('displayOrder 省略時にデフォルト値 0 を設定する', () => {
    const result = createProjectTypeSchema.safeParse({
      projectTypeCode: 'PT-001',
      name: 'テスト案件タイプ',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.displayOrder).toBe(0)
    }
  })

  describe('projectTypeCode のバリデーション', () => {
    it('空文字を拒否する', () => {
      const result = createProjectTypeSchema.safeParse({
        projectTypeCode: '',
        name: 'テスト案件タイプ',
      })
      expect(result.success).toBe(false)
    })

    it('21文字以上を拒否する', () => {
      const result = createProjectTypeSchema.safeParse({
        projectTypeCode: 'a'.repeat(21),
        name: 'テスト案件タイプ',
      })
      expect(result.success).toBe(false)
    })

    it('20文字を受け付ける', () => {
      const result = createProjectTypeSchema.safeParse({
        projectTypeCode: 'a'.repeat(20),
        name: 'テスト案件タイプ',
      })
      expect(result.success).toBe(true)
    })

    it('英数字・ハイフン・アンダースコアを受け付ける', () => {
      const result = createProjectTypeSchema.safeParse({
        projectTypeCode: 'PT_test-01',
        name: 'テスト案件タイプ',
      })
      expect(result.success).toBe(true)
    })

    it('スペースを含む文字列を拒否する', () => {
      const result = createProjectTypeSchema.safeParse({
        projectTypeCode: 'PT 001',
        name: 'テスト案件タイプ',
      })
      expect(result.success).toBe(false)
    })

    it('日本語文字を拒否する', () => {
      const result = createProjectTypeSchema.safeParse({
        projectTypeCode: 'テスト',
        name: 'テスト案件タイプ',
      })
      expect(result.success).toBe(false)
    })

    it('特殊文字を拒否する', () => {
      const result = createProjectTypeSchema.safeParse({
        projectTypeCode: 'PT@001',
        name: 'テスト案件タイプ',
      })
      expect(result.success).toBe(false)
    })

    it('未指定を拒否する', () => {
      const result = createProjectTypeSchema.safeParse({
        name: 'テスト案件タイプ',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('name のバリデーション', () => {
    it('空文字を拒否する', () => {
      const result = createProjectTypeSchema.safeParse({
        projectTypeCode: 'PT-001',
        name: '',
      })
      expect(result.success).toBe(false)
    })

    it('101文字以上を拒否する', () => {
      const result = createProjectTypeSchema.safeParse({
        projectTypeCode: 'PT-001',
        name: 'あ'.repeat(101),
      })
      expect(result.success).toBe(false)
    })

    it('100文字を受け付ける', () => {
      const result = createProjectTypeSchema.safeParse({
        projectTypeCode: 'PT-001',
        name: 'あ'.repeat(100),
      })
      expect(result.success).toBe(true)
    })

    it('未指定を拒否する', () => {
      const result = createProjectTypeSchema.safeParse({
        projectTypeCode: 'PT-001',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('displayOrder のバリデーション', () => {
    it('負の数を拒否する', () => {
      const result = createProjectTypeSchema.safeParse({
        projectTypeCode: 'PT-001',
        name: 'テスト案件タイプ',
        displayOrder: -1,
      })
      expect(result.success).toBe(false)
    })

    it('小数を拒否する', () => {
      const result = createProjectTypeSchema.safeParse({
        projectTypeCode: 'PT-001',
        name: 'テスト案件タイプ',
        displayOrder: 1.5,
      })
      expect(result.success).toBe(false)
    })

    it('0 を受け付ける', () => {
      const result = createProjectTypeSchema.safeParse({
        projectTypeCode: 'PT-001',
        name: 'テスト案件タイプ',
        displayOrder: 0,
      })
      expect(result.success).toBe(true)
    })
  })
})

describe('updateProjectTypeSchema', () => {
  it('有効な入力を受け付ける', () => {
    const result = updateProjectTypeSchema.safeParse({
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
    const result = updateProjectTypeSchema.safeParse({
      name: '更新後の名前',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.displayOrder).toBeUndefined()
    }
  })

  it('name が必須である', () => {
    const result = updateProjectTypeSchema.safeParse({
      displayOrder: 5,
    })
    expect(result.success).toBe(false)
  })

  it('name の空文字を拒否する', () => {
    const result = updateProjectTypeSchema.safeParse({
      name: '',
    })
    expect(result.success).toBe(false)
  })

  it('name の101文字以上を拒否する', () => {
    const result = updateProjectTypeSchema.safeParse({
      name: 'あ'.repeat(101),
    })
    expect(result.success).toBe(false)
  })

  it('displayOrder の負の数を拒否する', () => {
    const result = updateProjectTypeSchema.safeParse({
      name: 'テスト',
      displayOrder: -1,
    })
    expect(result.success).toBe(false)
  })

  it('displayOrder の小数を拒否する', () => {
    const result = updateProjectTypeSchema.safeParse({
      name: 'テスト',
      displayOrder: 1.5,
    })
    expect(result.success).toBe(false)
  })
})

describe('projectTypeListQuerySchema', () => {
  it('デフォルト値を設定する', () => {
    const result = projectTypeListQuerySchema.safeParse({})
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
    const result = projectTypeListQuerySchema.safeParse({
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
    const result = projectTypeListQuerySchema.safeParse({
      'page[number]': '0',
    })
    expect(result.success).toBe(false)
  })

  it('page[size] が 0 以下を拒否する', () => {
    const result = projectTypeListQuerySchema.safeParse({
      'page[size]': '0',
    })
    expect(result.success).toBe(false)
  })

  it('page[size] が 1000 を超える場合を拒否する', () => {
    const result = projectTypeListQuerySchema.safeParse({
      'page[size]': '1001',
    })
    expect(result.success).toBe(false)
  })

  it('page[size] が 1000 を受け付ける', () => {
    const result = projectTypeListQuerySchema.safeParse({
      'page[size]': '1000',
    })
    expect(result.success).toBe(true)
  })
})
