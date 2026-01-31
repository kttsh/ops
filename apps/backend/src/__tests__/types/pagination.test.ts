import { describe, it, expect } from 'vitest'
import { paginationQuerySchema } from '@/types/pagination'

describe('paginationQuerySchema', () => {
  it('デフォルト値を設定する', () => {
    const result = paginationQuerySchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({
        'page[number]': 1,
        'page[size]': 20,
      })
    }
  })

  it('文字列の数値を数値に変換する', () => {
    const result = paginationQuerySchema.safeParse({
      'page[number]': '3',
      'page[size]': '50',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data['page[number]']).toBe(3)
      expect(result.data['page[size]']).toBe(50)
    }
  })

  it('page[number] が 1 未満を拒否する', () => {
    const result = paginationQuerySchema.safeParse({
      'page[number]': '0',
    })
    expect(result.success).toBe(false)
  })

  it('page[size] が 1 未満を拒否する', () => {
    const result = paginationQuerySchema.safeParse({
      'page[size]': '0',
    })
    expect(result.success).toBe(false)
  })

  it('page[size] が 1000 を超える場合を拒否する', () => {
    const result = paginationQuerySchema.safeParse({
      'page[size]': '1001',
    })
    expect(result.success).toBe(false)
  })

  it('小数を拒否する', () => {
    const result = paginationQuerySchema.safeParse({
      'page[number]': '1.5',
    })
    expect(result.success).toBe(false)
  })
})
