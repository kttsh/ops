# Style and Conventions

## ディレクトリ構成

### フロントエンド (`apps/frontend/src/`)
- `routes/` - TanStack Router ファイルベースルーティング
- `features/[feature]/` - 機能ベースモジュール
  - `api/` - api-client.ts, queries.ts, mutations.ts
  - `components/` - UIコンポーネント（フォルダ作成不可）
  - `hooks/` - カスタムフック
  - `stores/` - 状態管理
  - `types/` - 型定義・Zodスキーマ
  - `index.ts` - パブリックAPIエクスポート
- `components/` - 共有コンポーネント
  - `ui/` - shadcn/ui コンポーネント
  - `layout/` - レイアウトコンポーネント
- `hooks/`, `stores/`, `utils/`, `lib/` - 共有リソース

### バックエンド (`apps/backend/src/`)
- `routes/` - エンドポイント定義
- `services/` - ビジネスロジック
- `data/` - DBアクセスとクエリ
- `database/` - DB接続設定
- `types/` - 型定義
- `transform/` - データ変換

## コーディング規約

### TypeScript
- `erasableSyntaxOnly: true` が有効 → `public readonly` パラメータプロパティ使用不可
- パスエイリアス `@/*` を使用すること
- features 同士の依存は極力排除

### API クライアント
- `ApiError` クラスで `ProblemDetails` をラップ
- fetch wrapper パターン（共通エラーハンドリング）

### TanStack Query
- `queryOptions` パターン + Query Key Factory
- mutations で `onSuccess` 時にキャッシュ無効化

### TanStack Form
- field-level Zod validators パターン
- `zodValidator` from `@tanstack/zod-adapter`

### ルートコンポーネント
- 100行前後でレイアウトを記述
- Search Params は Zod バリデーション

### UI スタイル（nani.now）
- `rounded-xl` / `rounded-2xl`
- `shadow-sm`
- `hover:scale-[1.02]`, `active:scale-[0.98]`
- `transition-all duration-200`
- oklch カラーシステム

## ドキュメント参照
- 業務ロジック実装前: `docs/domain/` 配下を確認
- Hono 実装: `docs/rules/hono/` 配下
- TanStack Router: `docs/rules/tanstack-router/` 配下
- TanStack Table: `docs/rules/tanstack-table/` 配下
- TanStack Form: `docs/rules/tanstack-form/` 配下
- TanStack Query: `docs/rules/tanstack-query/` 配下
- API レスポンス: `docs/rules/api-response.md`
- Git運用: `docs/rules/git-workflow.md`

## Spec Driven Development
- `.kiro/steering/` - プロジェクト全体のステアリング情報
- `.kiro/specs/` - 機能仕様（requirements → design → tasks → implementation）
- 3フェーズ承認ワークフロー
