import { describe, test, expect, vi, beforeEach } from 'vitest'
import { HTTPException } from 'hono/http-exception'
import type { IndirectWorkCaseRow } from '@/types/indirectWorkCase'

// indirectWorkCaseData のモック
const mockIndirectWorkCaseData = {
  findAll: vi.fn(),
  findById: vi.fn(),
  findByIdIncludingDeleted: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  softDelete: vi.fn(),
  restore: vi.fn(),
  hasReferences: vi.fn(),
}

// businessUnitData のモック
const mockBusinessUnitData = {
  findAll: vi.fn(),
  findByCode: vi.fn(),
  findByCodeIncludingDeleted: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  softDelete: vi.fn(),
  restore: vi.fn(),
  hasReferences: vi.fn(),
}

vi.mock('@/data/indirectWorkCaseData', () => ({
  indirectWorkCaseData: mockIndirectWorkCaseData,
}))

vi.mock('@/data/businessUnitData', () => ({
  businessUnitData: mockBusinessUnitData,
}))

// テスト用サンプルデータ
const sampleRow: IndirectWorkCaseRow = {
  indirect_work_case_id: 1,
  case_name: '標準ケース',
  is_primary: true,
  description: '間接作業の標準工数計画',
  business_unit_code: 'plant',
  business_unit_name: 'プラント事業',
  created_at: new Date('2026-01-01T00:00:00Z'),
  updated_at: new Date('2026-01-15T00:00:00Z'),
  deleted_at: null,
}

const deletedRow: IndirectWorkCaseRow = {
  ...sampleRow,
  indirect_work_case_id: 2,
  case_name: '削除済みケース',
  deleted_at: new Date('2026-01-10T00:00:00Z'),
}

describe('indirectWorkCaseService', () => {
  let indirectWorkCaseService: typeof import('@/services/indirectWorkCaseService').indirectWorkCaseService

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('@/services/indirectWorkCaseService')
    indirectWorkCaseService = mod.indirectWorkCaseService
  })

  describe('findAll', () => {
    test('データ層の結果を camelCase のレスポンス形式に変換して返す', async () => {
      mockIndirectWorkCaseData.findAll.mockResolvedValue({
        items: [sampleRow],
        totalCount: 1,
      })

      const result = await indirectWorkCaseService.findAll({
        page: 1,
        pageSize: 20,
        includeDisabled: false,
      })

      expect(result.items).toEqual([
        {
          indirectWorkCaseId: 1,
          caseName: '標準ケース',
          isPrimary: true,
          description: '間接作業の標準工数計画',
          businessUnitCode: 'plant',
          businessUnitName: 'プラント事業',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-15T00:00:00.000Z',
        },
      ])
      expect(result.totalCount).toBe(1)
    })

    test('データ層にパラメータを正しく渡す', async () => {
      mockIndirectWorkCaseData.findAll.mockResolvedValue({
        items: [],
        totalCount: 0,
      })

      await indirectWorkCaseService.findAll({
        page: 2,
        pageSize: 10,
        includeDisabled: true,
      })

      expect(mockIndirectWorkCaseData.findAll).toHaveBeenCalledWith({
        page: 2,
        pageSize: 10,
        includeDisabled: true,
      })
    })

    test('空の結果を正しく返す', async () => {
      mockIndirectWorkCaseData.findAll.mockResolvedValue({
        items: [],
        totalCount: 0,
      })

      const result = await indirectWorkCaseService.findAll({
        page: 1,
        pageSize: 20,
        includeDisabled: false,
      })

      expect(result.items).toEqual([])
      expect(result.totalCount).toBe(0)
    })
  })

  describe('findById', () => {
    test('存在する間接作業ケースを camelCase で返す', async () => {
      mockIndirectWorkCaseData.findById.mockResolvedValue(sampleRow)

      const result = await indirectWorkCaseService.findById(1)

      expect(result).toEqual({
        indirectWorkCaseId: 1,
        caseName: '標準ケース',
        isPrimary: true,
        description: '間接作業の標準工数計画',
        businessUnitCode: 'plant',
        businessUnitName: 'プラント事業',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-15T00:00:00.000Z',
      })
    })

    test('存在しない場合は HTTPException(404) を投げる', async () => {
      mockIndirectWorkCaseData.findById.mockResolvedValue(undefined)

      await expect(indirectWorkCaseService.findById(999)).rejects.toThrow(
        HTTPException,
      )

      try {
        await indirectWorkCaseService.findById(999)
      } catch (e) {
        expect(e).toBeInstanceOf(HTTPException)
        expect((e as HTTPException).status).toBe(404)
      }
    })
  })

  describe('create', () => {
    test('新規間接作業ケースを作成して camelCase で返す', async () => {
      mockBusinessUnitData.findByCode.mockResolvedValue({
        business_unit_code: 'plant',
        name: 'プラント事業',
      })
      mockIndirectWorkCaseData.create.mockResolvedValue(sampleRow)

      const result = await indirectWorkCaseService.create({
        caseName: '標準ケース',
        isPrimary: true,
        description: '間接作業の標準工数計画',
        businessUnitCode: 'plant',
      })

      expect(result).toEqual({
        indirectWorkCaseId: 1,
        caseName: '標準ケース',
        isPrimary: true,
        description: '間接作業の標準工数計画',
        businessUnitCode: 'plant',
        businessUnitName: 'プラント事業',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-15T00:00:00.000Z',
      })
    })

    test('businessUnitCode の存在チェックが常に実行される', async () => {
      mockBusinessUnitData.findByCode.mockResolvedValue({
        business_unit_code: 'plant',
        name: 'プラント事業',
      })
      mockIndirectWorkCaseData.create.mockResolvedValue(sampleRow)

      await indirectWorkCaseService.create({
        caseName: '標準ケース',
        isPrimary: false,
        businessUnitCode: 'plant',
      })

      expect(mockBusinessUnitData.findByCode).toHaveBeenCalledWith('plant')
    })

    test('存在しない businessUnitCode で HTTPException(422) を投げる', async () => {
      mockBusinessUnitData.findByCode.mockResolvedValue(undefined)

      await expect(
        indirectWorkCaseService.create({
          caseName: '標準ケース',
          isPrimary: false,
          businessUnitCode: 'INVALID',
        }),
      ).rejects.toThrow(HTTPException)

      try {
        await indirectWorkCaseService.create({
          caseName: '標準ケース',
          isPrimary: false,
          businessUnitCode: 'INVALID',
        })
      } catch (e) {
        expect(e).toBeInstanceOf(HTTPException)
        expect((e as HTTPException).status).toBe(422)
      }
    })
  })

  describe('update', () => {
    test('間接作業ケースを更新して camelCase で返す', async () => {
      const updatedRow = { ...sampleRow, case_name: '更新後ケース' }
      mockIndirectWorkCaseData.update.mockResolvedValue(updatedRow)

      const result = await indirectWorkCaseService.update(1, {
        caseName: '更新後ケース',
      })

      expect(result.caseName).toBe('更新後ケース')
    })

    test('businessUnitCode の存在チェックを行う', async () => {
      mockBusinessUnitData.findByCode.mockResolvedValue({
        business_unit_code: 'energy',
        name: 'エネルギー事業',
      })
      mockIndirectWorkCaseData.update.mockResolvedValue(sampleRow)

      await indirectWorkCaseService.update(1, {
        businessUnitCode: 'energy',
      })

      expect(mockBusinessUnitData.findByCode).toHaveBeenCalledWith('energy')
    })

    test('存在しない場合は HTTPException(404) を投げる', async () => {
      mockIndirectWorkCaseData.update.mockResolvedValue(undefined)

      await expect(
        indirectWorkCaseService.update(999, { caseName: '更新' }),
      ).rejects.toThrow(HTTPException)

      try {
        await indirectWorkCaseService.update(999, { caseName: '更新' })
      } catch (e) {
        expect(e).toBeInstanceOf(HTTPException)
        expect((e as HTTPException).status).toBe(404)
      }
    })

    test('存在しない businessUnitCode で HTTPException(422) を投げる', async () => {
      mockBusinessUnitData.findByCode.mockResolvedValue(undefined)

      await expect(
        indirectWorkCaseService.update(1, { businessUnitCode: 'INVALID' }),
      ).rejects.toThrow(HTTPException)

      try {
        await indirectWorkCaseService.update(1, { businessUnitCode: 'INVALID' })
      } catch (e) {
        expect(e).toBeInstanceOf(HTTPException)
        expect((e as HTTPException).status).toBe(422)
      }
    })
  })

  describe('delete', () => {
    test('間接作業ケースを論理削除する', async () => {
      mockIndirectWorkCaseData.hasReferences.mockResolvedValue(false)
      mockIndirectWorkCaseData.softDelete.mockResolvedValue({
        ...sampleRow,
        deleted_at: new Date(),
      })

      await expect(indirectWorkCaseService.delete(1)).resolves.toBeUndefined()
    })

    test('存在しない場合は HTTPException(404) を投げる', async () => {
      mockIndirectWorkCaseData.hasReferences.mockResolvedValue(false)
      mockIndirectWorkCaseData.softDelete.mockResolvedValue(undefined)

      await expect(indirectWorkCaseService.delete(999)).rejects.toThrow(
        HTTPException,
      )

      try {
        await indirectWorkCaseService.delete(999)
      } catch (e) {
        expect(e).toBeInstanceOf(HTTPException)
        expect((e as HTTPException).status).toBe(404)
      }
    })

    test('参照が存在する場合は HTTPException(409) を投げる', async () => {
      mockIndirectWorkCaseData.hasReferences.mockResolvedValue(true)

      await expect(indirectWorkCaseService.delete(1)).rejects.toThrow(
        HTTPException,
      )

      try {
        await indirectWorkCaseService.delete(1)
      } catch (e) {
        expect(e).toBeInstanceOf(HTTPException)
        expect((e as HTTPException).status).toBe(409)
      }
    })
  })

  describe('restore', () => {
    test('論理削除済み間接作業ケースを復元して camelCase で返す', async () => {
      mockIndirectWorkCaseData.findByIdIncludingDeleted.mockResolvedValue(deletedRow)
      mockIndirectWorkCaseData.restore.mockResolvedValue({
        ...deletedRow,
        deleted_at: null,
      })

      const result = await indirectWorkCaseService.restore(2)

      expect(result).toEqual({
        indirectWorkCaseId: 2,
        caseName: '削除済みケース',
        isPrimary: true,
        description: '間接作業の標準工数計画',
        businessUnitCode: 'plant',
        businessUnitName: 'プラント事業',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-15T00:00:00.000Z',
      })
    })

    test('存在しない場合は HTTPException(404) を投げる', async () => {
      mockIndirectWorkCaseData.findByIdIncludingDeleted.mockResolvedValue(undefined)

      await expect(indirectWorkCaseService.restore(999)).rejects.toThrow(
        HTTPException,
      )

      try {
        await indirectWorkCaseService.restore(999)
      } catch (e) {
        expect(e).toBeInstanceOf(HTTPException)
        expect((e as HTTPException).status).toBe(404)
      }
    })

    test('論理削除されていない場合は HTTPException(404) を投げる', async () => {
      mockIndirectWorkCaseData.findByIdIncludingDeleted.mockResolvedValue(sampleRow)

      await expect(indirectWorkCaseService.restore(1)).rejects.toThrow(
        HTTPException,
      )

      try {
        await indirectWorkCaseService.restore(1)
      } catch (e) {
        expect(e).toBeInstanceOf(HTTPException)
        expect((e as HTTPException).status).toBe(404)
      }
    })
  })
})
