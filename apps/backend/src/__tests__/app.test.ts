import { describe, test, expect } from 'vitest'
import app from '@/index'

describe('Hono App', () => {
  test('未定義ルートに対して 404 RFC 9457 形式のレスポンスを返す', async () => {
    const res = await app.request('/non-existent-route')
    expect(res.status).toBe(404)
    expect(res.headers.get('Content-Type')).toContain('application/problem+json')

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
    expect(body.status).toBe(404)
    expect(body.title).toBe('Resource Not Found')
    expect(body.instance).toBe('/non-existent-route')
    expect(body.timestamp).toBeDefined()
  })

  test('ルートパスにアクセスすると 404 を返す（まだルートが未設定）', async () => {
    const res = await app.request('/')
    expect(res.status).toBe(404)
  })
})
