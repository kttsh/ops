import { describe, test, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { problemResponse, getProblemType, getStatusTitle } from '@/utils/errorHelper'
import type { StatusCode } from 'hono/utils/http-status'

// --- モック ---
vi.mock('@/services/projectChangeHistoryService', () => ({
  projectChangeHistoryService: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
}))

// モックをインポート（vi.mock の後）
import { projectChangeHistoryService } from '@/services/projectChangeHistoryService'
import projectChangeHistory from '@/routes/projectChangeHistory'

const mockedService = vi.mocked(projectChangeHistoryService)

// テスト用アプリ（グローバルエラーハンドラ付き）
function createApp() {
  const app = new Hono()

  app.route('/projects/:projectId/change-history', projectChangeHistory)

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
const sampleHistory1 = {
  projectChangeHistoryId: 1,
  projectId: 10,
  changeType: 'UPDATE',
  fieldName: 'status',
  oldValue: 'planning',
  newValue: 'active',
  changedBy: '山田太郎',
  changedAt: '2026-01-15T09:00:00.000Z',
}

const sampleHistory2 = {
  projectChangeHistoryId: 2,
  projectId: 10,
  changeType: 'UPDATE',
  fieldName: 'totalManhour',
  oldValue: '1000',
  newValue: '1500',
  changedBy: '鈴木花子',
  changedAt: '2026-01-20T14:30:00.000Z',
}

const sampleHistoryNullFields = {
  projectChangeHistoryId: 3,
  projectId: 10,
  changeType: 'CREATE',
  fieldName: null,
  oldValue: null,
  newValue: null,
  changedBy: '田中一郎',
  changedAt: '2026-01-10T08:00:00.000Z',
}

const BASE_URL = '/projects/10/change-history'

// =============================================================================
// GET /projects/:projectId/change-history - 一覧取得
// =============================================================================
describe('GET /projects/:projectId/change-history', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('一覧を data 配列形式で返す', async () => {
    mockedService.findAll.mockResolvedValue([sampleHistory2, sampleHistory1])

    const res = await app.request(BASE_URL)
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toHaveLength(2)
    expect(body.data[0]).toMatchObject(sampleHistory2)
    expect(body.data[1]).toMatchObject(sampleHistory1)
  })

  test('空配列を data 形式で返す', async () => {
    mockedService.findAll.mockResolvedValue([])

    const res = await app.request(BASE_URL)
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toHaveLength(0)
  })

  test('null フィールドがそのまま返却される', async () => {
    mockedService.findAll.mockResolvedValue([sampleHistoryNullFields])

    const res = await app.request(BASE_URL)
    const body = await res.json()
    expect(body.data[0].fieldName).toBeNull()
    expect(body.data[0].oldValue).toBeNull()
    expect(body.data[0].newValue).toBeNull()
  })

  test('存在しない projectId で 404 を返す', async () => {
    mockedService.findAll.mockRejectedValue(
      new HTTPException(404, { message: "Project with ID '999' not found" }),
    )

    const res = await app.request('/projects/999/change-history')
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('不正な projectId で 422 を返す', async () => {
    const res = await app.request('/projects/abc/change-history')
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })

  test('負の projectId で 422 を返す', async () => {
    const res = await app.request('/projects/-1/change-history')
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })
})

// =============================================================================
// GET /projects/:projectId/change-history/:projectChangeHistoryId - 単一取得
// =============================================================================
describe('GET /projects/:projectId/change-history/:projectChangeHistoryId', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('指定IDの変更履歴を data オブジェクトで返す', async () => {
    mockedService.findById.mockResolvedValue(sampleHistory1)

    const res = await app.request(`${BASE_URL}/1`)
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toMatchObject(sampleHistory1)
  })

  test('存在しない変更履歴IDで 404 を返す', async () => {
    mockedService.findById.mockRejectedValue(
      new HTTPException(404, { message: "Project change history with ID '999' not found" }),
    )

    const res = await app.request(`${BASE_URL}/999`)
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('projectId 不一致で 404 を返す', async () => {
    mockedService.findById.mockRejectedValue(
      new HTTPException(404, { message: "Project change history with ID '1' not found" }),
    )

    const res = await app.request('/projects/20/change-history/1')
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
// POST /projects/:projectId/change-history - 新規作成
// =============================================================================
describe('POST /projects/:projectId/change-history', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('正常作成で 201 と Location ヘッダを返す', async () => {
    mockedService.create.mockResolvedValue(sampleHistory1)

    const res = await app.request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({
        changeType: 'UPDATE',
        fieldName: 'status',
        oldValue: 'planning',
        newValue: 'active',
        changedBy: '山田太郎',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(201)
    expect(res.headers.get('Location')).toBe('/projects/10/change-history/1')

    const body = await res.json()
    expect(body.data).toMatchObject(sampleHistory1)
  })

  test('任意フィールド省略で作成できる', async () => {
    mockedService.create.mockResolvedValue(sampleHistoryNullFields)

    const res = await app.request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({
        changeType: 'CREATE',
        changedBy: '田中一郎',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(201)

    expect(mockedService.create).toHaveBeenCalledWith(10, {
      changeType: 'CREATE',
      changedBy: '田中一郎',
    })
  })

  test('changeType 未指定でバリデーションエラー 422 を返す', async () => {
    const res = await app.request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({
        changedBy: '山田太郎',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
    expect(body.errors).toBeDefined()
  })

  test('changedBy 未指定でバリデーションエラー 422 を返す', async () => {
    const res = await app.request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({
        changeType: 'UPDATE',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })

  test('changeType 空文字でバリデーションエラー 422 を返す', async () => {
    const res = await app.request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({
        changeType: '',
        changedBy: '山田太郎',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })

  test('changeType 51文字超でバリデーションエラー 422 を返す', async () => {
    const res = await app.request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({
        changeType: 'a'.repeat(51),
        changedBy: '山田太郎',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })

  test('changedBy 101文字超でバリデーションエラー 422 を返す', async () => {
    const res = await app.request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({
        changeType: 'UPDATE',
        changedBy: 'a'.repeat(101),
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })

  test('存在しない projectId で 404 を返す', async () => {
    mockedService.create.mockRejectedValue(
      new HTTPException(404, { message: "Project with ID '999' not found" }),
    )

    const res = await app.request('/projects/999/change-history', {
      method: 'POST',
      body: JSON.stringify({
        changeType: 'UPDATE',
        changedBy: '山田太郎',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })
})

// =============================================================================
// DELETE /projects/:projectId/change-history/:projectChangeHistoryId - 物理削除
// =============================================================================
describe('DELETE /projects/:projectId/change-history/:projectChangeHistoryId', () => {
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

  test('存在しない変更履歴IDで 404 を返す', async () => {
    mockedService.delete.mockRejectedValue(
      new HTTPException(404, { message: "Project change history with ID '999' not found" }),
    )

    const res = await app.request(`${BASE_URL}/999`, {
      method: 'DELETE',
    })
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('projectId 不一致で 404 を返す', async () => {
    mockedService.delete.mockRejectedValue(
      new HTTPException(404, { message: "Project change history with ID '1' not found" }),
    )

    const res = await app.request('/projects/20/change-history/1', {
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
