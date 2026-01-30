# TanStack Query queryOptions / Query Key Factory 規約

## 概要

本ドキュメントは、TanStack Query v5 の `queryOptions` ヘルパーと Query Key Factory パターンの実装規約を定めるものです。
クエリの定義・再利用・型安全性の担保方法を規定します。

---

## 前提

- `queryOptions` / `infiniteQueryOptions` を使用してクエリ定義を一元管理する
- Query Key と Query Function は**必ず同一の `queryOptions` 内に co-locate する**
- features ディレクトリの `api/` 配下にクエリ定義を配置する

---

## ファイル配置

```
src/features/[feature]/api/
├── queries.ts      # queryOptions 定義（Query Key Factory）
├── mutations.ts    # mutation 関数定義
└── api-client.ts   # API クライアント（fetch / axios）
```

---

## queryOptions ヘルパー

### 基本パターン

`queryOptions` で `queryKey`、`queryFn`、その他オプションを一箇所にまとめる。

```ts
// src/features/posts/api/queries.ts
import { queryOptions } from '@tanstack/react-query'
import { fetchPost, fetchPosts } from './api-client'

export function postsQueryOptions(filters?: PostFilters) {
  return queryOptions({
    queryKey: ['posts', 'list', filters] as const,
    queryFn: () => fetchPosts(filters),
  })
}

export function postQueryOptions(postId: string) {
  return queryOptions({
    queryKey: ['posts', 'detail', postId] as const,
    queryFn: () => fetchPost(postId),
    staleTime: 1000 * 60 * 5, // 5分
  })
}
```

### 使用箇所

同一の `queryOptions` を `useQuery`、`useSuspenseQuery`、`prefetchQuery`、`invalidateQueries` すべてで使用する。

```ts
// コンポーネントでのクエリ
const { data } = useQuery(postsQueryOptions(filters))

// Suspense 対応クエリ
const { data } = useSuspenseQuery(postQueryOptions(postId))

// loader でのプリフェッチ
await queryClient.ensureQueryData(postsQueryOptions())

// キャッシュの無効化
queryClient.invalidateQueries(postsQueryOptions())

// キャッシュから直接取得（型安全）
const cached = queryClient.getQueryData(postQueryOptions(postId).queryKey)
```

---

## Query Key Factory パターン

### 基本構造

feature ごとに Query Key Factory オブジェクトを定義し、キーの階層構造を管理する。

```ts
// src/features/posts/api/queries.ts
import { queryOptions, infiniteQueryOptions } from '@tanstack/react-query'
import { fetchPost, fetchPosts, fetchPostComments } from './api-client'
import type { PostFilters } from '../types'

export const postQueries = {
  // ベースキー（invalidateQueries で全ポスト関連キャッシュを無効化）
  all: () => ['posts'] as const,

  // 一覧系のベースキー
  lists: () => [...postQueries.all(), 'list'] as const,

  // フィルタ付き一覧
  list: (filters?: PostFilters) =>
    queryOptions({
      queryKey: [...postQueries.lists(), filters] as const,
      queryFn: () => fetchPosts(filters),
    }),

  // 詳細系のベースキー
  details: () => [...postQueries.all(), 'detail'] as const,

  // 単一リソース詳細
  detail: (postId: string) =>
    queryOptions({
      queryKey: [...postQueries.details(), postId] as const,
      queryFn: () => fetchPost(postId),
      staleTime: 1000 * 60 * 5,
    }),

  // 無限スクロール一覧
  infinite: (filters?: PostFilters) =>
    infiniteQueryOptions({
      queryKey: [...postQueries.all(), 'infinite', filters] as const,
      queryFn: ({ pageParam }) => fetchPosts({ ...filters, cursor: pageParam }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    }),

  // サブリソース
  comments: (postId: string) =>
    queryOptions({
      queryKey: [...postQueries.detail(postId).queryKey, 'comments'] as const,
      queryFn: () => fetchPostComments(postId),
    }),
}
```

### キーの階層と無効化の粒度

```
['posts']                              → postQueries.all()     全ポスト関連
['posts', 'list']                      → postQueries.lists()   一覧系すべて
['posts', 'list', { status: 'draft' }] → postQueries.list(...) 特定フィルタの一覧
['posts', 'detail']                    → postQueries.details() 詳細系すべて
['posts', 'detail', '123']             → postQueries.detail()  特定ポスト
['posts', 'detail', '123', 'comments'] → postQueries.comments() 特定ポストのコメント
```

```ts
// 全ポスト関連キャッシュを無効化
queryClient.invalidateQueries({ queryKey: postQueries.all() })

// 一覧キャッシュのみ無効化（詳細は維持）
queryClient.invalidateQueries({ queryKey: postQueries.lists() })

// 特定ポストの詳細のみ無効化
queryClient.invalidateQueries(postQueries.detail(postId))
```

---

## Query Key の設計原則

### 命名規則

| レベル | 例 | 説明 |
|---|---|---|
| エンティティ | `'posts'` | リソース名（複数形） |
| スコープ | `'list'` / `'detail'` / `'infinite'` | クエリの種類 |
| 識別子 | `postId` / `filters` | 一意に特定する値 |

### 必須ルール

1. Query Key は**配列**で定義する
2. `as const` を付与して型推論を有効にする
3. Key と Function は**必ず `queryOptions` 内に co-locate する**
4. オブジェクトをキーに含める場合、**プロパティの順序は型安全性に影響しない**（ディープイコール比較）

### アンチパターン

```ts
// NG: キーと関数を別々に管理
const QUERY_KEYS = {
  posts: ['posts'],
  post: (id: string) => ['posts', id],
}
const { data } = useQuery({
  queryKey: QUERY_KEYS.post(id),
  queryFn: () => fetchPost(id),
})

// OK: queryOptions で co-locate
const { data } = useQuery(postQueries.detail(id))
```

---

## コンポーネントでのオーバーライド

`queryOptions` の結果をスプレッドし、コンポーネント固有のオプションを上書きできる。

```ts
// select でデータ変換
const { data: postTitle } = useQuery({
  ...postQueries.detail(postId),
  select: (data) => data.title,
})

// enabled で条件付き実行
const { data } = useQuery({
  ...postQueries.detail(postId),
  enabled: !!postId,
})
```

---

## TanStack Router の loader との統合

```tsx
// src/routes/posts/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { postQueries } from '@/features/posts/api/queries'

export const Route = createFileRoute('/posts')({
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(postQueries.list())
  },
  component: PostsPage,
})

function PostsPage() {
  const { data } = useSuspenseQuery(postQueries.list())
  return <PostList posts={data} />
}
```

```tsx
// src/routes/posts/$postId.tsx
import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { postQueries } from '@/features/posts/api/queries'

export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params, context: { queryClient } }) => {
    await queryClient.ensureQueryData(postQueries.detail(params.postId))
  },
  component: PostDetailPage,
})

function PostDetailPage() {
  const { postId } = Route.useParams()
  const { data: post } = useSuspenseQuery(postQueries.detail(postId))
  return <h1>{post.title}</h1>
}
```

---

## 参考リンク

- [Query Options](https://tanstack.com/query/v5/docs/react/guides/query-options)
- [Query Keys](https://tanstack.com/query/v5/docs/react/guides/query-keys)
- [Query Key Factory (@lukemorales)](https://github.com/lukemorales/query-key-factory)
