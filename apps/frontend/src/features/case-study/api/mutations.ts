import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  createProjectCase,
  updateProjectCase,
  deleteProjectCase,
  restoreProjectCase,
  bulkUpsertProjectLoads,
} from './api-client'
import { caseStudyKeys } from './queries'
import type {
  CreateProjectCaseInput,
  UpdateProjectCaseInput,
  BulkProjectLoadInput,
} from '@/features/case-study/types'

export function useCreateProjectCase() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      projectId,
      input,
    }: {
      projectId: number
      input: CreateProjectCaseInput
    }) => createProjectCase(projectId, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: caseStudyKeys.projectCases(variables.projectId),
      })
    },
  })
}

export function useUpdateProjectCase() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      projectId,
      projectCaseId,
      input,
    }: {
      projectId: number
      projectCaseId: number
      input: UpdateProjectCaseInput
    }) => updateProjectCase(projectId, projectCaseId, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: caseStudyKeys.projectCases(variables.projectId),
      })
      queryClient.invalidateQueries({
        queryKey: caseStudyKeys.projectCase(
          variables.projectId,
          variables.projectCaseId,
        ),
      })
    },
  })
}

export function useDeleteProjectCase() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      projectId,
      projectCaseId,
    }: {
      projectId: number
      projectCaseId: number
    }) => deleteProjectCase(projectId, projectCaseId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: caseStudyKeys.projectCases(variables.projectId),
      })
      toast.success('ケースを削除しました')
    },
    onError: () => {
      toast.error('ケースの削除に失敗しました')
    },
  })
}

export function useRestoreProjectCase() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      projectId,
      projectCaseId,
    }: {
      projectId: number
      projectCaseId: number
    }) => restoreProjectCase(projectId, projectCaseId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: caseStudyKeys.projectCases(variables.projectId),
      })
      toast.success('ケースを復元しました')
    },
    onError: () => {
      toast.error('ケースの復元に失敗しました')
    },
  })
}

export function useBulkUpsertProjectLoads() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      projectCaseId,
      input,
    }: {
      projectCaseId: number
      input: BulkProjectLoadInput
    }) => bulkUpsertProjectLoads(projectCaseId, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: caseStudyKeys.projectLoads(variables.projectCaseId),
      })
    },
  })
}
