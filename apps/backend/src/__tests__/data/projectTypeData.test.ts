import { describe, test, expect, vi, beforeEach } from 'vitest'
import type { ProjectTypeRow } from '@/types/projectType'

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
const sampleRow: ProjectTypeRow = {
  project_type_code: 'PT-001',
  name: '案件タイプ1',
  display_order: 1,
  created_at: new Date('2026-01-01T00:00:00Z'),
  updated_at: new Date('2026-01-01T00:00:00Z'),
  deleted_at: null,
}

const deletedRow: ProjectTypeRow = {
  ...sampleRow,
  project_type_code: 'PT-002',
  name: '案件タイプ2（削除済み）',
  deleted_at: new Date('2026-01-15T00:00:00Z'),
}

describe('projectTypeData', () => {
  let projectTypeData: typeof import('@/data/projectTypeData').projectTypeData

  beforeEach(async () => {
    vi.clearAllMocks()
    mockInput.mockReturnThis()
    const mod = await import('@/data/projectTypeData')
    projectTypeData = mod.projectTypeData
  })

  describe('findAll', () => {
    test('論理削除されていないレコードをページネーション付きで取得する', async () => {
      mockQuery
        .mockResolvedValueOnce({ recordset: [sampleRow] })
        .mockResolvedValueOnce({ recordset: [{ totalCount: 1 }] })

      const result = await projectTypeData.findAll({
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

      const result = await projectTypeData.findAll({
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

      await projectTypeData.findAll({
        page: 2,
        pageSize: 10,
        includeDisabled: false,
      })

      expect(mockInput).toHaveBeenCalledWith('offset', expect.anything(), 10)
      expect(mockInput).toHaveBeenCalledWith('pageSize', expect.anything(), 10)
    })
  })

  describe('findByCode', () => {
    test('指定コードのアクティブなレコードを返す', async () => {
      mockQuery.mockResolvedValueOnce({ recordset: [sampleRow] })

      const result = await projectTypeData.findByCode('PT-001')

      expect(result).toEqual(sampleRow)
      expect(mockInput).toHaveBeenCalledWith('code', expect.anything(), 'PT-001')
    })

    test('存在しない場合は undefined を返す', async () => {
      mockQuery.mockResolvedValueOnce({ recordset: [] })

      const result = await projectTypeData.findByCode('NON-EXISTENT')

      expect(result).toBeUndefined()
    })
  })

  describe('findByCodeIncludingDeleted', () => {
    test('論理削除済みのレコードも含めて返す', async () => {
      mockQuery.mockResolvedValueOnce({ recordset: [deletedRow] })

      const result = await projectTypeData.findByCodeIncludingDeleted('PT-002')

      expect(result).toEqual(deletedRow)
      expect(mockInput).toHaveBeenCalledWith('code', expect.anything(), 'PT-002')
    })

    test('存在しない場合は undefined を返す', async () => {
      mockQuery.mockResolvedValueOnce({ recordset: [] })

      const result = await projectTypeData.findByCodeIncludingDeleted('NON-EXISTENT')

      expect(result).toBeUndefined()
    })
  })

  describe('create', () => {
    test('新規レコードを作成して作成結果を返す', async () => {
      mockQuery.mockResolvedValueOnce({ recordset: [sampleRow] })

      const result = await projectTypeData.create({
        projectTypeCode: 'PT-001',
        name: '案件タイプ1',
        displayOrder: 1,
      })

      expect(result).toEqual(sampleRow)
      expect(mockInput).toHaveBeenCalledWith('projectTypeCode', expect.anything(), 'PT-001')
      expect(mockInput).toHaveBeenCalledWith('name', expect.anything(), '案件タイプ1')
      expect(mockInput).toHaveBeenCalledWith('displayOrder', expect.anything(), 1)
    })
  })

  describe('update', () => {
    test('レコードを更新して更新結果を返す', async () => {
      const updatedRow = { ...sampleRow, name: '更新後の名前' }
      mockQuery.mockResolvedValueOnce({ recordset: [updatedRow] })

      const result = await projectTypeData.update('PT-001', {
        name: '更新後の名前',
        displayOrder: 2,
      })

      expect(result).toEqual(updatedRow)
      expect(mockInput).toHaveBeenCalledWith('code', expect.anything(), 'PT-001')
      expect(mockInput).toHaveBeenCalledWith('name', expect.anything(), '更新後の名前')
      expect(mockInput).toHaveBeenCalledWith('displayOrder', expect.anything(), 2)
    })

    test('displayOrder が未指定の場合、name のみ更新する', async () => {
      const updatedRow = { ...sampleRow, name: '名前のみ更新' }
      mockQuery.mockResolvedValueOnce({ recordset: [updatedRow] })

      const result = await projectTypeData.update('PT-001', {
        name: '名前のみ更新',
      })

      expect(result).toEqual(updatedRow)
    })

    test('存在しないレコードの場合は undefined を返す', async () => {
      mockQuery.mockResolvedValueOnce({ recordset: [] })

      const result = await projectTypeData.update('NON-EXISTENT', {
        name: '更新テスト',
      })

      expect(result).toBeUndefined()
    })
  })

  describe('softDelete', () => {
    test('レコードを論理削除して結果を返す', async () => {
      const deletedResult = { ...sampleRow, deleted_at: new Date() }
      mockQuery.mockResolvedValueOnce({ recordset: [deletedResult] })

      const result = await projectTypeData.softDelete('PT-001')

      expect(result).toEqual(deletedResult)
      expect(mockInput).toHaveBeenCalledWith('code', expect.anything(), 'PT-001')
    })

    test('存在しない/既に削除済みのレコードの場合は undefined を返す', async () => {
      mockQuery.mockResolvedValueOnce({ recordset: [] })

      const result = await projectTypeData.softDelete('NON-EXISTENT')

      expect(result).toBeUndefined()
    })
  })

  describe('restore', () => {
    test('論理削除済みレコードを復元して結果を返す', async () => {
      const restoredRow = { ...sampleRow, deleted_at: null }
      mockQuery.mockResolvedValueOnce({ recordset: [restoredRow] })

      const result = await projectTypeData.restore('PT-002')

      expect(result).toEqual(restoredRow)
      expect(mockInput).toHaveBeenCalledWith('code', expect.anything(), 'PT-002')
    })

    test('存在しない/削除されていないレコードの場合は undefined を返す', async () => {
      mockQuery.mockResolvedValueOnce({ recordset: [] })

      const result = await projectTypeData.restore('NON-EXISTENT')

      expect(result).toBeUndefined()
    })
  })

  describe('hasReferences', () => {
    test('参照が存在する場合は true を返す', async () => {
      mockQuery.mockResolvedValueOnce({ recordset: [{ hasRef: true }] })

      const result = await projectTypeData.hasReferences('PT-001')

      expect(result).toBe(true)
      expect(mockInput).toHaveBeenCalledWith('code', expect.anything(), 'PT-001')
    })

    test('参照が存在しない場合は false を返す', async () => {
      mockQuery.mockResolvedValueOnce({ recordset: [{ hasRef: false }] })

      const result = await projectTypeData.hasReferences('PT-001')

      expect(result).toBe(false)
    })
  })
})
