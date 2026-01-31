import { describe, test, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { problemResponse, getProblemType, getStatusTitle } from '@/utils/errorHelper'
import type { StatusCode } from 'hono/utils/http-status'

// --- モック ---
vi.mock('@/services/chartViewProjectItemService', () => ({
  chartViewProjectItemService: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    updateDisplayOrder: vi.fn(),
  },
}))

// モックをインポート（vi.mock の後）
import { chartViewProjectItemService } from '@/services/chartViewProjectItemService'
import chartViewProjectItems from '@/routes/chartViewProjectItems'

const mockedService = vi.mocked(chartViewProjectItemService)

// テスト用アプリ（グローバルエラーハンドラ付き）
function createApp() {
  const app = new Hono()

  app.route('/chart-views/:chartViewId/project-items', chartViewProjectItems)

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
const sampleItem1 = {
  chartViewProjectItemId: 1,
  chartViewId: 10,
  projectId: 5,
  projectCaseId: 12,
  displayOrder: 0,
  isVisible: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  project: {
    projectCode: 'PRJ-001',
    projectName: '新規開発プロジェクトA',
  },
  projectCase: {
    caseName: '標準ケース',
  },
}

const sampleItem2 = {
  chartViewProjectItemId: 2,
  chartViewId: 10,
  projectId: 8,
  projectCaseId: null,
  displayOrder: 1,
  isVisible: true,
  createdAt: '2026-01-02T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
  project: {
    projectCode: 'PRJ-002',
    projectName: '改修プロジェクトB',
  },
  projectCase: null,
}

const BASE_URL = '/chart-views/10/project-items'

// =============================================================================
// GET /chart-views/:chartViewId/project-items - 一覧取得
// =============================================================================
describe('GET /chart-views/:chartViewId/project-items', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('一覧を data 配列形式で返す', async () => {
    mockedService.findAll.mockResolvedValue([sampleItem1, sampleItem2])

    const res = await app.request(BASE_URL)
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toHaveLength(2)
    expect(body.data[0]).toMatchObject(sampleItem1)
    expect(body.data[1]).toMatchObject(sampleItem2)
  })

  test('空リストの場合も 200 を返す', async () => {
    mockedService.findAll.mockResolvedValue([])

    const res = await app.request(BASE_URL)
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toHaveLength(0)
  })

  test('サービスの呼び出しパラメータを検証する', async () => {
    mockedService.findAll.mockResolvedValue([])

    await app.request(BASE_URL)

    expect(mockedService.findAll).toHaveBeenCalledWith(10)
  })

  test('project/projectCase のネストオブジェクトが含まれる', async () => {
    mockedService.findAll.mockResolvedValue([sampleItem1, sampleItem2])

    const res = await app.request(BASE_URL)
    const body = await res.json()

    expect(body.data[0].project.projectCode).toBe('PRJ-001')
    expect(body.data[0].projectCase.caseName).toBe('標準ケース')
    expect(body.data[1].projectCase).toBeNull()
  })

  test('存在しないチャートビューIDで 404 を返す', async () => {
    mockedService.findAll.mockRejectedValue(
      new HTTPException(404, { message: "Chart view with ID '999' not found" }),
    )

    const res = await app.request('/chart-views/999/project-items')
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('不正な chartViewId で 422 を返す', async () => {
    const res = await app.request('/chart-views/abc/project-items')
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })
})

// =============================================================================
// GET /chart-views/:chartViewId/project-items/:id - 単一取得
// =============================================================================
describe('GET /chart-views/:chartViewId/project-items/:id', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('指定IDの項目を data オブジェクトで返す', async () => {
    mockedService.findById.mockResolvedValue(sampleItem1)

    const res = await app.request(`${BASE_URL}/1`)
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toMatchObject(sampleItem1)
  })

  test('存在しないIDで 404 を返す', async () => {
    mockedService.findById.mockRejectedValue(
      new HTTPException(404, { message: "Chart view project item with ID '999' not found" }),
    )

    const res = await app.request(`${BASE_URL}/999`)
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('chartViewId 不一致で 404 を返す', async () => {
    mockedService.findById.mockRejectedValue(
      new HTTPException(404, { message: "Chart view project item with ID '1' not found" }),
    )

    const res = await app.request('/chart-views/20/project-items/1')
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('不正なパスパラメータで 422 を返す', async () => {
    const res = await app.request(`${BASE_URL}/abc`)
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })
})

// =============================================================================
// POST /chart-views/:chartViewId/project-items - 新規作成
// =============================================================================
describe('POST /chart-views/:chartViewId/project-items', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('正常作成で 201 と Location ヘッダを返す', async () => {
    mockedService.create.mockResolvedValue(sampleItem1)

    const res = await app.request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({
        projectId: 5,
        projectCaseId: 12,
        displayOrder: 0,
        isVisible: true,
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(201)
    expect(res.headers.get('Location')).toBe('/chart-views/10/project-items/1')

    const body = await res.json()
    expect(body.data).toMatchObject(sampleItem1)
  })

  test('デフォルト値で作成できる（displayOrder, isVisible, projectCaseId 省略）', async () => {
    mockedService.create.mockResolvedValue(sampleItem2)

    const res = await app.request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({
        projectId: 8,
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(201)

    expect(mockedService.create).toHaveBeenCalledWith(10, {
      projectId: 8,
      displayOrder: 0,
      isVisible: true,
    })
  })

  test('バリデーションエラー（projectId 欠落）で 422 を返す', async () => {
    const res = await app.request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({
        displayOrder: 0,
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
    expect(body.errors).toBeDefined()
  })

  test('バリデーションエラー（projectId が0以下）で 422 を返す', async () => {
    const res = await app.request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({
        projectId: 0,
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })

  test('バリデーションエラー（負の displayOrder）で 422 を返す', async () => {
    const res = await app.request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({
        projectId: 5,
        displayOrder: -1,
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })

  test('親チャートビュー不存在で 404 を返す', async () => {
    mockedService.create.mockRejectedValue(
      new HTTPException(404, { message: "Chart view with ID '999' not found" }),
    )

    const res = await app.request('/chart-views/999/project-items', {
      method: 'POST',
      body: JSON.stringify({
        projectId: 5,
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('存在しない案件IDで 422 を返す', async () => {
    mockedService.create.mockRejectedValue(
      new HTTPException(422, { message: "Project with ID '999' not found" }),
    )

    const res = await app.request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({
        projectId: 999,
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })

  test('案件ケース所属不一致で 422 を返す', async () => {
    mockedService.create.mockRejectedValue(
      new HTTPException(422, {
        message: "Project case with ID '99' not found or does not belong to project '5'",
      }),
    )

    const res = await app.request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({
        projectId: 5,
        projectCaseId: 99,
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })
})

// =============================================================================
// PUT /chart-views/:chartViewId/project-items/display-order - 一括表示順序更新
// =============================================================================
describe('PUT /chart-views/:chartViewId/project-items/display-order', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('正常更新で 200 と更新後の一覧を返す', async () => {
    const reorderedItems = [
      { ...sampleItem2, displayOrder: 0 },
      { ...sampleItem1, displayOrder: 1 },
    ]
    mockedService.updateDisplayOrder.mockResolvedValue(reorderedItems)

    const res = await app.request(`${BASE_URL}/display-order`, {
      method: 'PUT',
      body: JSON.stringify({
        items: [
          { chartViewProjectItemId: 2, displayOrder: 0 },
          { chartViewProjectItemId: 1, displayOrder: 1 },
        ],
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toHaveLength(2)
    expect(body.data[0].displayOrder).toBe(0)
    expect(body.data[1].displayOrder).toBe(1)
  })

  test('所属しないIDが含まれる場合、422 を返す', async () => {
    mockedService.updateDisplayOrder.mockRejectedValue(
      new HTTPException(422, {
        message: "Chart view project item with ID '99' does not belong to chart view '10'",
      }),
    )

    const res = await app.request(`${BASE_URL}/display-order`, {
      method: 'PUT',
      body: JSON.stringify({
        items: [
          { chartViewProjectItemId: 99, displayOrder: 0 },
        ],
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })

  test('バリデーションエラー（空配列）で 422 を返す', async () => {
    const res = await app.request(`${BASE_URL}/display-order`, {
      method: 'PUT',
      body: JSON.stringify({
        items: [],
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })

  test('バリデーションエラー（items 欠落）で 422 を返す', async () => {
    const res = await app.request(`${BASE_URL}/display-order`, {
      method: 'PUT',
      body: JSON.stringify({}),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })

  test('バリデーションエラー（負の displayOrder）で 422 を返す', async () => {
    const res = await app.request(`${BASE_URL}/display-order`, {
      method: 'PUT',
      body: JSON.stringify({
        items: [
          { chartViewProjectItemId: 1, displayOrder: -1 },
        ],
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })

  test('チャートビュー不存在で 404 を返す', async () => {
    mockedService.updateDisplayOrder.mockRejectedValue(
      new HTTPException(404, { message: "Chart view with ID '999' not found" }),
    )

    const res = await app.request('/chart-views/999/project-items/display-order', {
      method: 'PUT',
      body: JSON.stringify({
        items: [
          { chartViewProjectItemId: 1, displayOrder: 0 },
        ],
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })
})

// =============================================================================
// PUT /chart-views/:chartViewId/project-items/:id - 更新
// =============================================================================
describe('PUT /chart-views/:chartViewId/project-items/:id', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('正常更新で 200 を返す', async () => {
    const updatedItem = { ...sampleItem1, displayOrder: 5 }
    mockedService.update.mockResolvedValue(updatedItem)

    const res = await app.request(`${BASE_URL}/1`, {
      method: 'PUT',
      body: JSON.stringify({ displayOrder: 5 }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data.displayOrder).toBe(5)
  })

  test('isVisible 更新の反映を検証する', async () => {
    const updatedItem = { ...sampleItem1, isVisible: false }
    mockedService.update.mockResolvedValue(updatedItem)

    const res = await app.request(`${BASE_URL}/1`, {
      method: 'PUT',
      body: JSON.stringify({ isVisible: false }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data.isVisible).toBe(false)
  })

  test('projectCaseId を null に設定できる', async () => {
    const updatedItem = { ...sampleItem1, projectCaseId: null, projectCase: null }
    mockedService.update.mockResolvedValue(updatedItem)

    const res = await app.request(`${BASE_URL}/1`, {
      method: 'PUT',
      body: JSON.stringify({ projectCaseId: null }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data.projectCaseId).toBeNull()
  })

  test('存在しないIDで 404 を返す', async () => {
    mockedService.update.mockRejectedValue(
      new HTTPException(404, { message: "Chart view project item with ID '999' not found" }),
    )

    const res = await app.request(`${BASE_URL}/999`, {
      method: 'PUT',
      body: JSON.stringify({ displayOrder: 5 }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('chartViewId 不一致で 404 を返す', async () => {
    mockedService.update.mockRejectedValue(
      new HTTPException(404, { message: "Chart view project item with ID '1' not found" }),
    )

    const res = await app.request('/chart-views/20/project-items/1', {
      method: 'PUT',
      body: JSON.stringify({ displayOrder: 5 }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('バリデーションエラー（負の displayOrder）で 422 を返す', async () => {
    const res = await app.request(`${BASE_URL}/1`, {
      method: 'PUT',
      body: JSON.stringify({ displayOrder: -1 }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })

  test('projectCaseId 検証エラーで 422 を返す', async () => {
    mockedService.update.mockRejectedValue(
      new HTTPException(422, {
        message: "Project case with ID '99' not found or does not belong to project '5'",
      }),
    )

    const res = await app.request(`${BASE_URL}/1`, {
      method: 'PUT',
      body: JSON.stringify({ projectCaseId: 99 }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })
})

// =============================================================================
// DELETE /chart-views/:chartViewId/project-items/:id - 物理削除
// =============================================================================
describe('DELETE /chart-views/:chartViewId/project-items/:id', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('正常削除で 204 No Content を返す', async () => {
    mockedService.delete.mockResolvedValue(undefined)

    const res = await app.request(`${BASE_URL}/1`, {
      method: 'DELETE',
    })
    expect(res.status).toBe(204)
  })

  test('存在しないIDで 404 を返す', async () => {
    mockedService.delete.mockRejectedValue(
      new HTTPException(404, { message: "Chart view project item with ID '999' not found" }),
    )

    const res = await app.request(`${BASE_URL}/999`, {
      method: 'DELETE',
    })
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('chartViewId 不一致で 404 を返す', async () => {
    mockedService.delete.mockRejectedValue(
      new HTTPException(404, { message: "Chart view project item with ID '1' not found" }),
    )

    const res = await app.request('/chart-views/20/project-items/1', {
      method: 'DELETE',
    })
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('不正なパスパラメータで 422 を返す', async () => {
    const res = await app.request(`${BASE_URL}/abc`, {
      method: 'DELETE',
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })
})
