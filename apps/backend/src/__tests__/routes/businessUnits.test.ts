import { describe, test, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { problemResponse, getProblemType, getStatusTitle } from '@/utils/errorHelper'
import type { StatusCode } from 'hono/utils/http-status'

// --- モック ---
vi.mock('@/services/businessUnitService', () => ({
  businessUnitService: {
    findAll: vi.fn(),
    findByCode: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    restore: vi.fn(),
  },
}))

// モックをインポート（vi.mock の後）
import { businessUnitService } from '@/services/businessUnitService'
import businessUnits from '@/routes/businessUnits'

const mockedService = vi.mocked(businessUnitService)

// テスト用アプリ（グローバルエラーハンドラ付き）
function createApp() {
  const app = new Hono()

  app.route('/business-units', businessUnits)

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
const sampleBU = {
  businessUnitCode: 'BU-001',
  name: 'Engineering',
  displayOrder: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const sampleBU2 = {
  businessUnitCode: 'BU-002',
  name: 'Sales',
  displayOrder: 2,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('GET /business-units', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('一覧を data 配列と meta.pagination で返す', async () => {
    mockedService.findAll.mockResolvedValue({
      items: [sampleBU, sampleBU2],
      totalCount: 2,
    })

    const res = await app.request('/business-units')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toHaveLength(2)
    expect(body.data[0]).toMatchObject(sampleBU)
    expect(body.meta.pagination).toMatchObject({
      currentPage: 1,
      pageSize: 20,
      totalItems: 2,
      totalPages: 1,
    })
  })

  test('page[number] と page[size] でページネーションする', async () => {
    mockedService.findAll.mockResolvedValue({
      items: [sampleBU2],
      totalCount: 2,
    })

    const res = await app.request('/business-units?page[number]=2&page[size]=1')
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
      items: [sampleBU],
      totalCount: 1,
    })

    const res = await app.request('/business-units?filter[includeDisabled]=true')
    expect(res.status).toBe(200)

    expect(mockedService.findAll).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      includeDisabled: true,
    })
  })

  test('不正なクエリパラメータで 422 を返す', async () => {
    const res = await app.request('/business-units?page[number]=-1')
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
    expect(body.status).toBe(422)
    expect(body.errors).toBeDefined()
    expect(body.errors.length).toBeGreaterThan(0)
  })
})

describe('GET /business-units/:businessUnitCode', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('指定コードのビジネスユニットを data オブジェクトで返す', async () => {
    mockedService.findByCode.mockResolvedValue(sampleBU)

    const res = await app.request('/business-units/BU-001')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toMatchObject(sampleBU)
  })

  test('存在しないコードで 404 を返す', async () => {
    mockedService.findByCode.mockRejectedValue(
      new HTTPException(404, { message: "Business unit with code 'UNKNOWN' not found" }),
    )

    const res = await app.request('/business-units/UNKNOWN')
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })
})

describe('POST /business-units', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('正常作成で 201 と Location ヘッダを返す', async () => {
    mockedService.create.mockResolvedValue(sampleBU)

    const res = await app.request('/business-units', {
      method: 'POST',
      body: JSON.stringify({
        businessUnitCode: 'BU-001',
        name: 'Engineering',
        displayOrder: 1,
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(201)
    expect(res.headers.get('Location')).toBe('/business-units/BU-001')

    const body = await res.json()
    expect(body.data).toMatchObject(sampleBU)
  })

  test('displayOrder 省略時にデフォルト値 0 が使われる', async () => {
    const buWithDefault = { ...sampleBU, displayOrder: 0 }
    mockedService.create.mockResolvedValue(buWithDefault)

    const res = await app.request('/business-units', {
      method: 'POST',
      body: JSON.stringify({
        businessUnitCode: 'BU-001',
        name: 'Engineering',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(201)

    expect(mockedService.create).toHaveBeenCalledWith({
      businessUnitCode: 'BU-001',
      name: 'Engineering',
      displayOrder: 0,
    })
  })

  test('重複コードで 409 を返す', async () => {
    mockedService.create.mockRejectedValue(
      new HTTPException(409, { message: "Business unit with code 'BU-001' already exists" }),
    )

    const res = await app.request('/business-units', {
      method: 'POST',
      body: JSON.stringify({
        businessUnitCode: 'BU-001',
        name: 'Engineering',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(409)

    const body = await res.json()
    expect(body.type).toContain('conflict')
  })

  test('バリデーションエラーで 422 を返す', async () => {
    const res = await app.request('/business-units', {
      method: 'POST',
      body: JSON.stringify({
        businessUnitCode: '',
        name: '',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
    expect(body.errors).toBeDefined()
    expect(body.errors.length).toBeGreaterThan(0)
  })

  test('businessUnitCode が不正文字を含む場合 422 を返す', async () => {
    const res = await app.request('/business-units', {
      method: 'POST',
      body: JSON.stringify({
        businessUnitCode: 'BU 001!',
        name: 'Engineering',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.errors).toBeDefined()
  })
})

describe('PUT /business-units/:businessUnitCode', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('正常更新で 200 を返す', async () => {
    const updatedBU = { ...sampleBU, name: 'Updated Engineering' }
    mockedService.update.mockResolvedValue(updatedBU)

    const res = await app.request('/business-units/BU-001', {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Updated Engineering',
        displayOrder: 1,
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toMatchObject(updatedBU)
  })

  test('存在しないコードで 404 を返す', async () => {
    mockedService.update.mockRejectedValue(
      new HTTPException(404, { message: "Business unit with code 'UNKNOWN' not found" }),
    )

    const res = await app.request('/business-units/UNKNOWN', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Test' }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('バリデーションエラーで 422 を返す', async () => {
    const res = await app.request('/business-units/BU-001', {
      method: 'PUT',
      body: JSON.stringify({ name: '' }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
    expect(body.errors).toBeDefined()
  })
})

describe('DELETE /business-units/:businessUnitCode', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('正常削除で 204 No Content を返す', async () => {
    mockedService.delete.mockResolvedValue(undefined)

    const res = await app.request('/business-units/BU-001', {
      method: 'DELETE',
    })
    expect(res.status).toBe(204)
  })

  test('存在しないコードで 404 を返す', async () => {
    mockedService.delete.mockRejectedValue(
      new HTTPException(404, { message: "Business unit with code 'UNKNOWN' not found" }),
    )

    const res = await app.request('/business-units/UNKNOWN', {
      method: 'DELETE',
    })
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('参照中で 409 を返す', async () => {
    mockedService.delete.mockRejectedValue(
      new HTTPException(409, {
        message: "Business unit with code 'BU-001' is referenced by other resources and cannot be deleted",
      }),
    )

    const res = await app.request('/business-units/BU-001', {
      method: 'DELETE',
    })
    expect(res.status).toBe(409)

    const body = await res.json()
    expect(body.type).toContain('conflict')
  })
})

describe('POST /business-units/:businessUnitCode/actions/restore', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('正常復元で 200 を返す', async () => {
    mockedService.restore.mockResolvedValue(sampleBU)

    const res = await app.request('/business-units/BU-001/actions/restore', {
      method: 'POST',
    })
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toMatchObject(sampleBU)
  })

  test('存在しないコードで 404 を返す', async () => {
    mockedService.restore.mockRejectedValue(
      new HTTPException(404, { message: "Business unit with code 'UNKNOWN' not found" }),
    )

    const res = await app.request('/business-units/UNKNOWN/actions/restore', {
      method: 'POST',
    })
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('未削除で 409 を返す', async () => {
    mockedService.restore.mockRejectedValue(
      new HTTPException(409, { message: "Business unit with code 'BU-001' is not soft-deleted" }),
    )

    const res = await app.request('/business-units/BU-001/actions/restore', {
      method: 'POST',
    })
    expect(res.status).toBe(409)

    const body = await res.json()
    expect(body.type).toContain('conflict')
  })
})
