# TanStack Query 応用パターン規約

## 概要

本ドキュメントは、TanStack Query v5 の応用パターン（依存クエリ、並列クエリ、無限スクロール、テスト）の実装規約を定めるものです。

---

## 依存クエリ（Dependent Queries）

### enabled オプションによる制御

先行クエリの結果に依存するクエリは `enabled` で実行を制御する。

```tsx
function UserProjects({ userId }: { userId: string }) {
  // 1. ユーザー情報を取得
  const { data: user } = useQuery(userQueries.detail(userId))

  // 2. ユーザーの組織IDが取れたらプロジェクトを取得
  const { data: projects } = useQuery({
    ...projectQueries.listByOrg(user?.organizationId ?? ''),
    enabled: !!user?.organizationId,
  })

  return <ProjectList projects={projects} />
}
```

### 注意事項

- 依存クエリはリクエストウォーターフォールを生むため、パフォーマンス上不利
- 可能な限り**バックエンド API を統合**して並列取得に変更する
- `useSuspenseQuery` では `enabled` は使用不可（Suspense が代替する）

---

## 並列クエリ（Parallel Queries）

### 複数の useQuery

独立したクエリは別々の `useQuery` で並列実行される。

```tsx
function Dashboard() {
  const { data: posts } = useQuery(postQueries.list())
  const { data: users } = useQuery(userQueries.list())
  const { data: stats } = useQuery(statsQueries.summary())

  // 3つのクエリが並列に実行される
  return (
    <div>
      <PostSection posts={posts} />
      <UserSection users={users} />
      <StatsSection stats={stats} />
    </div>
  )
}
```

### useQueries（動的な並列クエリ）

クエリの数が動的な場合は `useQueries` を使用する。

```tsx
function UserDetails({ userIds }: { userIds: string[] }) {
  const results = useQueries({
    queries: userIds.map((id) => ({
      ...userQueries.detail(id),
    })),
  })

  return (
    <ul>
      {results.map((result, index) => (
        <li key={userIds[index]}>
          {result.isPending ? '読込中...' : result.data?.name}
        </li>
      ))}
    </ul>
  )
}
```

### 依存クエリ → 動的並列クエリ

先行クエリの結果を使って動的に並列クエリを実行するパターン。

```tsx
function PostCategories({ postId }: { postId: string }) {
  const { data: post } = useQuery(postQueries.detail(postId))

  // post が未取得の場合は空配列で useQueries を呼ぶ（hooks のルール遵守）
  const categoryResults = useQueries({
    queries: post?.categoryIds
      ? post.categoryIds.map((catId) => ({
          ...categoryQueries.detail(catId),
        }))
      : [],
  })

  return <CategoryList results={categoryResults} />
}
```

---

## 無限スクロール（useInfiniteQuery）

### 基本パターン

```ts
// src/features/posts/api/queries.ts
import { infiniteQueryOptions } from '@tanstack/react-query'

export const postQueries = {
  // ...既存のクエリ定義

  infinite: (filters?: PostFilters) =>
    infiniteQueryOptions({
      queryKey: ['posts', 'infinite', filters] as const,
      queryFn: async ({ pageParam }) => {
        const res = await fetch(
          `/api/posts?cursor=${pageParam ?? ''}&limit=20`,
        )
        return res.json() as Promise<{
          data: Post[]
          meta: { nextCursor: string | null }
        }>
      },
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.meta.nextCursor ?? undefined,
    }),
}
```

### コンポーネントでの使用

```tsx
import { useInfiniteQuery } from '@tanstack/react-query'
import { postQueries } from '../api/queries'

function InfinitePostList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery(postQueries.infinite())

  return (
    <div>
      {data?.pages.map((page) =>
        page.data.map((post) => <PostCard key={post.id} post={post} />),
      )}

      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? '読込中...' : 'もっと読む'}
        </button>
      )}
    </div>
  )
}
```

### 返り値の構造

| プロパティ | 型 | 説明 |
|---|---|---|
| `data.pages` | Array | 取得済みの全ページデータ |
| `data.pageParams` | Array | 各ページのパラメータ |
| `fetchNextPage` | function | 次ページを取得 |
| `hasNextPage` | boolean | 次ページが存在するか |
| `isFetchingNextPage` | boolean | 次ページ取得中か |

### maxPages によるメモリ制限

大量のページを保持しないように `maxPages` を設定する。

```ts
infiniteQueryOptions({
  queryKey: ['posts', 'infinite'],
  queryFn: fetchPostsPage,
  initialPageParam: undefined,
  getNextPageParam: (lastPage) => lastPage.meta.nextCursor ?? undefined,
  maxPages: 5, // 最大5ページ分のみキャッシュ
})
```

---

## Suspense 対応

### useSuspenseQuery

データのローディング状態を React Suspense に委譲する。`data` が常に `T` 型（`undefined` にならない）。

```tsx
import { useSuspenseQuery } from '@tanstack/react-query'

function PostDetail({ postId }: { postId: string }) {
  // data は T 型（undefined にならない）
  const { data: post } = useSuspenseQuery(postQueries.detail(postId))

  return <h1>{post.title}</h1>
}

// 親コンポーネントで Suspense を配置
function PostPage() {
  return (
    <Suspense fallback={<PostSkeleton />}>
      <PostDetail postId={postId} />
    </Suspense>
  )
}
```

### useSuspenseQuery の注意点

- `enabled` オプションは使用不可
- `placeholderData` は使用不可
- エラーは Error Boundary でキャッチされる
- 依存クエリは Suspense の仕組みで自動的にシリアル実行される

### TanStack Router との統合での Suspense

```tsx
// src/routes/posts/$postId.tsx
export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params, context: { queryClient } }) => {
    // loader でプリフェッチ → SSR 相当の高速表示
    await queryClient.ensureQueryData(postQueries.detail(params.postId))
  },
  component: PostDetailPage,
})

function PostDetailPage() {
  const { postId } = Route.useParams()
  // ensureQueryData 済みなので即座にデータが返る
  const { data: post } = useSuspenseQuery(postQueries.detail(postId))
  return <PostContent post={post} />
}
```

---

## テスト

### テスト用 QueryClient

テストごとに独立した QueryClient を生成する。

```ts
// src/test/utils.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react'

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,     // テストではリトライしない
        gcTime: Infinity, // テスト中にGCされないようにする
      },
    },
  })
}

export function renderWithQuery(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  const queryClient = createTestQueryClient()

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...options }),
    queryClient,
  }
}
```

### コンポーネントテスト

ネットワーク層をモックする（`useQuery` / `useMutation` 自体をモックしない）。

```ts
// MSW を使用したネットワークモック
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

const server = setupServer(
  http.get('/api/posts', () => {
    return HttpResponse.json({
      data: [{ id: '1', title: 'Test Post' }],
    })
  }),
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

test('投稿一覧が表示される', async () => {
  const { getByText } = renderWithQuery(<PostList />)

  await waitFor(() => {
    expect(getByText('Test Post')).toBeInTheDocument()
  })
})
```

### カスタムフックのテスト

```ts
import { renderHook, waitFor } from '@testing-library/react'

test('usePostQuery がデータを返す', async () => {
  const queryClient = createTestQueryClient()

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )

  const { result } = renderHook(
    () => useQuery(postQueries.detail('1')),
    { wrapper },
  )

  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true)
  })

  expect(result.current.data).toEqual({ id: '1', title: 'Test Post' })
})
```

### テストの原則

| 原則 | 説明 |
|---|---|
| QueryClient は毎テスト生成 | テスト間のキャッシュ汚染を防止 |
| `retry: false` | テストの安定性を確保 |
| ネットワーク層をモック | `useQuery` 自体はモックしない |
| `waitFor` で非同期アサーション | データ取得完了を待つ |
| MSW を推奨 | APIレスポンスのモックに使用 |

---

## 参考リンク

- [Dependent Queries](https://tanstack.com/query/v5/docs/framework/react/guides/dependent-queries)
- [Parallel Queries](https://tanstack.com/query/v5/docs/framework/react/guides/parallel-queries)
- [Infinite Queries](https://tanstack.com/query/v5/docs/react/guides/infinite-queries)
- [Testing](https://tanstack.com/query/v5/docs/framework/react/guides/testing)
- [Testing React Query (TkDodo)](https://tkdodo.eu/blog/testing-react-query)
