import { useMemo, useRef, useCallback, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronRightIcon, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { TableRow, TableRowType } from '@/features/workload/types'

interface WorkloadDataTableProps {
  rows: TableRow[]
  filteredRows: TableRow[]
  selectedYear: number
  availableYears: number[]
  onYearChange: (year: number) => void
  searchText: string
  onSearchChange: (text: string) => void
  rowTypeFilter: TableRowType | 'all'
  onRowTypeFilterChange: (filter: TableRowType | 'all') => void
}

function formatCellValue(value: number | undefined): string {
  if (value === undefined || value === 0) return '-'
  return value.toLocaleString('ja-JP')
}

const MONTH_LABELS = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月',
]

const ROW_HEIGHT = 48

const rowTypeFilterOptions: { value: TableRowType | 'all'; label: string }[] = [
  { value: 'all', label: '全体' },
  { value: 'project', label: '案件' },
  { value: 'capacity', label: 'キャパシティ' },
  { value: 'indirect', label: '間接作業' },
]

export function WorkloadDataTable({
  filteredRows,
  selectedYear,
  availableYears,
  onYearChange,
  searchText,
  onSearchChange,
  rowTypeFilter,
  onRowTypeFilterChange,
}: WorkloadDataTableProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  // 展開状態に基づいてフラット化された行リストを生成
  const flatRows = useMemo(() => {
    const result: TableRow[] = []
    for (const row of filteredRows) {
      result.push(row)
      if (row.rowType === 'project' && row.subRows?.length && expandedIds.has(row.id)) {
        for (const sub of row.subRows) {
          result.push(sub)
        }
      }
    }
    return result
  }, [filteredRows, expandedIds])

  const columns = useMemo<ColumnDef<TableRow>[]>(() => {
    const fixed: ColumnDef<TableRow>[] = [
      {
        id: 'name',
        accessorKey: 'name',
        header: '名称',
        size: 280,
        minSize: 60,
        maxSize: 400,
        enablePinning: true,
        cell: ({ row }) => {
          const original = row.original
          const hasSubRows = original.rowType === 'project' && (original.subRows?.length ?? 0) > 0
          const isExpanded = expandedIds.has(original.id)
          const isDetail = original.rowType === 'projectDetail'

          return (
            <div className="flex items-center gap-1">
              {hasSubRows ? (
                <button
                  type="button"
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded hover:bg-accent"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleExpand(original.id)
                  }}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRightIcon className="h-3.5 w-3.5" />
                  )}
                </button>
              ) : isDetail ? (
                <span className="w-5 shrink-0" />
              ) : null}
              <span className={cn('truncate', isDetail && 'pl-2 text-muted-foreground')}>
                {original.name}
              </span>
            </div>
          )
        },
      },
      {
        id: 'businessUnit',
        accessorKey: 'businessUnitCode',
        header: 'BU',
        size: 80,
        minSize: 60,
        maxSize: 200,
        cell: ({ getValue }) => getValue() ?? '-',
      },
      {
        id: 'projectType',
        accessorKey: 'projectTypeName',
        header: '案件タイプ',
        size: 100,
        minSize: 60,
        maxSize: 200,
        cell: ({ getValue }) => getValue() ?? '-',
      },
      {
        id: 'total',
        accessorKey: 'total',
        header: '合計',
        size: 100,
        minSize: 60,
        maxSize: 200,
        cell: ({ getValue }) => formatCellValue(getValue() as number),
      },
    ]

    const monthCols: ColumnDef<TableRow>[] = Array.from({ length: 12 }, (_, i) => {
      const monthKey = `${selectedYear}_${String(i + 1).padStart(2, '0')}`
      return {
        id: monthKey,
        header: MONTH_LABELS[i],
        size: 80,
        minSize: 60,
        maxSize: 200,
        accessorFn: (row: TableRow) => row.monthly[monthKey],
        cell: ({ getValue }) => formatCellValue(getValue() as number | undefined),
      }
    })

    return [...fixed, ...monthCols]
  }, [selectedYear, expandedIds, toggleExpand])

  const table = useReactTable({
    data: flatRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: 'onEnd',
    defaultColumn: {
      minSize: 60,
      maxSize: 400,
    },
    state: {
      columnPinning: {
        left: ['name', 'businessUnit', 'projectType', 'total'],
      },
    },
  })

  const { rows: tableRows } = table.getRowModel()

  const virtualizer = useVirtualizer({
    count: tableRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
  })

  const canGoPrev = availableYears.indexOf(selectedYear) > 0
  const canGoNext = availableYears.indexOf(selectedYear) < availableYears.length - 1

  const goPrev = useCallback(() => {
    const idx = availableYears.indexOf(selectedYear)
    if (idx > 0) onYearChange(availableYears[idx - 1])
  }, [availableYears, selectedYear, onYearChange])

  const goNext = useCallback(() => {
    const idx = availableYears.indexOf(selectedYear)
    if (idx < availableYears.length - 1) onYearChange(availableYears[idx + 1])
  }, [availableYears, selectedYear, onYearChange])

  return (
    <div className="flex flex-col gap-3">
      {/* ツールバー */}
      <div className="flex items-center gap-3">
        {/* 検索 */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="案件名で検索..."
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8 pl-8 text-sm"
          />
        </div>

        {/* 行タイプフィルタ */}
        <div className="flex items-center gap-1">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          {rowTypeFilterOptions.map((opt) => (
            <Button
              key={opt.value}
              variant="ghost"
              size="sm"
              className={cn(
                'h-7 text-xs',
                rowTypeFilter === opt.value && 'bg-accent text-accent-foreground',
              )}
              onClick={() => onRowTypeFilterChange(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>

        {/* 年切替 */}
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={!canGoPrev}
            onClick={goPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[4rem] text-center text-sm font-semibold">
            {selectedYear}年
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={!canGoNext}
            onClick={goNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* テーブル */}
      <div
        ref={parentRef}
        className="overflow-auto rounded-lg border border-border"
        style={{ height: 'calc(100vh - 320px)', minHeight: 300 }}
      >
        <div style={{ width: table.getTotalSize() }}>
          {/* ヘッダー */}
          <div className="sticky top-0 z-10 bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <div key={headerGroup.id} className="flex">
                {headerGroup.headers.map((header) => {
                  const isPinned = header.column.getIsPinned()
                  return (
                    <div
                      key={header.id}
                      className={cn(
                        'flex items-center border-b border-r border-border px-2 text-xs font-semibold text-muted-foreground',
                        isPinned && 'sticky z-20 bg-muted',
                      )}
                      style={{
                        width: header.getSize(),
                        height: ROW_HEIGHT,
                        left: isPinned ? header.getStart('left') : undefined,
                      }}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {/* リサイズハンドル */}
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50"
                      />
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* 仮想化ボディ */}
          <div
            style={{
              height: virtualizer.getTotalSize(),
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const row = tableRows[virtualRow.index]
              const rowType = row.original.rowType

              return (
                <div
                  key={row.id}
                  className={cn(
                    'absolute left-0 flex w-full border-b border-border',
                    rowType === 'capacity' && 'bg-blue-50 font-semibold',
                    rowType === 'indirect' && 'bg-gray-50',
                    rowType === 'project' && 'bg-white',
                    rowType === 'projectDetail' && 'bg-muted/30',
                  )}
                  style={{
                    height: ROW_HEIGHT,
                    top: virtualRow.start,
                  }}
                >
                  {row.getVisibleCells().map((cell) => {
                    const isPinned = cell.column.getIsPinned()
                    return (
                      <div
                        key={cell.id}
                        className={cn(
                          'flex items-center border-r border-border px-2 text-sm',
                          isPinned && 'sticky z-10',
                          rowType === 'capacity' && isPinned && 'bg-blue-50',
                          rowType === 'indirect' && isPinned && 'bg-gray-50',
                          rowType === 'project' && isPinned && 'bg-white',
                          rowType === 'projectDetail' && isPinned && 'bg-muted/30',
                        )}
                        style={{
                          width: cell.column.getSize(),
                          left: isPinned ? cell.column.getStart('left') : undefined,
                        }}
                      >
                        <span className="truncate">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* フッター情報 */}
      <div className="text-xs text-muted-foreground">
        {flatRows.length} 行
      </div>
    </div>
  )
}
