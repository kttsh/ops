# TanStack Router ナビゲーション規約

## 概要

本ドキュメントは、TanStack Router におけるナビゲーション（画面遷移）の実装規約を定めるものです。
Link コンポーネント、useNavigate フック、リダイレクト、プリロード戦略を規定します。

---

## ナビゲーション手段の優先順位

| 優先度 | 手段 | 用途 |
|---|---|---|
| 1 | `<Link>` コンポーネント | ユーザー操作によるナビゲーション（最優先） |
| 2 | `useNavigate()` フック | 副作用によるプログラマティック遷移 |
| 3 | `<Navigate>` コンポーネント | レンダリング時の即時リダイレクト |
| 4 | `throw redirect()` | `beforeLoad` / `loader` 内でのリダイレクト |
| 5 | `router.navigate()` | コンポーネント外からの遷移（最終手段） |

---

## Link コンポーネント

### 基本的な使い方

`<Link>` は型安全な `<a>` タグを生成します。すべてのパス・パラメータ・Search Params は型チェックされます。

```tsx
import { Link } from '@tanstack/react-router'

// 静的ルートへのリンク
<Link to="/about">About</Link>

// 動的ルートへのリンク（params は型安全）
<Link to="/posts/$postId" params={{ postId: '123' }}>
  記事を見る
</Link>

// Search Params 付きリンク
<Link to="/posts" search={{ page: 2, sort: 'date' }}>
  2ページ目
</Link>

// ハッシュ付きリンク
<Link to="/docs" hash="installation">
  インストール
</Link>
```

### アクティブリンク

現在のルートに一致するリンクに対してスタイルを適用できます。

```tsx
<Link
  to="/posts"
  activeProps={{
    className: 'font-bold text-blue-600',
  }}
  inactiveProps={{
    className: 'text-gray-500',
  }}
>
  記事一覧
</Link>
```

### activeOptions

| オプション | デフォルト | 説明 |
|---|---|---|
| `exact` | `false` | 完全一致の場合のみアクティブとするか |
| `includeSearch` | `true` | Search Params も一致条件に含めるか |
| `includeHash` | `false` | ハッシュも一致条件に含めるか |

```tsx
<Link
  to="/posts"
  activeOptions={{ exact: true }}
  activeProps={{ className: 'active' }}
>
  記事一覧
</Link>
```

---

## プリロード

### プリロード戦略

ルートのデータを事前に取得し、遷移時の体感速度を向上させます。

| 戦略 | トリガー | 説明 |
|---|---|---|
| `false` | なし | プリロードしない |
| `"intent"` | ホバー/タッチ開始 | ユーザーの意図を検知してプリロード |
| `"viewport"` | ビューポート内に入った時 | スクロール等で表示領域に入った時 |
| `"render"` | コンポーネントレンダリング時 | 描画時に即座にプリロード |

```tsx
// Link 個別設定
<Link to="/posts/$postId" params={{ postId: '123' }} preload="intent">
  記事を見る
</Link>

// ルーターレベルのデフォルト設定
const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultPreloadDelay: 50, // ms（デフォルト: 50）
})
```

---

## useNavigate フック

副作用（フォーム送信後、タイマー完了後等）でプログラマティックに遷移する場合に使用します。

```tsx
import { useNavigate } from '@tanstack/react-router'

function CreatePostForm() {
  const navigate = useNavigate()

  const handleSubmit = async (data: PostFormData) => {
    const newPost = await createPost(data)
    // 作成した記事のページへ遷移
    navigate({
      to: '/posts/$postId',
      params: { postId: newPost.id },
    })
  }

  return <form onSubmit={handleSubmit}>{/* ... */}</form>
}
```

### navigate のオプション

```tsx
navigate({
  to: '/posts',
  search: { page: 1 },
  hash: 'top',
  replace: true,     // 履歴を置換（戻るボタンで前のページに戻れない）
  resetScroll: true,  // スクロール位置をリセット
})
```

---

## Navigate コンポーネント

レンダリング時に即座にナビゲーションを実行するコンポーネントです。条件付きリダイレクトに使用します。

```tsx
import { Navigate } from '@tanstack/react-router'

function OldPage() {
  // レンダリングされた瞬間にリダイレクト
  return <Navigate to="/new-page" replace />
}
```

---

## redirect 関数

`beforeLoad` や `loader` 内でリダイレクトを行う場合に使用します。

```tsx
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/old-page')({
  beforeLoad: () => {
    throw redirect({
      to: '/new-page',
      replace: true,
    })
  },
})
```

### 認証リダイレクトパターン

```tsx
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href, // ログイン後の戻り先を保存
        },
      })
    }
  },
})
```

---

## 相対ナビゲーション

すべてのナビゲーションは相対的です。`from` を指定しない場合、ルート `/` からの絶対パスとして扱われます。

```tsx
// 現在のルートからの相対ナビゲーション
navigate({ from: '/posts/$postId', to: '../' }) // /posts に遷移

// from を指定した Link
<Link from="/posts/$postId" to="../">
  記事一覧に戻る
</Link>
```

---

## linkOptions ヘルパー

ナビゲーションオプションを型安全に再利用できるヘルパー関数です。

```tsx
import { linkOptions } from '@tanstack/react-router'

// 再利用可能なリンクオプションを定義
const dashboardLink = linkOptions({
  to: '/dashboard',
  search: { tab: 'overview' },
})

// Link で使用
<Link {...dashboardLink}>ダッシュボード</Link>

// navigate で使用
navigate(dashboardLink)

// redirect で使用
throw redirect(dashboardLink)
```

---

## 注意事項

- サーバーサイドリダイレクトが必要な場合は、クライアントサイドナビゲーションではなくサーバー側で実装すること
- `<Link>` コンポーネントは `cmd/ctrl + クリック` で新しいタブでの表示をサポートするため、可能な限り `<Link>` を使用すること
- `useNavigate` はコンポーネント外では使用できないため、コンポーネント外から遷移する場合は `router.navigate()` を使用すること

---

## 参考リンク

- [Navigation](https://tanstack.com/router/v1/docs/framework/react/guide/navigation)
- [Link Options](https://tanstack.com/router/latest/docs/framework/react/guide/link-options)
- [useNavigate Hook](https://tanstack.com/router/v1/docs/framework/react/api/router/useNavigateHook)
- [DeepWiki: Navigation](https://deepwiki.com/TanStack/router/3.2-navigation)
