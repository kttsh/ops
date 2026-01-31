import { describe, test, expect } from 'vitest'
import { Hono } from 'hono'
import { z } from 'zod'
import { validate } from '@/utils/validate'

function createTestApp() {
  const app = new Hono()

  // json バリデーション付きエンドポイント
  app.post(
    '/test-json',
    validate(
      'json',
      z.object({
        name: z.string().min(1).max(100),
        code: z
          .string()
          .min(1)
          .max(20)
          .regex(/^[a-zA-Z0-9_-]+$/),
        count: z.number().int().min(0).default(0),
      }),
    ),
    (c) => {
      const body = c.req.valid('json')
      return c.json({ data: body }, 200)
    },
  )

  // query バリデーション付きエンドポイント
  app.get(
    '/test-query',
    validate(
      'query',
      z.object({
        'page[number]': z.coerce.number().int().min(1).default(1),
        'page[size]': z.coerce.number().int().min(1).max(1000).default(20),
      }),
    ),
    (c) => {
      const query = c.req.valid('query')
      return c.json({ data: query }, 200)
    },
  )

  return app
}

describe('validate (RFC 9457 Zod バリデーション統合)', () => {
  const app = createTestApp()

  describe('バリデーション成功時', () => {
    test('有効な JSON ボディで 200 を返す', async () => {
      const res = await app.request('/test-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'テスト',
          code: 'TEST-01',
          count: 5,
        }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.name).toBe('テスト')
      expect(body.data.code).toBe('TEST-01')
      expect(body.data.count).toBe(5)
    })

    test('デフォルト値が適用される', async () => {
      const res = await app.request('/test-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'テスト',
          code: 'TEST-01',
        }),
      })

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data.count).toBe(0)
    })

    test('有効なクエリパラメータで 200 を返す', async () => {
      const res = await app.request('/test-query?page[number]=2&page[size]=50')

      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.data['page[number]']).toBe(2)
      expect(body.data['page[size]']).toBe(50)
    })
  })

  describe('バリデーションエラー時', () => {
    test('422 ステータスコードを返す', async () => {
      const res = await app.request('/test-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      expect(res.status).toBe(422)
    })

    test('Content-Type が application/problem+json を含む', async () => {
      const res = await app.request('/test-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      expect(res.headers.get('Content-Type')).toContain(
        'application/problem+json',
      )
    })

    test('RFC 9457 形式の必須フィールドを含む', async () => {
      const res = await app.request('/test-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const body = await res.json()
      expect(body.type).toBe(
        'https://example.com/problems/validation-error',
      )
      expect(body.status).toBe(422)
      expect(body.title).toBe('Validation Error')
      expect(body.detail).toBe('The request contains invalid parameters')
      expect(body.instance).toBe('/test-json')
      expect(body.timestamp).toBeDefined()
    })

    test('複数のバリデーションエラーを errors 配列で一括返却する', async () => {
      const res = await app.request('/test-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const body = await res.json()
      expect(body.errors).toBeDefined()
      expect(Array.isArray(body.errors)).toBe(true)
      // name と code が必須なので最低2つのエラー
      expect(body.errors.length).toBeGreaterThanOrEqual(2)
    })

    test('errors 配列の各要素が pointer, keyword, message を含む', async () => {
      const res = await app.request('/test-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const body = await res.json()
      for (const error of body.errors) {
        expect(error).toHaveProperty('pointer')
        expect(error).toHaveProperty('keyword')
        expect(error).toHaveProperty('message')
        expect(typeof error.pointer).toBe('string')
        expect(typeof error.keyword).toBe('string')
        expect(typeof error.message).toBe('string')
      }
    })

    test('pointer が正しいフィールドパスを示す', async () => {
      const res = await app.request('/test-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '', code: '!!!invalid!!!' }),
      })

      const body = await res.json()
      const pointers = body.errors.map(
        (e: { pointer: string }) => e.pointer,
      )
      // name が空文字列で min(1) バリデーションエラー
      expect(pointers).toContain('/name')
      // code が regex バリデーションエラー
      expect(pointers).toContain('/code')
    })

    test('クエリパラメータのバリデーションエラーも RFC 9457 形式で返す', async () => {
      const res = await app.request('/test-query?page[number]=-1&page[size]=9999')

      expect(res.status).toBe(422)

      const body = await res.json()
      expect(body.type).toBe(
        'https://example.com/problems/validation-error',
      )
      expect(body.errors).toBeDefined()
      expect(body.errors.length).toBeGreaterThanOrEqual(1)
    })

    test('timestamp が ISO 8601 形式である', async () => {
      const res = await app.request('/test-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const body = await res.json()
      const date = new Date(body.timestamp)
      expect(date.toISOString()).toBe(body.timestamp)
    })
  })
})
