# TanStack Table 基本セットアップ・カラム定義規約

## 概要

本ドキュメントは、TanStack Table（`@tanstack/react-table`）を使用したデータテーブルの基本的なセットアップとカラム定義の実装規約を定めるものです。
`apps/frontend` のテーブル実装時に本ガイドを遵守してください。

---

## 前提

- ライブラリ: **@tanstack/react-table** (v8+)
- UIコンポーネント: **shadcn/ui** の `<Table />` コンポーネント
- 型安全: **TypeScript** を使用した型安全なカラム定義
- ヘッドレスUI: TanStack Table はマークアップ・スタイルを一切提供しない。UIの構築は開発者の責任

---

## セットアップ

### 必須パッケージ

```bash
# TanStack Table React アダプター
pnpm add @tanstack/react-table

# shadcn/ui テーブルコンポーネント（未追加の場合）
pnpm dlx shadcn@latest add table
```

---

## ファイル構成

各テーブルは以下の構成で実装します。feature ディレクトリの中に配置してください。

```
src/features/[feature]/
├── components/
│   ├── columns.tsx          # カラム定義
│   ├── data-table.tsx       # DataTable コンポーネント
│   └── data-table-*.tsx     # テーブル関連のサブコンポーネント（後述）
├── types/
│   └── index.ts             # データ型定義
└── index.ts                 # パブリック API エクスポート
```

### 共通 DataTable コンポーネント

複数の feature で同一の DataTable コンポーネントを使い回す場合は、`src/components/` 配下に配置します。

```
src/components/
├── data-table/
│   ├── data-table.tsx           # 汎用 DataTable コンポーネント
│   ├── data-table-pagination.tsx
│   ├── data-table-column-header.tsx
│   └── data-table-toolbar.tsx
```

---

## データ型定義

テーブルの行データは必ず型を定義します。この型は `ColumnDef` のジェネリクスに使用されます。

```ts
// src/features/payments/types/index.ts
export type Payment = {
  id: string
  amount: number
  status: "pending" | "processing" | "success" | "failed"
  email: string
}
```

---

## カラム定義

### 基本ルール

- カラム定義は `columns.tsx` に分離して定義する
- `ColumnDef<TData>[]` 型を使用する
- `"use client"` ディレクティブを付与する（Next.js / TanStack Start 使用時）

### 3種類のカラム

| 種別 | 用途 | データモデル | ソート・フィルタ |
|------|------|-------------|----------------|
| **Accessor Column** | データ表示 | あり | 可能 |
| **Display Column** | アクション・チェックボックス等 | なし | 不可 |
| **Group Column** | カラムのグループ化 | なし | 不可 |

### Accessor Column の定義

データモデルに紐づくカラムです。`accessorKey` または `accessorFn` で値を取得します。

```tsx
// src/features/payments/components/columns.tsx
"use client"

import { ColumnDef } from "@tanstack/react-table"
import type { Payment } from "../types"

export const columns: ColumnDef<Payment>[] = [
  // accessorKey によるシンプルな定義
  {
    accessorKey: "status",
    header: "ステータス",
  },

  // accessorKey + カスタム cell レンダリング
  {
    accessorKey: "amount",
    header: () => <div className="text-right">金額</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"))
      const formatted = new Intl.NumberFormat("ja-JP", {
        style: "currency",
        currency: "JPY",
      }).format(amount)
      return <div className="text-right font-medium">{formatted}</div>
    },
  },

  // accessorFn による値の変換（id 必須）
  {
    id: "fullName",
    accessorFn: (row) => `${row.lastName} ${row.firstName}`,
    header: "氏名",
  },
]
```

### `createColumnHelper` の使用

型安全性を最大限に活用する場合は `createColumnHelper` を使用します。

```tsx
import { createColumnHelper } from "@tanstack/react-table"
import type { Payment } from "../types"

const columnHelper = createColumnHelper<Payment>()

export const columns = [
  columnHelper.accessor("status", {
    header: "ステータス",
    cell: (info) => info.getValue(),
  }),

  columnHelper.accessor("amount", {
    header: () => <div className="text-right">金額</div>,
    cell: (info) => {
      const formatted = new Intl.NumberFormat("ja-JP", {
        style: "currency",
        currency: "JPY",
      }).format(info.getValue())
      return <div className="text-right font-medium">{formatted}</div>
    },
  }),

  // Display Column（アクションボタン等）
  columnHelper.display({
    id: "actions",
    cell: ({ row }) => <RowActions payment={row.original} />,
  }),
]
```

### Display Column の定義

チェックボックスやアクションメニューなど、データモデルに紐づかないカラムに使用します。

```tsx
// 選択チェックボックス
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

// アクションメニュー
{
  id: "actions",
  cell: ({ row }) => {
    const payment = row.original
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">メニューを開く</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>アクション</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => navigator.clipboard.writeText(payment.id)}
          >
            IDをコピー
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>詳細を表示</DropdownMenuItem>
          <DropdownMenuItem>編集</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  },
},
```

### ColumnDef の主要オプション

| オプション | 型 | 説明 |
|---|---|---|
| `id` | `string` | カラムの一意識別子。`accessorKey` 未使用時に必須 |
| `accessorKey` | `string` | 行データから値を取得するキー |
| `accessorFn` | `(row) => any` | 行データから値を取得する関数 |
| `header` | `string \| Function` | ヘッダーの表示内容 |
| `cell` | `string \| Function` | セルの表示内容 |
| `footer` | `string \| Function` | フッターの表示内容 |
| `meta` | `object` | カラムに付与する任意のメタデータ |
| `enableSorting` | `boolean` | ソートの有効化（デフォルト: `true`） |
| `enableColumnFilter` | `boolean` | カラムフィルタの有効化 |
| `enableHiding` | `boolean` | カラム表示/非表示切替の有効化 |
| `sortingFn` | `string \| Function` | カスタムソート関数 |
| `filterFn` | `string \| Function` | カスタムフィルタ関数 |
| `size` / `minSize` / `maxSize` | `number` | カラム幅の制御 |

---

## テーブルインスタンスの作成

### useReactTable フック

`useReactTable` に `data`、`columns`、および必要な RowModel を渡してテーブルインスタンスを生成します。

```tsx
// src/features/payments/components/data-table.tsx
"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
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
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
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
  )
}
```

### テーブルの利用

```tsx
// ルートコンポーネントやページコンポーネントから利用
import { columns } from "@/features/payments/components/columns"
import { DataTable } from "@/features/payments/components/data-table"
import type { Payment } from "@/features/payments/types"

function PaymentsPage() {
  const payments: Payment[] = usePayments() // データ取得

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={payments} />
    </div>
  )
}
```

---

## データの安定参照

### 必須ルール

`data` と `columns` は安定した参照を持つ必要があります。React のレンダリングサイクルで毎回新しいオブジェクトを生成すると、無限再レンダリングが発生します。

```tsx
// --- NG: インラインで毎回新しい配列を生成 ---
function BadTable() {
  const table = useReactTable({
    data: fetchData(), // 毎回新しい配列
    columns: [...],    // 毎回新しい配列
    getCoreRowModel: getCoreRowModel(),
  })
}

// --- OK: useState / useMemo で安定参照を確保 ---
function GoodTable() {
  const [data] = React.useState(() => fetchInitialData())
  // or
  const data = React.useMemo(() => transformedData, [rawData])

  const table = useReactTable({
    data,
    columns, // モジュールスコープで定義済み
    getCoreRowModel: getCoreRowModel(),
  })
}

// --- OK: TanStack Query を使用（推奨） ---
function BestTable() {
  const { data = [] } = useQuery({
    queryKey: ["payments"],
    queryFn: fetchPayments,
  })

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })
}
```

### columns の定義場所

- columns はコンポーネント外（モジュールスコープ）で定義する
- コンポーネント内で定義する場合は `useMemo` でメモ化する
- `columns.tsx` に分離するパターンを推奨

---

## RowModel 一覧

各機能を有効化するには、対応する RowModel を `useReactTable` に渡します。

| RowModel | 用途 | import |
|---|---|---|
| `getCoreRowModel` | 基本（必須） | `@tanstack/react-table` |
| `getSortedRowModel` | ソート | `@tanstack/react-table` |
| `getFilteredRowModel` | フィルタリング | `@tanstack/react-table` |
| `getPaginationRowModel` | ページネーション | `@tanstack/react-table` |
| `getGroupedRowModel` | グルーピング | `@tanstack/react-table` |
| `getExpandedRowModel` | 行展開 | `@tanstack/react-table` |
| `getFacetedRowModel` | ファセット | `@tanstack/react-table` |
| `getFacetedUniqueValues` | ファセット一意値 | `@tanstack/react-table` |
| `getFacetedMinMaxValues` | ファセット最小最大値 | `@tanstack/react-table` |

```tsx
import {
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
})
```

---

## flexRender

TanStack Table のセル・ヘッダー・フッターのレンダリングには必ず `flexRender` を使用します。

```tsx
import { flexRender } from "@tanstack/react-table"

// ヘッダー
flexRender(header.column.columnDef.header, header.getContext())

// セル
flexRender(cell.column.columnDef.cell, cell.getContext())

// フッター
flexRender(footer.column.columnDef.footer, footer.getContext())
```

---

## 禁止事項

- コンポーネント内でカラム定義をメモ化せずに記述しない
- `data` にインラインの配列リテラルを渡さない
- `getCoreRowModel` を省略しない（必須 RowModel）
- `flexRender` を使わずにセル内容を直接レンダリングしない
