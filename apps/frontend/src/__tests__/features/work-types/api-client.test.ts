import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  fetchWorkTypes,
  fetchWorkType,
  createWorkType,
  updateWorkType,
  deleteWorkType,
  restoreWorkType,
  ApiError,
} from '@/features/work-types/api/api-client'

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

beforeEach(() => {
  mockFetch.mockReset()
})

describe('fetchWorkTypes', () => {
  it('正常に作業種類一覧を取得する', async () => {
    const mockData = {
      data: [{ workTypeCode: 'WT-001', name: 'テスト', displayOrder: 0, color: '#FF0000', createdAt: '2024-01-01', updatedAt: '2024-01-01' }],
      meta: { pagination: { currentPage: 1, pageSize: 20, totalItems: 1, totalPages: 1 } },
    }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockData,
    })

    const result = await fetchWorkTypes({ includeDisabled: false })
    expect(result).toEqual(mockData)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/work-types'),
    )
  })

  it('includeDisabledパラメータを送信する', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: [], meta: { pagination: {} } }),
    })

    await fetchWorkTypes({ includeDisabled: true })
    const url = mockFetch.mock.calls[0][0] as string
    expect(url).toContain('filter%5BincludeDisabled%5D=true')
  })

  it('includeDisabled=falseの場合クエリパラメータなし', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: [], meta: { pagination: {} } }),
    })

    await fetchWorkTypes({ includeDisabled: false })
    const url = mockFetch.mock.calls[0][0] as string
    expect(url).not.toContain('filter')
  })

  it('エラーレスポンスでApiErrorをthrowする', async () => {
    const problemDetails = {
      type: 'about:blank',
      status: 422,
      title: 'Validation Error',
      detail: 'バリデーションエラー',
    }
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => problemDetails,
    })

    await expect(fetchWorkTypes({ includeDisabled: false })).rejects.toThrow(ApiError)
  })
})

describe('fetchWorkType', () => {
  it('正常に単一の作業種類を取得する', async () => {
    const mockData = {
      data: { workTypeCode: 'WT-001', name: 'テスト', displayOrder: 0, color: null, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
    }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockData,
    })

    const result = await fetchWorkType('WT-001')
    expect(result).toEqual(mockData)
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/work-types/WT-001'))
  })

  it('404エラーでApiErrorをthrowする', async () => {
    const problemDetails = {
      type: 'about:blank',
      status: 404,
      title: 'Not Found',
      detail: '作業種類が見つかりません',
    }
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => problemDetails,
    })

    try {
      await fetchWorkType('NONEXISTENT')
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError)
      expect((err as ApiError).problemDetails.status).toBe(404)
    }
  })
})

describe('createWorkType', () => {
  it('正常に作業種類を作成する', async () => {
    const mockData = {
      data: { workTypeCode: 'WT-NEW', name: '新規', displayOrder: 0, color: '#00FF00', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
    }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => mockData,
    })

    const result = await createWorkType({
      workTypeCode: 'WT-NEW',
      name: '新規',
      displayOrder: 0,
      color: '#00FF00',
    })
    expect(result).toEqual(mockData)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/work-types'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    )
  })

  it('409 ConflictでApiErrorをthrowする', async () => {
    const problemDetails = {
      type: 'about:blank',
      status: 409,
      title: 'Conflict',
      detail: '同一コードが存在します',
    }
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => problemDetails,
    })

    try {
      await createWorkType({ workTypeCode: 'WT-EXISTING', name: '重複', displayOrder: 0 })
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError)
      expect((err as ApiError).problemDetails.status).toBe(409)
    }
  })
})

describe('updateWorkType', () => {
  it('正常に作業種類を更新する', async () => {
    const mockData = {
      data: { workTypeCode: 'WT-001', name: '更新済み', displayOrder: 5, color: '#0000FF', createdAt: '2024-01-01', updatedAt: '2024-01-02' },
    }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockData,
    })

    const result = await updateWorkType('WT-001', { name: '更新済み', displayOrder: 5, color: '#0000FF' })
    expect(result).toEqual(mockData)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/work-types/WT-001'),
      expect.objectContaining({ method: 'PUT' }),
    )
  })
})

describe('deleteWorkType', () => {
  it('正常に作業種類を削除する', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
    })

    await expect(deleteWorkType('WT-001')).resolves.toBeUndefined()
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/work-types/WT-001'),
      expect.objectContaining({ method: 'DELETE' }),
    )
  })
})

describe('restoreWorkType', () => {
  it('正常に作業種類を復元する', async () => {
    const mockData = {
      data: { workTypeCode: 'WT-001', name: 'テスト', displayOrder: 0, color: null, createdAt: '2024-01-01', updatedAt: '2024-01-03' },
    }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockData,
    })

    const result = await restoreWorkType('WT-001')
    expect(result).toEqual(mockData)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/work-types/WT-001/actions/restore'),
      expect.objectContaining({ method: 'POST' }),
    )
  })
})
