import { describe, test, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { problemResponse, getProblemType, getStatusTitle } from '@/utils/errorHelper'
import type { StatusCode } from 'hono/utils/http-status'

// --- モック ---
vi.mock('@/services/monthlyHeadcountPlanService', () => ({
  monthlyHeadcountPlanService: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    bulkUpsert: vi.fn(),
  },
}))

// モックをインポート（vi.mock の後）
import { monthlyHeadcountPlanService } from '@/services/monthlyHeadcountPlanService'
import monthlyHeadcountPlans from '@/routes/monthlyHeadcountPlans'

const mockedService = vi.mocked(monthlyHeadcountPlanService)

// テスト用アプリ（グローバルエラーハンドラ付き）
function createApp() {
  const app = new Hono()

  app.route('/headcount-plan-cases/:headcountPlanCaseId/monthly-headcount-plans', monthlyHeadcountPlans)

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
const samplePlan1 = {
  monthlyHeadcountPlanId: 1,
  headcountPlanCaseId: 10,
  businessUnitCode: 'BU001',
  yearMonth: '202601',
  headcount: 5,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const samplePlan2 = {
  monthlyHeadcountPlanId: 2,
  headcountPlanCaseId: 10,
  businessUnitCode: 'BU001',
  yearMonth: '202602',
  headcount: 8,
  createdAt: '2026-01-02T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
}

const samplePlan3 = {
  monthlyHeadcountPlanId: 3,
  headcountPlanCaseId: 10,
  businessUnitCode: 'BU002',
  yearMonth: '202601',
  headcount: 3,
  createdAt: '2026-01-03T00:00:00.000Z',
  updatedAt: '2026-01-03T00:00:00.000Z',
}

const BASE_URL = '/headcount-plan-cases/10/monthly-headcount-plans'

// =============================================================================
// GET /headcount-plan-cases/:headcountPlanCaseId/monthly-headcount-plans - 一覧取得
// =============================================================================
describe('GET /headcount-plan-cases/:headcountPlanCaseId/monthly-headcount-plans', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('一覧を data 配列形式で返す', async () => {
    mockedService.findAll.mockResolvedValue([samplePlan1, samplePlan2, samplePlan3])

    const res = await app.request(BASE_URL)
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toHaveLength(3)
    expect(body.data[0]).toMatchObject(samplePlan1)
    expect(body.data[1]).toMatchObject(samplePlan2)
    expect(body.data[2]).toMatchObject(samplePlan3)
  })

  test('business_unit_code 昇順＋year_month 昇順でソートされる（サービスの呼び出しを検証）', async () => {
    mockedService.findAll.mockResolvedValue([samplePlan1, samplePlan2, samplePlan3])

    const res = await app.request(BASE_URL)
    expect(res.status).toBe(200)

    expect(mockedService.findAll).toHaveBeenCalledWith(10, undefined)

    const body = await res.json()
    expect(body.data[0].businessUnitCode).toBe('BU001')
    expect(body.data[0].yearMonth).toBe('202601')
    expect(body.data[1].businessUnitCode).toBe('BU001')
    expect(body.data[1].yearMonth).toBe('202602')
    expect(body.data[2].businessUnitCode).toBe('BU002')
    expect(body.data[2].yearMonth).toBe('202601')
  })

  test('businessUnitCode フィルタが正しくサービスに渡される', async () => {
    mockedService.findAll.mockResolvedValue([samplePlan1, samplePlan2])

    const res = await app.request(`${BASE_URL}?businessUnitCode=BU001`)
    expect(res.status).toBe(200)

    expect(mockedService.findAll).toHaveBeenCalledWith(10, 'BU001')

    const body = await res.json()
    expect(body.data).toHaveLength(2)
  })

  test('存在しない/論理削除済みの人員計画ケースIDで 404 を返す', async () => {
    mockedService.findAll.mockRejectedValue(
      new HTTPException(404, { message: "Headcount plan case with ID '999' not found" }),
    )

    const res = await app.request('/headcount-plan-cases/999/monthly-headcount-plans')
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('不正な headcountPlanCaseId で 422 を返す', async () => {
    const res = await app.request('/headcount-plan-cases/abc/monthly-headcount-plans')
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })
})

// =============================================================================
// GET /:monthlyHeadcountPlanId - 単一取得
// =============================================================================
describe('GET /headcount-plan-cases/:headcountPlanCaseId/monthly-headcount-plans/:monthlyHeadcountPlanId', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('指定IDの人員計画データを data オブジェクトで返す', async () => {
    mockedService.findById.mockResolvedValue(samplePlan1)

    const res = await app.request(`${BASE_URL}/1`)
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toMatchObject(samplePlan1)
  })

  test('存在しない月次人員計画データIDで 404 を返す', async () => {
    mockedService.findById.mockRejectedValue(
      new HTTPException(404, { message: "Monthly headcount plan with ID '999' not found" }),
    )

    const res = await app.request(`${BASE_URL}/999`)
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('人員計画ケースID不一致で 404 を返す', async () => {
    mockedService.findById.mockRejectedValue(
      new HTTPException(404, { message: "Monthly headcount plan with ID '1' not found" }),
    )

    const res = await app.request('/headcount-plan-cases/20/monthly-headcount-plans/1')
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
describe('POST /headcount-plan-cases/:headcountPlanCaseId/monthly-headcount-plans', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('正常作成で 201 と Location ヘッダを返す', async () => {
    mockedService.create.mockResolvedValue(samplePlan1)

    const res = await app.request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({
        businessUnitCode: 'BU001',
        yearMonth: '202601',
        headcount: 5,
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(201)
    expect(res.headers.get('Location')).toBe('/headcount-plan-cases/10/monthly-headcount-plans/1')

    const body = await res.json()
    expect(body.data).toMatchObject(samplePlan1)
  })

  test('バリデーションエラー（yearMonth 形式不正）で 422 を返す', async () => {
    const res = await app.request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({
        businessUnitCode: 'BU001',
        yearMonth: '2026-01',
        headcount: 5,
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
        headcount: 5,
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })

  test('バリデーションエラー（headcount 負値）で 422 を返す', async () => {
    const res = await app.request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({
        businessUnitCode: 'BU001',
        yearMonth: '202601',
        headcount: -1,
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })

  test('バリデーションエラー（headcount 小数）で 422 を返す', async () => {
    const res = await app.request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({
        businessUnitCode: 'BU001',
        yearMonth: '202601',
        headcount: 5.5,
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
        headcount: 5,
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })

  test('親ケース不存在で 404 を返す', async () => {
    mockedService.create.mockRejectedValue(
      new HTTPException(404, { message: "Headcount plan case with ID '999' not found" }),
    )

    const res = await app.request('/headcount-plan-cases/999/monthly-headcount-plans', {
      method: 'POST',
      body: JSON.stringify({
        businessUnitCode: 'BU001',
        yearMonth: '202601',
        headcount: 5,
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('BU不存在で 404 を返す', async () => {
    mockedService.create.mockRejectedValue(
      new HTTPException(404, { message: "Business unit with code 'INVALID' not found" }),
    )

    const res = await app.request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({
        businessUnitCode: 'INVALID',
        yearMonth: '202601',
        headcount: 5,
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('ユニーク制約重複で 409 を返す', async () => {
    mockedService.create.mockRejectedValue(
      new HTTPException(409, {
        message: "Monthly headcount plan for business unit 'BU001' and year-month '202601' already exists in headcount plan case '10'",
      }),
    )

    const res = await app.request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify({
        businessUnitCode: 'BU001',
        yearMonth: '202601',
        headcount: 5,
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(409)

    const body = await res.json()
    expect(body.type).toContain('conflict')
  })
})

// =============================================================================
// PUT /:monthlyHeadcountPlanId - 更新
// =============================================================================
describe('PUT /headcount-plan-cases/:headcountPlanCaseId/monthly-headcount-plans/:monthlyHeadcountPlanId', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('正常更新で 200 を返す', async () => {
    const updatedPlan = { ...samplePlan1, headcount: 10 }
    mockedService.update.mockResolvedValue(updatedPlan)

    const res = await app.request(`${BASE_URL}/1`, {
      method: 'PUT',
      body: JSON.stringify({ headcount: 10 }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data.headcount).toBe(10)
  })

  test('更新されたフィールドの反映を検証する', async () => {
    const updatedPlan = { ...samplePlan1, businessUnitCode: 'BU003', yearMonth: '202603', headcount: 15 }
    mockedService.update.mockResolvedValue(updatedPlan)

    const res = await app.request(`${BASE_URL}/1`, {
      method: 'PUT',
      body: JSON.stringify({
        businessUnitCode: 'BU003',
        yearMonth: '202603',
        headcount: 15,
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data.businessUnitCode).toBe('BU003')
    expect(body.data.yearMonth).toBe('202603')
    expect(body.data.headcount).toBe(15)
  })

  test('存在しないIDで 404 を返す', async () => {
    mockedService.update.mockRejectedValue(
      new HTTPException(404, { message: "Monthly headcount plan with ID '999' not found" }),
    )

    const res = await app.request(`${BASE_URL}/999`, {
      method: 'PUT',
      body: JSON.stringify({ headcount: 10 }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('バリデーションエラーで 422 を返す', async () => {
    const res = await app.request(`${BASE_URL}/1`, {
      method: 'PUT',
      body: JSON.stringify({ headcount: -1 }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })

  test('ユニーク制約重複で 409 を返す', async () => {
    mockedService.update.mockRejectedValue(
      new HTTPException(409, {
        message: "Monthly headcount plan for business unit 'BU001' and year-month '202602' already exists in headcount plan case '10'",
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

  test('BU不存在で 404 を返す', async () => {
    mockedService.update.mockRejectedValue(
      new HTTPException(404, { message: "Business unit with code 'INVALID' not found" }),
    )

    const res = await app.request(`${BASE_URL}/1`, {
      method: 'PUT',
      body: JSON.stringify({ businessUnitCode: 'INVALID' }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })
})

// =============================================================================
// DELETE /:monthlyHeadcountPlanId - 物理削除
// =============================================================================
describe('DELETE /headcount-plan-cases/:headcountPlanCaseId/monthly-headcount-plans/:monthlyHeadcountPlanId', () => {
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
      new HTTPException(404, { message: "Monthly headcount plan with ID '999' not found" }),
    )

    const res = await app.request(`${BASE_URL}/999`, {
      method: 'DELETE',
    })
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('人員計画ケースID不一致で 404 を返す', async () => {
    mockedService.delete.mockRejectedValue(
      new HTTPException(404, { message: "Monthly headcount plan with ID '1' not found" }),
    )

    const res = await app.request('/headcount-plan-cases/20/monthly-headcount-plans/1', {
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
describe('PUT /headcount-plan-cases/:headcountPlanCaseId/monthly-headcount-plans/bulk', () => {
  let app: ReturnType<typeof createApp>

  beforeEach(() => {
    vi.clearAllMocks()
    app = createApp()
  })

  test('正常バルク Upsert で 200 と data 配列形式を返す', async () => {
    mockedService.bulkUpsert.mockResolvedValue([samplePlan1, samplePlan2])

    const res = await app.request(`${BASE_URL}/bulk`, {
      method: 'PUT',
      body: JSON.stringify({
        items: [
          { businessUnitCode: 'BU001', yearMonth: '202601', headcount: 5 },
          { businessUnitCode: 'BU001', yearMonth: '202602', headcount: 8 },
        ],
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.data).toHaveLength(2)
    expect(body.data[0]).toMatchObject(samplePlan1)
    expect(body.data[1]).toMatchObject(samplePlan2)
  })

  test('新規作成と既存更新の混在を検証する', async () => {
    mockedService.bulkUpsert.mockResolvedValue([samplePlan1, samplePlan2, samplePlan3])

    const res = await app.request(`${BASE_URL}/bulk`, {
      method: 'PUT',
      body: JSON.stringify({
        items: [
          { businessUnitCode: 'BU001', yearMonth: '202601', headcount: 5 },
          { businessUnitCode: 'BU001', yearMonth: '202602', headcount: 8 },
          { businessUnitCode: 'BU002', yearMonth: '202601', headcount: 3 },
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
          { businessUnitCode: 'BU001', yearMonth: 'invalid', headcount: 5 },
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
      new HTTPException(404, { message: "Headcount plan case with ID '999' not found" }),
    )

    const res = await app.request('/headcount-plan-cases/999/monthly-headcount-plans/bulk', {
      method: 'PUT',
      body: JSON.stringify({
        items: [
          { businessUnitCode: 'BU001', yearMonth: '202601', headcount: 5 },
        ],
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })

  test('配列内ビジネスユニットコード＋年月重複で 422 を返す', async () => {
    mockedService.bulkUpsert.mockRejectedValue(
      new HTTPException(422, {
        message: 'Duplicate businessUnitCode and yearMonth combination found in items array',
      }),
    )

    const res = await app.request(`${BASE_URL}/bulk`, {
      method: 'PUT',
      body: JSON.stringify({
        items: [
          { businessUnitCode: 'BU001', yearMonth: '202601', headcount: 5 },
          { businessUnitCode: 'BU001', yearMonth: '202601', headcount: 10 },
        ],
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(422)

    const body = await res.json()
    expect(body.type).toContain('validation-error')
  })

  test('BU不存在で 404 を返す', async () => {
    mockedService.bulkUpsert.mockRejectedValue(
      new HTTPException(404, { message: 'One or more business units not found' }),
    )

    const res = await app.request(`${BASE_URL}/bulk`, {
      method: 'PUT',
      body: JSON.stringify({
        items: [
          { businessUnitCode: 'INVALID', yearMonth: '202601', headcount: 5 },
        ],
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    expect(res.status).toBe(404)

    const body = await res.json()
    expect(body.type).toContain('resource-not-found')
  })
})
