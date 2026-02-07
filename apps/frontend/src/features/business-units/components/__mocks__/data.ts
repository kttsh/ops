import type { BusinessUnit } from '@/features/business-units/types'

export const mockBusinessUnit = {
  businessUnitCode: 'BU001',
  name: 'エンジニアリング事業部',
  displayOrder: 1,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
} satisfies BusinessUnit

export const mockBusinessUnits: BusinessUnit[] = [
  mockBusinessUnit,
  {
    businessUnitCode: 'BU002',
    name: 'プラント事業部',
    displayOrder: 2,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    businessUnitCode: 'BU003',
    name: '環境事業部',
    displayOrder: 3,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    deletedAt: '2025-06-01T00:00:00Z',
  },
  {
    businessUnitCode: 'BU004',
    name: 'インフラ事業部',
    displayOrder: 4,
    createdAt: '2025-02-01T00:00:00Z',
    updatedAt: '2025-02-01T00:00:00Z',
  },
]

export const generateMockBusinessUnits = (count: number): BusinessUnit[] =>
  Array.from({ length: count }, (_, i) => ({
    businessUnitCode: `BU${String(i + 1).padStart(3, '0')}`,
    name: `事業部${i + 1}`,
    displayOrder: i + 1,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  }))
