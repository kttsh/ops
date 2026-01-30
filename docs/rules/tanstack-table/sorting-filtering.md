# TanStack Table ソート・フィルタリング規約

## 概要

本ドキュメントは、TanStack Table のソート（Sorting）およびフィルタリング（Column Filtering / Global Filtering）機能の実装規約を定めるものです。

---

## 前提

- ソート・フィルタリングはクライアントサイドを基本とする
- 大量データ（数千行超）の場合はサーバーサイドを検討する
- 状態管理は React の `useState` で管理し、`useReactTable` の `state` オプションで渡す

---

## ソート

### 基本セットアップ

ソートを有効にするには `getSortedRowModel` を渡し、`SortingState` を管理します。

```tsx
import * as React from "react"
import {
  SortingState,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  // ...
}
```

### ソート可能なヘッダー

ヘッダーをクリックでソートを切り替えるUIを実装します。

```tsx
// カラム定義でソート可能なヘッダーを設定
{
  accessorKey: "email",
  header: ({ column }) => {
    return (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        メール
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    )
  },
},
```

### 再利用可能なソートヘッダーコンポーネント

```tsx
// src/components/data-table/data-table-column-header.tsx
import { Column } from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DataTableColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>
  title: string
  className?: string
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("-ml-3 h-8", className)}
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      <span>{title}</span>
      {column.getIsSorted() === "desc" ? (
        <ArrowDown className="ml-2 h-4 w-4" />
      ) : column.getIsSorted() === "asc" ? (
        <ArrowUp className="ml-2 h-4 w-4" />
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4" />
      )}
    </Button>
  )
}
```

使用例:

```tsx
{
  accessorKey: "email",
  header: ({ column }) => (
    <DataTableColumnHeader column={column} title="メール" />
  ),
},
```

### ソートのカラムオプション

| オプション | 型 | デフォルト | 説明 |
|---|---|---|---|
| `enableSorting` | `boolean` | `true` | カラムのソートを有効化 |
| `sortingFn` | `string \| Function` | 自動推定 | ソート関数 |
| `sortDescFirst` | `boolean` | `false` | 最初のソートを降順にする |
| `sortUndefined` | `false \| -1 \| 1` | `1` | undefined の扱い |
| `invertSorting` | `boolean` | `false` | ソート順を反転 |
| `enableMultiSort` | `boolean` | `true` | マルチカラムソート |

### 組み込みソート関数

| 関数名 | 説明 |
|---|---|
| `"alphanumeric"` | 英数字混在のソート |
| `"alphanumericCaseSensitive"` | 大文字小文字区別あり英数字ソート |
| `"text"` | テキストソート |
| `"textCaseSensitive"` | 大文字小文字区別ありテキストソート |
| `"datetime"` | 日時ソート |
| `"basic"` | 基本的な比較（`<` / `>`） |

```tsx
{
  accessorKey: "createdAt",
  header: "作成日",
  sortingFn: "datetime",
},
```

### カスタムソート関数

```tsx
{
  accessorKey: "priority",
  sortingFn: (rowA, rowB, columnId) => {
    const order = { high: 3, medium: 2, low: 1 }
    const a = order[rowA.getValue<string>(columnId)] ?? 0
    const b = order[rowB.getValue<string>(columnId)] ?? 0
    return a - b
  },
},
```

---

## カラムフィルタリング

### 基本セットアップ

カラムフィルタリングには `getFilteredRowModel` を渡し、`ColumnFiltersState` を管理します。

```tsx
import * as React from "react"
import {
  ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table"

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>([])

  const table = useReactTable({
    data,
    columns,
    state: { columnFilters },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  // ...
}
```

### フィルタ入力の実装

```tsx
<Input
  placeholder="メールでフィルタ..."
  value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
  onChange={(event) =>
    table.getColumn("email")?.setFilterValue(event.target.value)
  }
  className="max-w-sm"
/>
```

### 組み込みフィルタ関数

| 関数名 | 説明 |
|---|---|
| `"includesString"` | 大文字小文字無視の部分一致 |
| `"includesStringSensitive"` | 大文字小文字区別の部分一致 |
| `"equalsString"` | 大文字小文字無視の完全一致 |
| `"equalsStringSensitive"` | 大文字小文字区別の完全一致 |
| `"arrIncludes"` | 配列に含まれるか |
| `"arrIncludesAll"` | 配列にすべて含まれるか |
| `"arrIncludesSome"` | 配列にいずれか含まれるか |
| `"equals"` | 厳密等価比較 |
| `"weakEquals"` | 緩い等価比較 |
| `"inNumberRange"` | 数値範囲 |

```tsx
{
  accessorKey: "status",
  filterFn: "equalsString",
},
```

### カスタムフィルタ関数

```tsx
{
  accessorKey: "amount",
  filterFn: (row, columnId, filterValue) => {
    const amount = row.getValue<number>(columnId)
    const { min, max } = filterValue as { min: number; max: number }
    return amount >= min && amount <= max
  },
},
```

### ファセットフィルタ

カラムの一意な値を取得し、セレクト形式のフィルタUIを構築できます。

```tsx
import {
  getFacetedRowModel,
  getFacetedUniqueValues,
} from "@tanstack/react-table"

const table = useReactTable({
  // ...
  getFacetedRowModel: getFacetedRowModel(),
  getFacetedUniqueValues: getFacetedUniqueValues(),
})

// 一意な値を取得
const uniqueValues = table.getColumn("status")?.getFacetedUniqueValues()
// Map { "pending" => 5, "success" => 10, "failed" => 2 }
```

---

## グローバルフィルタリング

### 基本セットアップ

テーブル全体を横断して検索するグローバルフィルタを実装できます。

```tsx
const [globalFilter, setGlobalFilter] = React.useState("")

const table = useReactTable({
  data,
  columns,
  state: { globalFilter },
  onGlobalFilterChange: setGlobalFilter,
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
})
```

### ファジーフィルタ（あいまい検索）

`@tanstack/match-sorter-utils` を使用してランキングベースのファジー検索を実装します。

```bash
pnpm add @tanstack/match-sorter-utils
```

```tsx
import { rankItem } from "@tanstack/match-sorter-utils"
import { FilterFn } from "@tanstack/react-table"

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({ itemRank })
  return itemRank.passed
}

const table = useReactTable({
  data,
  columns,
  filterFns: { fuzzy: fuzzyFilter },
  globalFilterFn: "fuzzy",
  state: { globalFilter },
  onGlobalFilterChange: setGlobalFilter,
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getSortedRowModel: getSortedRowModel(),
})
```

---

## サーバーサイドソート・フィルタ

大量データを扱う場合、ソートとフィルタリングをサーバーに委譲します。

```tsx
const table = useReactTable({
  data,
  columns,
  state: { sorting, columnFilters },
  onSortingChange: setSorting,
  onColumnFiltersChange: setColumnFilters,
  getCoreRowModel: getCoreRowModel(),
  // getSortedRowModel / getFilteredRowModel を渡さない
  manualSorting: true,
  manualFiltering: true,
})
```

- `manualSorting: true` を指定するとクライアントサイドソートを無効化
- `manualFiltering: true` を指定するとクライアントサイドフィルタを無効化
- `sorting` / `columnFilters` の状態変更を監視し、API リクエストに反映する

```tsx
// TanStack Query との連携例
const { data = [] } = useQuery({
  queryKey: ["payments", sorting, columnFilters],
  queryFn: () =>
    fetchPayments({
      sortBy: sorting[0]?.id,
      sortOrder: sorting[0]?.desc ? "desc" : "asc",
      filters: columnFilters,
    }),
})
```

---

## 状態の組み合わせパターン

ソートとフィルタを同時に使用する場合の推奨パターン:

```tsx
export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] =
    React.useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <div>
      {/* グローバル検索 */}
      <Input
        placeholder="検索..."
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="max-w-sm"
      />

      {/* テーブル本体 */}
      {/* ... */}
    </div>
  )
}
```

---

## 禁止事項

- ソート・フィルタの状態を `useReactTable` 外部で直接操作しない
- `manualSorting` / `manualFiltering` を `true` にしたまま `getSortedRowModel` / `getFilteredRowModel` を渡さない（パフォーマンス上の問題になる）
- フィルタ関数内で副作用を発生させない
