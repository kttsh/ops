import { describe, test, expect, vi, beforeEach } from 'vitest'
import { HTTPException } from 'hono/http-exception'
import type { ChartViewProjectItemRow } from '@/types/chartViewProjectItem'

// --- モック ---
const mockData = {
  findAll: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  deleteById: vi.fn(),
  updateDisplayOrders: vi.fn(),
  chartViewExists: vi.fn(),
  projectExists: vi.fn(),
  projectCaseBelongsToProject: vi.fn(),
}

vi.mock('@/data/chartViewProjectItemData', () => ({
  chartViewProjectItemData: mockData,
}))

// --- テスト用データ ---
const sampleRow: ChartViewProjectItemRow = {
  chart_view_project_item_id: 1,
  chart_view_id: 10,
  project_id: 5,
  project_case_id: 12,
  display_order: 0,
  is_visible: true,
  created_at: new Date('2026-01-01T00:00:00.000Z'),
  updated_at: new Date('2026-01-01T00:00:00.000Z'),
  project_code: 'PRJ-001',
  project_name: '新規開発プロジェクトA',
  case_name: '標準ケース',
}

const sampleRow2: ChartViewProjectItemRow = {
  chart_view_project_item_id: 2,
  chart_view_id: 10,
  project_id: 8,
  project_case_id: null,
  display_order: 1,
  is_visible: true,
  created_at: new Date('2026-01-02T00:00:00.000Z'),
  updated_at: new Date('2026-01-02T00:00:00.000Z'),
  project_code: 'PRJ-002',
  project_name: '改修プロジェクトB',
  case_name: null,
}

describe('chartViewProjectItemService', () => {
  let chartViewProjectItemService: typeof import('@/services/chartViewProjectItemService').chartViewProjectItemService

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('@/services/chartViewProjectItemService')
    chartViewProjectItemService = mod.chartViewProjectItemService
  })

  // ===========================================================================
  // findAll
  // ===========================================================================
  describe('findAll', () => {
    test('チャートビューが存在する場合、変換済み配列を返す', async () => {
      mockData.chartViewExists.mockResolvedValue(true)
      mockData.findAll.mockResolvedValue([sampleRow, sampleRow2])

      const result = await chartViewProjectItemService.findAll(10)

      expect(result).toHaveLength(2)
      expect(result[0].chartViewProjectItemId).toBe(1)
      expect(result[0].project.projectCode).toBe('PRJ-001')
      expect(result[0].projectCase).toEqual({ caseName: '標準ケース' })
      expect(result[1].chartViewProjectItemId).toBe(2)
      expect(result[1].projectCase).toBeNull()
    })

    test('チャートビューが存在しない場合、404 を投げる', async () => {
      mockData.chartViewExists.mockResolvedValue(false)

      await expect(chartViewProjectItemService.findAll(999)).rejects.toThrow(HTTPException)
      try {
        await chartViewProjectItemService.findAll(999)
      } catch (e) {
        expect((e as HTTPException).status).toBe(404)
      }
    })
  })

  // ===========================================================================
  // findById
  // ===========================================================================
  describe('findById', () => {
    test('レコードが存在し chartViewId が一致する場合、変換済みオブジェクトを返す', async () => {
      mockData.findById.mockResolvedValue(sampleRow)

      const result = await chartViewProjectItemService.findById(10, 1)

      expect(result.chartViewProjectItemId).toBe(1)
      expect(result.project.projectName).toBe('新規開発プロジェクトA')
    })

    test('レコードが存在しない場合、404 を投げる', async () => {
      mockData.findById.mockResolvedValue(undefined)

      await expect(chartViewProjectItemService.findById(10, 999)).rejects.toThrow(HTTPException)
      try {
        await chartViewProjectItemService.findById(10, 999)
      } catch (e) {
        expect((e as HTTPException).status).toBe(404)
      }
    })

    test('chartViewId が不一致の場合、404 を投げる', async () => {
      mockData.findById.mockResolvedValue(sampleRow)

      await expect(chartViewProjectItemService.findById(20, 1)).rejects.toThrow(HTTPException)
      try {
        await chartViewProjectItemService.findById(20, 1)
      } catch (e) {
        expect((e as HTTPException).status).toBe(404)
      }
    })
  })

  // ===========================================================================
  // create
  // ===========================================================================
  describe('create', () => {
    test('正常に作成して変換済みオブジェクトを返す', async () => {
      mockData.chartViewExists.mockResolvedValue(true)
      mockData.projectExists.mockResolvedValue(true)
      mockData.projectCaseBelongsToProject.mockResolvedValue(true)
      mockData.create.mockResolvedValue(sampleRow)

      const result = await chartViewProjectItemService.create(10, {
        projectId: 5,
        projectCaseId: 12,
        displayOrder: 0,
        isVisible: true,
      })

      expect(result.chartViewProjectItemId).toBe(1)
      expect(mockData.create).toHaveBeenCalledWith({
        chartViewId: 10,
        projectId: 5,
        projectCaseId: 12,
        displayOrder: 0,
        isVisible: true,
      })
    })

    test('projectCaseId が null の場合、projectCaseBelongsToProject を呼ばない', async () => {
      mockData.chartViewExists.mockResolvedValue(true)
      mockData.projectExists.mockResolvedValue(true)
      mockData.create.mockResolvedValue(sampleRow2)

      await chartViewProjectItemService.create(10, {
        projectId: 8,
        projectCaseId: null,
        displayOrder: 1,
        isVisible: true,
      })

      expect(mockData.projectCaseBelongsToProject).not.toHaveBeenCalled()
    })

    test('チャートビュー不存在で 404 を投げる', async () => {
      mockData.chartViewExists.mockResolvedValue(false)

      await expect(
        chartViewProjectItemService.create(999, {
          projectId: 5,
          displayOrder: 0,
          isVisible: true,
        }),
      ).rejects.toThrow(HTTPException)

      try {
        await chartViewProjectItemService.create(999, {
          projectId: 5,
          displayOrder: 0,
          isVisible: true,
        })
      } catch (e) {
        expect((e as HTTPException).status).toBe(404)
      }
    })

    test('案件不存在で 422 を投げる', async () => {
      mockData.chartViewExists.mockResolvedValue(true)
      mockData.projectExists.mockResolvedValue(false)

      await expect(
        chartViewProjectItemService.create(10, {
          projectId: 999,
          displayOrder: 0,
          isVisible: true,
        }),
      ).rejects.toThrow(HTTPException)

      try {
        await chartViewProjectItemService.create(10, {
          projectId: 999,
          displayOrder: 0,
          isVisible: true,
        })
      } catch (e) {
        expect((e as HTTPException).status).toBe(422)
      }
    })

    test('案件ケース所属不一致で 422 を投げる', async () => {
      mockData.chartViewExists.mockResolvedValue(true)
      mockData.projectExists.mockResolvedValue(true)
      mockData.projectCaseBelongsToProject.mockResolvedValue(false)

      await expect(
        chartViewProjectItemService.create(10, {
          projectId: 5,
          projectCaseId: 99,
          displayOrder: 0,
          isVisible: true,
        }),
      ).rejects.toThrow(HTTPException)

      try {
        await chartViewProjectItemService.create(10, {
          projectId: 5,
          projectCaseId: 99,
          displayOrder: 0,
          isVisible: true,
        })
      } catch (e) {
        expect((e as HTTPException).status).toBe(422)
      }
    })
  })

  // ===========================================================================
  // update
  // ===========================================================================
  describe('update', () => {
    test('正常に更新して変換済みオブジェクトを返す', async () => {
      const updatedRow = { ...sampleRow, display_order: 5 }
      mockData.findById.mockResolvedValue(sampleRow)
      mockData.update.mockResolvedValue(updatedRow)

      const result = await chartViewProjectItemService.update(10, 1, { displayOrder: 5 })

      expect(result.displayOrder).toBe(5)
    })

    test('projectCaseId 変更時に所属検証を実行する', async () => {
      const updatedRow = { ...sampleRow, project_case_id: 15, case_name: '新ケース' }
      mockData.findById.mockResolvedValue(sampleRow)
      mockData.projectCaseBelongsToProject.mockResolvedValue(true)
      mockData.update.mockResolvedValue(updatedRow)

      await chartViewProjectItemService.update(10, 1, { projectCaseId: 15 })

      expect(mockData.projectCaseBelongsToProject).toHaveBeenCalledWith(15, 5)
    })

    test('projectCaseId を null に設定する場合、所属検証を実行しない', async () => {
      const updatedRow = { ...sampleRow, project_case_id: null, case_name: null }
      mockData.findById.mockResolvedValue(sampleRow)
      mockData.update.mockResolvedValue(updatedRow)

      await chartViewProjectItemService.update(10, 1, { projectCaseId: null })

      expect(mockData.projectCaseBelongsToProject).not.toHaveBeenCalled()
    })

    test('displayOrder のみの変更時は所属検証を実行しない', async () => {
      const updatedRow = { ...sampleRow, display_order: 3 }
      mockData.findById.mockResolvedValue(sampleRow)
      mockData.update.mockResolvedValue(updatedRow)

      await chartViewProjectItemService.update(10, 1, { displayOrder: 3 })

      expect(mockData.projectCaseBelongsToProject).not.toHaveBeenCalled()
    })

    test('レコードが存在しない場合、404 を投げる', async () => {
      mockData.findById.mockResolvedValue(undefined)

      await expect(
        chartViewProjectItemService.update(10, 999, { displayOrder: 5 }),
      ).rejects.toThrow(HTTPException)

      try {
        await chartViewProjectItemService.update(10, 999, { displayOrder: 5 })
      } catch (e) {
        expect((e as HTTPException).status).toBe(404)
      }
    })

    test('chartViewId が不一致の場合、404 を投げる', async () => {
      mockData.findById.mockResolvedValue(sampleRow)

      await expect(
        chartViewProjectItemService.update(20, 1, { displayOrder: 5 }),
      ).rejects.toThrow(HTTPException)

      try {
        await chartViewProjectItemService.update(20, 1, { displayOrder: 5 })
      } catch (e) {
        expect((e as HTTPException).status).toBe(404)
      }
    })

    test('projectCaseId の所属不一致で 422 を投げる', async () => {
      mockData.findById.mockResolvedValue(sampleRow)
      mockData.projectCaseBelongsToProject.mockResolvedValue(false)

      await expect(
        chartViewProjectItemService.update(10, 1, { projectCaseId: 99 }),
      ).rejects.toThrow(HTTPException)

      try {
        await chartViewProjectItemService.update(10, 1, { projectCaseId: 99 })
      } catch (e) {
        expect((e as HTTPException).status).toBe(422)
      }
    })
  })

  // ===========================================================================
  // delete
  // ===========================================================================
  describe('delete', () => {
    test('正常に削除する', async () => {
      mockData.findById.mockResolvedValue(sampleRow)
      mockData.deleteById.mockResolvedValue(true)

      await expect(chartViewProjectItemService.delete(10, 1)).resolves.toBeUndefined()
      expect(mockData.deleteById).toHaveBeenCalledWith(1)
    })

    test('レコードが存在しない場合、404 を投げる', async () => {
      mockData.findById.mockResolvedValue(undefined)

      await expect(chartViewProjectItemService.delete(10, 999)).rejects.toThrow(HTTPException)
      try {
        await chartViewProjectItemService.delete(10, 999)
      } catch (e) {
        expect((e as HTTPException).status).toBe(404)
      }
    })

    test('chartViewId が不一致の場合、404 を投げる', async () => {
      mockData.findById.mockResolvedValue(sampleRow)

      await expect(chartViewProjectItemService.delete(20, 1)).rejects.toThrow(HTTPException)
      try {
        await chartViewProjectItemService.delete(20, 1)
      } catch (e) {
        expect((e as HTTPException).status).toBe(404)
      }
    })
  })

  // ===========================================================================
  // updateDisplayOrder
  // ===========================================================================
  describe('updateDisplayOrder', () => {
    test('正常に一括更新して更新後の一覧を返す', async () => {
      mockData.chartViewExists.mockResolvedValue(true)
      mockData.findById
        .mockResolvedValueOnce(sampleRow)
        .mockResolvedValueOnce(sampleRow2)
      mockData.updateDisplayOrders.mockResolvedValue(undefined)
      mockData.findAll.mockResolvedValue([
        { ...sampleRow2, display_order: 0 },
        { ...sampleRow, display_order: 1 },
      ])

      const result = await chartViewProjectItemService.updateDisplayOrder(10, {
        items: [
          { chartViewProjectItemId: 1, displayOrder: 1 },
          { chartViewProjectItemId: 2, displayOrder: 0 },
        ],
      })

      expect(result).toHaveLength(2)
      expect(mockData.updateDisplayOrders).toHaveBeenCalledWith([
        { chartViewProjectItemId: 1, displayOrder: 1 },
        { chartViewProjectItemId: 2, displayOrder: 0 },
      ])
    })

    test('チャートビュー不存在で 404 を投げる', async () => {
      mockData.chartViewExists.mockResolvedValue(false)

      await expect(
        chartViewProjectItemService.updateDisplayOrder(999, {
          items: [{ chartViewProjectItemId: 1, displayOrder: 0 }],
        }),
      ).rejects.toThrow(HTTPException)

      try {
        await chartViewProjectItemService.updateDisplayOrder(999, {
          items: [{ chartViewProjectItemId: 1, displayOrder: 0 }],
        })
      } catch (e) {
        expect((e as HTTPException).status).toBe(404)
      }
    })

    test('所属しないIDが含まれる場合、422 を投げる', async () => {
      mockData.chartViewExists.mockResolvedValue(true)
      mockData.findById.mockResolvedValueOnce(undefined)

      await expect(
        chartViewProjectItemService.updateDisplayOrder(10, {
          items: [{ chartViewProjectItemId: 99, displayOrder: 0 }],
        }),
      ).rejects.toThrow(HTTPException)

      try {
        mockData.chartViewExists.mockResolvedValue(true)
        mockData.findById.mockResolvedValueOnce(undefined)
        await chartViewProjectItemService.updateDisplayOrder(10, {
          items: [{ chartViewProjectItemId: 99, displayOrder: 0 }],
        })
      } catch (e) {
        expect((e as HTTPException).status).toBe(422)
      }
    })

    test('chartViewId が不一致のIDが含まれる場合、422 を投げる', async () => {
      const otherChartViewRow = { ...sampleRow, chart_view_id: 20 }
      mockData.chartViewExists.mockResolvedValue(true)
      mockData.findById.mockResolvedValueOnce(otherChartViewRow)

      await expect(
        chartViewProjectItemService.updateDisplayOrder(10, {
          items: [{ chartViewProjectItemId: 1, displayOrder: 0 }],
        }),
      ).rejects.toThrow(HTTPException)

      try {
        mockData.chartViewExists.mockResolvedValue(true)
        mockData.findById.mockResolvedValueOnce(otherChartViewRow)
        await chartViewProjectItemService.updateDisplayOrder(10, {
          items: [{ chartViewProjectItemId: 1, displayOrder: 0 }],
        })
      } catch (e) {
        expect((e as HTTPException).status).toBe(422)
      }
    })
  })
})
