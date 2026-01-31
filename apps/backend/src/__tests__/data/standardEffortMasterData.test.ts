import { describe, test, expect, vi, beforeEach } from 'vitest'
import type {
  StandardEffortMasterRow,
  StandardEffortWeightRow,
} from '@/types/standardEffortMaster'

// mssql のモック
const mockQuery = vi.fn()
const mockInput = vi.fn().mockReturnThis()
const mockRequest = vi.fn(() => ({
  input: mockInput,
  query: mockQuery,
}))

// トランザクションのモック
const mockTxQuery = vi.fn()
const mockTxInput = vi.fn()
const mockTxRequest = vi.fn()
const mockTxBegin = vi.fn()
const mockTxCommit = vi.fn()
const mockTxRollback = vi.fn()

vi.mock('mssql', () => {
  function Transaction() {
    return {
      begin: mockTxBegin,
      commit: mockTxCommit,
      rollback: mockTxRollback,
      request: mockTxRequest,
    }
  }
  return {
    default: {
      Transaction,
      Int: 'Int',
      VarChar: 'VarChar',
      NVarChar: 'NVarChar',
    },
  }
})

vi.mock('@/database/client', () => ({
  getPool: vi.fn().mockResolvedValue({
    request: mockRequest,
  }),
}))

const sampleRow: StandardEffortMasterRow = {
  standard_effort_id: 1,
  business_unit_code: 'BU-001',
  project_type_code: 'PT-001',
  name: 'Sカーブパターン',
  created_at: new Date('2026-01-01T00:00:00Z'),
  updated_at: new Date('2026-01-01T00:00:00Z'),
  deleted_at: null,
}

const deletedRow: StandardEffortMasterRow = {
  ...sampleRow,
  standard_effort_id: 2,
  name: '削除済みパターン',
  deleted_at: new Date('2026-01-15T00:00:00Z'),
}

const sampleWeightRows: StandardEffortWeightRow[] = [
  {
    standard_effort_weight_id: 1,
    standard_effort_id: 1,
    progress_rate: 0,
    weight: 0,
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
  },
  {
    standard_effort_weight_id: 2,
    standard_effort_id: 1,
    progress_rate: 50,
    weight: 10,
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
  },
]

describe('standardEffortMasterData', () => {
  let standardEffortMasterData: typeof import('@/data/standardEffortMasterData').standardEffortMasterData

  beforeEach(async () => {
    vi.clearAllMocks()
    mockInput.mockReturnThis()
    mockTxInput.mockReturnThis()
    mockTxRequest.mockReturnValue({
      input: mockTxInput,
      query: mockTxQuery,
    })
    mockTxBegin.mockResolvedValue(undefined)
    mockTxCommit.mockResolvedValue(undefined)
    mockTxRollback.mockResolvedValue(undefined)
    const mod = await import('@/data/standardEffortMasterData')
    standardEffortMasterData = mod.standardEffortMasterData
  })

  describe('findAll', () => {
    test('論理削除されていないレコードをページネーション付きで取得する', async () => {
      mockQuery
        .mockResolvedValueOnce({ recordset: [sampleRow] })
        .mockResolvedValueOnce({ recordset: [{ totalCount: 1 }] })

      const result = await standardEffortMasterData.findAll({
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

      const result = await standardEffortMasterData.findAll({
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

      await standardEffortMasterData.findAll({
        page: 2,
        pageSize: 10,
        includeDisabled: false,
      })

      expect(mockInput).toHaveBeenCalledWith('offset', expect.anything(), 10)
      expect(mockInput).toHaveBeenCalledWith('pageSize', expect.anything(), 10)
    })

    test('businessUnitCode でフィルタリングする', async () => {
      mockQuery
        .mockResolvedValueOnce({ recordset: [sampleRow] })
        .mockResolvedValueOnce({ recordset: [{ totalCount: 1 }] })

      await standardEffortMasterData.findAll({
        page: 1,
        pageSize: 20,
        includeDisabled: false,
        businessUnitCode: 'BU-001',
      })

      expect(mockInput).toHaveBeenCalledWith('businessUnitCode', expect.anything(), 'BU-001')
    })

    test('projectTypeCode でフィルタリングする', async () => {
      mockQuery
        .mockResolvedValueOnce({ recordset: [sampleRow] })
        .mockResolvedValueOnce({ recordset: [{ totalCount: 1 }] })

      await standardEffortMasterData.findAll({
        page: 1,
        pageSize: 20,
        includeDisabled: false,
        projectTypeCode: 'PT-001',
      })

      expect(mockInput).toHaveBeenCalledWith('projectTypeCode', expect.anything(), 'PT-001')
    })
  })

  describe('findById', () => {
    test('指定 ID のアクティブなレコードを返す', async () => {
      mockQuery.mockResolvedValueOnce({ recordset: [sampleRow] })

      const result = await standardEffortMasterData.findById(1)

      expect(result).toEqual(sampleRow)
      expect(mockInput).toHaveBeenCalledWith('id', expect.anything(), 1)
    })

    test('存在しない場合は undefined を返す', async () => {
      mockQuery.mockResolvedValueOnce({ recordset: [] })

      const result = await standardEffortMasterData.findById(999)

      expect(result).toBeUndefined()
    })
  })

  describe('findByIdIncludingDeleted', () => {
    test('論理削除済みのレコードも含めて返す', async () => {
      mockQuery.mockResolvedValueOnce({ recordset: [deletedRow] })

      const result = await standardEffortMasterData.findByIdIncludingDeleted(2)

      expect(result).toEqual(deletedRow)
      expect(mockInput).toHaveBeenCalledWith('id', expect.anything(), 2)
    })

    test('存在しない場合は undefined を返す', async () => {
      mockQuery.mockResolvedValueOnce({ recordset: [] })

      const result = await standardEffortMasterData.findByIdIncludingDeleted(999)

      expect(result).toBeUndefined()
    })
  })

  describe('findByCompositeKey', () => {
    test('複合キーで一致するレコードを返す', async () => {
      mockQuery.mockResolvedValueOnce({ recordset: [sampleRow] })

      const result = await standardEffortMasterData.findByCompositeKey(
        'BU-001',
        'PT-001',
        'Sカーブパターン',
      )

      expect(result).toEqual(sampleRow)
      expect(mockInput).toHaveBeenCalledWith('businessUnitCode', expect.anything(), 'BU-001')
      expect(mockInput).toHaveBeenCalledWith('projectTypeCode', expect.anything(), 'PT-001')
      expect(mockInput).toHaveBeenCalledWith('name', expect.anything(), 'Sカーブパターン')
    })

    test('一致しない場合は undefined を返す', async () => {
      mockQuery.mockResolvedValueOnce({ recordset: [] })

      const result = await standardEffortMasterData.findByCompositeKey(
        'BU-999',
        'PT-999',
        '存在しない',
      )

      expect(result).toBeUndefined()
    })
  })

  describe('findWeightsByMasterId', () => {
    test('マスタ ID に紐づく重みレコードを返す', async () => {
      mockQuery.mockResolvedValueOnce({ recordset: sampleWeightRows })

      const result = await standardEffortMasterData.findWeightsByMasterId(1)

      expect(result).toEqual(sampleWeightRows)
      expect(mockInput).toHaveBeenCalledWith('masterId', expect.anything(), 1)
    })

    test('重みがない場合は空配列を返す', async () => {
      mockQuery.mockResolvedValueOnce({ recordset: [] })

      const result = await standardEffortMasterData.findWeightsByMasterId(999)

      expect(result).toEqual([])
    })
  })

  describe('create', () => {
    test('トランザクションでマスタと重みを作成する', async () => {
      mockTxQuery.mockResolvedValueOnce({ recordset: [{ standard_effort_id: 1 }] })
      mockTxQuery.mockResolvedValue({ recordset: [] })
      // findById の呼び出し用
      mockQuery.mockResolvedValueOnce({ recordset: [sampleRow] })

      const result = await standardEffortMasterData.create({
        businessUnitCode: 'BU-001',
        projectTypeCode: 'PT-001',
        name: 'Sカーブパターン',
        weights: [
          { progressRate: 0, weight: 0 },
          { progressRate: 50, weight: 10 },
        ],
      })

      expect(result).toEqual(sampleRow)
      expect(mockTxBegin).toHaveBeenCalled()
      expect(mockTxCommit).toHaveBeenCalled()
      expect(mockTxRollback).not.toHaveBeenCalled()
    })

    test('weights なしでもマスタを作成する', async () => {
      mockTxQuery.mockResolvedValueOnce({ recordset: [{ standard_effort_id: 1 }] })
      mockQuery.mockResolvedValueOnce({ recordset: [sampleRow] })

      const result = await standardEffortMasterData.create({
        businessUnitCode: 'BU-001',
        projectTypeCode: 'PT-001',
        name: 'Sカーブパターン',
      })

      expect(result).toEqual(sampleRow)
      expect(mockTxBegin).toHaveBeenCalled()
      expect(mockTxCommit).toHaveBeenCalled()
    })

    test('エラー時にロールバックする', async () => {
      mockTxQuery.mockRejectedValueOnce(new Error('DB error'))

      await expect(
        standardEffortMasterData.create({
          businessUnitCode: 'BU-001',
          projectTypeCode: 'PT-001',
          name: 'テスト',
        }),
      ).rejects.toThrow('DB error')

      expect(mockTxBegin).toHaveBeenCalled()
      expect(mockTxRollback).toHaveBeenCalled()
      expect(mockTxCommit).not.toHaveBeenCalled()
    })
  })

  describe('update', () => {
    test('name のみ更新する場合はトランザクションを使用しない', async () => {
      mockQuery
        .mockResolvedValueOnce({ recordset: [] }) // UPDATE
        .mockResolvedValueOnce({ recordset: [sampleRow] }) // findById

      const result = await standardEffortMasterData.update(1, { name: '更新名' })

      expect(result).toEqual(sampleRow)
      expect(mockTxBegin).not.toHaveBeenCalled()
      expect(mockInput).toHaveBeenCalledWith('name', expect.anything(), '更新名')
    })

    test('weights を含む更新はトランザクションを使用する', async () => {
      mockTxQuery.mockResolvedValue({ recordset: [] })
      mockQuery.mockResolvedValueOnce({ recordset: [sampleRow] })

      const result = await standardEffortMasterData.update(1, {
        weights: [{ progressRate: 0, weight: 5 }],
      })

      expect(result).toEqual(sampleRow)
      expect(mockTxBegin).toHaveBeenCalled()
      expect(mockTxCommit).toHaveBeenCalled()
    })

    test('name と weights の両方を更新する場合はトランザクションを使用する', async () => {
      mockTxQuery.mockResolvedValue({ recordset: [] })
      mockQuery.mockResolvedValueOnce({ recordset: [sampleRow] })

      await standardEffortMasterData.update(1, {
        name: '更新名',
        weights: [{ progressRate: 50, weight: 10 }],
      })

      expect(mockTxBegin).toHaveBeenCalled()
      expect(mockTxCommit).toHaveBeenCalled()
    })

    test('name も weights も未指定の場合は現在のレコードを返す', async () => {
      mockQuery.mockResolvedValueOnce({ recordset: [sampleRow] })

      const result = await standardEffortMasterData.update(1, {})

      expect(result).toEqual(sampleRow)
      expect(mockTxBegin).not.toHaveBeenCalled()
    })

    test('weights 更新中にエラーが発生したらロールバックする', async () => {
      mockTxQuery
        .mockResolvedValueOnce({ recordset: [] }) // UPDATE master
        .mockRejectedValueOnce(new Error('DB error')) // DELETE weights

      await expect(
        standardEffortMasterData.update(1, {
          weights: [{ progressRate: 0, weight: 0 }],
        }),
      ).rejects.toThrow('DB error')

      expect(mockTxRollback).toHaveBeenCalled()
    })
  })

  describe('softDelete', () => {
    test('レコードを論理削除して結果を返す', async () => {
      const deletedResult = { ...sampleRow, deleted_at: new Date() }
      mockQuery.mockResolvedValueOnce({ recordset: [deletedResult] })

      const result = await standardEffortMasterData.softDelete(1)

      expect(result).toEqual(deletedResult)
      expect(mockInput).toHaveBeenCalledWith('id', expect.anything(), 1)
    })

    test('存在しない/既に削除済みの場合は undefined を返す', async () => {
      mockQuery.mockResolvedValueOnce({ recordset: [] })

      const result = await standardEffortMasterData.softDelete(999)

      expect(result).toBeUndefined()
    })
  })

  describe('restore', () => {
    test('論理削除済みレコードを復元して結果を返す', async () => {
      const restoredRow = { ...sampleRow, deleted_at: null }
      mockQuery.mockResolvedValueOnce({ recordset: [restoredRow] })

      const result = await standardEffortMasterData.restore(1)

      expect(result).toEqual(restoredRow)
      expect(mockInput).toHaveBeenCalledWith('id', expect.anything(), 1)
    })

    test('存在しない/削除されていない場合は undefined を返す', async () => {
      mockQuery.mockResolvedValueOnce({ recordset: [] })

      const result = await standardEffortMasterData.restore(999)

      expect(result).toBeUndefined()
    })
  })

  describe('hasReferences', () => {
    test('参照が存在する場合は true を返す', async () => {
      mockQuery.mockResolvedValueOnce({ recordset: [{ hasRef: true }] })

      const result = await standardEffortMasterData.hasReferences(1)

      expect(result).toBe(true)
      expect(mockInput).toHaveBeenCalledWith('id', expect.anything(), 1)
    })

    test('参照が存在しない場合は false を返す', async () => {
      mockQuery.mockResolvedValueOnce({ recordset: [{ hasRef: false }] })

      const result = await standardEffortMasterData.hasReferences(1)

      expect(result).toBe(false)
    })
  })
})
