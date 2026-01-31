import { describe, test, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { problemResponse, getProblemType, getStatusTitle } from '@/utils/errorHelper'
import type { StatusCode } from 'hono/utils/http-status'

// --- モック ---
vi.mock('@/services/headcountPlanCaseService', () => ({
  headcountPlanCaseService: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    restore: vi.fn(),
  },
}))

// モックをインポート（vi.mock の後）
import { headcountPlanCaseService } from '@/services/headcountPlanCaseService'
import headcountPlanCases from '@/routes/headcountPlanCases'

const mockedService = vi.mocked(headcountPlanCaseService)

// テスト用アプリ（グローバルエラーハンドラ付き）
function createApp() {
  const app = new Hono()

  app.route('/headcount-plan-cases', headcountPlanCases)

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
const sampleCase = {
  headcountPlanCaseId: 1,
  caseName: '標準ケース',
  isPrimary: true,
  description: '標準的な人員計画',
  businessUnitCode: 'plant',
  businessUnitName: 'プラント事業',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const sampleCase2 = {
  headcountPlanCaseId: 2,
  caseName: '楽観ケース',
  isPrimary: false,
  description: null,
  businessUnitCode: null,
  businessUnitName: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('GET /headcount-plan-cases', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('一覧を data 配列と meta.pagination で返す', async () => {
    mockedService.findAll.mockResolvedValue({
      items: [sampleCase, sampleCase2],
      totalCount: 2,
    })

    const res = await app.request('/headcount-plan-cases')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toHaveLength(2)
    expect(body.data[0]).toMatchObject(sampleCase)
    expect(body.meta.pagination).toMatchObject({
      currentPage: 1,
      pageSize: 20,
      totalItems: 2,
      totalPages: 1,
    })
  })

  test('page[number] と page[size] でページネーションする', async () => {
    mockedService.findAll.mockResolvedValue({
      items: [sampleCase2],
      totalCount: 2,
    })

    const res = await app.request('/headcount-plan-cases?page[number]=2&page[size]=1')
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
      items: [sampleCase],
      totalCount: 1,
    })

    const res = await app.request('/headcount-plan-cases?filter[includeDisabled]=true')
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

    const res = await app.request('/headcount-plan-cases')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toEqual([])
    expect(body.meta.pagination.totalItems).toBe(0)
    expect(body.meta.pagination.totalPages).toBe(0)
  })

  test('不正なクエリパラメータで 422 を返す', async () => {
    const res = await app.request('/headcount-plan-cases?page[number]=-1')
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
    expect(body.status).toBe(422)
    expect(body.errors).toBeDefined()
    expect(body.errors.length).toBeGreaterThan(0)
  })
})

describe('GET /headcount-plan-cases/:id', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('指定IDの人員計画ケースを data オブジェクトで返す', async () => {
    mockedService.findById.mockResolvedValue(sampleCase)

    const res = await app.request('/headcount-plan-cases/1')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toMatchObject(sampleCase)
  })

  test('存在しないIDで 404 を返す', async () => {
    mockedService.findById.mockRejectedValue(
      new HTTPException(404, { message: "Headcount plan case with ID '999' not found" }),
    )

    const res = await app.request('/headcount-plan-cases/999')
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })
})

describe('POST /headcount-plan-cases', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('正常作成で 201 と Location ヘッダを返す', async () => {
    mockedService.create.mockResolvedValue(sampleCase)

    const res = await app.request('/headcount-plan-cases', {
      method: 'POST',
      body: JSON.stringify({
        caseName: '標準ケース',
        isPrimary: true,
        description: '標準的な人員計画',
        businessUnitCode: 'plant',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(201)
    expect(res.headers.get('Location')).toBe('/headcount-plan-cases/1')

    const body = await res.json()
    expect(body.data).toMatchObject(sampleCase)
  })

  test('isPrimary 省略時にデフォルト値 false が使われる', async () => {
    mockedService.create.mockResolvedValue(sampleCase2)

    const res = await app.request('/headcount-plan-cases', {
      method: 'POST',
      body: JSON.stringify({
        caseName: '楽観ケース',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(201)

    expect(mockedService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        caseName: '楽観ケース',
        isPrimary: false,
      }),
    )
  })

  test('businessUnitCode が不存在で 422 を返す', async () => {
    mockedService.create.mockRejectedValue(
      new HTTPException(422, { message: "Business unit with code 'INVALID' not found" }),
    )

    const res = await app.request('/headcount-plan-cases', {
      method: 'POST',
      body: JSON.stringify({
        caseName: 'テスト',
        businessUnitCode: 'INVALID',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })

  test('バリデーションエラーで 422 を返す（caseName 空文字）', async () => {
    const res = await app.request('/headcount-plan-cases', {
      method: 'POST',
      body: JSON.stringify({
        caseName: '',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
    expect(body.errors).toBeDefined()
    expect(body.errors.length).toBeGreaterThan(0)
  })

  test('バリデーションエラーで 422 を返す（caseName 未指定）', async () => {
    const res = await app.request('/headcount-plan-cases', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
    expect(body.errors).toBeDefined()
  })

  test('businessUnitCode が不正文字を含む場合 422 を返す', async () => {
    const res = await app.request('/headcount-plan-cases', {
      method: 'POST',
      body: JSON.stringify({
        caseName: 'テスト',
        businessUnitCode: 'BU 001!',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.errors).toBeDefined()
  })

  test('caseName が101文字以上の場合 422 を返す', async () => {
    const res = await app.request('/headcount-plan-cases', {
      method: 'POST',
      body: JSON.stringify({
        caseName: 'a'.repeat(101),
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.errors).toBeDefined()
  })
})

describe('PUT /headcount-plan-cases/:id', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('正常更新で 200 を返す', async () => {
    const updatedCase = { ...sampleCase, caseName: '更新後ケース' }
    mockedService.update.mockResolvedValue(updatedCase)

    const res = await app.request('/headcount-plan-cases/1', {
      method: 'PUT',
      body: JSON.stringify({
        caseName: '更新後ケース',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toMatchObject(updatedCase)
  })

  test('存在しないIDで 404 を返す', async () => {
    mockedService.update.mockRejectedValue(
      new HTTPException(404, { message: "Headcount plan case with ID '999' not found" }),
    )

    const res = await app.request('/headcount-plan-cases/999', {
      method: 'PUT',
      body: JSON.stringify({ caseName: 'テスト' }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('バリデーションエラーで 422 を返す（caseName 空文字）', async () => {
    const res = await app.request('/headcount-plan-cases/1', {
      method: 'PUT',
      body: JSON.stringify({ caseName: '' }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
    expect(body.errors).toBeDefined()
  })

  test('businessUnitCode が不存在で 422 を返す', async () => {
    mockedService.update.mockRejectedValue(
      new HTTPException(422, { message: "Business unit with code 'INVALID' not found" }),
    )

    const res = await app.request('/headcount-plan-cases/1', {
      method: 'PUT',
      body: JSON.stringify({ businessUnitCode: 'INVALID' }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })
})

describe('DELETE /headcount-plan-cases/:id', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('正常削除で 204 No Content を返す', async () => {
    mockedService.delete.mockResolvedValue(undefined)

    const res = await app.request('/headcount-plan-cases/1', {
      method: 'DELETE',
    })
    expect(res.status).toBe(204)
  })

  test('存在しないIDで 404 を返す', async () => {
    mockedService.delete.mockRejectedValue(
      new HTTPException(404, { message: "Headcount plan case with ID '999' not found" }),
    )

    const res = await app.request('/headcount-plan-cases/999', {
      method: 'DELETE',
    })
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('参照中で 409 を返す', async () => {
    mockedService.delete.mockRejectedValue(
      new HTTPException(409, {
        message: "Headcount plan case with ID '1' is referenced by other resources and cannot be deleted",
      }),
    )

    const res = await app.request('/headcount-plan-cases/1', {
      method: 'DELETE',
    })
    expect(res.status).toBe(409)

    const body = await res.json()
    expect(body.type).toContain('conflict')
  })
})

describe('POST /headcount-plan-cases/:id/actions/restore', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('正常復元で 200 を返す', async () => {
    mockedService.restore.mockResolvedValue(sampleCase)

    const res = await app.request('/headcount-plan-cases/1/actions/restore', {
      method: 'POST',
    })
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toMatchObject(sampleCase)
  })

  test('存在しないIDで 404 を返す', async () => {
    mockedService.restore.mockRejectedValue(
      new HTTPException(404, { message: "Headcount plan case with ID '999' not found" }),
    )

    const res = await app.request('/headcount-plan-cases/999/actions/restore', {
      method: 'POST',
    })
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('未削除で 409 を返す', async () => {
    mockedService.restore.mockRejectedValue(
      new HTTPException(409, { message: "Headcount plan case with ID '1' is not soft-deleted" }),
    )

    const res = await app.request('/headcount-plan-cases/1/actions/restore', {
      method: 'POST',
    })
    expect(res.status).toBe(409)

    const body = await res.json()
    expect(body.type).toContain('conflict')
  })
})
