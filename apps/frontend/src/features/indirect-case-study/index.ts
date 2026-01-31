// Types
export type {
  HeadcountPlanCase,
  MonthlyHeadcountPlan,
  CapacityScenario,
  MonthlyCapacity,
  CalculateCapacityResult,
  IndirectWorkCase,
  IndirectWorkTypeRatio,
  MonthlyIndirectWorkLoad,
  IndirectWorkCalcResult,
  CalculationTableData,
  PaginatedResponse,
  SingleResponse,
} from './types'

export {
  createHeadcountPlanCaseSchema,
  updateHeadcountPlanCaseSchema,
  createCapacityScenarioSchema,
  updateCapacityScenarioSchema,
  createIndirectWorkCaseSchema,
  updateIndirectWorkCaseSchema,
} from './types'

// Queries
export {
  indirectCaseStudyKeys,
  headcountPlanCasesQueryOptions,
  monthlyHeadcountPlansQueryOptions,
  capacityScenariosQueryOptions,
  indirectWorkCasesQueryOptions,
  indirectWorkTypeRatiosQueryOptions,
} from './api/queries'

// Mutations
export {
  useCreateHeadcountPlanCase,
  useUpdateHeadcountPlanCase,
  useDeleteHeadcountPlanCase,
  useRestoreHeadcountPlanCase,
  useBulkUpdateMonthlyHeadcountPlans,
  useCreateCapacityScenario,
  useUpdateCapacityScenario,
  useDeleteCapacityScenario,
  useRestoreCapacityScenario,
  useCreateIndirectWorkCase,
  useUpdateIndirectWorkCase,
  useDeleteIndirectWorkCase,
  useRestoreIndirectWorkCase,
  useBulkUpdateIndirectWorkTypeRatios,
  useBulkSaveMonthlyIndirectWorkLoads,
} from './api/mutations'

// Components
export { SettingsPanel } from './components/SettingsPanel'
export { ResultPanel } from './components/ResultPanel'
export { CaseFormSheet } from './components/CaseFormSheet'
export { ScenarioFormSheet } from './components/ScenarioFormSheet'
export { CalculationResultTable } from './components/CalculationResultTable'

// Hooks
export { useIndirectCaseStudyPage } from './hooks/useIndirectCaseStudyPage'
export { useCapacityCalculation } from './hooks/useCapacityCalculation'
export { useIndirectWorkCalculation } from './hooks/useIndirectWorkCalculation'
export { useUnsavedChanges } from './hooks/useUnsavedChanges'
export { useExcelExport } from './hooks/useExcelExport'
