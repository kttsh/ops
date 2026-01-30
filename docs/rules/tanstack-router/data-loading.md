# TanStack Router データローディング規約

## 概要

本ドキュメントは、TanStack Router のデータローディング機能の実装規約を定めるものです。
ルートレベルでのデータ取得、キャッシュ制御、ローディング状態の管理パターンを規定します。

---

## 前提

- TanStack Router の組み込みローダーを使用
- 外部データフェッチライブラリ（TanStack Query 等）との統合も可能
- すべてのローダーはルートレベルで定義し、コンポーネント内でのデータ取得は避ける

---

## ローダーの基本

### loader 関数

各ルートで `loader` オプションを定義し、ルートに必要なデータを事前に取得します。

```tsx
// src/routes/posts/$postId.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    const post = await fetchPost(params.postId)
    return post
  },
  component: PostDetailPage,
})

function PostDetailPage() {
  const post = Route.useLoaderData()
  return <h1>{post.title}</h1>
}
```

### loader のコンテキスト

`loader` 関数は以下のコンテキストを受け取ります。

| プロパティ | 型 | 説明 |
|---|---|---|
| `params` | object | 親ルートからマージされたパスパラメータ |
| `deps` | object | `loaderDeps` の出力 |
| `context` | object | ルーターと親ルートからマージされたコンテキスト |
| `abortController` | AbortController | キャンセル用シグナル |
| `preload` | boolean | プリロード実行かどうか |
| `location` | object | 現在のパースされたロケーション |
| `navigate` | function | プログラマティックナビゲーション |
| `cause` | string | 実行理由: `'preload'` \| `'enter'` \| `'stay'` |

---

## beforeLoad フック

`beforeLoad` はローダーより前に実行されるフックです。認証チェック、リダイレクト、コンテキスト注入に使用します。

```tsx
export const Route = createFileRoute('/dashboard')({
  beforeLoad: async ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }
    // コンテキストを返すと、loaderやコンポーネントで利用可能
    return { user: context.auth.user }
  },
  loader: async ({ context }) => {
    // beforeLoad で返されたコンテキストにアクセス可能
    return await fetchDashboardData(context.user.id)
  },
})
```

### beforeLoad vs loader

| 特性 | beforeLoad | loader |
|---|---|---|
| 実行順序 | 先に実行（外→内の順で逐次） | 後に実行（並列） |
| Search Params アクセス | あり | なし（`loaderDeps` 経由） |
| Loader Deps アクセス | なし | あり |
| コンテキスト返却 | 可能 | 不可 |
| リダイレクト | 可能 | 可能 |
| 主な用途 | 認証・リダイレクト | データ取得 |

### 実行順序の重要なポイント

1. `beforeLoad` は**外側のルートから内側のルートへ順次**実行される
2. すべての `beforeLoad` が完了した後に、`loader` が**並列**で実行される
3. `beforeLoad` でエラーを投げると、子ルートの `beforeLoad` と `loader` は実行されない

---

## loaderDeps（ローダー依存関係）

Search Params をローダーに渡す場合は、`loaderDeps` を使用してキャッシュ無効化の粒度を制御します。

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { zodValidator, fallback } from '@tanstack/zod-adapter'

const searchSchema = z.object({
  page: fallback(z.number().int().positive(), 1),
  sort: fallback(z.enum(['name', 'date']), 'date'),
})

export const Route = createFileRoute('/posts')({
  validateSearch: zodValidator(searchSchema),
  loaderDeps: ({ search: { page, sort } }) => ({ page, sort }),
  loader: async ({ deps: { page, sort } }) => {
    return await fetchPosts({ page, sort })
  },
  component: PostsPage,
})
```

### loaderDeps の仕組み

- `loaderDeps` は Search Params から安定した値を計算する
- 依存値が**ディープイコール**で比較され、変更時にローダーが再実行される
- ルートが変わらなくても依存値が変われば再フェッチされる

---

## キャッシュ制御

### キャッシュオプション

| オプション | デフォルト | 説明 |
|---|---|---|
| `staleTime` | 0ms | データが新鮮とみなされる期間 |
| `gcTime` | 30分 | ガベージコレクションまでの期間 |
| `preloadStaleTime` | 30秒 | プリロード時のデータ新鮮期間 |
| `preloadGcTime` | 30分 | プリロードキャッシュのGC期間 |

### キャッシュの状態遷移

```
fresh（新鮮）→ stale（古い）→ garbage-collectable（GC対象）
```

- `staleTime` 期間中: データは新鮮でありそのまま使用される
- `staleTime` 超過 〜 `gcTime` 未満: **SWR**（Stale-While-Revalidate）パターンで古いデータを表示しつつバックグラウンドで再取得
- `gcTime` 超過: キャッシュエントリが削除される

### ルートレベルのキャッシュ設定

```tsx
export const Route = createFileRoute('/posts')({
  loader: async () => fetchPosts(),
  staleTime: 1000 * 60 * 5, // 5分間新鮮
  gcTime: 1000 * 60 * 30,   // 30分後にGC
})
```

### ルーターレベルのデフォルト設定

```tsx
const router = createRouter({
  routeTree,
  defaultStaleTime: 1000 * 60, // 全ルートで1分間新鮮
  defaultGcTime: 1000 * 60 * 30,
})
```

---

## ローディング状態の管理

### Pending コンポーネント

ローダーの解決に時間がかかる場合に表示されるコンポーネントです。

```tsx
export const Route = createFileRoute('/posts')({
  loader: async () => fetchPosts(),
  pendingComponent: PostsLoading,
  pendingMs: 1000,    // 1秒後にペンディングUIを表示（デフォルト）
  pendingMinMs: 500,  // 最低500ms表示（フラッシュ防止、デフォルト）
})

function PostsLoading() {
  return <div>読み込み中...</div>
}
```

| オプション | デフォルト | 説明 |
|---|---|---|
| `pendingMs` | 1000ms | ペンディングUI表示までの遅延 |
| `pendingMinMs` | 500ms | ペンディングUIの最低表示時間 |
| `pendingComponent` | undefined | ローディング中に表示するコンポーネント |

---

## エラーハンドリング

### errorComponent

ローダーやコンポーネントでエラーが発生した場合に表示するコンポーネントです。

```tsx
export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    const post = await fetchPost(params.postId)
    if (!post) {
      throw notFound()
    }
    return post
  },
  errorComponent: PostErrorComponent,
  notFoundComponent: PostNotFoundComponent,
})

function PostErrorComponent({ error }: { error: Error }) {
  return <div>エラーが発生しました: {error.message}</div>
}

function PostNotFoundComponent() {
  return <div>記事が見つかりませんでした</div>
}
```

### ルーターレベルのデフォルトエラーコンポーネント

```tsx
const router = createRouter({
  routeTree,
  defaultErrorComponent: DefaultError,
  defaultNotFoundComponent: DefaultNotFound,
})
```

### notFound() 関数

リソースが見つからない場合に `notFound()` をスローします。

```tsx
import { notFound } from '@tanstack/react-router'

// loader 内で使用
loader: async ({ params }) => {
  const post = await fetchPost(params.postId)
  if (!post) {
    throw notFound()
  }
  return post
}
```

### notFoundMode

| モード | 説明 |
|---|---|
| `"fuzzy"`（デフォルト） | 最も近い一致するルートの `notFoundComponent` を表示 |
| `"root"` | すべての Not Found エラーをルートルートで処理 |

---

## 遅延データローディング（Deferred）

重要でないデータを遅延して読み込み、ユーザーに素早くUIを表示します。

```tsx
export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    // クリティカルデータは await する
    const post = await fetchPost(params.postId)

    // 非クリティカルデータは await しない（Promise のまま返す）
    const comments = fetchComments(params.postId)

    return { post, comments }
  },
  component: PostDetailPage,
})

function PostDetailPage() {
  const { post, comments } = Route.useLoaderData()

  return (
    <div>
      <h1>{post.title}</h1>
      <p>{post.body}</p>

      <Suspense fallback={<div>コメント読み込み中...</div>}>
        <Await promise={comments}>
          {(data) => <CommentList comments={data} />}
        </Await>
      </Suspense>
    </div>
  )
}
```

---

## 外部データフェッチライブラリとの統合

TanStack Query などの外部ライブラリと統合する場合は、ルートの `loader` でプリフェッチを行います。

```tsx
// src/routes/posts/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { queryClient } from '@/lib/query-client'
import { postsQueryOptions } from '@/features/posts/api/queries'

export const Route = createFileRoute('/posts')({
  loader: async () => {
    // TanStack Query でプリフェッチ
    await queryClient.ensureQueryData(postsQueryOptions())
  },
  component: PostsPage,
})

function PostsPage() {
  // コンポーネント内で TanStack Query の hooks を使用
  const { data: posts } = useSuspenseQuery(postsQueryOptions())
  return <PostList posts={posts} />
}
```

---

## キャッシュの無効化

### router.invalidate()

現在のルートマッチを無効化し、リロードします。

```tsx
import { useRouter } from '@tanstack/react-router'

function RefreshButton() {
  const router = useRouter()

  return (
    <button onClick={() => router.invalidate()}>
      データを更新
    </button>
  )
}
```

### router.clearCache()

リロードせずにキャッシュをクリアします。

---

## データアクセスフック

| フック | 説明 |
|---|---|
| `Route.useLoaderData()` | ローダーデータを取得（型安全） |
| `Route.useLoaderDeps()` | ローダー依存値を取得 |
| `Route.useParams()` | パスパラメータを取得 |
| `Route.useSearch()` | Search Params を取得 |
| `Route.useRouteContext()` | ルートコンテキストを取得 |
| `Route.useMatch()` | ルートマッチオブジェクトを取得 |

```tsx
function PostDetailPage() {
  const post = Route.useLoaderData()
  const { postId } = Route.useParams()
  const search = Route.useSearch()
  const context = Route.useRouteContext()

  return <div>{post.title}</div>
}
```

---

## 参考リンク

- [Data Loading](https://tanstack.com/router/v1/docs/framework/react/guide/data-loading)
- [Deferred Data Loading](https://tanstack.com/router/v1/docs/framework/react/guide/deferred-data-loading)
- [External Data Loading](https://tanstack.com/router/v1/docs/framework/react/guide/external-data-loading)
- [DeepWiki: Data Loading and Caching](https://deepwiki.com/tanstack/router/2.3-data-loading-and-caching)
