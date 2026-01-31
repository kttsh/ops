import { describe, test, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { problemResponse, getProblemType, getStatusTitle } from '@/utils/errorHelper'
import type { StatusCode } from 'hono/utils/http-status'

// --- モック ---
vi.mock('@/services/capacityScenarioService', () => ({
  capacityScenarioService: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    restore: vi.fn(),
  },
}))

// モックをインポート（vi.mock の後）
import { capacityScenarioService } from '@/services/capacityScenarioService'
import capacityScenarios from '@/routes/capacityScenarios'

const mockedService = vi.mocked(capacityScenarioService)

// テスト用アプリ（グローバルエラーハンドラ付き）
function createApp() {
  const app = new Hono()

  app.route('/capacity-scenarios', capacityScenarios)

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
const sampleScenario = {
  capacityScenarioId: 1,
  scenarioName: '標準シナリオ',
  isPrimary: true,
  description: '標準的なキャパシティ計画',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const sampleScenario2 = {
  capacityScenarioId: 2,
  scenarioName: '楽観シナリオ',
  isPrimary: false,
  description: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('GET /capacity-scenarios', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('一覧を data 配列と meta.pagination で返す', async () => {
    mockedService.findAll.mockResolvedValue({
      items: [sampleScenario, sampleScenario2],
      totalCount: 2,
    })

    const res = await app.request('/capacity-scenarios')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toHaveLength(2)
    expect(body.data[0]).toMatchObject(sampleScenario)
    expect(body.meta.pagination).toMatchObject({
      currentPage: 1,
      pageSize: 20,
      totalItems: 2,
      totalPages: 1,
    })
  })

  test('page[number] と page[size] でページネーションする', async () => {
    mockedService.findAll.mockResolvedValue({
      items: [sampleScenario2],
      totalCount: 2,
    })

    const res = await app.request('/capacity-scenarios?page[number]=2&page[size]=1')
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
      items: [sampleScenario],
      totalCount: 1,
    })

    const res = await app.request('/capacity-scenarios?filter[includeDisabled]=true')
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

    const res = await app.request('/capacity-scenarios')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toEqual([])
    expect(body.meta.pagination.totalItems).toBe(0)
    expect(body.meta.pagination.totalPages).toBe(0)
  })

  test('不正なクエリパラメータで 422 を返す', async () => {
    const res = await app.request('/capacity-scenarios?page[number]=-1')
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
    expect(body.status).toBe(422)
    expect(body.errors).toBeDefined()
    expect(body.errors.length).toBeGreaterThan(0)
  })
})

describe('GET /capacity-scenarios/:id', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('指定IDのキャパシティシナリオを data オブジェクトで返す', async () => {
    mockedService.findById.mockResolvedValue(sampleScenario)

    const res = await app.request('/capacity-scenarios/1')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toMatchObject(sampleScenario)
  })

  test('存在しないIDで 404 を返す', async () => {
    mockedService.findById.mockRejectedValue(
      new HTTPException(404, { message: "Capacity scenario with ID '999' not found" }),
    )

    const res = await app.request('/capacity-scenarios/999')
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })
})

describe('POST /capacity-scenarios', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('正常作成で 201 と Location ヘッダを返す', async () => {
    mockedService.create.mockResolvedValue(sampleScenario)

    const res = await app.request('/capacity-scenarios', {
      method: 'POST',
      body: JSON.stringify({
        scenarioName: '標準シナリオ',
        isPrimary: true,
        description: '標準的なキャパシティ計画',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(201)
    expect(res.headers.get('Location')).toBe('/capacity-scenarios/1')

    const body = await res.json()
    expect(body.data).toMatchObject(sampleScenario)
  })

  test('isPrimary 省略時にデフォルト値 false が使われる', async () => {
    mockedService.create.mockResolvedValue(sampleScenario2)

    const res = await app.request('/capacity-scenarios', {
      method: 'POST',
      body: JSON.stringify({
        scenarioName: '楽観シナリオ',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(201)

    expect(mockedService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        scenarioName: '楽観シナリオ',
        isPrimary: false,
      }),
    )
  })

  test('バリデーションエラーで 422 を返す（scenarioName 空文字）', async () => {
    const res = await app.request('/capacity-scenarios', {
      method: 'POST',
      body: JSON.stringify({
        scenarioName: '',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
    expect(body.errors).toBeDefined()
    expect(body.errors.length).toBeGreaterThan(0)
  })

  test('バリデーションエラーで 422 を返す（scenarioName 未指定）', async () => {
    const res = await app.request('/capacity-scenarios', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
    expect(body.errors).toBeDefined()
  })

  test('scenarioName が101文字以上の場合 422 を返す', async () => {
    const res = await app.request('/capacity-scenarios', {
      method: 'POST',
      body: JSON.stringify({
        scenarioName: 'a'.repeat(101),
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.errors).toBeDefined()
  })

  test('description が501文字以上の場合 422 を返す', async () => {
    const res = await app.request('/capacity-scenarios', {
      method: 'POST',
      body: JSON.stringify({
        scenarioName: 'テスト',
        description: 'a'.repeat(501),
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.errors).toBeDefined()
  })
})

describe('PUT /capacity-scenarios/:id', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('正常更新で 200 を返す', async () => {
    const updatedScenario = { ...sampleScenario, scenarioName: '更新後シナリオ' }
    mockedService.update.mockResolvedValue(updatedScenario)

    const res = await app.request('/capacity-scenarios/1', {
      method: 'PUT',
      body: JSON.stringify({
        scenarioName: '更新後シナリオ',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toMatchObject(updatedScenario)
  })

  test('存在しないIDで 404 を返す', async () => {
    mockedService.update.mockRejectedValue(
      new HTTPException(404, { message: "Capacity scenario with ID '999' not found" }),
    )

    const res = await app.request('/capacity-scenarios/999', {
      method: 'PUT',
      body: JSON.stringify({ scenarioName: 'テスト' }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('バリデーションエラーで 422 を返す（scenarioName 空文字）', async () => {
    const res = await app.request('/capacity-scenarios/1', {
      method: 'PUT',
      body: JSON.stringify({ scenarioName: '' }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
    expect(body.errors).toBeDefined()
  })
})

describe('DELETE /capacity-scenarios/:id', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('正常削除で 204 No Content を返す', async () => {
    mockedService.delete.mockResolvedValue(undefined)

    const res = await app.request('/capacity-scenarios/1', {
      method: 'DELETE',
    })
    expect(res.status).toBe(204)
  })

  test('存在しないIDで 404 を返す', async () => {
    mockedService.delete.mockRejectedValue(
      new HTTPException(404, { message: "Capacity scenario with ID '999' not found" }),
    )

    const res = await app.request('/capacity-scenarios/999', {
      method: 'DELETE',
    })
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('参照中で 409 を返す', async () => {
    mockedService.delete.mockRejectedValue(
      new HTTPException(409, {
        message: "Capacity scenario with ID '1' is referenced by other resources and cannot be deleted",
      }),
    )

    const res = await app.request('/capacity-scenarios/1', {
      method: 'DELETE',
    })
    expect(res.status).toBe(409)

    const body = await res.json()
    expect(body.type).toContain('conflict')
  })
})

describe('POST /capacity-scenarios/:id/actions/restore', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('正常復元で 200 を返す', async () => {
    mockedService.restore.mockResolvedValue(sampleScenario)

    const res = await app.request('/capacity-scenarios/1/actions/restore', {
      method: 'POST',
    })
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toMatchObject(sampleScenario)
  })

  test('存在しないIDで 404 を返す', async () => {
    mockedService.restore.mockRejectedValue(
      new HTTPException(404, { message: "Capacity scenario with ID '999' not found" }),
    )

    const res = await app.request('/capacity-scenarios/999/actions/restore', {
      method: 'POST',
    })
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('未削除で 409 を返す', async () => {
    mockedService.restore.mockRejectedValue(
      new HTTPException(409, { message: "Capacity scenario with ID '1' is not soft-deleted" }),
    )

    const res = await app.request('/capacity-scenarios/1/actions/restore', {
      method: 'POST',
    })
    expect(res.status).toBe(409)

    const body = await res.json()
    expect(body.type).toContain('conflict')
  })
})
