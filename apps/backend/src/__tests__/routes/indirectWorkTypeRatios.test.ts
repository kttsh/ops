import { describe, test, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { problemResponse, getProblemType, getStatusTitle } from '@/utils/errorHelper'
import type { StatusCode } from 'hono/utils/http-status'

// --- モック ---
vi.mock('@/services/indirectWorkTypeRatioService', () => ({
  indirectWorkTypeRatioService: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    bulkUpsert: vi.fn(),
  },
}))

// モックをインポート（vi.mock の後）
import { indirectWorkTypeRatioService } from '@/services/indirectWorkTypeRatioService'
import indirectWorkTypeRatios from '@/routes/indirectWorkTypeRatios'

const mockedService = vi.mocked(indirectWorkTypeRatioService)

// テスト用アプリ（グローバルエラーハンドラ付き）
function createApp() {
  const app = new Hono()

  app.route('/indirect-work-cases/:indirectWorkCaseId/indirect-work-type-ratios', indirectWorkTypeRatios)

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
const sampleRatio1 = {
  indirectWorkTypeRatioId: 1,
  indirectWorkCaseId: 10,
  workTypeCode: 'DESIGN',
  fiscalYear: 2026,
  ratio: 0.5,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const sampleRatio2 = {
  indirectWorkTypeRatioId: 2,
  indirectWorkCaseId: 10,
  workTypeCode: 'REVIEW',
  fiscalYear: 2026,
  ratio: 0.3,
  createdAt: '2026-01-02T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
}

const BASE_URL = '/indirect-work-cases/10/indirect-work-type-ratios'

// =============================================================================
// GET /indirect-work-cases/:indirectWorkCaseId/indirect-work-type-ratios - 一覧取得
// =============================================================================
describe('GET /indirect-work-cases/:indirectWorkCaseId/indirect-work-type-ratios', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('一覧を data 配列形式で返す', async () => {
    mockedService.findAll.mockResolvedValue([sampleRatio1, sampleRatio2])

    const res = await app.request(BASE_URL)
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toHaveLength(2)
    expect(body.data[0]).toMatchObject(sampleRatio1)
    expect(body.data[1]).toMatchObject(sampleRatio2)
  })

  test('サービスの呼び出しパラメータを検証する', async () => {
    mockedService.findAll.mockResolvedValue([sampleRatio1])

    const res = await app.request(BASE_URL)
    expect(res.status).toBe(200)

    expect(mockedService.findAll).toHaveBeenCalledWith(10)
  })

  test('存在しない間接作業ケースIDで 404 を返す', async () => {
    mockedService.findAll.mockRejectedValue(
      new HTTPException(404, { message: "Indirect work case with ID '999' not found" }),
    )

    const res = await app.request('/indirect-work-cases/999/indirect-work-type-ratios')
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('不正な indirectWorkCaseId で 422 を返す', async () => {
    const res = await app.request('/indirect-work-cases/abc/indirect-work-type-ratios')
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })
})

// =============================================================================
// GET /:indirectWorkTypeRatioId - 単一取得
// =============================================================================
describe('GET /indirect-work-cases/:indirectWorkCaseId/indirect-work-type-ratios/:indirectWorkTypeRatioId', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('指定IDの配分比率を data オブジェクトで返す', async () => {
    mockedService.findById.mockResolvedValue(sampleRatio1)

    const res = await app.request(`${BASE_URL}/1`)
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toMatchObject(sampleRatio1)
  })

  test('存在しないIDで 404 を返す', async () => {
    mockedService.findById.mockRejectedValue(
      new HTTPException(404, { message: "Indirect work type ratio with ID '999' not found" }),
    )

    const res = await app.request(`${BASE_URL}/999`)
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('間接作業ケースID不一致で 404 を返す', async () => {
    mockedService.findById.mockRejectedValue(
      new HTTPException(404, { message: "Indirect work type ratio with ID '1' not found" }),
    )

    const res = await app.request('/indirect-work-cases/20/indirect-work-type-ratios/1')
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
// POST / - 新規作成
// =============================================================================
describe('POST /indirect-work-cases/:indirectWorkCaseId/indirect-work-type-ratios', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('正常作成で 201 と Location ヘッダを返す', async () => {
    mockedService.create.mockResolvedValue(sampleRatio1)

    const res = await app.request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({
        workTypeCode: 'DESIGN',
        fiscalYear: 2026,
        ratio: 0.5,
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(201)
    expect(res.headers.get('Location')).toBe('/indirect-work-cases/10/indirect-work-type-ratios/1')

    const body = await res.json()
    expect(body.data).toMatchObject(sampleRatio1)
  })

  test('バリデーションエラー（workTypeCode 超過）で 422 を返す', async () => {
    const res = await app.request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({
        workTypeCode: 'A'.repeat(21),
        fiscalYear: 2026,
        ratio: 0.5,
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
    expect(body.errors).toBeDefined()
  })

  test('バリデーションエラー（ratio 範囲外）で 422 を返す', async () => {
    const res = await app.request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({
        workTypeCode: 'DESIGN',
        fiscalYear: 2026,
        ratio: 1.5,
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })

  test('バリデーションエラー（fiscalYear 小数）で 422 を返す', async () => {
    const res = await app.request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({
        workTypeCode: 'DESIGN',
        fiscalYear: 2026.5,
        ratio: 0.5,
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })

  test('親ケース不存在で 404 を返す', async () => {
    mockedService.create.mockRejectedValue(
      new HTTPException(404, { message: "Indirect work case with ID '999' not found" }),
    )

    const res = await app.request('/indirect-work-cases/999/indirect-work-type-ratios', {
      method: 'POST',
      body: JSON.stringify({
        workTypeCode: 'DESIGN',
        fiscalYear: 2026,
        ratio: 0.5,
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('複合キー重複で 409 を返す', async () => {
    mockedService.create.mockRejectedValue(
      new HTTPException(409, {
        message: "Indirect work type ratio for work type 'DESIGN' and fiscal year '2026' already exists",
      }),
    )

    const res = await app.request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({
        workTypeCode: 'DESIGN',
        fiscalYear: 2026,
        ratio: 0.5,
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(409)

    const body = await res.json()
    expect(body.type).toContain('conflict')
  })

  test('不正な workTypeCode で 422 を返す', async () => {
    mockedService.create.mockRejectedValue(
      new HTTPException(422, { message: "Work type with code 'INVALID' not found" }),
    )

    const res = await app.request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({
        workTypeCode: 'INVALID',
        fiscalYear: 2026,
        ratio: 0.5,
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })
})

// =============================================================================
// PUT /:indirectWorkTypeRatioId - 更新
// =============================================================================
describe('PUT /indirect-work-cases/:indirectWorkCaseId/indirect-work-type-ratios/:indirectWorkTypeRatioId', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('正常更新で 200 を返す', async () => {
    const updatedRatio = { ...sampleRatio1, ratio: 0.8 }
    mockedService.update.mockResolvedValue(updatedRatio)

    const res = await app.request(`${BASE_URL}/1`, {
      method: 'PUT',
      body: JSON.stringify({ ratio: 0.8 }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data.ratio).toBe(0.8)
  })

  test('複数フィールド更新の反映を検証する', async () => {
    const updatedRatio = { ...sampleRatio1, workTypeCode: 'REVIEW', ratio: 0.7 }
    mockedService.update.mockResolvedValue(updatedRatio)

    const res = await app.request(`${BASE_URL}/1`, {
      method: 'PUT',
      body: JSON.stringify({
        workTypeCode: 'REVIEW',
        ratio: 0.7,
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data.workTypeCode).toBe('REVIEW')
    expect(body.data.ratio).toBe(0.7)
  })

  test('存在しないIDで 404 を返す', async () => {
    mockedService.update.mockRejectedValue(
      new HTTPException(404, { message: "Indirect work type ratio with ID '999' not found" }),
    )

    const res = await app.request(`${BASE_URL}/999`, {
      method: 'PUT',
      body: JSON.stringify({ ratio: 0.8 }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('バリデーションエラーで 422 を返す', async () => {
    const res = await app.request(`${BASE_URL}/1`, {
      method: 'PUT',
      body: JSON.stringify({ ratio: -0.5 }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })

  test('複合キー重複で 409 を返す', async () => {
    mockedService.update.mockRejectedValue(
      new HTTPException(409, {
        message: "Indirect work type ratio for work type 'REVIEW' and fiscal year '2026' already exists",
      }),
    )

    const res = await app.request(`${BASE_URL}/1`, {
      method: 'PUT',
      body: JSON.stringify({ workTypeCode: 'REVIEW' }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(409)

    const body = await res.json()
    expect(body.type).toContain('conflict')
  })
})

// =============================================================================
// DELETE /:indirectWorkTypeRatioId - 物理削除
// =============================================================================
describe('DELETE /indirect-work-cases/:indirectWorkCaseId/indirect-work-type-ratios/:indirectWorkTypeRatioId', () => {
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
      new HTTPException(404, { message: "Indirect work type ratio with ID '999' not found" }),
    )

    const res = await app.request(`${BASE_URL}/999`, {
      method: 'DELETE',
    })
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('間接作業ケースID不一致で 404 を返す', async () => {
    mockedService.delete.mockRejectedValue(
      new HTTPException(404, { message: "Indirect work type ratio with ID '1' not found" }),
    )

    const res = await app.request('/indirect-work-cases/20/indirect-work-type-ratios/1', {
      method: 'DELETE',
    })
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })
})

// =============================================================================
// PUT /bulk - バルク Upsert
// =============================================================================
describe('PUT /indirect-work-cases/:indirectWorkCaseId/indirect-work-type-ratios/bulk', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('正常バルク Upsert で 200 と data 配列形式を返す', async () => {
    mockedService.bulkUpsert.mockResolvedValue([sampleRatio1, sampleRatio2])

    const res = await app.request(`${BASE_URL}/bulk`, {
      method: 'PUT',
      body: JSON.stringify({
        items: [
          { workTypeCode: 'DESIGN', fiscalYear: 2026, ratio: 0.5 },
          { workTypeCode: 'REVIEW', fiscalYear: 2026, ratio: 0.3 },
        ],
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toHaveLength(2)
    expect(body.data[0]).toMatchObject(sampleRatio1)
    expect(body.data[1]).toMatchObject(sampleRatio2)
  })

  test('バリデーションエラー（空配列）で 422 を返す', async () => {
    const res = await app.request(`${BASE_URL}/bulk`, {
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

  test('バリデーションエラー（ratio 範囲外）で 422 を返す', async () => {
    const res = await app.request(`${BASE_URL}/bulk`, {
      method: 'PUT',
      body: JSON.stringify({
        items: [{ workTypeCode: 'DESIGN', fiscalYear: 2026, ratio: 2.0 }],
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })

  test('親ケース不存在で 404 を返す', async () => {
    mockedService.bulkUpsert.mockRejectedValue(
      new HTTPException(404, { message: "Indirect work case with ID '999' not found" }),
    )

    const res = await app.request('/indirect-work-cases/999/indirect-work-type-ratios/bulk', {
      method: 'PUT',
      body: JSON.stringify({
        items: [{ workTypeCode: 'DESIGN', fiscalYear: 2026, ratio: 0.5 }],
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('配列内重複で 422 を返す', async () => {
    mockedService.bulkUpsert.mockRejectedValue(
      new HTTPException(422, {
        message: 'Duplicate workTypeCode + fiscalYear combinations found in items array',
      }),
    )

    const res = await app.request(`${BASE_URL}/bulk`, {
      method: 'PUT',
      body: JSON.stringify({
        items: [
          { workTypeCode: 'DESIGN', fiscalYear: 2026, ratio: 0.5 },
          { workTypeCode: 'DESIGN', fiscalYear: 2026, ratio: 0.8 },
        ],
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })
})
