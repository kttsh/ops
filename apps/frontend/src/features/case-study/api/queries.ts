import { queryOptions } from '@tanstack/react-query'
import {
  fetchProjectCases,
  fetchProjectCase,
  fetchProjectLoads,
  fetchStandardEffortMasters,
  fetchStandardEffortMaster,
} from './api-client'
import type {
  ProjectCaseListParams,
  StandardEffortMasterListParams,
} from '@/features/case-study/types'

// ============================================================
// Query Key Factory
// ============================================================

export const caseStudyKeys = {
  all: ['case-study'] as const,
  projectCases: (projectId: number) =>
    [...caseStudyKeys.all, 'project-cases', projectId] as const,
  projectCase: (projectId: number, caseId: number) =>
    [...caseStudyKeys.all, 'project-case', projectId, caseId] as const,
  projectLoads: (caseId: number) =>
    [...caseStudyKeys.all, 'project-loads', caseId] as const,
  standardEffortMasters: () =>
    [...caseStudyKeys.all, 'standard-effort-masters'] as const,
  standardEffortMaster: (id: number) =>
    [...caseStudyKeys.all, 'standard-effort-master', id] as const,
}

// ============================================================
// ProjectCase
// ============================================================

export function projectCasesQueryOptions(
  projectId: number,
  params?: ProjectCaseListParams,
) {
  return queryOptions({
    queryKey: caseStudyKeys.projectCases(projectId),
    queryFn: () => fetchProjectCases(projectId, params),
    staleTime: 5 * 60 * 1000,
  })
}

export function projectCaseQueryOptions(
  projectId: number,
  caseId: number,
) {
  return queryOptions({
    queryKey: caseStudyKeys.projectCase(projectId, caseId),
    queryFn: () => fetchProjectCase(projectId, caseId),
    staleTime: 5 * 60 * 1000,
  })
}

// ============================================================
// ProjectLoad
// ============================================================

export function projectLoadsQueryOptions(caseId: number) {
  return queryOptions({
    queryKey: caseStudyKeys.projectLoads(caseId),
    queryFn: () => fetchProjectLoads(caseId),
    staleTime: 5 * 60 * 1000,
    enabled: caseId > 0,
  })
}

// ============================================================
// StandardEffortMaster
// ============================================================

export function standardEffortMastersQueryOptions(
  params?: StandardEffortMasterListParams,
) {
  return queryOptions({
    queryKey: caseStudyKeys.standardEffortMasters(),
    queryFn: () => fetchStandardEffortMasters(params),
    staleTime: 30 * 60 * 1000,
  })
}

export function standardEffortMasterQueryOptions(id: number) {
  return queryOptions({
    queryKey: caseStudyKeys.standardEffortMaster(id),
    queryFn: () => fetchStandardEffortMaster(id),
    staleTime: 30 * 60 * 1000,
    enabled: id > 0,
  })
}
