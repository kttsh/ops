import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  bulkUpsertChartColorSettings,
  bulkUpsertChartStackOrderSettings,
  createChartView,
  updateChartView,
  deleteChartView,
} from './api-client'
import { workloadKeys } from './queries'
import type {
  ChartColorSettingInput,
  ChartStackOrderSettingInput,
  CreateChartViewInput,
  UpdateChartViewInput,
} from '@/features/workload/types'

export function useBulkUpsertColorSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (items: ChartColorSettingInput[]) =>
      bulkUpsertChartColorSettings(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workloadKeys.colorSettings() })
    },
  })
}

export function useBulkUpsertStackOrderSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (items: ChartStackOrderSettingInput[]) =>
      bulkUpsertChartStackOrderSettings(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workloadKeys.stackOrderSettings() })
    },
  })
}

export function useCreateChartView() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateChartViewInput) => createChartView(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workloadKeys.chartViews() })
    },
  })
}

export function useUpdateChartView() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateChartViewInput }) =>
      updateChartView(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workloadKeys.chartViews() })
    },
  })
}

export function useDeleteChartView() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteChartView(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workloadKeys.chartViews() })
    },
  })
}
