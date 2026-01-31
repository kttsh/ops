import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/services/chartDataService', () => ({
  chartDataService: {
    getChartData: vi.fn(),
  },
}))

import app from '@/index'
import { chartDataService } from '@/services/chartDataService'

const mockedService = vi.mocked(chartDataService)

describe('GET /chart-data', () => {
  const mockResponse = {
    projectLoads: [],
    indirectWorkLoads: [],
    capacities: [],
    period: { startYearMonth: '202504', endYearMonth: '202603' },
    businessUnitCodes: ['BU001'],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockedService.getChartData.mockResolvedValue(mockResponse)
  })

  it('全必須パラメータ指定時に200レスポンスで3セクション + メタ情報を返却する', async () => {
    const res = await app.request(
      '/chart-data?businessUnitCodes=BU001&startYearMonth=202504&endYearMonth=202603',
    )

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toHaveProperty('projectLoads')
    expect(json.data).toHaveProperty('indirectWorkLoads')
    expect(json.data).toHaveProperty('capacities')
    expect(json.data).toHaveProperty('period')
    expect(json.data).toHaveProperty('businessUnitCodes')
  })

  it('サービス関数に正しいパラメータを渡す', async () => {
    await app.request(
      '/chart-data?businessUnitCodes=BU001,BU002&startYearMonth=202504&endYearMonth=202603&chartViewId=1&capacityScenarioIds=1,2&indirectWorkCaseIds=10,20',
    )

    expect(mockedService.getChartData).toHaveBeenCalledWith({
      businessUnitCodes: ['BU001', 'BU002'],
      startYearMonth: '202504',
      endYearMonth: '202603',
      chartViewId: 1,
      capacityScenarioIds: [1, 2],
      indirectWorkCaseIds: [10, 20],
    })
  })

  it('レスポンスが { data: {...} } 構造で返却される', async () => {
    const res = await app.request(
      '/chart-data?businessUnitCodes=BU001&startYearMonth=202504&endYearMonth=202603',
    )

    const json = await res.json()
    expect(json).toHaveProperty('data')
    expect(json.data.period).toEqual({
      startYearMonth: '202504',
      endYearMonth: '202603',
    })
    expect(json.data.businessUnitCodes).toEqual(['BU001'])
  })

  describe('バリデーションエラー', () => {
    it('businessUnitCodes 未指定時に422エラーを返却する', async () => {
      const res = await app.request(
        '/chart-data?startYearMonth=202504&endYearMonth=202603',
      )

      expect(res.status).toBe(422)
      const json = await res.json()
      expect(json).toHaveProperty('type')
      expect(json).toHaveProperty('status', 422)
      expect(json).toHaveProperty('title')
    })

    it('startYearMonth が不正形式の場合に422エラーを返却する', async () => {
      const res = await app.request(
        '/chart-data?businessUnitCodes=BU001&startYearMonth=20250&endYearMonth=202603',
      )

      expect(res.status).toBe(422)
    })

    it('月が範囲外の場合に422エラーを返却する', async () => {
      const res = await app.request(
        '/chart-data?businessUnitCodes=BU001&startYearMonth=202513&endYearMonth=202603',
      )

      expect(res.status).toBe(422)
    })

    it('startYearMonth > endYearMonth の場合に422エラーを返却する', async () => {
      const res = await app.request(
        '/chart-data?businessUnitCodes=BU001&startYearMonth=202604&endYearMonth=202603',
      )

      expect(res.status).toBe(422)
    })

    it('期間が60ヶ月を超える場合に422エラーを返却する', async () => {
      const res = await app.request(
        '/chart-data?businessUnitCodes=BU001&startYearMonth=202001&endYearMonth=202501',
      )

      expect(res.status).toBe(422)
    })
  })

  it('オプショナルパラメータ未指定時も正常に動作する', async () => {
    const res = await app.request(
      '/chart-data?businessUnitCodes=BU001&startYearMonth=202504&endYearMonth=202603',
    )

    expect(res.status).toBe(200)
    expect(mockedService.getChartData).toHaveBeenCalledWith({
      businessUnitCodes: ['BU001'],
      startYearMonth: '202504',
      endYearMonth: '202603',
      chartViewId: undefined,
      capacityScenarioIds: undefined,
      indirectWorkCaseIds: undefined,
    })
  })
})
