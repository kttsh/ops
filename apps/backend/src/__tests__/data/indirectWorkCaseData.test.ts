import { describe, test, expect, vi, beforeEach } from 'vitest'
import type { IndirectWorkCaseRow } from '@/types/indirectWorkCase'

// mssql のモック
const mockQuery = vi.fn()
const mockInput = vi.fn().mockReturnThis()
const mockRequest = vi.fn(() => ({
  input: mockInput,
  query: mockQuery,
}))

vi.mock('@/database/client', () => ({
  getPool: vi.fn().mockResolvedValue({
    request: mockRequest,
  }),
}))

// テスト用のサンプルデータ
const sampleRow: IndirectWorkCaseRow = {
  indirect_work_case_id: 1,
  case_name: '標準ケース',
  is_primary: true,
  description: '間接作業の標準工数計画',
  business_unit_code: 'plant',
  business_unit_name: 'プラント事業',
  created_at: new Date('2026-01-01T00:00:00Z'),
  updated_at: new Date('2026-01-01T00:00:00Z'),
  deleted_at: null,
}

const deletedRow: IndirectWorkCaseRow = {
  ...sampleRow,
  indirect_work_case_id: 2,
  case_name: '削除済みケース',
  deleted_at: new Date('2026-01-15T00:00:00Z'),
}

describe('indirectWorkCaseData', () => {
  let indirectWorkCaseData: typeof import('@/data/indirectWorkCaseData').indirectWorkCaseData

  beforeEach(async () => {
    vi.clearAllMocks()
    mockInput.mockReturnThis()
    const mod = await import('@/data/indirectWorkCaseData')
    indirectWorkCaseData = mod.indirectWorkCaseData
  })

  describe('findAll', () => {
    test('論理削除されていないレコードをページネーション付きで取得する', async () => {
      mockQuery
        .mockResolvedValueOnce({ recordset: [sampleRow] })
        .mockResolvedValueOnce({ recordset: [{ totalCount: 1 }] })

      const result = await indirectWorkCaseData.findAll({
        page: 1,
        pageSize: 20,
        includeDisabled: false,
      })

      expect(result.items).toEqual([sampleRow])
      expect(result.totalCount).toBe(1)
      expect(mockInput).toHaveBeenCalledWith('offset', expect.anything(), 0)
      expect(mockInput).toHaveBeenCalledWith('pageSize', expect.anything(), 20)
    })

    test('includeDisabled=true で論理削除済みも含めて取得する', async () => {
      mockQuery
        .mockResolvedValueOnce({ recordset: [sampleRow, deletedRow] })
        .mockResolvedValueOnce({ recordset: [{ totalCount: 2 }] })

      const result = await indirectWorkCaseData.findAll({
        page: 1,
        pageSize: 20,
        includeDisabled: true,
      })

      expect(result.items).toEqual([sampleRow, deletedRow])
      expect(result.totalCount).toBe(2)
    })

    test('2ページ目を取得する場合、offset が正しく計算される', async () => {
      mockQuery
        .mockResolvedValueOnce({ recordset: [] })
        .mockResolvedValueOnce({ recordset: [{ totalCount: 25 }] })

      await indirectWorkCaseData.findAll({
        page: 2,
        pageSize: 10,
        includeDisabled: false,
      })

      expect(mockInput).toHaveBeenCalledWith('offset', expect.anything(), 10)
      expect(mockInput).toHaveBeenCalledWith('pageSize', expect.anything(), 10)
    })
  })

  describe('findById', () => {
    test('指定IDのアクティブなレコードを返す', async () => {
      mockQuery.mockResolvedValueOnce({ recordset: [sampleRow] })

      const result = await indirectWorkCaseData.findById(1)

      expect(result).toEqual(sampleRow)
      expect(mockInput).toHaveBeenCalledWith('id', expect.anything(), 1)
    })

    test('存在しない場合は undefined を返す', async () => {
      mockQuery.mockResolvedValueOnce({ recordset: [] })

      const result = await indirectWorkCaseData.findById(999)

      expect(result).toBeUndefined()
    })
  })

  describe('findByIdIncludingDeleted', () => {
    test('論理削除済みのレコードも含めて返す', async () => {
      mockQuery.mockResolvedValueOnce({ recordset: [deletedRow] })

      const result = await indirectWorkCaseData.findByIdIncludingDeleted(2)

      expect(result).toEqual(deletedRow)
      expect(mockInput).toHaveBeenCalledWith('id', expect.anything(), 2)
    })

    test('存在しない場合は undefined を返す', async () => {
      mockQuery.mockResolvedValueOnce({ recordset: [] })

      const result = await indirectWorkCaseData.findByIdIncludingDeleted(999)

      expect(result).toBeUndefined()
    })
  })

  describe('create', () => {
    test('新規レコードを作成して findById で完全な行を返す', async () => {
      // INSERT の OUTPUT で ID を返す
      mockQuery.mockResolvedValueOnce({ recordset: [{ indirect_work_case_id: 1 }] })
      // findById の結果
      mockQuery.mockResolvedValueOnce({ recordset: [sampleRow] })

      const result = await indirectWorkCaseData.create({
        caseName: '標準ケース',
        isPrimary: true,
        description: '間接作業の標準工数計画',
        businessUnitCode: 'plant',
      })

      expect(result).toEqual(sampleRow)
      expect(mockInput).toHaveBeenCalledWith('caseName', expect.anything(), '標準ケース')
      expect(mockInput).toHaveBeenCalledWith('isPrimary', expect.anything(), true)
      expect(mockInput).toHaveBeenCalledWith('description', expect.anything(), '間接作業の標準工数計画')
      expect(mockInput).toHaveBeenCalledWith('businessUnitCode', expect.anything(), 'plant')
    })
  })

  describe('update', () => {
    test('指定フィールドのみ更新して findById で完全な行を返す', async () => {
      const updatedRow = { ...sampleRow, case_name: '更新後ケース' }
      // UPDATE の OUTPUT で ID を返す
      mockQuery.mockResolvedValueOnce({ recordset: [{ indirect_work_case_id: 1 }] })
      // findById の結果
      mockQuery.mockResolvedValueOnce({ recordset: [updatedRow] })

      const result = await indirectWorkCaseData.update(1, {
        caseName: '更新後ケース',
      })

      expect(result).toEqual(updatedRow)
      expect(mockInput).toHaveBeenCalledWith('id', expect.anything(), 1)
      expect(mockInput).toHaveBeenCalledWith('caseName', expect.anything(), '更新後ケース')
    })

    test('複数フィールドを更新する', async () => {
      // UPDATE の OUTPUT で ID を返す
      mockQuery.mockResolvedValueOnce({ recordset: [{ indirect_work_case_id: 1 }] })
      // findById の結果
      mockQuery.mockResolvedValueOnce({ recordset: [sampleRow] })

      await indirectWorkCaseData.update(1, {
        caseName: '更新ケース',
        isPrimary: false,
        description: '更新説明',
        businessUnitCode: 'energy',
      })

      expect(mockInput).toHaveBeenCalledWith('caseName', expect.anything(), '更新ケース')
      expect(mockInput).toHaveBeenCalledWith('isPrimary', expect.anything(), false)
      expect(mockInput).toHaveBeenCalledWith('description', expect.anything(), '更新説明')
      expect(mockInput).toHaveBeenCalledWith('businessUnitCode', expect.anything(), 'energy')
    })

    test('存在しないレコードの場合は undefined を返す', async () => {
      mockQuery.mockResolvedValueOnce({ recordset: [] })

      const result = await indirectWorkCaseData.update(999, {
        caseName: '更新テスト',
      })

      expect(result).toBeUndefined()
    })
  })

  describe('softDelete', () => {
    test('レコードを論理削除して結果を返す', async () => {
      const deletedResult = { ...sampleRow, deleted_at: new Date() }
      mockQuery.mockResolvedValueOnce({ recordset: [deletedResult] })

      const result = await indirectWorkCaseData.softDelete(1)

      expect(result).toEqual(deletedResult)
      expect(mockInput).toHaveBeenCalledWith('id', expect.anything(), 1)
    })

    test('存在しない/既に削除済みのレコードの場合は undefined を返す', async () => {
      mockQuery.mockResolvedValueOnce({ recordset: [] })

      const result = await indirectWorkCaseData.softDelete(999)

      expect(result).toBeUndefined()
    })
  })

  describe('restore', () => {
    test('論理削除済みレコードを復元して findById で完全な行を返す', async () => {
      const restoredRow = { ...sampleRow, deleted_at: null }
      // restore の OUTPUT
      mockQuery.mockResolvedValueOnce({ recordset: [restoredRow] })
      // findById の結果
      mockQuery.mockResolvedValueOnce({ recordset: [restoredRow] })

      const result = await indirectWorkCaseData.restore(2)

      expect(result).toEqual(restoredRow)
      expect(mockInput).toHaveBeenCalledWith('id', expect.anything(), 2)
    })

    test('存在しない/削除されていないレコードの場合は undefined を返す', async () => {
      mockQuery.mockResolvedValueOnce({ recordset: [] })

      const result = await indirectWorkCaseData.restore(999)

      expect(result).toBeUndefined()
    })
  })

  describe('hasReferences', () => {
    test('参照が存在する場合は true を返す', async () => {
      mockQuery.mockResolvedValueOnce({ recordset: [{ hasRef: true }] })

      const result = await indirectWorkCaseData.hasReferences(1)

      expect(result).toBe(true)
      expect(mockInput).toHaveBeenCalledWith('id', expect.anything(), 1)
    })

    test('参照が存在しない場合は false を返す', async () => {
      mockQuery.mockResolvedValueOnce({ recordset: [{ hasRef: false }] })

      const result = await indirectWorkCaseData.hasReferences(1)

      expect(result).toBe(false)
    })
  })
})
