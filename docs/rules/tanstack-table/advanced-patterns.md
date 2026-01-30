# TanStack Table 応用パターン規約

## 概要

本ドキュメントは、TanStack Table の応用的な実装パターンを定めるものです。
再利用可能なコンポーネント設計、サーバーサイド統合、TanStack Virtual（`@tanstack/react-virtual`）による仮想化、パフォーマンス最適化のガイドラインを規定します。

---

## 再利用可能な DataTable コンポーネント設計

### 汎用 DataTable Props

複数の feature で共有する DataTable コンポーネントは、ジェネリクスを活用して型安全に設計します。

```tsx
// src/components/data-table/data-table.tsx
"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  TableOptions,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  /** テーブルにツールバーを表示するためのレンダー関数 */
  toolbar?: (table: ReturnType<typeof useReactTable<TData>>) => React.ReactNode
  /** 初期ソート状態 */
  initialSorting?: SortingState
  /** 初期ページサイズ */
  initialPageSize?: number
  /** 追加の useReactTable オプション */
  tableOptions?: Partial<TableOptions<TData>>
}

export function DataTable<TData, TValue>({
  columns,
  data,
  toolbar,
  initialSorting = [],
  initialPageSize = 10,
  tableOptions,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting)
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageIndex: 0, pageSize: initialPageSize },
    },
    ...tableOptions,
  })

  return (
    <div className="space-y-4">
      {toolbar?.(table)}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  データがありません
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />
    </div>
  )
}
```

### 使用例

```tsx
// src/features/payments/components/payments-table.tsx
import { DataTable } from "@/components/data-table/data-table"
import { columns } from "./columns"
import { DataTableToolbar } from "./payments-toolbar"

export function PaymentsTable({ data }: { data: Payment[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      initialPageSize={20}
      toolbar={(table) => <DataTableToolbar table={table} />}
    />
  )
}
```

---

## Context Provider パターン

テーブルの prop drilling を解消するために React Context を使用します。
テーブルが複雑化し、ツールバー・ページネーション・フィルタ等のサブコンポーネントが増えた場合に有効です。

```tsx
// src/components/data-table/data-table-context.tsx
import * as React from "react"
import { Table } from "@tanstack/react-table"

interface DataTableContextValue<TData> {
  table: Table<TData>
}

const DataTableContext = React.createContext<DataTableContextValue<any> | null>(
  null
)

export function DataTableProvider<TData>({
  table,
  children,
}: {
  table: Table<TData>
  children: React.ReactNode
}) {
  return (
    <DataTableContext.Provider value={{ table }}>
      {children}
    </DataTableContext.Provider>
  )
}

export function useDataTable<TData>(): Table<TData> {
  const context = React.useContext(DataTableContext)
  if (!context) {
    throw new Error("useDataTable must be used within a DataTableProvider")
  }
  return context.table as Table<TData>
}
```

### Context の使用

```tsx
// DataTable コンポーネント内
function DataTable<TData, TValue>({ columns, data }: DataTableProps<TData, TValue>) {
  const table = useReactTable({ /* ... */ })

  return (
    <DataTableProvider table={table}>
      <DataTableToolbar />
      <DataTableContent />
      <DataTablePagination />
    </DataTableProvider>
  )
}

// サブコンポーネントで prop drilling なしにアクセス
function DataTableToolbar() {
  const table = useDataTable()
  // table.getColumn("email")?.setFilterValue(...)
}
```

---

## TanStack Query との統合

### サーバーサイドテーブル

ページネーション・ソート・フィルタをサーバーに委譲する統合パターンです。

```tsx
// src/features/payments/hooks/use-payments-table.ts
import { useQuery, keepPreviousData } from "@tanstack/react-query"
import {
  PaginationState,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table"
import * as React from "react"

interface UsePaymentsTableOptions {
  initialPageSize?: number
}

export function usePaymentsTable({
  initialPageSize = 10,
}: UsePaymentsTableOptions = {}) {
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  })
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>([])

  const { data, isLoading } = useQuery({
    queryKey: ["payments", pagination, sorting, columnFilters],
    queryFn: () =>
      fetchPayments({
        page: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
        sortBy: sorting[0]?.id,
        sortOrder: sorting[0]?.desc ? "desc" : "asc",
        filters: columnFilters.reduce(
          (acc, filter) => ({
            ...acc,
            [filter.id]: filter.value,
          }),
          {}
        ),
      }),
    placeholderData: keepPreviousData,
  })

  return {
    data: data?.items ?? [],
    pageCount: data?.totalPages ?? -1,
    rowCount: data?.totalCount ?? 0,
    isLoading,
    pagination,
    setPagination,
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
  }
}
```

### サーバーサイドテーブルのコンポーネント

```tsx
// src/features/payments/components/payments-server-table.tsx
import {
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { usePaymentsTable } from "../hooks/use-payments-table"
import { columns } from "./columns"

export function PaymentsServerTable() {
  const {
    data,
    pageCount,
    isLoading,
    pagination,
    setPagination,
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
  } = usePaymentsTable()

  const table = useReactTable({
    data,
    columns,
    state: {
      pagination,
      sorting,
      columnFilters,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount,
  })

  if (isLoading) return <TableSkeleton />

  // テーブルレンダリング...
}
```

### keepPreviousData の使用

サーバーサイドテーブルでページ切替時にデータが一瞬消えるのを防ぐため、TanStack Query の `keepPreviousData` を使用します。

```tsx
import { keepPreviousData } from "@tanstack/react-query"

const { data } = useQuery({
  queryKey: ["payments", pagination],
  queryFn: fetchPayments,
  placeholderData: keepPreviousData, // 前回データを維持
})
```

---

## ツールバーコンポーネント

### 標準ツールバー構成

```tsx
// src/components/data-table/data-table-toolbar.tsx
import { Table } from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { DataTableViewOptions } from "./data-table-view-options"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {/* テキスト検索 */}
        <Input
          placeholder="検索..."
          value={
            (table.getColumn("name")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />

        {/* ファセットフィルタ */}
        {table.getColumn("status") && (
          <DataTableFacetedFilter
            column={table.getColumn("status")}
            title="ステータス"
            options={statusOptions}
          />
        )}

        {/* フィルタリセット */}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            リセット
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      {/* カラム表示切替 */}
      <DataTableViewOptions table={table} />
    </div>
  )
}
```

---

## パフォーマンス最適化

### 1. データのメモ化

```tsx
// React.useMemo でデータを安定化
const memoizedData = React.useMemo(() => data, [data])

// columns はモジュールスコープで定義（推奨）
// or コンポーネント内なら useMemo
const memoizedColumns = React.useMemo(() => columns, [])
```

### 2. 必要な RowModel のみインポート

TanStack Table はツリーシェイク可能です。使用しない機能の RowModel はインポートしません。

```tsx
// --- NG: 使わない機能もインポート ---
import {
  getCoreRowModel,
  getSortedRowModel,      // 使わないなら不要
  getFilteredRowModel,    // 使わないなら不要
  getPaginationRowModel,  // 使わないなら不要
  getGroupedRowModel,     // 使わないなら不要
  getExpandedRowModel,    // 使わないなら不要
} from "@tanstack/react-table"

// --- OK: 必要なものだけ ---
import {
  getCoreRowModel,
  getPaginationRowModel,
} from "@tanstack/react-table"
```

### 3. TanStack Virtual による仮想化

数千行を超えるデータの場合は `@tanstack/react-virtual` と組み合わせて仮想スクロールを実装します。
仮想化を使用する場合、`getPaginationRowModel` は使用せず、スクロールで全行を表示します。

```bash
pnpm add @tanstack/react-virtual
```

#### 仮想化テーブルの CSS レイアウト規約

仮想化テーブルでは **CSS Grid レイアウト** を使用します。デフォルトの HTML テーブルレイアウトでは行の絶対配置ができないためです。

| 要素 | 必須スタイル | 目的 |
|---|---|---|
| `<table>` | `display: grid` | Grid レイアウトに切り替え |
| `<thead>` | `display: grid; position: sticky; top: 0; z-index: 1` | ヘッダー固定 |
| `<tr>`（ヘッダー） | `display: flex; width: 100%` | カラム幅制御 |
| `<tbody>` | `display: grid; height: getTotalSize(); position: relative` | 仮想スクロール領域 |
| `<tr>`（ボディ） | `display: flex; position: absolute; transform: translateY(...)` | 仮想行配置 |
| `<th>` / `<td>` | `display: flex; width: column.getSize()` | カラム幅の統一 |

#### 行仮想化（推奨パターン）

```tsx
// src/components/data-table/data-table-virtual.tsx
"use client"

import * as React from "react"
import {
  ColumnDef,
  Row,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { useVirtualizer } from "@tanstack/react-virtual"

interface VirtualDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  /** スクロールコンテナの高さ（デフォルト: 600px） */
  height?: number
  /** 行の推定高さ（デフォルト: 33px） */
  estimateRowHeight?: number
  /** オーバースキャン行数（デフォルト: 5） */
  overscan?: number
}

export function VirtualDataTable<TData, TValue>({
  columns,
  data,
  height = 600,
  estimateRowHeight = 33,
  overscan = 5,
}: VirtualDataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // getPaginationRowModel は使用しない
  })

  const { rows } = table.getRowModel()
  const tableContainerRef = React.useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => estimateRowHeight,
    overscan,
    // 動的行高の計測（Firefox ではボーダー計測バグがあるため無効化）
    measureElement:
      typeof window !== "undefined" &&
      !navigator.userAgent.includes("Firefox")
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
  })

  return (
    <div
      ref={tableContainerRef}
      className="rounded-md border"
      style={{
        overflow: "auto",
        position: "relative",
        height: `${height}px`,
      }}
    >
      <table style={{ display: "grid" }}>
        {/* ヘッダー（sticky） */}
        <thead
          style={{
            display: "grid",
            position: "sticky",
            top: 0,
            zIndex: 1,
          }}
          className="bg-background"
        >
          {table.getHeaderGroups().map((headerGroup) => (
            <tr
              key={headerGroup.id}
              style={{ display: "flex", width: "100%" }}
            >
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  style={{
                    display: "flex",
                    width: header.getSize(),
                  }}
                  className="px-4 py-2 text-left text-sm font-medium text-muted-foreground"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>

        {/* ボディ（仮想化） */}
        <tbody
          style={{
            display: "grid",
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: "relative",
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index] as Row<TData>
            return (
              <tr
                key={row.id}
                data-index={virtualRow.index}
                ref={(node) => rowVirtualizer.measureElement(node)}
                style={{
                  display: "flex",
                  position: "absolute",
                  transform: `translateY(${virtualRow.start}px)`,
                  width: "100%",
                }}
                className="border-b"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    style={{
                      display: "flex",
                      width: cell.column.getSize(),
                    }}
                    className="px-4 py-2 text-sm"
                  >
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
```

#### 動的行高の必須属性

動的な行高を計測するには、以下の2つの属性が **必須** です。

```tsx
<tr
  data-index={virtualRow.index}                         // 必須: 計測対象の追跡
  ref={(node) => rowVirtualizer.measureElement(node)}   // 必須: 要素の計測
>
```

`estimateSize` には **想定される最大サイズ** を指定すると、スクロールバーの精度が向上します。

#### カラム仮想化

カラム数が多い場合（20列超）、表示領域外のカラムを仮想化してパフォーマンスを改善できます。
カラム仮想化では `translateX` ではなく **パディング方式** で水平スクロール領域を確保します。

```tsx
// src/components/data-table/data-table-virtual-columns.tsx
"use client"

import * as React from "react"
import {
  ColumnDef,
  Row,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { useVirtualizer } from "@tanstack/react-virtual"

export function VirtualColumnDataTable<TData, TValue>({
  columns,
  data,
  height = 600,
}: {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  height?: number
}) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const tableContainerRef = React.useRef<HTMLDivElement>(null)
  const { rows } = table.getRowModel()
  const visibleColumns = table.getVisibleLeafColumns()

  // 行仮想化
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 33,
    overscan: 5,
  })

  // カラム仮想化
  const columnVirtualizer = useVirtualizer({
    count: visibleColumns.length,
    estimateSize: (index) => visibleColumns[index].getSize(),
    getScrollElement: () => tableContainerRef.current,
    horizontal: true,
    overscan: 3,
  })

  const virtualColumns = columnVirtualizer.getVirtualItems()

  // 仮想パディング（表示領域外のカラム幅を確保）
  let virtualPaddingLeft: number | undefined
  let virtualPaddingRight: number | undefined
  if (virtualColumns.length > 0) {
    virtualPaddingLeft = virtualColumns[0]?.start ?? 0
    virtualPaddingRight =
      columnVirtualizer.getTotalSize() -
      (virtualColumns[virtualColumns.length - 1]?.end ?? 0)
  }

  return (
    <div
      ref={tableContainerRef}
      className="rounded-md border"
      style={{
        overflow: "auto",
        position: "relative",
        height: `${height}px`,
      }}
    >
      <table style={{ display: "grid" }}>
        <thead
          style={{
            display: "grid",
            position: "sticky",
            top: 0,
            zIndex: 1,
          }}
          className="bg-background"
        >
          {table.getHeaderGroups().map((headerGroup) => (
            <tr
              key={headerGroup.id}
              style={{ display: "flex", width: "100%" }}
            >
              {virtualPaddingLeft ? (
                <th style={{ display: "flex", width: virtualPaddingLeft }} />
              ) : null}
              {virtualColumns.map((vc) => {
                const header = headerGroup.headers[vc.index]
                return (
                  <th
                    key={header.id}
                    style={{
                      display: "flex",
                      width: header.getSize(),
                    }}
                    className="px-4 py-2 text-left text-sm font-medium text-muted-foreground"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                )
              })}
              {virtualPaddingRight ? (
                <th style={{ display: "flex", width: virtualPaddingRight }} />
              ) : null}
            </tr>
          ))}
        </thead>

        <tbody
          style={{
            display: "grid",
            height: `${rowVirtualizer.getTotalSize()}px`,
            position: "relative",
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index] as Row<TData>
            const visibleCells = row.getVisibleCells()
            return (
              <tr
                key={row.id}
                data-index={virtualRow.index}
                ref={(node) => rowVirtualizer.measureElement(node)}
                style={{
                  display: "flex",
                  position: "absolute",
                  transform: `translateY(${virtualRow.start}px)`,
                  width: "100%",
                }}
                className="border-b"
              >
                {virtualPaddingLeft ? (
                  <td style={{ display: "flex", width: virtualPaddingLeft }} />
                ) : null}
                {virtualColumns.map((vc) => {
                  const cell = visibleCells[vc.index]
                  return (
                    <td
                      key={cell.id}
                      style={{
                        display: "flex",
                        width: cell.column.getSize(),
                      }}
                      className="px-4 py-2 text-sm"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  )
                })}
                {virtualPaddingRight ? (
                  <td style={{ display: "flex", width: virtualPaddingRight }} />
                ) : null}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
```

#### 無限スクロール + 仮想化 + TanStack Query

サーバーサイドデータを無限スクロールで取得し、仮想化で描画するパターンです。

```tsx
// src/features/[feature]/hooks/use-virtual-infinite-table.ts
import * as React from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { useVirtualizer } from "@tanstack/react-virtual"
import {
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table"

export function useVirtualInfiniteTable<TData>({
  queryKey,
  queryFn,
  columns,
  fetchSize = 50,
}: {
  queryKey: string[]
  queryFn: (params: { cursor: number; size: number }) => Promise<{
    items: TData[]
    nextCursor: number | null
  }>
  columns: ColumnDef<TData, any>[]
  fetchSize?: number
}) {
  const tableContainerRef = React.useRef<HTMLDivElement>(null)
  const [sorting, setSorting] = React.useState<SortingState>([])

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey,
      queryFn: ({ pageParam = 0 }) =>
        queryFn({ cursor: pageParam, size: fetchSize }),
      initialPageParam: 0,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    })

  const flatData = React.useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data]
  )

  const table = useReactTable({
    data: flatData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const { rows } = table.getRowModel()

  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? rows.length + 1 : rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 33,
    overscan: 5,
  })

  // スクロール末尾で次ページを自動取得
  React.useEffect(() => {
    const lastItem = rowVirtualizer.getVirtualItems().at(-1)
    if (
      lastItem &&
      lastItem.index >= rows.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage()
    }
  }, [
    rowVirtualizer.getVirtualItems(),
    hasNextPage,
    isFetchingNextPage,
    rows.length,
    fetchNextPage,
  ])

  return {
    table,
    rows,
    tableContainerRef,
    rowVirtualizer,
    isFetchingNextPage,
    totalFetched: flatData.length,
  }
}
```

#### スクロール位置の復元（TanStack Router 連携）

TanStack Router の `useElementScrollRestoration` と組み合わせて、ページ遷移後のスクロール位置を復元します。

```tsx
import { useElementScrollRestoration } from "@tanstack/react-router"
import { useVirtualizer } from "@tanstack/react-virtual"

function VirtualTableWithScrollRestoration() {
  const scrollRestorationId = "payments-table"
  const scrollEntry = useElementScrollRestoration({
    id: scrollRestorationId,
  })

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 33,
    initialOffset: scrollEntry?.scrollY ?? 0, // スクロール位置を復元
    overscan: 5,
  })

  return (
    <div
      ref={tableContainerRef}
      data-scroll-restoration-id={scrollRestorationId} // 必須属性
      style={{ overflow: "auto", height: "600px" }}
    >
      {/* テーブル本体 */}
    </div>
  )
}
```

#### useVirtualizer の主要オプション

| オプション | 型 | デフォルト | 説明 |
|---|---|---|---|
| `count` | `number` | **必須** | 仮想化する要素の総数 |
| `getScrollElement` | `() => Element \| null` | **必須** | スクロールコンテナを返す関数 |
| `estimateSize` | `(index: number) => number` | **必須** | 要素の推定サイズ（px） |
| `overscan` | `number` | `1` | 表示領域外に追加レンダリングする要素数 |
| `horizontal` | `boolean` | `false` | 水平方向の仮想化 |
| `getItemKey` | `(index: number) => Key` | `(i) => i` | 要素の一意キー |
| `measureElement` | `(el) => number` | - | 動的サイズ計測関数 |
| `initialOffset` | `number` | `0` | 初期スクロール位置（復元用） |
| `paddingStart` / `paddingEnd` | `number` | `0` | スクロール領域の余白 |
| `gap` | `number` | `0` | 要素間のギャップ |
| `lanes` | `number` | `1` | レーン数（Masonry レイアウト用） |
| `rangeExtractor` | `(range) => number[]` | デフォルト | カスタム表示範囲（Sticky 行用） |

#### useVirtualizer の主要メソッド

| メソッド | 説明 |
|---|---|
| `getVirtualItems()` | 現在表示すべき仮想アイテムの配列を返す |
| `getTotalSize()` | スクロール領域の合計サイズ（px）を返す |
| `scrollToIndex(index, options?)` | 指定インデックスへスクロール |
| `scrollToOffset(offset, options?)` | 指定オフセットへスクロール |
| `measureElement(element)` | 要素のサイズを計測（ref コールバックとして使用） |
| `measure()` | 全計測値を再計算 |

#### overscan のチューニング

| 用途 | 推奨値 | 理由 |
|---|---|---|
| 行仮想化 | `5` | 高速スクロール時の空白防止 |
| カラム仮想化 | `3` | 水平スクロールは比較的遅い |
| 高頻度スクロール | `10` | 空白が頻発する場合に増やす |
| 低スペック端末 | `3` | DOM ノード数を削減 |

### 4. パフォーマンスの目安

| データ量 | 推奨アプローチ |
|---|---|
| ~1,000 行 | クライアントサイド（すべての機能） |
| 1,000 ~ 10,000 行 | クライアントサイド + 仮想化（`@tanstack/react-virtual`） |
| 10,000 行超 | サーバーサイドページネーション + ソート + フィルタ |
| 10,000 行超 + 無限リスト | 無限スクロール + 仮想化（`useInfiniteQuery` 連携） |
| カラム 20 列超 | カラム仮想化を検討 |

---

## エラーハンドリング

### 空テーブルの表示

データが存在しない場合のフォールバック表示は必ず実装します。

```tsx
<TableBody>
  {table.getRowModel().rows?.length ? (
    // 行の表示...
  ) : (
    <TableRow>
      <TableCell
        colSpan={columns.length}
        className="h-24 text-center"
      >
        データがありません
      </TableCell>
    </TableRow>
  )}
</TableBody>
```

### ローディング状態

```tsx
{isLoading ? (
  <TableBody>
    {Array.from({ length: 5 }).map((_, i) => (
      <TableRow key={i}>
        {columns.map((_, j) => (
          <TableCell key={j}>
            <Skeleton className="h-4 w-full" />
          </TableCell>
        ))}
      </TableRow>
    ))}
  </TableBody>
) : (
  <TableBody>{/* 通常のレンダリング */}</TableBody>
)}
```

---

## ファイル構成まとめ

### 共通コンポーネント

```
src/components/data-table/
├── data-table.tsx                  # 汎用 DataTable コンポーネント
├── data-table-virtual.tsx          # 仮想化 DataTable（行仮想化）
├── data-table-virtual-columns.tsx  # 仮想化 DataTable（行+カラム仮想化）
├── data-table-context.tsx          # Context Provider（必要に応じて）
├── data-table-column-header.tsx    # 再利用可能なソートヘッダー
├── data-table-pagination.tsx       # ページネーション UI
├── data-table-toolbar.tsx          # ツールバー（必要に応じて）
├── data-table-faceted-filter.tsx   # ファセットフィルタ（必要に応じて）
└── data-table-view-options.tsx     # カラム表示切替
```

### Feature 固有コンポーネント

```
src/features/[feature]/
├── components/
│   ├── columns.tsx                 # カラム定義
│   ├── [feature]-table.tsx         # テーブルコンポーネント
│   └── [feature]-toolbar.tsx       # Feature 固有のツールバー
├── hooks/
│   ├── use-[feature]-table.ts      # サーバーサイド連携 hook（必要に応じて）
│   └── use-[feature]-virtual-table.ts  # 無限スクロール+仮想化 hook（必要に応じて）
└── types/
    └── index.ts                    # データ型定義
```

---

## 禁止事項

- 共通 DataTable コンポーネントに feature 固有のロジックを混入しない
- Context Provider を不要な場合に導入しない（prop drilling が問題になるまではシンプルに保つ）
- 大量データでクライアントサイド処理を行いパフォーマンスを劣化させない
- `keepPreviousData` を使用せずにサーバーサイドテーブルでページ切替のチラつきを放置しない
- 仮想化テーブルで `display: grid` を適用せずにデフォルトのテーブルレイアウトを使用しない
- 仮想化テーブルで `data-index` と `ref={measureElement}` を省略しない（動的行高が機能しなくなる）
- 仮想化テーブルで `getPaginationRowModel` を併用しない（仮想スクロールとページネーションは排他的）
- `estimateSize` に過小な値を設定しない（スクロールバーの精度が低下する。想定される最大サイズを指定する）
