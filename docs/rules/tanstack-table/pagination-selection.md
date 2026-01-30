# TanStack Table ページネーション・行選択規約

## 概要

本ドキュメントは、TanStack Table のページネーション（Pagination）および行選択（Row Selection）機能の実装規約を定めるものです。

---

## ページネーション

### 基本セットアップ

クライアントサイドページネーションには `getPaginationRowModel` を渡し、`PaginationState` を管理します。

```tsx
import * as React from "react"
import {
  PaginationState,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const table = useReactTable({
    data,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  // ...
}
```

### ページネーション UI

```tsx
<div className="flex items-center justify-between space-x-2 py-4">
  <div className="text-sm text-muted-foreground">
    {table.getFilteredRowModel().rows.length} 件中{" "}
    {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}
    -
    {Math.min(
      (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
      table.getFilteredRowModel().rows.length
    )}
    件を表示
  </div>
  <div className="flex items-center space-x-2">
    <Button
      variant="outline"
      size="sm"
      onClick={() => table.previousPage()}
      disabled={!table.getCanPreviousPage()}
    >
      前へ
    </Button>
    <Button
      variant="outline"
      size="sm"
      onClick={() => table.nextPage()}
      disabled={!table.getCanNextPage()}
    >
      次へ
    </Button>
  </div>
</div>
```

### 再利用可能なページネーションコンポーネント

```tsx
// src/components/data-table/data-table-pagination.tsx
import { Table } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"

interface DataTablePaginationProps<TData> {
  table: Table<TData>
}

export function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex-1 text-sm text-muted-foreground">
        {table.getFilteredSelectedRowModel().rows.length} /{" "}
        {table.getFilteredRowModel().rows.length} 件選択中
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        {/* ページサイズ選択 */}
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">表示件数</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value))
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ページ表示 */}
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          {table.getState().pagination.pageIndex + 1} / {table.getPageCount()} ページ
        </div>

        {/* ナビゲーションボタン */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">最初のページ</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">前のページ</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">次のページ</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">最後のページ</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
```

### ページネーション API 一覧

| API | 型 | 説明 |
|---|---|---|
| `table.getPageCount()` | `number` | 総ページ数 |
| `table.getCanPreviousPage()` | `boolean` | 前ページが存在するか |
| `table.getCanNextPage()` | `boolean` | 次ページが存在するか |
| `table.previousPage()` | `void` | 前ページへ移動 |
| `table.nextPage()` | `void` | 次ページへ移動 |
| `table.setPageIndex(index)` | `void` | 指定ページへ移動 |
| `table.setPageSize(size)` | `void` | ページサイズを変更 |
| `table.getState().pagination` | `PaginationState` | 現在のページネーション状態 |

### デフォルトページサイズ

`getPaginationRowModel` を追加するとデフォルトでページサイズ 10 でページネーションされます。明示的に変更する場合は `initialState` を使用します。

```tsx
const table = useReactTable({
  // ...
  initialState: {
    pagination: {
      pageIndex: 0,
      pageSize: 20,
    },
  },
})
```

---

## サーバーサイドページネーション

大量データの場合はサーバーサイドでページネーションを行います。

```tsx
const [pagination, setPagination] = React.useState<PaginationState>({
  pageIndex: 0,
  pageSize: 10,
})

// TanStack Query でサーバーからデータ取得
const { data } = useQuery({
  queryKey: ["payments", pagination],
  queryFn: () =>
    fetchPayments({
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
    }),
})

const table = useReactTable({
  data: data?.items ?? [],
  columns,
  state: { pagination },
  onPaginationChange: setPagination,
  getCoreRowModel: getCoreRowModel(),
  // getPaginationRowModel は渡さない
  manualPagination: true,
  pageCount: data?.totalPages ?? -1, // サーバーから総ページ数を受け取る
})
```

### サーバーサイドページネーションの必須設定

| オプション | 説明 |
|---|---|
| `manualPagination: true` | クライアントサイドのページネーション無効化 |
| `pageCount` | サーバーから受け取った総ページ数。不明な場合は `-1` |
| `rowCount` | サーバーから受け取った総行数（`pageCount` の代替） |

---

## 行選択

### 基本セットアップ

行選択には `RowSelectionState` を管理し、チェックボックスカラムを定義します。

```tsx
import * as React from "react"
import {
  RowSelectionState,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})

  const table = useReactTable({
    data,
    columns,
    state: { rowSelection },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
  })

  // ...
}
```

### チェックボックスカラムの定義

```tsx
import { Checkbox } from "@/components/ui/checkbox"

// columns.tsx 内に追加（配列の先頭に配置）
{
  id: "select",
  header: ({ table }) => (
    <Checkbox
      checked={
        table.getIsAllPageRowsSelected() ||
        (table.getIsSomePageRowsSelected() && "indeterminate")
      }
      onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      aria-label="すべて選択"
    />
  ),
  cell: ({ row }) => (
    <Checkbox
      checked={row.getIsSelected()}
      onCheckedChange={(value) => row.toggleSelected(!!value)}
      aria-label="行を選択"
    />
  ),
  enableSorting: false,
  enableHiding: false,
},
```

### 行選択の表示

テーブル行のスタイルに選択状態を反映します。

```tsx
<TableRow
  key={row.id}
  data-state={row.getIsSelected() && "selected"}
>
  {/* ... */}
</TableRow>
```

### 選択行数の表示

```tsx
<div className="text-sm text-muted-foreground">
  {table.getFilteredSelectedRowModel().rows.length} /{" "}
  {table.getFilteredRowModel().rows.length} 件選択中
</div>
```

### 行選択テーブルオプション

| オプション | 型 | デフォルト | 説明 |
|---|---|---|---|
| `enableRowSelection` | `boolean \| (row) => boolean` | `true` | 行選択の有効化。関数で条件付きも可 |
| `enableMultiRowSelection` | `boolean \| (row) => boolean` | `true` | 複数行選択の有効化 |
| `enableSubRowSelection` | `boolean \| (row) => boolean` | `true` | サブ行の連動選択 |
| `onRowSelectionChange` | `(updater) => void` | - | 行選択状態の変更ハンドラ |

### 行レベル API

| API | 型 | 説明 |
|---|---|---|
| `row.getIsSelected()` | `boolean` | 行が選択されているか |
| `row.getCanSelect()` | `boolean` | 行が選択可能か |
| `row.toggleSelected(value?)` | `void` | 行の選択を切り替え |
| `row.getToggleSelectedHandler()` | `(e) => void` | 選択切替のイベントハンドラ |

### テーブルレベル API

| API | 型 | 説明 |
|---|---|---|
| `table.getIsAllRowsSelected()` | `boolean` | 全行が選択されているか |
| `table.getIsSomeRowsSelected()` | `boolean` | 一部の行が選択されているか |
| `table.getIsAllPageRowsSelected()` | `boolean` | 現在ページの全行が選択されているか |
| `table.getIsSomePageRowsSelected()` | `boolean` | 現在ページの一部の行が選択されているか |
| `table.toggleAllRowsSelected(value?)` | `void` | 全行の選択を切り替え |
| `table.toggleAllPageRowsSelected(value?)` | `void` | 現在ページの全行の選択を切り替え |
| `table.getSelectedRowModel()` | `RowModel` | 選択された行のモデル |
| `table.getFilteredSelectedRowModel()` | `RowModel` | フィルタ後の選択行モデル |

### 選択データへのアクセス

```tsx
// 選択された行の元データを取得
const selectedRows = table
  .getFilteredSelectedRowModel()
  .rows.map((row) => row.original)

// 選択された行のIDを取得
const selectedIds = Object.keys(rowSelection)
```

### 条件付き行選択

特定の条件を満たす行のみ選択可能にします。

```tsx
const table = useReactTable({
  // ...
  enableRowSelection: (row) => row.original.status !== "locked",
})
```

### 単一行選択

ラジオボタンのように一度に1行のみ選択する場合:

```tsx
const table = useReactTable({
  // ...
  enableMultiRowSelection: false,
})
```

---

## カラム表示/非表示

### 基本セットアップ

```tsx
import { VisibilityState } from "@tanstack/react-table"

const [columnVisibility, setColumnVisibility] =
  React.useState<VisibilityState>({})

const table = useReactTable({
  // ...
  state: { columnVisibility },
  onColumnVisibilityChange: setColumnVisibility,
})
```

### カラム切替ドロップダウン

```tsx
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline" className="ml-auto">
      表示カラム
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    {table
      .getAllColumns()
      .filter((column) => column.getCanHide())
      .map((column) => (
        <DropdownMenuCheckboxItem
          key={column.id}
          className="capitalize"
          checked={column.getIsVisible()}
          onCheckedChange={(value) => column.toggleVisibility(!!value)}
        >
          {column.id}
        </DropdownMenuCheckboxItem>
      ))}
  </DropdownMenuContent>
</DropdownMenu>
```

---

## 全機能統合パターン

ソート・フィルタ・ページネーション・行選択・カラム表示を統合した DataTable の推奨実装:

```tsx
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
} from "@tanstack/react-table"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
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
  })

  // テーブルUI（basic-setup.md のレンダリングパターンを参照）
}
```

---

## 禁止事項

- `manualPagination: true` 設定時に `pageCount` または `rowCount` を省略しない
- ページネーション UI で `getCanPreviousPage()` / `getCanNextPage()` によるボタンの無効化チェックを省略しない
- 行選択カラムに `enableSorting: false` と `enableHiding: false` を設定しないまま使用しない
- `getSelectedRowModel()` を `manualPagination` と併用する際、現在ページのデータのみが返却される制約を考慮する
