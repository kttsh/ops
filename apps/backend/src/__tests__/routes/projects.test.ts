import { describe, test, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { problemResponse, getProblemType, getStatusTitle } from '@/utils/errorHelper'
import type { StatusCode } from 'hono/utils/http-status'

// --- モック ---
vi.mock('@/services/projectService', () => ({
  projectService: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    restore: vi.fn(),
  },
}))

// モックをインポート（vi.mock の後）
import { projectService } from '@/services/projectService'
import projects from '@/routes/projects'

const mockedService = vi.mocked(projectService)

// テスト用アプリ（グローバルエラーハンドラ付き）
function createApp() {
  const app = new Hono()

  app.route('/projects', projects)

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
const sampleProject = {
  projectId: 1,
  projectCode: 'PRJ-001',
  name: 'テスト案件',
  businessUnitCode: 'BU-001',
  businessUnitName: 'エンジニアリング部',
  projectTypeCode: 'PT-001',
  projectTypeName: '受託開発',
  startYearMonth: '202601',
  totalManhour: 100,
  status: 'ACTIVE',
  durationMonths: 12,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const sampleProject2 = {
  ...sampleProject,
  projectId: 2,
  projectCode: 'PRJ-002',
  name: '別の案件',
}

describe('GET /projects', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('一覧を data 配列と meta.pagination で返す', async () => {
    mockedService.findAll.mockResolvedValue({
      items: [sampleProject, sampleProject2],
      totalCount: 2,
    })

    const res = await app.request('/projects')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toHaveLength(2)
    expect(body.data[0]).toMatchObject(sampleProject)
    expect(body.meta.pagination).toMatchObject({
      currentPage: 1,
      pageSize: 20,
      totalItems: 2,
      totalPages: 1,
    })
  })

  test('page[number] と page[size] でページネーションする', async () => {
    mockedService.findAll.mockResolvedValue({
      items: [sampleProject2],
      totalCount: 2,
    })

    const res = await app.request('/projects?page[number]=2&page[size]=1')
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
      businessUnitCode: undefined,
      status: undefined,
    })
  })

  test('filter[includeDisabled]=true で論理削除済みを含む', async () => {
    mockedService.findAll.mockResolvedValue({
      items: [sampleProject],
      totalCount: 1,
    })

    const res = await app.request('/projects?filter[includeDisabled]=true')
    expect(res.status).toBe(200)

    expect(mockedService.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ includeDisabled: true }),
    )
  })

  test('filter[businessUnitCode] でフィルタリングする', async () => {
    mockedService.findAll.mockResolvedValue({
      items: [sampleProject],
      totalCount: 1,
    })

    const res = await app.request('/projects?filter[businessUnitCode]=BU-001')
    expect(res.status).toBe(200)

    expect(mockedService.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ businessUnitCode: 'BU-001' }),
    )
  })

  test('filter[status] でフィルタリングする', async () => {
    mockedService.findAll.mockResolvedValue({
      items: [sampleProject],
      totalCount: 1,
    })

    const res = await app.request('/projects?filter[status]=ACTIVE')
    expect(res.status).toBe(200)

    expect(mockedService.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'ACTIVE' }),
    )
  })

  test('不正なクエリパラメータで 422 を返す', async () => {
    const res = await app.request('/projects?page[number]=-1')
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
    expect(body.status).toBe(422)
    expect(body.errors).toBeDefined()
    expect(body.errors.length).toBeGreaterThan(0)
  })
})

describe('GET /projects/:id', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('指定 ID の案件を data オブジェクトで返す', async () => {
    mockedService.findById.mockResolvedValue(sampleProject)

    const res = await app.request('/projects/1')
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toMatchObject(sampleProject)
  })

  test('存在しない ID で 404 を返す', async () => {
    mockedService.findById.mockRejectedValue(
      new HTTPException(404, { message: "Project with ID '999' not found" }),
    )

    const res = await app.request('/projects/999')
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('不正な ID パラメータで 422 を返す', async () => {
    const res = await app.request('/projects/abc')
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })
})

describe('POST /projects', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('正常作成で 201 と Location ヘッダを返す', async () => {
    mockedService.create.mockResolvedValue(sampleProject)

    const res = await app.request('/projects', {
      method: 'POST',
      body: JSON.stringify({
        projectCode: 'PRJ-001',
        name: 'テスト案件',
        businessUnitCode: 'BU-001',
        projectTypeCode: 'PT-001',
        startYearMonth: '202601',
        totalManhour: 100,
        status: 'ACTIVE',
        durationMonths: 12,
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(201)
    expect(res.headers.get('Location')).toBe('/projects/1')

    const body = await res.json()
    expect(body.data).toMatchObject(sampleProject)
  })

  test('重複 projectCode で 409 を返す', async () => {
    mockedService.create.mockRejectedValue(
      new HTTPException(409, { message: "Project with code 'PRJ-001' already exists" }),
    )

    const res = await app.request('/projects', {
      method: 'POST',
      body: JSON.stringify({
        projectCode: 'PRJ-001',
        name: 'テスト案件',
        businessUnitCode: 'BU-001',
        startYearMonth: '202601',
        totalManhour: 100,
        status: 'ACTIVE',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(409)

    const body = await res.json()
    expect(body.type).toContain('conflict')
  })

  test('バリデーションエラーで 422 を返す', async () => {
    const res = await app.request('/projects', {
      method: 'POST',
      body: JSON.stringify({
        projectCode: '',
        name: '',
        businessUnitCode: '',
        startYearMonth: '',
        totalManhour: 0,
        status: '',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
    expect(body.errors).toBeDefined()
    expect(body.errors.length).toBeGreaterThan(0)
  })

  test('BU 存在しない場合の 422 を返す', async () => {
    mockedService.create.mockRejectedValue(
      new HTTPException(422, { message: "Business unit with code 'UNKNOWN' not found" }),
    )

    const res = await app.request('/projects', {
      method: 'POST',
      body: JSON.stringify({
        projectCode: 'PRJ-001',
        name: 'テスト',
        businessUnitCode: 'UNKNOWN',
        startYearMonth: '202601',
        totalManhour: 100,
        status: 'ACTIVE',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })
})

describe('PUT /projects/:id', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('正常更新で 200 を返す', async () => {
    const updatedProject = { ...sampleProject, name: '更新後の案件名' }
    mockedService.update.mockResolvedValue(updatedProject)

    const res = await app.request('/projects/1', {
      method: 'PUT',
      body: JSON.stringify({ name: '更新後の案件名' }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toMatchObject(updatedProject)
  })

  test('存在しない ID で 404 を返す', async () => {
    mockedService.update.mockRejectedValue(
      new HTTPException(404, { message: "Project with ID '999' not found" }),
    )

    const res = await app.request('/projects/999', {
      method: 'PUT',
      body: JSON.stringify({ name: 'テスト' }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('バリデーションエラーで 422 を返す（空ボディ）', async () => {
    const res = await app.request('/projects/1', {
      method: 'PUT',
      body: JSON.stringify({}),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })

  test('重複 projectCode で 409 を返す', async () => {
    mockedService.update.mockRejectedValue(
      new HTTPException(409, { message: "Project with code 'PRJ-001' already exists" }),
    )

    const res = await app.request('/projects/1', {
      method: 'PUT',
      body: JSON.stringify({ projectCode: 'PRJ-001' }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(409)

    const body = await res.json()
    expect(body.type).toContain('conflict')
  })
})

describe('DELETE /projects/:id', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('正常削除で 204 No Content を返す', async () => {
    mockedService.delete.mockResolvedValue(undefined)

    const res = await app.request('/projects/1', {
      method: 'DELETE',
    })
    expect(res.status).toBe(204)
  })

  test('存在しない ID で 404 を返す', async () => {
    mockedService.delete.mockRejectedValue(
      new HTTPException(404, { message: "Project with ID '999' not found" }),
    )

    const res = await app.request('/projects/999', {
      method: 'DELETE',
    })
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('参照中で 409 を返す', async () => {
    mockedService.delete.mockRejectedValue(
      new HTTPException(409, {
        message: "Project with ID '1' is referenced by other resources and cannot be deleted",
      }),
    )

    const res = await app.request('/projects/1', {
      method: 'DELETE',
    })
    expect(res.status).toBe(409)

    const body = await res.json()
    expect(body.type).toContain('conflict')
  })
})

describe('POST /projects/:id/actions/restore', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('正常復元で 200 を返す', async () => {
    mockedService.restore.mockResolvedValue(sampleProject)

    const res = await app.request('/projects/1/actions/restore', {
      method: 'POST',
    })
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toMatchObject(sampleProject)
  })

  test('存在しない ID で 404 を返す', async () => {
    mockedService.restore.mockRejectedValue(
      new HTTPException(404, { message: "Project with ID '999' not found" }),
    )

    const res = await app.request('/projects/999/actions/restore', {
      method: 'POST',
    })
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('未削除で 409 を返す', async () => {
    mockedService.restore.mockRejectedValue(
      new HTTPException(409, { message: "Project with ID '1' is not soft-deleted" }),
    )

    const res = await app.request('/projects/1/actions/restore', {
      method: 'POST',
    })
    expect(res.status).toBe(409)

    const body = await res.json()
    expect(body.type).toContain('conflict')
  })

  test('projectCode 重複で 409 を返す', async () => {
    mockedService.restore.mockRejectedValue(
      new HTTPException(409, {
        message: "Project with code 'PRJ-001' conflicts with an existing active project",
      }),
    )

    const res = await app.request('/projects/1/actions/restore', {
      method: 'POST',
    })
    expect(res.status).toBe(409)

    const body = await res.json()
    expect(body.type).toContain('conflict')
  })
})
