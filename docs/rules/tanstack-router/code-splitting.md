# TanStack Router コード分割規約

## 概要

本ドキュメントは、TanStack Router におけるコード分割（Code Splitting）の実装規約を定めるものです。
自動コード分割、手動分割、クリティカル/非クリティカルオプションの分類を規定します。

---

## コード分割の原則

TanStack Router はルートコードを2つのカテゴリに分類します。

| カテゴリ | 説明 | ロードタイミング |
|---|---|---|
| **クリティカル** | ルートマッチング・データローディングに必要 | 即座にロード |
| **非クリティカル** | レンダリングにのみ必要 | オンデマンドで遅延ロード |

### クリティカルオプション（メインファイル）

- `loader` — データ取得
- `beforeLoad` — 認証チェック・リダイレクト
- `validateSearch` — Search Params バリデーション
- `loaderDeps` — ローダー依存関係

### 非クリティカルオプション（遅延ファイル）

- `component` — メインコンポーネント
- `errorComponent` — エラーバウンダリ
- `pendingComponent` — ローディング状態
- `notFoundComponent` — 404 ハンドラ

---

## 自動コード分割（推奨）

### 設定

`tsr.config.json` または Vite プラグインで有効化します。

```json
{
  "autoCodeSplitting": true
}
```

```ts
// vite.config.ts
import { TanStackRouterVitePlugin } from '@tanstack/router-vite-plugin'

export default defineConfig({
  plugins: [
    TanStackRouterVitePlugin({
      autoCodeSplitting: true,
    }),
  ],
})
```

### 自動コード分割の動作

- 開発時とビルド時にルートファイルを変換
- コンポーネントとローダーを別チャンクに自動分割
- 手動でファイルを分ける必要がない
- **ほとんどのプロジェクトではこの設定で十分**

### カスタマイズ（優先順位順）

1. **ルート単位の上書き**: ルートファイル内の `codeSplitGroupings` プロパティ
2. **プログラマティック分割**: バンドラー設定の `splitBehavior` 関数
3. **デフォルト動作**: バンドラー設定の `defaultBehavior` オプション

---

## 手動コード分割

自動コード分割が使えない場合、`.lazy.tsx` サフィックスを使用して手動分割を行います。

### ファイル構成

```
src/routes/
├── posts.$postId.tsx           ← クリティカル: loader, beforeLoad, validation
└── posts.$postId.lazy.tsx      ← 非クリティカル: components のみ
```

### メインルートファイル（クリティカル）

```tsx
// src/routes/posts.$postId.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    return await fetchPost(params.postId)
  },
  beforeLoad: async ({ context }) => {
    // 認証チェック等
  },
  validateSearch: zodValidator(searchSchema),
})
```

### 遅延ルートファイル（非クリティカル）

```tsx
// src/routes/posts.$postId.lazy.tsx
import { createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/posts/$postId')({
  component: PostDetailPage,
  errorComponent: PostErrorComponent,
  pendingComponent: PostLoadingComponent,
  notFoundComponent: PostNotFoundComponent,
})

function PostDetailPage() {
  const post = Route.useLoaderData()
  return <h1>{post.title}</h1>
}
```

---

## ルートスコープフック

遅延ルートファイルで Route オブジェクトからスコープ付きフックを使用できます。

```tsx
// src/routes/posts.$postId.lazy.tsx
export const Route = createLazyFileRoute('/posts/$postId')({
  component: PostDetailPage,
})

function PostDetailPage() {
  const post = Route.useLoaderData()      // ローダーデータ
  const { postId } = Route.useParams()    // パスパラメータ
  const search = Route.useSearch()         // Search Params
  const navigate = Route.useNavigate()     // ナビゲーション
  const context = Route.useRouteContext()   // ルートコンテキスト
  const match = Route.useMatch()           // ルートマッチ

  return <div>{post.title}</div>
}
```

### getRouteApi（別ファイルからのアクセス）

ルートファイルをインポートせずに型安全な API にアクセスできます。

```tsx
// src/features/posts/components/PostDetail.tsx
import { getRouteApi } from '@tanstack/react-router'

const routeApi = getRouteApi('/posts/$postId')

export function PostDetail() {
  const post = routeApi.useLoaderData()
  const { postId } = routeApi.useParams()
  return <div>{post.title}</div>
}
```

---

## バーチャルルート

すべてのオプションを遅延ファイルに移動した場合、メインルートファイルは空になります。
空のファイルは削除して構いません。ルートツリー生成時にバーチャルルートが自動生成されます。

```
src/routes/
├── posts.$postId.lazy.tsx      ← 遅延ファイルのみ（メインファイル不要）
```

---

## プリロードとの連携

コード分割されたルートでも、プリロード機能は正常に動作します。

```tsx
<Link
  to="/posts/$postId"
  params={{ postId: '123' }}
  preload="intent"  // ホバー時にチャンクをプリロード
>
  記事を見る
</Link>
```

プリロード時には以下が事前にロードされます。
1. クリティカルチャンク（loader, beforeLoad）
2. 非クリティカルチャンク（component 等）
3. ローダーによるデータフェッチ

---

## 注意事項

- `__root.tsx` はコード分割の対象外（常にレンダリングされるため）
- 自動コード分割を有効にしている場合、手動の `.lazy.tsx` ファイルは不要
- `createLazyFileRoute` にはクリティカルオプション（`loader`, `beforeLoad`, `validateSearch`）を含めないこと
- `lazyRouteComponent` よりも `createLazyFileRoute` の使用を推奨

---

## 参考リンク

- [Code Splitting](https://tanstack.com/router/v1/docs/framework/react/guide/code-splitting)
- [Automatic Code Splitting](https://tanstack.com/router/v1/docs/framework/react/guide/automatic-code-splitting)
- [DeepWiki: File Routes and Lazy Loading](https://deepwiki.com/tanstack/router/3.4-file-routes-and-lazy-loading)
