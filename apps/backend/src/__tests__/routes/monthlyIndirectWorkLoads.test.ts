import { describe, test, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { problemResponse, getProblemType, getStatusTitle } from '@/utils/errorHelper'
import type { StatusCode } from 'hono/utils/http-status'

// --- モック ---
vi.mock('@/services/monthlyIndirectWorkLoadService', () => ({
  monthlyIndirectWorkLoadService: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    bulkUpsert: vi.fn(),
  },
}))

// モックをインポート（vi.mock の後）
import { monthlyIndirectWorkLoadService } from '@/services/monthlyIndirectWorkLoadService'
import monthlyIndirectWorkLoads from '@/routes/monthlyIndirectWorkLoads'

const mockedService = vi.mocked(monthlyIndirectWorkLoadService)

// テスト用アプリ（グローバルエラーハンドラ付き）
function createApp() {
  const app = new Hono()

  app.route('/indirect-work-cases/:indirectWorkCaseId/monthly-indirect-work-loads', monthlyIndirectWorkLoads)

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
const sampleLoad1 = {
  monthlyIndirectWorkLoadId: 1,
  indirectWorkCaseId: 10,
  businessUnitCode: 'BU001',
  yearMonth: '202601',
  manhour: 100.5,
  source: 'calculated',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const sampleLoad2 = {
  monthlyIndirectWorkLoadId: 2,
  indirectWorkCaseId: 10,
  businessUnitCode: 'BU002',
  yearMonth: '202602',
  manhour: 200.0,
  source: 'manual',
  createdAt: '2026-01-02T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
}

const BASE_URL = '/indirect-work-cases/10/monthly-indirect-work-loads'

// =============================================================================
// GET /indirect-work-cases/:indirectWorkCaseId/monthly-indirect-work-loads - 一覧取得
// =============================================================================
describe('GET /indirect-work-cases/:indirectWorkCaseId/monthly-indirect-work-loads', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('一覧を data 配列形式で返す', async () => {
    mockedService.findAll.mockResolvedValue([sampleLoad1, sampleLoad2])

    const res = await app.request(BASE_URL)
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toHaveLength(2)
    expect(body.data[0]).toMatchObject(sampleLoad1)
    expect(body.data[1]).toMatchObject(sampleLoad2)
  })

  test('business_unit_code 昇順・year_month 昇順でソートされる（サービスの呼び出しを検証）', async () => {
    mockedService.findAll.mockResolvedValue([sampleLoad1, sampleLoad2])

    const res = await app.request(BASE_URL)
    expect(res.status).toBe(200)

    expect(mockedService.findAll).toHaveBeenCalledWith(10)

    const body = await res.json()
    expect(body.data[0].businessUnitCode).toBe('BU001')
    expect(body.data[0].yearMonth).toBe('202601')
    expect(body.data[1].businessUnitCode).toBe('BU002')
    expect(body.data[1].yearMonth).toBe('202602')
  })

  test('source フィールドが含まれることを検証する', async () => {
    mockedService.findAll.mockResolvedValue([sampleLoad1])

    const res = await app.request(BASE_URL)
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data[0].source).toBe('calculated')
  })

  test('存在しない/論理削除済みの間接作業ケースIDで 404 を返す', async () => {
    mockedService.findAll.mockRejectedValue(
      new HTTPException(404, { message: "Indirect work case with ID '999' not found" }),
    )

    const res = await app.request('/indirect-work-cases/999/monthly-indirect-work-loads')
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('不正な indirectWorkCaseId で 422 を返す', async () => {
    const res = await app.request('/indirect-work-cases/abc/monthly-indirect-work-loads')
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })
})

// =============================================================================
// GET /.../monthly-indirect-work-loads/:monthlyIndirectWorkLoadId - 単一取得
// =============================================================================
describe('GET /indirect-work-cases/:indirectWorkCaseId/monthly-indirect-work-loads/:monthlyIndirectWorkLoadId', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('指定IDの負荷データを data オブジェクトで返す', async () => {
    mockedService.findById.mockResolvedValue(sampleLoad1)

    const res = await app.request(`${BASE_URL}/1`)
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toMatchObject(sampleLoad1)
  })

  test('source フィールドの存在を検証する', async () => {
    mockedService.findById.mockResolvedValue(sampleLoad1)

    const res = await app.request(`${BASE_URL}/1`)
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data.source).toBe('calculated')
  })

  test('存在しない負荷データIDで 404 を返す', async () => {
    mockedService.findById.mockRejectedValue(
      new HTTPException(404, { message: "Monthly indirect work load with ID '999' not found" }),
    )

    const res = await app.request(`${BASE_URL}/999`)
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('間接作業ケースID不一致で 404 を返す', async () => {
    mockedService.findById.mockRejectedValue(
      new HTTPException(404, { message: "Monthly indirect work load with ID '1' not found" }),
    )

    const res = await app.request('/indirect-work-cases/20/monthly-indirect-work-loads/1')
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
// POST /indirect-work-cases/:indirectWorkCaseId/monthly-indirect-work-loads - 新規作成
// =============================================================================
describe('POST /indirect-work-cases/:indirectWorkCaseId/monthly-indirect-work-loads', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('正常作成で 201 と Location ヘッダを返す', async () => {
    mockedService.create.mockResolvedValue(sampleLoad1)

    const res = await app.request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({
        businessUnitCode: 'BU001',
        yearMonth: '202601',
        manhour: 100.5,
        source: 'calculated',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(201)
    expect(res.headers.get('Location')).toBe('/indirect-work-cases/10/monthly-indirect-work-loads/1')

    const body = await res.json()
    expect(body.data).toMatchObject(sampleLoad1)
  })

  test('レスポンスボディに source フィールドが含まれる', async () => {
    mockedService.create.mockResolvedValue(sampleLoad1)

    const res = await app.request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({
        businessUnitCode: 'BU001',
        yearMonth: '202601',
        manhour: 100.5,
        source: 'calculated',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(201)

    const body = await res.json()
    expect(body.data.source).toBe('calculated')
  })

  test('バリデーションエラー（yearMonth 形式不正）で 422 を返す', async () => {
    const res = await app.request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({
        businessUnitCode: 'BU001',
        yearMonth: '2026-01',
        manhour: 100,
        source: 'calculated',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
    expect(body.errors).toBeDefined()
  })

  test('バリデーションエラー（月が13）で 422 を返す', async () => {
    const res = await app.request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({
        businessUnitCode: 'BU001',
        yearMonth: '202613',
        manhour: 100,
        source: 'calculated',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })

  test('バリデーションエラー（manhour 負値）で 422 を返す', async () => {
    const res = await app.request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({
        businessUnitCode: 'BU001',
        yearMonth: '202601',
        manhour: -1,
        source: 'calculated',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })

  test('バリデーションエラー（manhour 上限超過）で 422 を返す', async () => {
    const res = await app.request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({
        businessUnitCode: 'BU001',
        yearMonth: '202601',
        manhour: 100000000,
        source: 'calculated',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })

  test('バリデーションエラー（source 不正値）で 422 を返す', async () => {
    const res = await app.request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({
        businessUnitCode: 'BU001',
        yearMonth: '202601',
        manhour: 100,
        source: 'invalid',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })

  test('バリデーションエラー（businessUnitCode 空文字）で 422 を返す', async () => {
    const res = await app.request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({
        businessUnitCode: '',
        yearMonth: '202601',
        manhour: 100,
        source: 'calculated',
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

    const res = await app.request('/indirect-work-cases/999/monthly-indirect-work-loads', {
      method: 'POST',
      body: JSON.stringify({
        businessUnitCode: 'BU001',
        yearMonth: '202601',
        manhour: 100,
        source: 'calculated',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('事業部不存在で 422 を返す', async () => {
    mockedService.create.mockRejectedValue(
      new HTTPException(422, { message: "Business unit with code 'INVALID' not found" }),
    )

    const res = await app.request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({
        businessUnitCode: 'INVALID',
        yearMonth: '202601',
        manhour: 100,
        source: 'calculated',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })

  test('事業部コード＋年月重複で 409 を返す', async () => {
    mockedService.create.mockRejectedValue(
      new HTTPException(409, {
        message: "Monthly indirect work load for business unit 'BU001' and year-month '202601' already exists in indirect work case '10'",
      }),
    )

    const res = await app.request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({
        businessUnitCode: 'BU001',
        yearMonth: '202601',
        manhour: 100,
        source: 'calculated',
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(409)

    const body = await res.json()
    expect(body.type).toContain('conflict')
  })
})

// =============================================================================
// PUT /.../monthly-indirect-work-loads/:monthlyIndirectWorkLoadId - 更新
// =============================================================================
describe('PUT /indirect-work-cases/:indirectWorkCaseId/monthly-indirect-work-loads/:monthlyIndirectWorkLoadId', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('正常更新で 200 を返す', async () => {
    const updatedLoad = { ...sampleLoad1, manhour: 150.0 }
    mockedService.update.mockResolvedValue(updatedLoad)

    const res = await app.request(`${BASE_URL}/1`, {
      method: 'PUT',
      body: JSON.stringify({ manhour: 150.0 }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data.manhour).toBe(150.0)
  })

  test('更新されたフィールド（source 含む）の反映を検証する', async () => {
    const updatedLoad = { ...sampleLoad1, source: 'manual', manhour: 300.0 }
    mockedService.update.mockResolvedValue(updatedLoad)

    const res = await app.request(`${BASE_URL}/1`, {
      method: 'PUT',
      body: JSON.stringify({
        source: 'manual',
        manhour: 300.0,
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data.source).toBe('manual')
    expect(body.data.manhour).toBe(300.0)
  })

  test('存在しないIDで 404 を返す', async () => {
    mockedService.update.mockRejectedValue(
      new HTTPException(404, { message: "Monthly indirect work load with ID '999' not found" }),
    )

    const res = await app.request(`${BASE_URL}/999`, {
      method: 'PUT',
      body: JSON.stringify({ manhour: 100 }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('バリデーションエラーで 422 を返す', async () => {
    const res = await app.request(`${BASE_URL}/1`, {
      method: 'PUT',
      body: JSON.stringify({ manhour: -1 }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })

  test('事業部コード＋年月重複で 409 を返す', async () => {
    mockedService.update.mockRejectedValue(
      new HTTPException(409, {
        message: "Monthly indirect work load for business unit 'BU002' and year-month '202602' already exists in indirect work case '10'",
      }),
    )

    const res = await app.request(`${BASE_URL}/1`, {
      method: 'PUT',
      body: JSON.stringify({ businessUnitCode: 'BU002', yearMonth: '202602' }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(409)

    const body = await res.json()
    expect(body.type).toContain('conflict')
  })

  test('事業部不存在で 422 を返す', async () => {
    mockedService.update.mockRejectedValue(
      new HTTPException(422, { message: "Business unit with code 'INVALID' not found" }),
    )

    const res = await app.request(`${BASE_URL}/1`, {
      method: 'PUT',
      body: JSON.stringify({ businessUnitCode: 'INVALID' }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })
})

// =============================================================================
// DELETE /.../monthly-indirect-work-loads/:monthlyIndirectWorkLoadId - 物理削除
// =============================================================================
describe('DELETE /indirect-work-cases/:indirectWorkCaseId/monthly-indirect-work-loads/:monthlyIndirectWorkLoadId', () => {
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
      new HTTPException(404, { message: "Monthly indirect work load with ID '999' not found" }),
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
      new HTTPException(404, { message: "Monthly indirect work load with ID '1' not found" }),
    )

    const res = await app.request('/indirect-work-cases/20/monthly-indirect-work-loads/1', {
      method: 'DELETE',
    })
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })
})

// =============================================================================
// PUT /.../monthly-indirect-work-loads/bulk - バルク Upsert
// =============================================================================
describe('PUT /indirect-work-cases/:indirectWorkCaseId/monthly-indirect-work-loads/bulk', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('正常バルク Upsert で 200 と data 配列形式を返す', async () => {
    mockedService.bulkUpsert.mockResolvedValue([sampleLoad1, sampleLoad2])

    const res = await app.request(`${BASE_URL}/bulk`, {
      method: 'PUT',
      body: JSON.stringify({
        items: [
          { businessUnitCode: 'BU001', yearMonth: '202601', manhour: 100.5, source: 'calculated' },
          { businessUnitCode: 'BU002', yearMonth: '202602', manhour: 200.0, source: 'manual' },
        ],
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toHaveLength(2)
    expect(body.data[0]).toMatchObject(sampleLoad1)
    expect(body.data[1]).toMatchObject(sampleLoad2)
  })

  test('新規作成と既存更新の混在を検証する', async () => {
    const load3 = { ...sampleLoad1, monthlyIndirectWorkLoadId: 3, businessUnitCode: 'BU003', yearMonth: '202603', manhour: 300.0 }
    mockedService.bulkUpsert.mockResolvedValue([sampleLoad1, sampleLoad2, load3])

    const res = await app.request(`${BASE_URL}/bulk`, {
      method: 'PUT',
      body: JSON.stringify({
        items: [
          { businessUnitCode: 'BU001', yearMonth: '202601', manhour: 100.5, source: 'calculated' },
          { businessUnitCode: 'BU002', yearMonth: '202602', manhour: 200.0, source: 'manual' },
          { businessUnitCode: 'BU003', yearMonth: '202603', manhour: 300.0, source: 'calculated' },
        ],
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toHaveLength(3)
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

  test('バリデーションエラー（yearMonth 形式不正）で 422 を返す', async () => {
    const res = await app.request(`${BASE_URL}/bulk`, {
      method: 'PUT',
      body: JSON.stringify({
        items: [
          { businessUnitCode: 'BU001', yearMonth: 'invalid', manhour: 100, source: 'calculated' },
        ],
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })

  test('バリデーションエラー（source 不正値）で 422 を返す', async () => {
    const res = await app.request(`${BASE_URL}/bulk`, {
      method: 'PUT',
      body: JSON.stringify({
        items: [
          { businessUnitCode: 'BU001', yearMonth: '202601', manhour: 100, source: 'invalid' },
        ],
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

    const res = await app.request('/indirect-work-cases/999/monthly-indirect-work-loads/bulk', {
      method: 'PUT',
      body: JSON.stringify({
        items: [
          { businessUnitCode: 'BU001', yearMonth: '202601', manhour: 100, source: 'calculated' },
        ],
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('配列内事業部コード＋年月重複で 422 を返す', async () => {
    mockedService.bulkUpsert.mockRejectedValue(
      new HTTPException(422, {
        message: 'Duplicate businessUnitCode + yearMonth combinations found in items array',
      }),
    )

    const res = await app.request(`${BASE_URL}/bulk`, {
      method: 'PUT',
      body: JSON.stringify({
        items: [
          { businessUnitCode: 'BU001', yearMonth: '202601', manhour: 100, source: 'calculated' },
          { businessUnitCode: 'BU001', yearMonth: '202601', manhour: 200, source: 'manual' },
        ],
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })

  test('事業部不存在で 422 を返す', async () => {
    mockedService.bulkUpsert.mockRejectedValue(
      new HTTPException(422, {
        message: 'One or more business unit codes not found',
      }),
    )

    const res = await app.request(`${BASE_URL}/bulk`, {
      method: 'PUT',
      body: JSON.stringify({
        items: [
          { businessUnitCode: 'INVALID', yearMonth: '202601', manhour: 100, source: 'calculated' },
        ],
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })
})
