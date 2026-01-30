# TanStack Router ファイルベースルーティング規約

## 概要

本ドキュメントは、TanStack Router の File-based Routing を使用したフロントエンドルーティングの実装規約を定めるものです。
`apps/frontend` の実装時に本ガイドを遵守してください。

---

## 前提

- フレームワーク: **React** + **TanStack Router**
- ビルドツール: **Vite** + `@tanstack/router-vite-plugin`
- ルーティング方式: **File-based Routing**（推奨）
- ディレクトリ: `src/routes/` 配下にルートファイルを配置
- 生成ファイル: `src/routeTree.gen.ts`（自動生成、手動編集禁止）

---

## セットアップ

### 必須パッケージ

```bash
# TanStack Router 本体
pnpm add @tanstack/react-router

# Vite プラグイン
pnpm add -D @tanstack/router-vite-plugin

# Search Params バリデーション（必要に応じて）
pnpm add @tanstack/zod-adapter
```

### Vite 設定

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVitePlugin } from '@tanstack/router-vite-plugin'

export default defineConfig({
  plugins: [
    react(),
    TanStackRouterVitePlugin(),
  ],
})
```

### TSR 設定（オプション）

プロジェクトルートに `tsr.config.json` を作成して、ファイルベースルーティングの動作をカスタマイズできます。

```json
{
  "routesDirectory": "./src/routes",
  "generatedRouteTree": "./src/routeTree.gen.ts",
  "routeFileIgnorePrefix": "-",
  "autoCodeSplitting": true
}
```

| オプション | 型 | デフォルト | 説明 |
|---|---|---|---|
| `routesDirectory` | string | `./src/routes` | ルートファイルのディレクトリ |
| `generatedRouteTree` | string | `./src/routeTree.gen.ts` | 生成されるルートツリーのパス |
| `routeFileIgnorePrefix` | string | `"-"` | 無視するファイルのプレフィックス |
| `routeFileIgnorePattern` | string | undefined | 無視するファイルの正規表現パターン |
| `autoCodeSplitting` | boolean | undefined | 自動コード分割の有効化 |
| `indexToken` | string | `"index"` | インデックスルートのトークン |
| `routeToken` | string | `"route"` | ルートファイルのトークン |

---

## ディレクトリ構成

### 基本構成

```
src/routes/
├── __root.tsx              ← ルートルート（必須）
├── index.tsx               ← / （トップページ）
├── about.tsx               ← /about
│
├── posts/                  ← /posts 配下のネストルート
│   ├── index.tsx           ← /posts
│   ├── $postId.tsx         ← /posts/:postId（動的パラメータ）
│   └── $postId/
│       └── comments.tsx    ← /posts/:postId/comments
│
├── _auth/                  ← パスレスレイアウト（URLに影響しない）
│   ├── login.tsx           ← /login
│   └── signup.tsx          ← /signup
│
├── (admin)/                ← ルートグループ（URLに影響しない）
│   ├── users.tsx           ← /users
│   └── settings.tsx        ← /settings
│
├── admin.route.tsx         ← /admin（明示的ルートファイル）
├── admin.lazy.tsx          ← /admin（遅延読み込みコンポーネント）
│
├── docs/
│   └── $.tsx               ← /docs/*（スプラットルート）
│
└── -components/            ← 無視されるディレクトリ（コロケーション用）
    └── Header.tsx
```

---

## ファイル命名規則

### 特殊ファイル名パターン

| パターン | 用途 | URL への影響 | 例 |
|---|---|---|---|
| `__root.tsx` | ルートルート（必須） | なし | `__root.tsx` → 全画面の共通レイアウト |
| `index.tsx` | インデックスルート | セグメントの末尾 | `posts/index.tsx` → `/posts` |
| `$param.tsx` | 動的パラメータ | `:param` に対応 | `$postId.tsx` → `/posts/:postId` |
| `$.tsx` | スプラット（キャッチオール） | `*` に対応 | `docs/$.tsx` → `/docs/*` |
| `_prefix/` | パスレスレイアウト | URLに含まれない | `_auth/login.tsx` → `/login` |
| `(group)/` | ルートグループ | URLに含まれない | `(admin)/users.tsx` → `/users` |
| `*.route.tsx` | 明示的ルートファイル | 通常のパス | `admin.route.tsx` → `/admin` |
| `*.lazy.tsx` | 遅延読み込み | 通常のパス | `admin.lazy.tsx` → `/admin` |
| `-prefix` | 無視ファイル/ディレクトリ | 対象外 | `-components/` → ルーティング対象外 |

### フラットルート vs ディレクトリルート

ファイル名にドット `.` を使用することで、ディレクトリを作成せずにネストを表現できます。

```
# フラットルート（ドット区切り）
src/routes/
├── posts.tsx               ← /posts レイアウト
├── posts.index.tsx         ← /posts
└── posts.$postId.tsx       ← /posts/:postId

# ディレクトリルート（同じ結果）
src/routes/
├── posts/
│   ├── route.tsx           ← /posts レイアウト
│   ├── index.tsx           ← /posts
│   └── $postId.tsx         ← /posts/:postId
```

**使い分け基準:**
- **フラットルート**: ネストが浅い場合、子ルートが少ない場合
- **ディレクトリルート**: ネストが深い場合、子ルートが多い場合
- 両方を混在させることも可能

---

## ルートルート（__root.tsx）

すべてのルートの共通祖先。アプリケーション全体のレイアウトを定義します。

```tsx
// src/routes/__root.tsx
import { createRootRoute, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <div>
      <header>{/* 共通ヘッダー */}</header>
      <main>
        <Outlet />
      </main>
      <footer>{/* 共通フッター */}</footer>
    </div>
  )
}
```

### ルートルートの注意事項

- `__root.tsx` はコード分割の対象外（常にレンダリングされるため）
- `createRootRoute` または `createRootRouteWithContext` を使用
- `Outlet` コンポーネントで子ルートをレンダリング

---

## 基本ルート定義

### createFileRoute

すべてのルートファイルは `createFileRoute` を使用して定義します。パス文字列は Vite プラグインにより自動管理されます。

```tsx
// src/routes/about.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: AboutPage,
})

function AboutPage() {
  return <div>About ページ</div>
}
```

### 動的ルート

```tsx
// src/routes/posts/$postId.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/posts/$postId')({
  component: PostDetailPage,
  loader: async ({ params }) => {
    // params.postId は型安全
    return await fetchPost(params.postId)
  },
})

function PostDetailPage() {
  const post = Route.useLoaderData()
  return <div>{post.title}</div>
}
```

### スプラットルート

```tsx
// src/routes/docs/$.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/docs/$')({
  component: DocsPage,
})

function DocsPage() {
  const { _splat } = Route.useParams()
  // /docs/getting-started/install → _splat = "getting-started/install"
  return <div>ドキュメント: {_splat}</div>
}
```

---

## パスレスレイアウト（_prefix）

URLパスに影響を与えずに、子ルートに共通のレイアウトやロジックを適用します。

```tsx
// src/routes/_auth.tsx
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth')({
  component: AuthLayout,
})

function AuthLayout() {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <Outlet />
      </div>
    </div>
  )
}
```

```tsx
// src/routes/_auth/login.tsx → URL: /login
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/login')({
  component: LoginPage,
})
```

---

## ルートグループ（(group)）

ファイルの整理目的のみで使用し、URLやレイアウトに影響しません。

```
src/routes/
├── (marketing)/
│   ├── about.tsx       ← /about
│   └── pricing.tsx     ← /pricing
├── (dashboard)/
│   ├── overview.tsx    ← /overview
│   └── analytics.tsx   ← /analytics
```

---

## コロケーション（ファイル共存）

ルートファイルと関連ファイルを同じディレクトリに配置できます。`-` プレフィックスのファイル/ディレクトリはルーティング対象外になります。

```
src/routes/
├── posts/
│   ├── index.tsx           ← ルートファイル
│   ├── $postId.tsx         ← ルートファイル
│   ├── -components/        ← 無視される
│   │   └── PostCard.tsx
│   ├── -hooks/             ← 無視される
│   │   └── usePosts.ts
│   └── -utils/             ← 無視される
│       └── formatDate.ts
```

ただし、本プロジェクトではルートファイルと機能コードの分離を推奨します。機能固有のコンポーネントやロジックは `src/features/` に配置してください（`docs/rules/folder-structure.md` 参照）。

---

## 参考リンク

- [File-Based Routing](https://tanstack.com/router/latest/docs/framework/react/routing/file-based-routing)
- [File-Based Routing API Reference](https://tanstack.com/router/latest/docs/api/file-based-routing)
- [Routing Concepts](https://tanstack.com/router/v1/docs/framework/react/routing/routing-concepts)
- [DeepWiki: File-Based Routing](https://deepwiki.com/TanStack/router/4.1-file-based-routing)
