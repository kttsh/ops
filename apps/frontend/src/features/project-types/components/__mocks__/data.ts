import type { ProjectType } from '@/features/project-types/types'

export const mockProjectType = {
  projectTypeCode: 'PT001',
  name: '設計',
  displayOrder: 1,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
} satisfies ProjectType

export const mockProjectTypes: ProjectType[] = [
  mockProjectType,
  {
    projectTypeCode: 'PT002',
    name: '施工管理',
    displayOrder: 2,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    projectTypeCode: 'PT003',
    name: 'コンサルティング',
    displayOrder: 3,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    deletedAt: '2025-06-01T00:00:00Z',
  },
]

export const generateMockProjectTypes = (count: number): ProjectType[] =>
  Array.from({ length: count }, (_, i) => ({
    projectTypeCode: `PT${String(i + 1).padStart(3, '0')}`,
    name: `案件タイプ${i + 1}`,
    displayOrder: i + 1,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  }))
