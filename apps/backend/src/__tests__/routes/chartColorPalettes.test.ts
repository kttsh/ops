import { describe, test, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { problemResponse, getProblemType, getStatusTitle } from '@/utils/errorHelper'
import type { StatusCode } from 'hono/utils/http-status'

// --- モック ---
vi.mock('@/services/chartColorPaletteService', () => ({
  chartColorPaletteService: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

// モックをインポート（vi.mock の後）
import { chartColorPaletteService } from '@/services/chartColorPaletteService'
import chartColorPalettes from '@/routes/chartColorPalettes'

const mockedService = vi.mocked(chartColorPaletteService)

// テスト用アプリ（グローバルエラーハンドラ付き）
function createApp() {
  const app = new Hono()

  app.route('/chart-color-palettes', chartColorPalettes)

  app.onError((err, c) => {
    if (err instanceof HTTPException) {
      const status = err.status as StatusCode
      return problemResponse(c, {
        type: `https://example.com/problems/${getProblemType(status)}`,
        status,
        title: getStatusTitle(status),
        detail: err.message,
        instance: c.req.path,
        timestamp: new Date().toISOString(),
      }, status)
    }
    return problemResponse(c, {
      type: 'https://example.com/problems/internal-error',
      status: 500,
      title: 'Internal Server Error',
      detail: 'An unexpected error occurred',
      instance: c.req.path,
      timestamp: new Date().toISOString(),
    }, 500)
  })

  return app
}

// --- テスト用データ ---
const samplePalette = {
  chartColorPaletteId: 1,
  name: 'レッド',
  colorCode: '#FF5733',
  displayOrder: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const samplePalette2 = {
  chartColorPaletteId: 2,
  name: 'ブルー',
  colorCode: '#0000FF',
  displayOrder: 2,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('GET /chart-color-palettes', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('一覧を data 配列で返す', async () => {
    mockedService.findAll.mockResolvedValue([samplePalette, samplePalette2])

    const res = await app.request('/chart-color-palettes')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toHaveLength(2)
    expect(body.data[0]).toMatchObject(samplePalette)
    expect(body.data[1]).toMatchObject(samplePalette2)
  })

  test('0件の場合は空配列を返す', async () => {
    mockedService.findAll.mockResolvedValue([])

    const res = await app.request('/chart-color-palettes')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toEqual([])
  })
})

describe('GET /chart-color-palettes/:paletteId', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('指定IDのカラーパレットを data オブジェクトで返す', async () => {
    mockedService.findById.mockResolvedValue(samplePalette)

    const res = await app.request('/chart-color-palettes/1')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toMatchObject(samplePalette)
  })

  test('存在しないIDで 404 を返す', async () => {
    mockedService.findById.mockRejectedValue(
      new HTTPException(404, { message: "Chart color palette with ID '999' not found" }),
    )

    const res = await app.request('/chart-color-palettes/999')
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('不正なパスパラメータで 422 を返す', async () => {
    const res = await app.request('/chart-color-palettes/abc')
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })

  test('0以下のパスパラメータで 422 を返す', async () => {
    const res = await app.request('/chart-color-palettes/0')
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })

  test('負の数のパスパラメータで 422 を返す', async () => {
    const res = await app.request('/chart-color-palettes/-1')
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })
})

describe('POST /chart-color-palettes', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('正常作成で 201 と Location ヘッダを返す', async () => {
    mockedService.create.mockResolvedValue(samplePalette)

    const res = await app.request('/chart-color-palettes', {
      method: 'POST',
      body: JSON.stringify({
        name: 'レッド',
        colorCode: '#FF5733',
        displayOrder: 1,
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(201)
    expect(res.headers.get('Location')).toBe('/chart-color-palettes/1')

    const body = await res.json()
    expect(body.data).toMatchObject(samplePalette)
  })

  test('displayOrder 省略時にデフォルト値 0 が使われる', async () => {
    const paletteWithDefault = { ...samplePalette, displayOrder: 0 }
    mockedService.create.mockResolvedValue(paletteWithDefault)

    const res = await app.request('/chart-color-palettes', {
      method: 'POST',
      body: JSON.stringify({
        name: 'レッド',
        colorCode: '#FF5733',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(201)

    expect(mockedService.create).toHaveBeenCalledWith({
      name: 'レッド',
      colorCode: '#FF5733',
      displayOrder: 0,
    })
  })

  test('バリデーションエラーで 422 を返す（name 空文字）', async () => {
    const res = await app.request('/chart-color-palettes', {
      method: 'POST',
      body: JSON.stringify({
        name: '',
        colorCode: '#FF5733',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
    expect(body.errors).toBeDefined()
    expect(body.errors.length).toBeGreaterThan(0)
  })

  test('バリデーションエラーで 422 を返す（colorCode 不正形式）', async () => {
    const res = await app.request('/chart-color-palettes', {
      method: 'POST',
      body: JSON.stringify({
        name: 'テスト',
        colorCode: 'FF5733',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
    expect(body.errors).toBeDefined()
  })

  test('バリデーションエラーで 422 を返す（colorCode #GG0000）', async () => {
    const res = await app.request('/chart-color-palettes', {
      method: 'POST',
      body: JSON.stringify({
        name: 'テスト',
        colorCode: '#GG0000',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.errors).toBeDefined()
  })

  test('バリデーションエラーで 422 を返す（colorCode 3桁短縮形式）', async () => {
    const res = await app.request('/chart-color-palettes', {
      method: 'POST',
      body: JSON.stringify({
        name: 'テスト',
        colorCode: '#fff',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.errors).toBeDefined()
  })

  test('バリデーションエラーで RFC 9457 形式のレスポンスを返す', async () => {
    const res = await app.request('/chart-color-palettes', {
      method: 'POST',
      body: JSON.stringify({
        name: '',
        colorCode: 'invalid',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
    expect(body.status).toBe(422)
    expect(body.title).toBe('Validation Error')
    expect(body.detail).toBeDefined()
    expect(body.instance).toBeDefined()
    expect(body.errors).toBeDefined()
    expect(Array.isArray(body.errors)).toBe(true)

    for (const err of body.errors) {
      expect(err).toHaveProperty('pointer')
      expect(err).toHaveProperty('keyword')
      expect(err).toHaveProperty('message')
    }
  })
})

describe('PUT /chart-color-palettes/:paletteId', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('正常更新で 200 を返す', async () => {
    const updatedPalette = { ...samplePalette, name: '更新後レッド', colorCode: '#FF0000' }
    mockedService.update.mockResolvedValue(updatedPalette)

    const res = await app.request('/chart-color-palettes/1', {
      method: 'PUT',
      body: JSON.stringify({
        name: '更新後レッド',
        colorCode: '#FF0000',
        displayOrder: 1,
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toMatchObject(updatedPalette)
  })

  test('存在しないIDで 404 を返す', async () => {
    mockedService.update.mockRejectedValue(
      new HTTPException(404, { message: "Chart color palette with ID '999' not found" }),
    )

    const res = await app.request('/chart-color-palettes/999', {
      method: 'PUT',
      body: JSON.stringify({ name: 'テスト', colorCode: '#FF5733' }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('バリデーションエラーで 422 を返す', async () => {
    const res = await app.request('/chart-color-palettes/1', {
      method: 'PUT',
      body: JSON.stringify({ name: '', colorCode: '' }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
    expect(body.errors).toBeDefined()
  })

  test('不正なパスパラメータで 422 を返す', async () => {
    const res = await app.request('/chart-color-palettes/abc', {
      method: 'PUT',
      body: JSON.stringify({ name: 'テスト', colorCode: '#FF5733' }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })
})

describe('DELETE /chart-color-palettes/:paletteId', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('正常削除で 204 No Content を返す', async () => {
    mockedService.delete.mockResolvedValue(undefined)

    const res = await app.request('/chart-color-palettes/1', {
      method: 'DELETE',
    })
    expect(res.status).toBe(204)
  })

  test('存在しないIDで 404 を返す', async () => {
    mockedService.delete.mockRejectedValue(
      new HTTPException(404, { message: "Chart color palette with ID '999' not found" }),
    )

    const res = await app.request('/chart-color-palettes/999', {
      method: 'DELETE',
    })
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('不正なパスパラメータで 422 を返す', async () => {
    const res = await app.request('/chart-color-palettes/abc', {
      method: 'DELETE',
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })
})
