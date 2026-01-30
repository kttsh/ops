# TanStack Router 認証・ルートガード規約

## 概要

本ドキュメントは、TanStack Router における認証チェックおよびルートガード（Protected Routes）の実装規約を定めるものです。
`beforeLoad` によるガードパターン、リダイレクト、ロールベースアクセス制御を規定します。

---

## 基本方針

- 認証チェックは**コンポーネントレベルではなく `beforeLoad` で行う**
- パスレスレイアウトルートを使用してガードを一元管理する
- コンポーネントでの認証チェックは、保護されたコンテンツが一瞬表示されてしまうため禁止

---

## 基本的な認証ガードパターン

### ルーターコンテキストの定義

```tsx
// src/main.tsx
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

interface AuthContext {
  isAuthenticated: boolean
  user: User | null
}

interface RouterContext {
  auth: AuthContext
}

const router = createRouter({
  routeTree,
  context: {
    auth: undefined!, // 実行時に設定される
  },
})

// ルートルートでコンテキスト型を定義
// src/routes/__root.tsx
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'

interface RouterContext {
  auth: AuthContext
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
})

function RootComponent() {
  return <Outlet />
}
```

### パスレスレイアウトによる認証ガード

```tsx
// src/routes/_authenticated.tsx
import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      })
    }
  },
  component: () => <Outlet />,
})
```

### 認証済みルートのファイル配置

```
src/routes/
├── __root.tsx
├── index.tsx                  ← / （公開ページ）
│
├── _authenticated.tsx         ← 認証ガード（パスレスレイアウト）
├── _authenticated/
│   ├── dashboard.tsx          ← /dashboard（要認証）
│   ├── profile.tsx            ← /profile（要認証）
│   └── settings.tsx           ← /settings（要認証）
│
├── _guest.tsx                 ← 未認証ガード（ログイン済みならリダイレクト）
├── _guest/
│   ├── login.tsx              ← /login（未認証のみ）
│   └── register.tsx           ← /register（未認証のみ）
```

---

## 未認証ユーザー向けガード

ログイン済みのユーザーがログインページにアクセスした場合にリダイレクトします。

```tsx
// src/routes/_guest.tsx
import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_guest')({
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: () => <Outlet />,
})
```

---

## ログイン後のリダイレクト

ログイン前にアクセスしていたページにリダイレクトします。

```tsx
// src/routes/_guest/login.tsx
import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'
import { zodValidator, fallback } from '@tanstack/zod-adapter'

const searchSchema = z.object({
  redirect: fallback(z.string(), '/dashboard').default('/dashboard'),
})

export const Route = createFileRoute('/_guest/login')({
  validateSearch: zodValidator(searchSchema),
  component: LoginPage,
})

function LoginPage() {
  const { redirect: redirectTo } = Route.useSearch()
  const navigate = Route.useNavigate()

  const handleLogin = async (credentials: LoginCredentials) => {
    await login(credentials)
    // ログイン前のページにリダイレクト
    navigate({ to: redirectTo })
  }

  return <LoginForm onSubmit={handleLogin} />
}
```

---

## 非同期認証チェック

セッション検証など非同期の認証チェックを行う場合のパターンです。

```tsx
// src/routes/_authenticated.tsx
import { createFileRoute, redirect, isRedirect, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ location }) => {
    try {
      const user = await verifySession()
      if (!user) {
        throw redirect({
          to: '/login',
          search: { redirect: location.href },
        })
      }
      // コンテキストとしてユーザー情報を返す
      return { user }
    } catch (error) {
      // redirect はエラーとして投げられるため、再スローする
      if (isRedirect(error)) throw error

      // その他のエラー（ネットワークエラー等）もログインへリダイレクト
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }
  },
  component: () => <Outlet />,
})
```

### isRedirect の重要性

`beforeLoad` 内で `try/catch` を使う場合、`redirect()` はエラーとしてスローされます。
`isRedirect()` を使って意図的なリダイレクトと実際のエラーを区別する必要があります。

---

## ロールベースアクセス制御（RBAC）

```tsx
// src/routes/_authenticated/_admin.tsx
import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/_admin')({
  beforeLoad: ({ context }) => {
    if (context.auth.user?.role !== 'admin') {
      throw redirect({ to: '/unauthorized' })
    }
  },
  component: () => <Outlet />,
})
```

### ファイル構成例

```
src/routes/
├── _authenticated.tsx              ← 認証ガード
├── _authenticated/
│   ├── dashboard.tsx               ← /dashboard（一般ユーザー以上）
│   ├── profile.tsx                 ← /profile（一般ユーザー以上）
│   │
│   ├── _admin.tsx                  ← 管理者ガード（ネスト）
│   └── _admin/
│       ├── users.tsx               ← /users（管理者のみ）
│       └── system-settings.tsx     ← /system-settings（管理者のみ）
```

---

## beforeLoad の注意事項

| 注意点 | 説明 |
|---|---|
| 実行順序 | 外側のルートから内側のルートへ**逐次**実行される |
| 子ルートへの影響 | エラー/リダイレクトをスローすると子ルートは実行されない |
| `notFound` の制限 | `beforeLoad` 内の `notFound()` は常にルートルートで処理される |
| コンテキスト返却 | 返却値は子ルートの `beforeLoad` と `loader` のコンテキストに追加される |

---

## 参考リンク

- [Authenticated Routes](https://tanstack.com/router/v1/docs/framework/react/guide/authenticated-routes)
- [How to Set Up Authentication](https://tanstack.com/router/v1/docs/framework/react/how-to/setup-authentication)
- [DeepWiki: Navigation Guards](https://deepwiki.com/tanstack/router/9.3-navigation-guards-and-blocking)
