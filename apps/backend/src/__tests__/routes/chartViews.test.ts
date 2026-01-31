import { describe, test, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { problemResponse, getProblemType, getStatusTitle } from '@/utils/errorHelper'
import type { StatusCode } from 'hono/utils/http-status'

// --- モック ---
vi.mock('@/services/chartViewService', () => ({
  chartViewService: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    restore: vi.fn(),
  },
}))

// モックをインポート（vi.mock の後）
import { chartViewService } from '@/services/chartViewService'
import chartViews from '@/routes/chartViews'

const mockedService = vi.mocked(chartViewService)

// テスト用アプリ（グローバルエラーハンドラ付き）
function createApp() {
  const app = new Hono()

  app.route('/chart-views', chartViews)

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
const sampleView = {
  chartViewId: 1,
  viewName: '2026年度全体ビュー',
  chartType: 'stacked-area',
  startYearMonth: '202604',
  endYearMonth: '202703',
  isDefault: true,
  description: '2026年度のプロジェクト工数積み上げ表示',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const sampleView2 = {
  chartViewId: 2,
  viewName: 'テストビュー',
  chartType: 'stacked-bar',
  startYearMonth: '202501',
  endYearMonth: '202512',
  isDefault: false,
  description: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('GET /chart-views', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('一覧を data 配列と meta.pagination で返す', async () => {
    mockedService.findAll.mockResolvedValue({
      items: [sampleView, sampleView2],
      totalCount: 2,
    })

    const res = await app.request('/chart-views')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toHaveLength(2)
    expect(body.data[0]).toMatchObject(sampleView)
    expect(body.meta.pagination).toMatchObject({
      currentPage: 1,
      pageSize: 20,
      totalItems: 2,
      totalPages: 1,
    })
  })

  test('page[number] と page[size] でページネーションする', async () => {
    mockedService.findAll.mockResolvedValue({
      items: [sampleView2],
      totalCount: 2,
    })

    const res = await app.request('/chart-views?page[number]=2&page[size]=1')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.meta.pagination).toMatchObject({
      currentPage: 2,
      pageSize: 1,
      totalItems: 2,
      totalPages: 2,
    })

    expect(mockedService.findAll).toHaveBeenCalledWith({
      page: 2,
      pageSize: 1,
      includeDisabled: false,
    })
  })

  test('filter[includeDisabled]=true で論理削除済みを含む', async () => {
    mockedService.findAll.mockResolvedValue({
      items: [sampleView],
      totalCount: 1,
    })

    const res = await app.request('/chart-views?filter[includeDisabled]=true')
    expect(res.status).toBe(200)

    expect(mockedService.findAll).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      includeDisabled: true,
    })
  })

  test('空の一覧を正しく返す', async () => {
    mockedService.findAll.mockResolvedValue({
      items: [],
      totalCount: 0,
    })

    const res = await app.request('/chart-views')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toEqual([])
    expect(body.meta.pagination.totalItems).toBe(0)
    expect(body.meta.pagination.totalPages).toBe(0)
  })

  test('不正なクエリパラメータで 422 を返す', async () => {
    const res = await app.request('/chart-views?page[number]=-1')
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
    expect(body.status).toBe(422)
    expect(body.errors).toBeDefined()
    expect(body.errors.length).toBeGreaterThan(0)
  })
})

describe('GET /chart-views/:id', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('指定IDのチャートビューを data オブジェクトで返す', async () => {
    mockedService.findById.mockResolvedValue(sampleView)

    const res = await app.request('/chart-views/1')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toMatchObject(sampleView)
  })

  test('存在しないIDで 404 を返す', async () => {
    mockedService.findById.mockRejectedValue(
      new HTTPException(404, { message: "Chart view with ID '999' not found" }),
    )

    const res = await app.request('/chart-views/999')
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })
})

describe('POST /chart-views', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('正常作成で 201 と Location ヘッダを返す', async () => {
    mockedService.create.mockResolvedValue(sampleView)

    const res = await app.request('/chart-views', {
      method: 'POST',
      body: JSON.stringify({
        viewName: '2026年度全体ビュー',
        chartType: 'stacked-area',
        startYearMonth: '202604',
        endYearMonth: '202703',
        isDefault: true,
        description: '2026年度のプロジェクト工数積み上げ表示',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(201)
    expect(res.headers.get('Location')).toBe('/chart-views/1')

    const body = await res.json()
    expect(body.data).toMatchObject(sampleView)
  })

  test('isDefault 省略時にデフォルト値 false が使われる', async () => {
    mockedService.create.mockResolvedValue(sampleView2)

    const res = await app.request('/chart-views', {
      method: 'POST',
      body: JSON.stringify({
        viewName: 'テストビュー',
        chartType: 'stacked-bar',
        startYearMonth: '202501',
        endYearMonth: '202512',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(201)

    expect(mockedService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        viewName: 'テストビュー',
        chartType: 'stacked-bar',
        startYearMonth: '202501',
        endYearMonth: '202512',
        isDefault: false,
      }),
    )
  })

  test('バリデーションエラーで 422 を返す（viewName 未指定）', async () => {
    const res = await app.request('/chart-views', {
      method: 'POST',
      body: JSON.stringify({
        chartType: 'stacked-area',
        startYearMonth: '202604',
        endYearMonth: '202703',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
    expect(body.errors).toBeDefined()
  })

  test('バリデーションエラーで 422 を返す（viewName 空文字）', async () => {
    const res = await app.request('/chart-views', {
      method: 'POST',
      body: JSON.stringify({
        viewName: '',
        chartType: 'stacked-area',
        startYearMonth: '202604',
        endYearMonth: '202703',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
    expect(body.errors).toBeDefined()
  })

  test('バリデーションエラーで 422 を返す（viewName 101文字以上）', async () => {
    const res = await app.request('/chart-views', {
      method: 'POST',
      body: JSON.stringify({
        viewName: 'a'.repeat(101),
        chartType: 'stacked-area',
        startYearMonth: '202604',
        endYearMonth: '202703',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.errors).toBeDefined()
  })

  test('バリデーションエラーで 422 を返す（startYearMonth 不正形式）', async () => {
    const res = await app.request('/chart-views', {
      method: 'POST',
      body: JSON.stringify({
        viewName: 'テスト',
        chartType: 'stacked-area',
        startYearMonth: '2026-04',
        endYearMonth: '202703',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.errors).toBeDefined()
  })

  test('バリデーションエラーで 422 を返す（startYearMonth > endYearMonth）', async () => {
    const res = await app.request('/chart-views', {
      method: 'POST',
      body: JSON.stringify({
        viewName: 'テスト',
        chartType: 'stacked-area',
        startYearMonth: '202801',
        endYearMonth: '202703',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
    expect(body.errors).toBeDefined()
  })

  test('バリデーションエラーで 422 を返す（chartType 51文字以上）', async () => {
    const res = await app.request('/chart-views', {
      method: 'POST',
      body: JSON.stringify({
        viewName: 'テスト',
        chartType: 'a'.repeat(51),
        startYearMonth: '202604',
        endYearMonth: '202703',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.errors).toBeDefined()
  })

  test('バリデーションエラーで 422 を返す（description 501文字以上）', async () => {
    const res = await app.request('/chart-views', {
      method: 'POST',
      body: JSON.stringify({
        viewName: 'テスト',
        chartType: 'stacked-area',
        startYearMonth: '202604',
        endYearMonth: '202703',
        description: 'a'.repeat(501),
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.errors).toBeDefined()
  })
})

describe('PUT /chart-views/:id', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('正常更新で 200 を返す', async () => {
    const updatedView = { ...sampleView, viewName: '更新後ビュー' }
    mockedService.update.mockResolvedValue(updatedView)

    const res = await app.request('/chart-views/1', {
      method: 'PUT',
      body: JSON.stringify({
        viewName: '更新後ビュー',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toMatchObject(updatedView)
  })

  test('存在しないIDで 404 を返す', async () => {
    mockedService.update.mockRejectedValue(
      new HTTPException(404, { message: "Chart view with ID '999' not found" }),
    )

    const res = await app.request('/chart-views/999', {
      method: 'PUT',
      body: JSON.stringify({ viewName: 'テスト' }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('バリデーションエラーで 422 を返す（viewName 空文字）', async () => {
    const res = await app.request('/chart-views/1', {
      method: 'PUT',
      body: JSON.stringify({ viewName: '' }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
    expect(body.errors).toBeDefined()
  })

  test('年月大小関係不正で 422 を返す（サービス層エラー）', async () => {
    mockedService.update.mockRejectedValue(
      new HTTPException(422, {
        message: 'endYearMonth must be greater than or equal to startYearMonth',
      }),
    )

    const res = await app.request('/chart-views/1', {
      method: 'PUT',
      body: JSON.stringify({ startYearMonth: '202801' }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })
})

describe('DELETE /chart-views/:id', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('正常削除で 204 No Content を返す', async () => {
    mockedService.delete.mockResolvedValue(undefined)

    const res = await app.request('/chart-views/1', {
      method: 'DELETE',
    })
    expect(res.status).toBe(204)
  })

  test('存在しないIDで 404 を返す', async () => {
    mockedService.delete.mockRejectedValue(
      new HTTPException(404, { message: "Chart view with ID '999' not found" }),
    )

    const res = await app.request('/chart-views/999', {
      method: 'DELETE',
    })
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })
})

describe('POST /chart-views/:id/actions/restore', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('正常復元で 200 を返す', async () => {
    mockedService.restore.mockResolvedValue(sampleView)

    const res = await app.request('/chart-views/1/actions/restore', {
      method: 'POST',
    })
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toMatchObject(sampleView)
  })

  test('存在しないIDで 404 を返す', async () => {
    mockedService.restore.mockRejectedValue(
      new HTTPException(404, { message: "Chart view with ID '999' not found" }),
    )

    const res = await app.request('/chart-views/999/actions/restore', {
      method: 'POST',
    })
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })
})
