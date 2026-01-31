import { useCallback, useMemo } from 'react'
import { useSearch, useNavigate } from '@tanstack/react-router'
import type { ChartDataParams, WorkloadSearchParams } from '@/features/workload/types'

export interface UseWorkloadFiltersReturn {
  filters: WorkloadSearchParams
  setBusinessUnits: (codes: string[]) => void
  setPeriod: (from: string | undefined, to: string | undefined) => void
  setViewMode: (mode: 'chart' | 'table' | 'both') => void
  setSidePanelTab: (tab: 'projects' | 'indirect' | 'settings') => void
  hasBusinessUnits: boolean
  chartDataParams: ChartDataParams | null
}

export function useWorkloadFilters(): UseWorkloadFiltersReturn {
  const filters = useSearch({ from: '/workload/' })
  const navigate = useNavigate({ from: '/workload/' })

  const setBusinessUnits = useCallback(
    (codes: string[]) => {
      navigate({ search: (prev) => ({ ...prev, bu: codes }) })
    },
    [navigate],
  )

  const setPeriod = useCallback(
    (from: string | undefined, to: string | undefined) => {
      navigate({ search: (prev) => ({ ...prev, from, to }) })
    },
    [navigate],
  )

  const setViewMode = useCallback(
    (mode: 'chart' | 'table' | 'both') => {
      navigate({ search: (prev) => ({ ...prev, view: mode }) })
    },
    [navigate],
  )

  const setSidePanelTab = useCallback(
    (tab: 'projects' | 'indirect' | 'settings') => {
      navigate({ search: (prev) => ({ ...prev, tab }) })
    },
    [navigate],
  )

  const hasBusinessUnits = filters.bu.length > 0

  const chartDataParams: ChartDataParams | null = useMemo(() => {
    if (!hasBusinessUnits) return null

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    const defaultFrom = `${currentYear}01`
    const defaultTo = `${currentYear + 3}12`

    return {
      businessUnitCodes: filters.bu,
      startYearMonth: filters.from ?? defaultFrom,
      endYearMonth: filters.to ?? defaultTo,
    }
  }, [filters.bu, filters.from, filters.to, hasBusinessUnits])

  return {
    filters,
    setBusinessUnits,
    setPeriod,
    setViewMode,
    setSidePanelTab,
    hasBusinessUnits,
    chartDataParams,
  }
}
