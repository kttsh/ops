import type { WorkType } from '@/features/work-types/types'

export const mockWorkType = {
  workTypeCode: 'WT001',
  name: '基本設計',
  displayOrder: 1,
  color: '#3b82f6',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
} satisfies WorkType

export const mockWorkTypes: WorkType[] = [
  mockWorkType,
  {
    workTypeCode: 'WT002',
    name: '詳細設計',
    displayOrder: 2,
    color: '#10b981',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    workTypeCode: 'WT003',
    name: 'テスト・検証',
    displayOrder: 3,
    color: '#f59e0b',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    deletedAt: '2025-06-01T00:00:00Z',
  },
]

export const generateMockWorkTypes = (count: number): WorkType[] =>
  Array.from({ length: count }, (_, i) => ({
    workTypeCode: `WT${String(i + 1).padStart(3, '0')}`,
    name: `作業種類${i + 1}`,
    displayOrder: i + 1,
    color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  }))
