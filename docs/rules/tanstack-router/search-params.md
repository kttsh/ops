# TanStack Router Search Params 規約

## 概要

本ドキュメントは、TanStack Router における URL Search Params（クエリパラメータ）の管理規約を定めるものです。
Zod によるバリデーション、型安全なアクセス、ローダーとの連携パターンを規定します。

---

## 前提

- バリデーションライブラリ: **Zod** + **@tanstack/zod-adapter**
- Search Params は型安全で、バリデーション済みの値としてアクセスする
- フォールバック値を設定し、不正な URL パラメータでもエラーを出さない

---

## セットアップ

```bash
pnpm add zod @tanstack/zod-adapter
```

---

## 基本パターン

### validateSearch によるスキーマ定義

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { zodValidator, fallback } from '@tanstack/zod-adapter'
import { z } from 'zod'

const searchSchema = z.object({
  page: fallback(z.number().int().positive(), 1).default(1),
  sort: fallback(z.enum(['name', 'date', 'relevance']), 'date').default('date'),
  query: fallback(z.string(), '').default(''),
})

export const Route = createFileRoute('/posts')({
  validateSearch: zodValidator(searchSchema),
  component: PostsPage,
})
```

### コンポーネントでの使用

```tsx
function PostsPage() {
  const { page, sort, query } = Route.useSearch()
  // page: number, sort: 'name' | 'date' | 'relevance', query: string
  // すべて型安全にアクセス可能

  return (
    <div>
      <p>ページ: {page}, ソート: {sort}, 検索: {query}</p>
    </div>
  )
}
```

---

## fallback vs default vs catch

| メソッド | バリデーション失敗時 | 用途 |
|---|---|---|
| `fallback(schema, value)` | フォールバック値を使用（エラーなし） | **推奨**: ユーザー体験を損なわない |
| `.default(value)` | エラーを発生（errorComponent 表示） | バリデーション失敗を明示したい場合 |
| `.catch(value)` | Zod レベルでフォールバック | `fallback` の代替（アダプターなし） |

### 推奨パターン

```tsx
// 推奨: fallback + default の組み合わせ
const searchSchema = z.object({
  page: fallback(z.number().int().positive(), 1).default(1),
  category: fallback(z.string(), 'all').default('all'),
  showArchived: fallback(z.boolean(), false).default(false),
})
```

### 非推奨パターン

```tsx
// 非推奨: Zod の .catch() のみ（アダプターの型推論が効かない）
const searchSchema = z.object({
  page: z.number().catch(1),
})
```

---

## ローダーとの連携

Search Params をローダーに渡す場合は、必ず `loaderDeps` を経由します。

```tsx
const searchSchema = z.object({
  page: fallback(z.number().int().positive(), 1).default(1),
  sort: fallback(z.enum(['name', 'date']), 'date').default('date'),
  filter: fallback(z.string(), '').default(''),
})

export const Route = createFileRoute('/posts')({
  validateSearch: zodValidator(searchSchema),
  loaderDeps: ({ search: { page, sort, filter } }) => ({ page, sort, filter }),
  loader: async ({ deps: { page, sort, filter } }) => {
    return await fetchPosts({ page, sort, filter })
  },
  component: PostsPage,
})
```

### loaderDeps を使う理由

- ローダー関数は直接 Search Params にアクセスできない
- `loaderDeps` でキャッシュの無効化粒度を制御する
- 依存値はディープイコールで比較され、変更時のみローダーが再実行される

---

## Search Params の更新

### Link で更新

```tsx
import { Link } from '@tanstack/react-router'

function Pagination({ currentPage }: { currentPage: number }) {
  return (
    <div>
      <Link
        to="/posts"
        search={(prev) => ({ ...prev, page: currentPage - 1 })}
        disabled={currentPage <= 1}
      >
        前のページ
      </Link>
      <Link
        to="/posts"
        search={(prev) => ({ ...prev, page: currentPage + 1 })}
      >
        次のページ
      </Link>
    </div>
  )
}
```

### useNavigate で更新

```tsx
import { useNavigate } from '@tanstack/react-router'

function SortSelector() {
  const navigate = useNavigate()
  const { sort } = Route.useSearch()

  const handleSortChange = (newSort: string) => {
    navigate({
      to: '/posts',
      search: (prev) => ({ ...prev, sort: newSort, page: 1 }),
    })
  }

  return (
    <select value={sort} onChange={(e) => handleSortChange(e.target.value)}>
      <option value="date">日付順</option>
      <option value="name">名前順</option>
    </select>
  )
}
```

---

## 複雑な Search Params パターン

### 配列型パラメータ

```tsx
const searchSchema = z.object({
  tags: fallback(z.array(z.string()), []).default([]),
  status: fallback(
    z.array(z.enum(['active', 'archived', 'draft'])),
    ['active'],
  ).default(['active']),
})
```

### オプショナルパラメータ

```tsx
const searchSchema = z.object({
  // 必須パラメータ（デフォルト値あり）
  page: fallback(z.number(), 1).default(1),
  // オプショナルパラメータ（undefined 許容）
  query: z.string().optional(),
  categoryId: z.string().optional(),
})
```

### 日付型パラメータ

```tsx
const searchSchema = z.object({
  startDate: fallback(
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    '',
  ).default(''),
  endDate: fallback(
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    '',
  ).default(''),
})
```

---

## Search Middleware

Search Params を生成前に変換するミドルウェアです。

```tsx
export const Route = createFileRoute('/posts')({
  validateSearch: zodValidator(searchSchema),
  search: {
    middlewares: [
      // 特定の条件で Search Params を変換
      ({ search, next }) => {
        // page が 0 以下なら 1 にリセット
        if (search.page <= 0) {
          return next({ ...search, page: 1 })
        }
        return next(search)
      },
    ],
  },
})
```

---

## 注意事項

- Search Params はURLに直接反映されるため、機密情報を含めないこと
- `validateSearch` を定義しないルートでは Search Params の型安全が失われるため、必ずスキーマを定義すること
- `fallback` を使用して、不正な URL パラメータでもアプリケーションがクラッシュしないようにすること
- 複雑なオブジェクトを Search Params に含める場合は、JSONシリアライズ可能な形式にすること

---

## 参考リンク

- [Search Params](https://tanstack.com/router/v1/docs/framework/react/guide/search-params)
- [Validate Search Params with Schemas](https://tanstack.com/router/latest/docs/framework/react/how-to/validate-search-params)
- [Setup Basic Search Params](https://tanstack.com/router/latest/docs/framework/react/how-to/setup-basic-search-params)
- [DeepWiki: Search Parameters](https://deepwiki.com/TanStack/router/3.4-search-parameters)
