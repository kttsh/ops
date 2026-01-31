import { describe, test, expect } from 'vitest'
import { toProjectTypeResponse } from '@/transform/projectTypeTransform'
import type { ProjectTypeRow } from '@/types/projectType'

describe('projectTypeTransform', () => {
  describe('toProjectTypeResponse', () => {
    test('snake_case の DB 行を camelCase の API レスポンス形式に変換する', () => {
      const row: ProjectTypeRow = {
        project_type_code: 'PT-001',
        name: '案件タイプ1',
        display_order: 1,
        created_at: new Date('2026-01-01T00:00:00Z'),
        updated_at: new Date('2026-01-15T00:00:00Z'),
        deleted_at: null,
      }

      const result = toProjectTypeResponse(row)

      expect(result).toEqual({
        projectTypeCode: 'PT-001',
        name: '案件タイプ1',
        displayOrder: 1,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-15T00:00:00.000Z',
      })
    })

    test('Date 型を ISO 8601 文字列に変換する', () => {
      const row: ProjectTypeRow = {
        project_type_code: 'PT-002',
        name: 'テスト',
        display_order: 0,
        created_at: new Date('2026-06-15T09:30:00Z'),
        updated_at: new Date('2026-06-15T10:00:00Z'),
        deleted_at: null,
      }

      const result = toProjectTypeResponse(row)

      expect(result.createdAt).toBe('2026-06-15T09:30:00.000Z')
      expect(result.updatedAt).toBe('2026-06-15T10:00:00.000Z')
    })

    test('deleted_at フィールドがレスポンスに含まれない', () => {
      const row: ProjectTypeRow = {
        project_type_code: 'PT-003',
        name: '削除済み',
        display_order: 5,
        created_at: new Date('2026-01-01T00:00:00Z'),
        updated_at: new Date('2026-01-10T00:00:00Z'),
        deleted_at: new Date('2026-01-10T00:00:00Z'),
      }

      const result = toProjectTypeResponse(row)

      expect(result).not.toHaveProperty('deletedAt')
      expect(result).not.toHaveProperty('deleted_at')
    })

    test('displayOrder が 0 の場合も正しく変換する', () => {
      const row: ProjectTypeRow = {
        project_type_code: 'PT-004',
        name: 'デフォルト順',
        display_order: 0,
        created_at: new Date('2026-01-01T00:00:00Z'),
        updated_at: new Date('2026-01-01T00:00:00Z'),
        deleted_at: null,
      }

      const result = toProjectTypeResponse(row)

      expect(result.displayOrder).toBe(0)
    })
  })
})
