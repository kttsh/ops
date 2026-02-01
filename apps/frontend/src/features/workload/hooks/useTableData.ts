import { useMemo, useState, useCallback } from 'react'
import type { ChartDataResponse, TableRow, TableRowType } from '@/features/workload/types'

export interface UseTableDataReturn {
  rows: TableRow[]
  selectedYear: number
  availableYears: number[]
  setSelectedYear: (year: number) => void
  searchText: string
  setSearchText: (text: string) => void
  rowTypeFilter: TableRowType | 'all'
  setRowTypeFilter: (filter: TableRowType | 'all') => void
  filteredRows: TableRow[]
}

const CURRENT_YEAR = new Date().getFullYear()

export function useTableData(rawResponse: ChartDataResponse | undefined): UseTableDataReturn {
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR)
  const [searchText, setSearchText] = useState('')
  const [rowTypeFilter, setRowTypeFilter] = useState<TableRowType | 'all'>('all')

  const { rows, availableYears } = useMemo(() => {
    if (!rawResponse) {
      return { rows: [] as TableRow[], availableYears: [CURRENT_YEAR] }
    }

    const allRows: TableRow[] = []
    const yearSet = new Set<number>()

    // キャパシティ行
    for (const cap of rawResponse.capacities) {
      const monthly: Record<string, number> = {}
      let total = 0
      for (const m of cap.monthly) {
        const month = m.yearMonth.slice(4, 6)
        const year = parseInt(m.yearMonth.slice(0, 4), 10)
        yearSet.add(year)
        monthly[`${year}_${month}`] = m.capacity
        total += m.capacity
      }
      allRows.push({
        id: `capacity_${cap.capacityScenarioId}`,
        rowType: 'capacity',
        name: cap.scenarioName,
        total,
        monthly,
      })
    }

    // 間接作業行
    for (const iw of rawResponse.indirectWorkLoads) {
      const monthly: Record<string, number> = {}
      let total = 0
      for (const m of iw.monthly) {
        const month = m.yearMonth.slice(4, 6)
        const year = parseInt(m.yearMonth.slice(0, 4), 10)
        yearSet.add(year)
        monthly[`${year}_${month}`] = m.manhour
        total += m.manhour
      }
      allRows.push({
        id: `indirect_${iw.indirectWorkCaseId}`,
        rowType: 'indirect',
        name: iw.caseName,
        businessUnitCode: iw.businessUnitCode,
        total,
        monthly,
      })
    }

    // 案件行（案件タイプ別集約 + 個別案件サブ行）
    for (const pl of rawResponse.projectLoads) {
      const monthly: Record<string, number> = {}
      let total = 0
      for (const m of pl.monthly) {
        const month = m.yearMonth.slice(4, 6)
        const year = parseInt(m.yearMonth.slice(0, 4), 10)
        yearSet.add(year)
        monthly[`${year}_${month}`] = m.manhour
        total += m.manhour
      }

      const parentId = `project_${pl.projectTypeCode ?? 'none'}`

      // 個別案件のサブ行を生成
      const subRows: TableRow[] = (pl.projects ?? []).map((proj) => {
        const projMonthly: Record<string, number> = {}
        let projTotal = 0
        for (const m of proj.monthly) {
          const month = m.yearMonth.slice(4, 6)
          const year = parseInt(m.yearMonth.slice(0, 4), 10)
          projMonthly[`${year}_${month}`] = m.manhour
          projTotal += m.manhour
        }
        return {
          id: `projectDetail_${proj.projectId}`,
          rowType: 'projectDetail' as const,
          name: proj.projectName,
          projectTypeCode: pl.projectTypeCode,
          projectTypeName: pl.projectTypeName,
          total: projTotal,
          monthly: projMonthly,
          parentId,
        }
      })

      allRows.push({
        id: parentId,
        rowType: 'project',
        name: pl.projectTypeName ?? '未分類',
        projectTypeCode: pl.projectTypeCode,
        projectTypeName: pl.projectTypeName,
        total,
        monthly,
        subRows,
      })
    }

    const years = Array.from(yearSet).sort()

    return { rows: allRows, availableYears: years.length > 0 ? years : [CURRENT_YEAR] }
  }, [rawResponse])

  const filteredRows = useMemo(() => {
    let result = rows

    if (rowTypeFilter !== 'all') {
      result = result.filter(
        (r) => r.rowType === rowTypeFilter || r.rowType === 'projectDetail',
      )
    }

    if (searchText.trim()) {
      const lower = searchText.toLowerCase()
      result = result.filter((r) => {
        // 親行自身がマッチするか
        if (r.name.toLowerCase().includes(lower)) return true
        // サブ行にマッチするものがあるか
        if (r.subRows?.some((sub) => sub.name.toLowerCase().includes(lower))) return true
        return false
      })
    }

    return result
  }, [rows, rowTypeFilter, searchText])

  const safeSetSelectedYear = useCallback(
    (year: number) => {
      if (availableYears.includes(year)) {
        setSelectedYear(year)
      }
    },
    [availableYears],
  )

  return {
    rows,
    selectedYear,
    availableYears,
    setSelectedYear: safeSetSelectedYear,
    searchText,
    setSearchText,
    rowTypeFilter,
    setRowTypeFilter,
    filteredRows,
  }
}
