import { describe, test, expect, vi, beforeEach } from 'vitest'
import { HTTPException } from 'hono/http-exception'
import type { CapacityScenarioRow } from '@/types/capacityScenario'

// capacityScenarioData のモック
const mockCapacityScenarioData = {
  findAll: vi.fn(),
  findById: vi.fn(),
  findByIdIncludingDeleted: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  softDelete: vi.fn(),
  restore: vi.fn(),
  hasReferences: vi.fn(),
}

vi.mock('@/data/capacityScenarioData', () => ({
  capacityScenarioData: mockCapacityScenarioData,
}))

// テスト用サンプルデータ
const sampleRow: CapacityScenarioRow = {
  capacity_scenario_id: 1,
  scenario_name: '標準シナリオ',
  is_primary: true,
  description: '標準的なキャパシティ計画',
  created_at: new Date('2026-01-01T00:00:00Z'),
  updated_at: new Date('2026-01-15T00:00:00Z'),
  deleted_at: null,
}

const deletedRow: CapacityScenarioRow = {
  ...sampleRow,
  capacity_scenario_id: 2,
  scenario_name: '削除済みシナリオ',
  deleted_at: new Date('2026-01-10T00:00:00Z'),
}

describe('capacityScenarioService', () => {
  let capacityScenarioService: typeof import('@/services/capacityScenarioService').capacityScenarioService

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('@/services/capacityScenarioService')
    capacityScenarioService = mod.capacityScenarioService
  })

  describe('findAll', () => {
    test('データ層の結果を camelCase のレスポンス形式に変換して返す', async () => {
      mockCapacityScenarioData.findAll.mockResolvedValue({
        items: [sampleRow],
        totalCount: 1,
      })

      const result = await capacityScenarioService.findAll({
        page: 1,
        pageSize: 20,
        includeDisabled: false,
      })

      expect(result.items).toEqual([
        {
          capacityScenarioId: 1,
          scenarioName: '標準シナリオ',
          isPrimary: true,
          description: '標準的なキャパシティ計画',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-15T00:00:00.000Z',
        },
      ])
      expect(result.totalCount).toBe(1)
    })

    test('データ層にパラメータを正しく渡す', async () => {
      mockCapacityScenarioData.findAll.mockResolvedValue({
        items: [],
        totalCount: 0,
      })

      await capacityScenarioService.findAll({
        page: 2,
        pageSize: 10,
        includeDisabled: true,
      })

      expect(mockCapacityScenarioData.findAll).toHaveBeenCalledWith({
        page: 2,
        pageSize: 10,
        includeDisabled: true,
      })
    })

    test('空の結果を正しく返す', async () => {
      mockCapacityScenarioData.findAll.mockResolvedValue({
        items: [],
        totalCount: 0,
      })

      const result = await capacityScenarioService.findAll({
        page: 1,
        pageSize: 20,
        includeDisabled: false,
      })

      expect(result.items).toEqual([])
      expect(result.totalCount).toBe(0)
    })
  })

  describe('findById', () => {
    test('存在するキャパシティシナリオを camelCase で返す', async () => {
      mockCapacityScenarioData.findById.mockResolvedValue(sampleRow)

      const result = await capacityScenarioService.findById(1)

      expect(result).toEqual({
        capacityScenarioId: 1,
        scenarioName: '標準シナリオ',
        isPrimary: true,
        description: '標準的なキャパシティ計画',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-15T00:00:00.000Z',
      })
    })

    test('存在しない場合は HTTPException(404) を投げる', async () => {
      mockCapacityScenarioData.findById.mockResolvedValue(undefined)

      await expect(capacityScenarioService.findById(999)).rejects.toThrow(
        HTTPException,
      )

      try {
        await capacityScenarioService.findById(999)
      } catch (e) {
        expect(e).toBeInstanceOf(HTTPException)
        expect((e as HTTPException).status).toBe(404)
      }
    })
  })

  describe('create', () => {
    test('新規キャパシティシナリオを作成して camelCase で返す', async () => {
      mockCapacityScenarioData.create.mockResolvedValue(sampleRow)

      const result = await capacityScenarioService.create({
        scenarioName: '標準シナリオ',
        isPrimary: true,
        description: '標準的なキャパシティ計画',
      })

      expect(result).toEqual({
        capacityScenarioId: 1,
        scenarioName: '標準シナリオ',
        isPrimary: true,
        description: '標準的なキャパシティ計画',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-15T00:00:00.000Z',
      })
    })

    test('isPrimary 未指定でもデフォルト false で作成できる', async () => {
      const rowWithDefaults = {
        ...sampleRow,
        is_primary: false,
      }
      mockCapacityScenarioData.create.mockResolvedValue(rowWithDefaults)

      await capacityScenarioService.create({
        scenarioName: '標準シナリオ',
        isPrimary: false,
      })

      expect(mockCapacityScenarioData.create).toHaveBeenCalledWith({
        scenarioName: '標準シナリオ',
        isPrimary: false,
        description: null,
      })
    })
  })

  describe('update', () => {
    test('キャパシティシナリオを更新して camelCase で返す', async () => {
      const updatedRow = { ...sampleRow, scenario_name: '更新後シナリオ' }
      mockCapacityScenarioData.update.mockResolvedValue(updatedRow)

      const result = await capacityScenarioService.update(1, {
        scenarioName: '更新後シナリオ',
      })

      expect(result.scenarioName).toBe('更新後シナリオ')
    })

    test('存在しない場合は HTTPException(404) を投げる', async () => {
      mockCapacityScenarioData.update.mockResolvedValue(undefined)

      await expect(
        capacityScenarioService.update(999, { scenarioName: '更新' }),
      ).rejects.toThrow(HTTPException)

      try {
        await capacityScenarioService.update(999, { scenarioName: '更新' })
      } catch (e) {
        expect(e).toBeInstanceOf(HTTPException)
        expect((e as HTTPException).status).toBe(404)
      }
    })
  })

  describe('delete', () => {
    test('キャパシティシナリオを論理削除する', async () => {
      mockCapacityScenarioData.hasReferences.mockResolvedValue(false)
      mockCapacityScenarioData.softDelete.mockResolvedValue({
        ...sampleRow,
        deleted_at: new Date(),
      })

      await expect(capacityScenarioService.delete(1)).resolves.toBeUndefined()
    })

    test('存在しない場合は HTTPException(404) を投げる', async () => {
      mockCapacityScenarioData.hasReferences.mockResolvedValue(false)
      mockCapacityScenarioData.softDelete.mockResolvedValue(undefined)

      await expect(capacityScenarioService.delete(999)).rejects.toThrow(
        HTTPException,
      )

      try {
        await capacityScenarioService.delete(999)
      } catch (e) {
        expect(e).toBeInstanceOf(HTTPException)
        expect((e as HTTPException).status).toBe(404)
      }
    })

    test('参照が存在する場合は HTTPException(409) を投げる', async () => {
      mockCapacityScenarioData.hasReferences.mockResolvedValue(true)

      await expect(capacityScenarioService.delete(1)).rejects.toThrow(
        HTTPException,
      )

      try {
        await capacityScenarioService.delete(1)
      } catch (e) {
        expect(e).toBeInstanceOf(HTTPException)
        expect((e as HTTPException).status).toBe(409)
      }
    })
  })

  describe('restore', () => {
    test('論理削除済みキャパシティシナリオを復元して camelCase で返す', async () => {
      mockCapacityScenarioData.findByIdIncludingDeleted.mockResolvedValue(deletedRow)
      mockCapacityScenarioData.restore.mockResolvedValue({
        ...deletedRow,
        deleted_at: null,
      })

      const result = await capacityScenarioService.restore(2)

      expect(result).toEqual({
        capacityScenarioId: 2,
        scenarioName: '削除済みシナリオ',
        isPrimary: true,
        description: '標準的なキャパシティ計画',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-15T00:00:00.000Z',
      })
    })

    test('存在しない場合は HTTPException(404) を投げる', async () => {
      mockCapacityScenarioData.findByIdIncludingDeleted.mockResolvedValue(undefined)

      await expect(capacityScenarioService.restore(999)).rejects.toThrow(
        HTTPException,
      )

      try {
        await capacityScenarioService.restore(999)
      } catch (e) {
        expect(e).toBeInstanceOf(HTTPException)
        expect((e as HTTPException).status).toBe(404)
      }
    })

    test('論理削除されていない場合は HTTPException(409) を投げる', async () => {
      mockCapacityScenarioData.findByIdIncludingDeleted.mockResolvedValue(sampleRow)

      await expect(capacityScenarioService.restore(1)).rejects.toThrow(
        HTTPException,
      )

      try {
        await capacityScenarioService.restore(1)
      } catch (e) {
        expect(e).toBeInstanceOf(HTTPException)
        expect((e as HTTPException).status).toBe(409)
      }
    })
  })
})
