import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createBusinessUnit,
  updateBusinessUnit,
  deleteBusinessUnit,
  restoreBusinessUnit,
} from './api-client'
import { businessUnitKeys } from './queries'
import type { CreateBusinessUnitInput, UpdateBusinessUnitInput } from '@/features/business-units/types'

export function useCreateBusinessUnit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateBusinessUnitInput) => createBusinessUnit(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessUnitKeys.lists() })
    },
  })
}

export function useUpdateBusinessUnit(code: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateBusinessUnitInput) => updateBusinessUnit(code, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessUnitKeys.lists() })
      queryClient.invalidateQueries({ queryKey: businessUnitKeys.detail(code) })
    },
  })
}

export function useDeleteBusinessUnit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (code: string) => deleteBusinessUnit(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessUnitKeys.lists() })
    },
  })
}

export function useRestoreBusinessUnit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (code: string) => restoreBusinessUnit(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: businessUnitKeys.lists() })
    },
  })
}
