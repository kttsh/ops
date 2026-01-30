# TanStack Query Mutation 規約

## 概要

本ドキュメントは、TanStack Query v5 の `useMutation` によるデータ変更操作（作成・更新・削除）の実装規約を定めるものです。
楽観的更新、キャッシュ無効化、コールバックパターンを規定します。

---

## 前提

- `useMutation` を使用してすべてのデータ変更を行う
- mutation 後は**必ず**関連クエリのキャッシュを無効化する
- mutation 関数は features ディレクトリの `api/mutations.ts` に定義する

---

## ファイル配置

```
src/features/[feature]/api/
├── queries.ts      # queryOptions 定義
├── mutations.ts    # mutation 関数定義
└── api-client.ts   # API クライアント
```

---

## 基本パターン

### mutation 関数の定義

```ts
// src/features/posts/api/mutations.ts
import type { CreatePostInput, UpdatePostInput } from '../types'

export async function createPost(input: CreatePostInput) {
  const res = await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error('Failed to create post')
  return res.json()
}

export async function updatePost(params: { id: string; data: UpdatePostInput }) {
  const res = await fetch(`/api/posts/${params.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params.data),
  })
  if (!res.ok) throw new Error('Failed to update post')
  return res.json()
}

export async function deletePost(id: string) {
  const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete post')
}
```

### useMutation の使用

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createPost } from '../api/mutations'
import { postQueries } from '../api/queries'

function CreatePostForm() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      // 一覧キャッシュを無効化して再取得
      queryClient.invalidateQueries({ queryKey: postQueries.lists() })
    },
  })

  const handleSubmit = (data: CreatePostInput) => {
    mutation.mutate(data)
  }

  return (
    <form onSubmit={handleSubmit}>
      {mutation.isPending && <p>送信中...</p>}
      {mutation.isError && <p>エラー: {mutation.error.message}</p>}
      {/* フォーム内容 */}
    </form>
  )
}
```

---

## コールバックパターン

### onSuccess / onError / onSettled

| コールバック | タイミング | 主な用途 |
|---|---|---|
| `onMutate` | mutation 実行前 | 楽観的更新の準備 |
| `onSuccess` | 成功時 | キャッシュ無効化、トースト表示 |
| `onError` | 失敗時 | ロールバック、エラー表示 |
| `onSettled` | 成功・失敗問わず | キャッシュ無効化（確実に実行） |

### 推奨パターン: onSettled でキャッシュ無効化

成功・失敗を問わずキャッシュを最新に保つため、`onSettled` で `invalidateQueries` を呼ぶ。

```ts
const mutation = useMutation({
  mutationFn: updatePost,
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: postQueries.all() })
  },
})
```

### 複数クエリの無効化

```ts
onSettled: async () => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: postQueries.all() }),
    queryClient.invalidateQueries({ queryKey: ['comments'] }),
  ])
}
```

---

## 楽観的更新

### 方式 1: UI ベース（シンプル）

mutation の `variables` と `isPending` を使ってUIのみを即座に更新する。キャッシュは操作しない。

```tsx
function TodoList() {
  const queryClient = useQueryClient()
  const { data: todos } = useQuery(todoQueries.list())

  const addMutation = useMutation({
    mutationFn: addTodo,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todoQueries.lists() })
    },
  })

  return (
    <ul>
      {todos?.map((todo) => <TodoItem key={todo.id} todo={todo} />)}
      {/* 楽観的に表示（送信中のデータ） */}
      {addMutation.isPending && (
        <li style={{ opacity: 0.5 }}>{addMutation.variables.title}</li>
      )}
    </ul>
  )
}
```

**適用場面**: 楽観的表示が1箇所のみ、シンプルなUI更新で十分な場合。

### 方式 2: キャッシュベース（堅牢）

キャッシュを直接操作し、エラー時にロールバックする。

```ts
const updateMutation = useMutation({
  mutationFn: updatePost,
  onMutate: async (newPost) => {
    // 1. 進行中のクエリをキャンセル（楽観的更新の上書きを防止）
    await queryClient.cancelQueries({
      queryKey: postQueries.detail(newPost.id).queryKey,
    })

    // 2. 現在のキャッシュをスナップショット
    const previousPost = queryClient.getQueryData(
      postQueries.detail(newPost.id).queryKey,
    )

    // 3. キャッシュを楽観的に更新
    queryClient.setQueryData(
      postQueries.detail(newPost.id).queryKey,
      (old) => old ? { ...old, ...newPost.data } : old,
    )

    // 4. ロールバック用にスナップショットを返す
    return { previousPost }
  },
  onError: (_err, newPost, context) => {
    // エラー時にキャッシュをロールバック
    if (context?.previousPost) {
      queryClient.setQueryData(
        postQueries.detail(newPost.id).queryKey,
        context.previousPost,
      )
    }
  },
  onSettled: (_data, _error, newPost) => {
    // 成功・失敗を問わずサーバーデータと同期
    queryClient.invalidateQueries(postQueries.detail(newPost.id))
  },
})
```

**適用場面**: 複数コンポーネントでキャッシュを共有、即座のUI反映が必要な場合。

---

## 削除操作

### 基本パターン

```ts
const deleteMutation = useMutation({
  mutationFn: deletePost,
  onSuccess: () => {
    // 一覧を無効化
    queryClient.invalidateQueries({ queryKey: postQueries.lists() })
    // 削除したリソースのキャッシュを除去
    queryClient.removeQueries(postQueries.detail(postId))
  },
})
```

### 楽観的削除

```ts
const deleteMutation = useMutation({
  mutationFn: deletePost,
  onMutate: async (deletedId) => {
    await queryClient.cancelQueries({ queryKey: postQueries.lists() })

    const previousPosts = queryClient.getQueryData(
      postQueries.list().queryKey,
    )

    queryClient.setQueryData(
      postQueries.list().queryKey,
      (old) => old ? { ...old, data: old.data.filter((p) => p.id !== deletedId) } : old,
    )

    return { previousPosts }
  },
  onError: (_err, _id, context) => {
    if (context?.previousPosts) {
      queryClient.setQueryData(postQueries.list().queryKey, context.previousPosts)
    }
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: postQueries.all() })
  },
})
```

---

## mutation の状態管理

### useMutation の返り値

| プロパティ | 型 | 説明 |
|---|---|---|
| `mutate` | function | mutation を実行（fire-and-forget） |
| `mutateAsync` | function | mutation を実行（Promise を返す） |
| `isPending` | boolean | 実行中かどうか |
| `isSuccess` | boolean | 成功したかどうか |
| `isError` | boolean | エラーが発生したかどうか |
| `error` | Error \| null | エラーオブジェクト |
| `data` | unknown | mutation の返り値 |
| `variables` | unknown | mutation に渡された引数 |
| `reset` | function | mutation の状態をリセット |

### mutate vs mutateAsync

```ts
// mutate: コールバックでハンドリング（推奨）
mutation.mutate(data, {
  onSuccess: (result) => { /* ... */ },
  onError: (error) => { /* ... */ },
})

// mutateAsync: Promise で await（try-catch が必要）
try {
  const result = await mutation.mutateAsync(data)
} catch (error) {
  // エラーハンドリング必須
}
```

**原則**: `mutate` を使用する。`mutateAsync` は複数の mutation を直列実行する場合にのみ使う。

---

## invalidateQueries の Promise を返す

`onSettled` / `onSuccess` で `invalidateQueries` の Promise を返すと、再取得が完了するまで mutation が `pending` 状態を維持する。

```ts
const mutation = useMutation({
  mutationFn: createPost,
  onSettled: () => {
    // Promise を返す → 再取得完了まで isPending: true
    return queryClient.invalidateQueries({ queryKey: postQueries.lists() })
  },
})
```

---

## 参考リンク

- [Mutations](https://tanstack.com/query/v5/docs/react/guides/mutations)
- [Optimistic Updates](https://tanstack.com/query/v5/docs/react/guides/optimistic-updates)
- [Invalidations from Mutations](https://tanstack.com/query/v5/docs/react/guides/invalidations-from-mutations)
- [Concurrent Optimistic Updates (TkDodo)](https://tkdodo.eu/blog/concurrent-optimistic-updates-in-react-query)
