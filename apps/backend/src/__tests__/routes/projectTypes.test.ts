import { describe, test, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { problemResponse, getProblemType, getStatusTitle } from '@/utils/errorHelper'
import type { StatusCode } from 'hono/utils/http-status'

// --- モック ---
vi.mock('@/services/projectTypeService', () => ({
  projectTypeService: {
    findAll: vi.fn(),
    findByCode: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    restore: vi.fn(),
  },
}))

// モックをインポート（vi.mock の後）
import { projectTypeService } from '@/services/projectTypeService'
import projectTypes from '@/routes/projectTypes'

const mockedService = vi.mocked(projectTypeService)

// テスト用アプリ（グローバルエラーハンドラ付き）
function createApp() {
  const app = new Hono()

  app.route('/project-types', projectTypes)

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
const samplePT = {
  projectTypeCode: 'PT-001',
  name: '新規開発',
  displayOrder: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const samplePT2 = {
  projectTypeCode: 'PT-002',
  name: '保守運用',
  displayOrder: 2,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('GET /project-types', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('一覧を data 配列と meta.pagination で返す', async () => {
    mockedService.findAll.mockResolvedValue({
      items: [samplePT, samplePT2],
      totalCount: 2,
    })

    const res = await app.request('/project-types')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toHaveLength(2)
    expect(body.data[0]).toMatchObject(samplePT)
    expect(body.meta.pagination).toMatchObject({
      currentPage: 1,
      pageSize: 20,
      totalItems: 2,
      totalPages: 1,
    })
  })

  test('page[number] と page[size] でページネーションする', async () => {
    mockedService.findAll.mockResolvedValue({
      items: [samplePT2],
      totalCount: 2,
    })

    const res = await app.request('/project-types?page[number]=2&page[size]=1')
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
      items: [samplePT],
      totalCount: 1,
    })

    const res = await app.request('/project-types?filter[includeDisabled]=true')
    expect(res.status).toBe(200)

    expect(mockedService.findAll).toHaveBeenCalledWith({
      page: 1,
      pageSize: 20,
      includeDisabled: true,
    })
  })

  test('不正なクエリパラメータで 422 を返す', async () => {
    const res = await app.request('/project-types?page[number]=-1')
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
    expect(body.status).toBe(422)
    expect(body.errors).toBeDefined()
    expect(body.errors.length).toBeGreaterThan(0)
  })
})

describe('GET /project-types/:projectTypeCode', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('指定コードの案件タイプを data オブジェクトで返す', async () => {
    mockedService.findByCode.mockResolvedValue(samplePT)

    const res = await app.request('/project-types/PT-001')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toMatchObject(samplePT)
  })

  test('存在しないコードで 404 を返す', async () => {
    mockedService.findByCode.mockRejectedValue(
      new HTTPException(404, { message: "Project type with code 'UNKNOWN' not found" }),
    )

    const res = await app.request('/project-types/UNKNOWN')
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })
})

describe('POST /project-types', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('正常作成で 201 と Location ヘッダを返す', async () => {
    mockedService.create.mockResolvedValue(samplePT)

    const res = await app.request('/project-types', {
      method: 'POST',
      body: JSON.stringify({
        projectTypeCode: 'PT-001',
        name: '新規開発',
        displayOrder: 1,
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(201)
    expect(res.headers.get('Location')).toBe('/project-types/PT-001')

    const body = await res.json()
    expect(body.data).toMatchObject(samplePT)
  })

  test('displayOrder 省略時にデフォルト値 0 が使われる', async () => {
    const ptWithDefault = { ...samplePT, displayOrder: 0 }
    mockedService.create.mockResolvedValue(ptWithDefault)

    const res = await app.request('/project-types', {
      method: 'POST',
      body: JSON.stringify({
        projectTypeCode: 'PT-001',
        name: '新規開発',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(201)

    expect(mockedService.create).toHaveBeenCalledWith({
      projectTypeCode: 'PT-001',
      name: '新規開発',
      displayOrder: 0,
    })
  })

  test('重複コードで 409 を返す', async () => {
    mockedService.create.mockRejectedValue(
      new HTTPException(409, { message: "Project type with code 'PT-001' already exists" }),
    )

    const res = await app.request('/project-types', {
      method: 'POST',
      body: JSON.stringify({
        projectTypeCode: 'PT-001',
        name: '新規開発',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(409)

    const body = await res.json()
    expect(body.type).toContain('conflict')
  })

  test('バリデーションエラーで 422 を返す', async () => {
    const res = await app.request('/project-types', {
      method: 'POST',
      body: JSON.stringify({
        projectTypeCode: '',
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

  test('projectTypeCode が不正文字を含む場合 422 を返す', async () => {
    const res = await app.request('/project-types', {
      method: 'POST',
      body: JSON.stringify({
        projectTypeCode: 'PT 001!',
        name: '新規開発',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.errors).toBeDefined()
  })
})

describe('PUT /project-types/:projectTypeCode', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('正常更新で 200 を返す', async () => {
    const updatedPT = { ...samplePT, name: 'Updated 新規開発' }
    mockedService.update.mockResolvedValue(updatedPT)

    const res = await app.request('/project-types/PT-001', {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Updated 新規開発',
        displayOrder: 1,
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toMatchObject(updatedPT)
  })

  test('存在しないコードで 404 を返す', async () => {
    mockedService.update.mockRejectedValue(
      new HTTPException(404, { message: "Project type with code 'UNKNOWN' not found" }),
    )

    const res = await app.request('/project-types/UNKNOWN', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Test' }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('バリデーションエラーで 422 を返す', async () => {
    const res = await app.request('/project-types/PT-001', {
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

describe('DELETE /project-types/:projectTypeCode', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('正常削除で 204 No Content を返す', async () => {
    mockedService.delete.mockResolvedValue(undefined)

    const res = await app.request('/project-types/PT-001', {
      method: 'DELETE',
    })
    expect(res.status).toBe(204)
  })

  test('存在しないコードで 404 を返す', async () => {
    mockedService.delete.mockRejectedValue(
      new HTTPException(404, { message: "Project type with code 'UNKNOWN' not found" }),
    )

    const res = await app.request('/project-types/UNKNOWN', {
      method: 'DELETE',
    })
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('参照中で 409 を返す', async () => {
    mockedService.delete.mockRejectedValue(
      new HTTPException(409, {
        message: "Project type with code 'PT-001' is referenced by other resources and cannot be deleted",
      }),
    )

    const res = await app.request('/project-types/PT-001', {
      method: 'DELETE',
    })
    expect(res.status).toBe(409)

    const body = await res.json()
    expect(body.type).toContain('conflict')
  })
})

describe('POST /project-types/:projectTypeCode/actions/restore', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('正常復元で 200 を返す', async () => {
    mockedService.restore.mockResolvedValue(samplePT)

    const res = await app.request('/project-types/PT-001/actions/restore', {
      method: 'POST',
    })
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toMatchObject(samplePT)
  })

  test('存在しないコードで 404 を返す', async () => {
    mockedService.restore.mockRejectedValue(
      new HTTPException(404, { message: "Project type with code 'UNKNOWN' not found" }),
    )

    const res = await app.request('/project-types/UNKNOWN/actions/restore', {
      method: 'POST',
    })
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('未削除で 409 を返す', async () => {
    mockedService.restore.mockRejectedValue(
      new HTTPException(409, { message: "Project type with code 'PT-001' is not soft-deleted" }),
    )

    const res = await app.request('/project-types/PT-001/actions/restore', {
      method: 'POST',
    })
    expect(res.status).toBe(409)

    const body = await res.json()
    expect(body.type).toContain('conflict')
  })
})
