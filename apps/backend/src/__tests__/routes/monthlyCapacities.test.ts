import { describe, test, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { problemResponse, getProblemType, getStatusTitle } from '@/utils/errorHelper'
import type { StatusCode } from 'hono/utils/http-status'

// --- モック ---
vi.mock('@/services/monthlyCapacityService', () => ({
  monthlyCapacityService: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    bulkUpsert: vi.fn(),
  },
}))

// モックをインポート（vi.mock の後）
import { monthlyCapacityService } from '@/services/monthlyCapacityService'
import monthlyCapacities from '@/routes/monthlyCapacities'

const mockedService = vi.mocked(monthlyCapacityService)

// テスト用アプリ（グローバルエラーハンドラ付き）
function createApp() {
  const app = new Hono()

  app.route('/capacity-scenarios/:capacityScenarioId/monthly-capacities', monthlyCapacities)

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
const sampleCapacity1 = {
  monthlyCapacityId: 1,
  capacityScenarioId: 10,
  businessUnitCode: 'BU001',
  yearMonth: '202601',
  capacity: 100.5,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const sampleCapacity2 = {
  monthlyCapacityId: 2,
  capacityScenarioId: 10,
  businessUnitCode: 'BU001',
  yearMonth: '202602',
  capacity: 200.0,
  createdAt: '2026-01-02T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
}

const sampleCapacity3 = {
  monthlyCapacityId: 3,
  capacityScenarioId: 10,
  businessUnitCode: 'BU002',
  yearMonth: '202601',
  capacity: 150.0,
  createdAt: '2026-01-03T00:00:00.000Z',
  updatedAt: '2026-01-03T00:00:00.000Z',
}

const BASE_URL = '/capacity-scenarios/10/monthly-capacities'

// =============================================================================
// GET /capacity-scenarios/:capacityScenarioId/monthly-capacities - 一覧取得
// =============================================================================
describe('GET /capacity-scenarios/:capacityScenarioId/monthly-capacities', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('一覧を data 配列形式で返す', async () => {
    mockedService.findAll.mockResolvedValue([sampleCapacity1, sampleCapacity2, sampleCapacity3])

    const res = await app.request(BASE_URL)
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toHaveLength(3)
    expect(body.data[0]).toMatchObject(sampleCapacity1)
    expect(body.data[1]).toMatchObject(sampleCapacity2)
    expect(body.data[2]).toMatchObject(sampleCapacity3)
  })

  test('business_unit_code + year_month 昇順でソートされる（サービスの呼び出しを検証）', async () => {
    mockedService.findAll.mockResolvedValue([sampleCapacity1, sampleCapacity2, sampleCapacity3])

    const res = await app.request(BASE_URL)
    expect(res.status).toBe(200)

    expect(mockedService.findAll).toHaveBeenCalledWith(10)

    const body = await res.json()
    expect(body.data[0].businessUnitCode).toBe('BU001')
    expect(body.data[0].yearMonth).toBe('202601')
    expect(body.data[1].businessUnitCode).toBe('BU001')
    expect(body.data[1].yearMonth).toBe('202602')
    expect(body.data[2].businessUnitCode).toBe('BU002')
    expect(body.data[2].yearMonth).toBe('202601')
  })

  test('存在しない/論理削除済みのシナリオIDで 404 を返す', async () => {
    mockedService.findAll.mockRejectedValue(
      new HTTPException(404, { message: "Capacity scenario with ID '999' not found" }),
    )

    const res = await app.request('/capacity-scenarios/999/monthly-capacities')
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('不正な capacityScenarioId で 422 を返す', async () => {
    const res = await app.request('/capacity-scenarios/abc/monthly-capacities')
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })
})

// =============================================================================
// GET /capacity-scenarios/:capacityScenarioId/monthly-capacities/:monthlyCapacityId - 単一取得
// =============================================================================
describe('GET /capacity-scenarios/:capacityScenarioId/monthly-capacities/:monthlyCapacityId', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('指定IDのキャパシティデータを data オブジェクトで返す', async () => {
    mockedService.findById.mockResolvedValue(sampleCapacity1)

    const res = await app.request(`${BASE_URL}/1`)
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toMatchObject(sampleCapacity1)
  })

  test('存在しないキャパシティデータIDで 404 を返す', async () => {
    mockedService.findById.mockRejectedValue(
      new HTTPException(404, { message: "Monthly capacity with ID '999' not found" }),
    )

    const res = await app.request(`${BASE_URL}/999`)
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('シナリオID不一致で 404 を返す', async () => {
    mockedService.findById.mockRejectedValue(
      new HTTPException(404, { message: "Monthly capacity with ID '1' not found" }),
    )

    const res = await app.request('/capacity-scenarios/20/monthly-capacities/1')
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
// POST /capacity-scenarios/:capacityScenarioId/monthly-capacities - 新規作成
// =============================================================================
describe('POST /capacity-scenarios/:capacityScenarioId/monthly-capacities', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('正常作成で 201 と Location ヘッダを返す', async () => {
    mockedService.create.mockResolvedValue(sampleCapacity1)

    const res = await app.request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({
        businessUnitCode: 'BU001',
        yearMonth: '202601',
        capacity: 100.5,
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(201)
    expect(res.headers.get('Location')).toBe('/capacity-scenarios/10/monthly-capacities/1')

    const body = await res.json()
    expect(body.data).toMatchObject(sampleCapacity1)
  })

  test('バリデーションエラー（yearMonth 形式不正）で 422 を返す', async () => {
    const res = await app.request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({
        businessUnitCode: 'BU001',
        yearMonth: '2026-01',
        capacity: 100,
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
        capacity: 100,
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })

  test('バリデーションエラー（capacity 負値）で 422 を返す', async () => {
    const res = await app.request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({
        businessUnitCode: 'BU001',
        yearMonth: '202601',
        capacity: -1,
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })

  test('バリデーションエラー（capacity 上限超過）で 422 を返す', async () => {
    const res = await app.request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({
        businessUnitCode: 'BU001',
        yearMonth: '202601',
        capacity: 100000000,
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
        capacity: 100,
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })

  test('バリデーションエラー（businessUnitCode 21文字）で 422 を返す', async () => {
    const res = await app.request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({
        businessUnitCode: 'A'.repeat(21),
        yearMonth: '202601',
        capacity: 100,
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })

  test('親シナリオ不存在で 404 を返す', async () => {
    mockedService.create.mockRejectedValue(
      new HTTPException(404, { message: "Capacity scenario with ID '999' not found" }),
    )

    const res = await app.request('/capacity-scenarios/999/monthly-capacities', {
      method: 'POST',
      body: JSON.stringify({
        businessUnitCode: 'BU001',
        yearMonth: '202601',
        capacity: 100,
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('事業部コード不存在で 422 を返す', async () => {
    mockedService.create.mockRejectedValue(
      new HTTPException(422, { message: "Business unit with code 'INVALID' not found" }),
    )

    const res = await app.request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({
        businessUnitCode: 'INVALID',
        yearMonth: '202601',
        capacity: 100,
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })

  test('ユニーク制約重複で 409 を返す', async () => {
    mockedService.create.mockRejectedValue(
      new HTTPException(409, {
        message: "Monthly capacity for business unit 'BU001' and year-month '202601' already exists in capacity scenario '10'",
      }),
    )

    const res = await app.request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({
        businessUnitCode: 'BU001',
        yearMonth: '202601',
        capacity: 100,
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(409)

    const body = await res.json()
    expect(body.type).toContain('conflict')
  })
})

// =============================================================================
// PUT /capacity-scenarios/:capacityScenarioId/monthly-capacities/:monthlyCapacityId - 更新
// =============================================================================
describe('PUT /capacity-scenarios/:capacityScenarioId/monthly-capacities/:monthlyCapacityId', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('正常更新で 200 を返す', async () => {
    const updatedCapacity = { ...sampleCapacity1, capacity: 150.0 }
    mockedService.update.mockResolvedValue(updatedCapacity)

    const res = await app.request(`${BASE_URL}/1`, {
      method: 'PUT',
      body: JSON.stringify({ capacity: 150.0 }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data.capacity).toBe(150.0)
  })

  test('更新されたフィールドの反映を検証する', async () => {
    const updatedCapacity = { ...sampleCapacity1, businessUnitCode: 'BU002', yearMonth: '202603', capacity: 300.0 }
    mockedService.update.mockResolvedValue(updatedCapacity)

    const res = await app.request(`${BASE_URL}/1`, {
      method: 'PUT',
      body: JSON.stringify({
        businessUnitCode: 'BU002',
        yearMonth: '202603',
        capacity: 300.0,
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data.businessUnitCode).toBe('BU002')
    expect(body.data.yearMonth).toBe('202603')
    expect(body.data.capacity).toBe(300.0)
  })

  test('存在しないIDで 404 を返す', async () => {
    mockedService.update.mockRejectedValue(
      new HTTPException(404, { message: "Monthly capacity with ID '999' not found" }),
    )

    const res = await app.request(`${BASE_URL}/999`, {
      method: 'PUT',
      body: JSON.stringify({ capacity: 100 }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('バリデーションエラーで 422 を返す', async () => {
    const res = await app.request(`${BASE_URL}/1`, {
      method: 'PUT',
      body: JSON.stringify({ capacity: -1 }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })

  test('ユニーク制約重複で 409 を返す', async () => {
    mockedService.update.mockRejectedValue(
      new HTTPException(409, {
        message: "Monthly capacity for business unit 'BU001' and year-month '202602' already exists in capacity scenario '10'",
      }),
    )

    const res = await app.request(`${BASE_URL}/1`, {
      method: 'PUT',
      body: JSON.stringify({ yearMonth: '202602' }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(409)

    const body = await res.json()
    expect(body.type).toContain('conflict')
  })

  test('事業部コード不存在で 422 を返す', async () => {
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
// DELETE /capacity-scenarios/:capacityScenarioId/monthly-capacities/:monthlyCapacityId - 物理削除
// =============================================================================
describe('DELETE /capacity-scenarios/:capacityScenarioId/monthly-capacities/:monthlyCapacityId', () => {
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
      new HTTPException(404, { message: "Monthly capacity with ID '999' not found" }),
    )

    const res = await app.request(`${BASE_URL}/999`, {
      method: 'DELETE',
    })
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('シナリオID不一致で 404 を返す', async () => {
    mockedService.delete.mockRejectedValue(
      new HTTPException(404, { message: "Monthly capacity with ID '1' not found" }),
    )

    const res = await app.request('/capacity-scenarios/20/monthly-capacities/1', {
      method: 'DELETE',
    })
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })
})

// =============================================================================
// PUT /capacity-scenarios/:capacityScenarioId/monthly-capacities/bulk - バルク Upsert
// =============================================================================
describe('PUT /capacity-scenarios/:capacityScenarioId/monthly-capacities/bulk', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('正常バルク Upsert で 200 と data 配列形式を返す', async () => {
    mockedService.bulkUpsert.mockResolvedValue([sampleCapacity1, sampleCapacity2])

    const res = await app.request(`${BASE_URL}/bulk`, {
      method: 'PUT',
      body: JSON.stringify({
        items: [
          { businessUnitCode: 'BU001', yearMonth: '202601', capacity: 100.5 },
          { businessUnitCode: 'BU001', yearMonth: '202602', capacity: 200.0 },
        ],
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toHaveLength(2)
    expect(body.data[0]).toMatchObject(sampleCapacity1)
    expect(body.data[1]).toMatchObject(sampleCapacity2)
  })

  test('新規作成と既存更新の混在を検証する', async () => {
    const capacity4 = { ...sampleCapacity1, monthlyCapacityId: 4, businessUnitCode: 'BU003', yearMonth: '202603', capacity: 300.0 }
    mockedService.bulkUpsert.mockResolvedValue([sampleCapacity1, sampleCapacity2, capacity4])

    const res = await app.request(`${BASE_URL}/bulk`, {
      method: 'PUT',
      body: JSON.stringify({
        items: [
          { businessUnitCode: 'BU001', yearMonth: '202601', capacity: 100.5 },
          { businessUnitCode: 'BU001', yearMonth: '202602', capacity: 200.0 },
          { businessUnitCode: 'BU003', yearMonth: '202603', capacity: 300.0 },
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
          { businessUnitCode: 'BU001', yearMonth: 'invalid', capacity: 100 },
        ],
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })

  test('親シナリオ不存在で 404 を返す', async () => {
    mockedService.bulkUpsert.mockRejectedValue(
      new HTTPException(404, { message: "Capacity scenario with ID '999' not found" }),
    )

    const res = await app.request('/capacity-scenarios/999/monthly-capacities/bulk', {
      method: 'PUT',
      body: JSON.stringify({
        items: [
          { businessUnitCode: 'BU001', yearMonth: '202601', capacity: 100 },
        ],
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('配列内 businessUnitCode+yearMonth 重複で 422 を返す', async () => {
    mockedService.bulkUpsert.mockRejectedValue(
      new HTTPException(422, {
        message: 'Duplicate businessUnitCode + yearMonth combinations found in items array',
      }),
    )

    const res = await app.request(`${BASE_URL}/bulk`, {
      method: 'PUT',
      body: JSON.stringify({
        items: [
          { businessUnitCode: 'BU001', yearMonth: '202601', capacity: 100 },
          { businessUnitCode: 'BU001', yearMonth: '202601', capacity: 200 },
        ],
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })

  test('事業部コード不存在で 422 を返す', async () => {
    mockedService.bulkUpsert.mockRejectedValue(
      new HTTPException(422, {
        message: 'One or more business unit codes not found',
      }),
    )

    const res = await app.request(`${BASE_URL}/bulk`, {
      method: 'PUT',
      body: JSON.stringify({
        items: [
          { businessUnitCode: 'INVALID', yearMonth: '202601', capacity: 100 },
        ],
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })
})
