import type {
  ProjectCase,
  ProjectLoad,
  StandardEffortMaster,
  StandardEffortMasterDetail,
} from '@/features/case-study/types'

export const mockProjectCase = {
  projectCaseId: 1,
  projectId: 1,
  caseName: '標準ケース',
  isPrimary: true,
  description: 'メインの工数見積りケース',
  calculationType: 'STANDARD' as const,
  standardEffortId: 1,
  startYearMonth: '202504',
  durationMonths: 24,
  totalManhour: 12000,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  projectName: 'A工場建設プロジェクト',
  standardEffortName: '設計標準工数パターンA',
} satisfies ProjectCase

export const mockProjectCases: ProjectCase[] = [
  mockProjectCase,
  {
    projectCaseId: 2,
    projectId: 1,
    caseName: '楽観ケース',
    isPrimary: false,
    description: '楽観的な工数見積り',
    calculationType: 'MANUAL' as const,
    standardEffortId: null,
    startYearMonth: '202504',
    durationMonths: 18,
    totalManhour: 9000,
    createdAt: '2025-01-15T00:00:00Z',
    updatedAt: '2025-01-15T00:00:00Z',
    projectName: 'A工場建設プロジェクト',
    standardEffortName: null,
  },
]

export const mockProjectLoads: ProjectLoad[] = Array.from(
  { length: 12 },
  (_, i) => ({
    projectLoadId: i + 1,
    projectCaseId: 1,
    yearMonth: `2025${String(i + 4).padStart(2, '0')}`,
    manhour: 500 + Math.round(Math.random() * 500),
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  }),
)

export const mockStandardEffortMasters: StandardEffortMaster[] = [
  {
    standardEffortId: 1,
    businessUnitCode: 'BU001',
    projectTypeCode: 'PT001',
    name: '設計標準工数パターンA',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    standardEffortId: 2,
    businessUnitCode: 'BU001',
    projectTypeCode: 'PT001',
    name: '設計標準工数パターンB',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
]

export const mockStandardEffortDetail = {
  ...mockStandardEffortMasters[0],
  weights: [
    { standardEffortWeightId: 1, progressRate: 0, weight: 0.05 },
    { standardEffortWeightId: 2, progressRate: 10, weight: 0.08 },
    { standardEffortWeightId: 3, progressRate: 20, weight: 0.12 },
    { standardEffortWeightId: 4, progressRate: 30, weight: 0.15 },
    { standardEffortWeightId: 5, progressRate: 40, weight: 0.13 },
    { standardEffortWeightId: 6, progressRate: 50, weight: 0.12 },
    { standardEffortWeightId: 7, progressRate: 60, weight: 0.1 },
    { standardEffortWeightId: 8, progressRate: 70, weight: 0.08 },
    { standardEffortWeightId: 9, progressRate: 80, weight: 0.07 },
    { standardEffortWeightId: 10, progressRate: 90, weight: 0.05 },
    { standardEffortWeightId: 11, progressRate: 100, weight: 0.05 },
  ],
} satisfies StandardEffortMasterDetail
