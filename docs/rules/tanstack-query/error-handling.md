# TanStack Query エラーハンドリング規約

## 概要

本ドキュメントは、TanStack Query v5 のエラーハンドリング、リトライ戦略、Error Boundary 連携の規約を定めるものです。

---

## 前提

- グローバルエラーハンドリングは `QueryCache` / `MutationCache` の `onError` コールバックで行う
- Error Boundary との連携は `throwOnError` オプションで制御する
- リトライはクエリのデフォルト設定で一元管理する

---

## リトライ設定

### グローバル設定

```ts
// src/lib/query-client.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,                    // 1回リトライ（デフォルト: 3）
      retryDelay: (attemptIndex) => // 指数バックオフ（デフォルトのまま）
        Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 0, // ミューテーションはリトライしない
    },
  },
})
```

### 個別クエリでのオーバーライド

```ts
// 認証チェックなど、リトライ不要なクエリ
export function authQueryOptions() {
  return queryOptions({
    queryKey: ['auth', 'me'],
    queryFn: fetchCurrentUser,
    retry: false, // リトライしない
  })
}

// 重要度の高いクエリは多めにリトライ
export function criticalDataQueryOptions() {
  return queryOptions({
    queryKey: ['critical-data'],
    queryFn: fetchCriticalData,
    retry: 3,
  })
}
```

### 条件付きリトライ

```ts
// ステータスコードに応じてリトライを制御
retry: (failureCount, error) => {
  // 4xx エラーはリトライしない
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
    return false
  }
  return failureCount < 3
}
```

---

## グローバルエラーハンドリング

### QueryCache / MutationCache の onError

アプリ全体で共通のエラー処理（トースト通知、ログ送信等）を行う。

```ts
// src/lib/query-client.ts
import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query'
import { toast } from '@/lib/toast'

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // バックグラウンド再取得のエラーのみトーストで通知
      if (query.state.data !== undefined) {
        toast.error(`データの更新に失敗しました: ${error.message}`)
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      toast.error(`操作に失敗しました: ${error.message}`)
    },
  }),
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
})
```

### グローバル vs ローカルの使い分け

| スコープ | 方法 | 用途 |
|---|---|---|
| グローバル | `QueryCache` / `MutationCache` の `onError` | トースト通知、エラーログ |
| コンポーネント | `useMutation` の `onError` | フォームのエラー表示 |
| Error Boundary | `throwOnError` | 画面全体のフォールバック |

---

## Error Boundary 連携

### throwOnError

`throwOnError` を使用すると、クエリのエラーを React Error Boundary に伝播できる。

```ts
// 5xx エラーのみ Error Boundary に伝播
const { data } = useQuery({
  ...postQueries.detail(postId),
  throwOnError: (error) => {
    return error instanceof ApiError && error.status >= 500
  },
})
```

### QueryErrorResetBoundary

Error Boundary からの復帰時にクエリをリセットする。

```tsx
// src/components/ErrorBoundaryWithReset.tsx
import { QueryErrorResetBoundary } from '@tanstack/react-query'
import { ErrorBoundary } from 'react-error-boundary'

export function QueryErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={({ resetErrorBoundary, error }) => (
            <div>
              <p>エラーが発生しました: {error.message}</p>
              <button onClick={resetErrorBoundary}>再試行</button>
            </div>
          )}
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  )
}
```

### Error Boundary の配置

```tsx
// ページ単位で Error Boundary を配置
function PostsPage() {
  return (
    <QueryErrorBoundary>
      <PostList />
    </QueryErrorBoundary>
  )
}
```

---

## エラー型の定義

### API エラークラス

```ts
// src/lib/api-error.ts
export class ApiError extends Error {
  constructor(
    public status: number,
    public title: string,
    public detail?: string,
    public errors?: Array<{
      pointer: string
      message: string
    }>,
  ) {
    super(title)
    this.name = 'ApiError'
  }
}
```

### fetch ラッパーでのエラー変換

```ts
// src/lib/api-client.ts
import { ApiError } from './api-error'

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(
      res.status,
      body.title ?? 'Request failed',
      body.detail,
      body.errors,
    )
  }

  // 204 No Content
  if (res.status === 204) return undefined as T

  return res.json()
}
```

---

## クエリ状態によるエラー表示

### コンポーネントでのハンドリング

```tsx
function PostDetail({ postId }: { postId: string }) {
  const { data, error, isPending, isError } = useQuery(
    postQueries.detail(postId),
  )

  if (isPending) return <Skeleton />

  if (isError) {
    if (error instanceof ApiError && error.status === 404) {
      return <NotFound message="記事が見つかりません" />
    }
    return <ErrorMessage error={error} />
  }

  return <PostContent post={data} />
}
```

### mutation エラーのフォーム表示

```tsx
function CreatePostForm() {
  const mutation = useMutation({
    mutationFn: createPost,
  })

  return (
    <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(formData) }}>
      {/* フォームフィールド */}

      {mutation.isError && mutation.error instanceof ApiError && (
        <div>
          <p>{mutation.error.detail}</p>
          {mutation.error.errors?.map((e) => (
            <p key={e.pointer}>{e.message}</p>
          ))}
        </div>
      )}

      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? '送信中...' : '作成'}
      </button>
    </form>
  )
}
```

---

## エラーハンドリングの判断基準

| エラー種別 | 対応方法 |
|---|---|
| 400 バリデーションエラー | フォームにエラーメッセージを表示 |
| 401 認証エラー | ログインページにリダイレクト |
| 403 権限エラー | アクセス拒否メッセージを表示 |
| 404 リソース未検出 | Not Found コンポーネントを表示 |
| 409 競合エラー | ユーザーに確認を促す |
| 5xx サーバーエラー | Error Boundary で処理 / トースト通知 |
| ネットワークエラー | リトライ + トースト通知 |

---

## 参考リンク

- [Query Retries](https://tanstack.com/query/v5/docs/framework/react/guides/query-retries)
- [QueryErrorResetBoundary](https://tanstack.com/query/latest/docs/framework/react/reference/QueryErrorResetBoundary)
- [React Query Error Handling (TkDodo)](https://tkdodo.eu/blog/react-query-error-handling)
