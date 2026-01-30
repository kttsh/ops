# TanStack Query セットアップ規約

## 概要

本ドキュメントは、TanStack Query（v5）のセットアップ、QueryClient 設定、プロバイダー構成の規約を定めるものです。
`apps/frontend` の実装時に本ガイドを遵守してください。

---

## 前提

- TanStack Query **v5** を使用
- フレームワーク: **React**（`@tanstack/react-query`）
- TanStack Router との統合を想定
- TypeScript 必須

---

## 必須パッケージ

```bash
# TanStack Query 本体
pnpm add @tanstack/react-query

# DevTools（開発時のみ）
pnpm add -D @tanstack/react-query-devtools
```

---

## QueryClient の設定

### ファイル配置

QueryClient はモジュールスコープで生成し、専用ファイルに分離する。

```
src/lib/query-client.ts
```

### 基本設定

```ts
// src/lib/query-client.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // 5分間新鮮
      gcTime: 1000 * 60 * 30,     // 30分後にGC
      retry: 1,                    // リトライ1回
      refetchOnWindowFocus: false, // ウィンドウフォーカス時の再取得を無効化
    },
    mutations: {
      retry: 0, // ミューテーションはリトライしない
    },
  },
})
```

### デフォルト値の理解

| オプション | デフォルト | 推奨値 | 説明 |
|---|---|---|---|
| `staleTime` | 0（即座に stale） | 5分 | データが新鮮とみなされる期間 |
| `gcTime` | 5分 | 30分 | 未使用データのGC猶予期間 |
| `retry` | 3 | 1 | 失敗時のリトライ回数 |
| `retryDelay` | 指数バックオフ | デフォルトのまま | リトライ間隔 |
| `refetchOnWindowFocus` | true | false | ウィンドウフォーカス時の再取得 |

### 設定の原則

- `gcTime` は `staleTime` **以上**に設定する（stale データが即座にGCされるのを防ぐ）
- QueryClient はコンポーネントツリーの**外側**（モジュールスコープ）で生成する
- レンダリングごとに再生成されないようにする

---

## プロバイダーの設定

### TanStack Router との統合

TanStack Router のルートコンテキストに QueryClient を注入する。

```tsx
// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from '@/lib/query-client'
import { routeTree } from './routeTree.gen'

const router = createRouter({
  routeTree,
  context: { queryClient },
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('root')!

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
)
```

### ルートコンテキストの型定義

```tsx
// src/routes/__root.tsx
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
})

function RootLayout() {
  return <Outlet />
}
```

---

## DevTools

### 設定

開発環境でのみ DevTools を表示する。

```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// QueryClientProvider の子要素として配置
<ReactQueryDevtools initialIsOpen={false} />
```

### DevTools で確認すべきポイント

- クエリのステータス（fresh / stale / fetching / paused）
- キャッシュの状態とキーの構造
- ミューテーションの実行状態

---

## useQueryClient の使用

コンポーネント内で QueryClient にアクセスする場合は `useQueryClient` を使用する。

```ts
import { useQueryClient } from '@tanstack/react-query'

function SomeComponent() {
  const queryClient = useQueryClient()

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['posts'] })
  }
}
```

---

## v5 の主な変更点（v4 からの移行時）

| 項目 | v4 | v5 |
|---|---|---|
| キャッシュタイム | `cacheTime` | `gcTime` |
| API 形式 | 位置引数 | **オブジェクト引数のみ** |
| エラーバウンダリ | `useErrorBoundary` | `throwOnError` |
| ステータス | `isLoading` | `isPending`（初回ロード） / `isFetching`（バックグラウンド） |
| TypeScript | オーバーロード | **単一オブジェクトパラメータ** |

---

## 参考リンク

- [TanStack Query v5 Overview](https://tanstack.com/query/v5/docs/react/overview)
- [QueryClientProvider](https://tanstack.com/query/v5/docs/framework/react/reference/QueryClientProvider)
- [Important Defaults](https://tanstack.com/query/v5/docs/react/guides/important-defaults)
- [Migrating to v5](https://tanstack.com/query/v5/docs/react/guides/migrating-to-v5)
