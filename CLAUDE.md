# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Turborepo + pnpm を使用したモノレポ構成のフルスタックアプリケーション。

## 開発コマンド

```bash
# 依存関係インストール
pnpm install

# 全パッケージのビルド
pnpm build

# 開発サーバー起動
pnpm dev

# リント実行
pnpm lint

# テスト実行
pnpm test

# クリーンアップ
pnpm clean
```

### 特定パッケージのみ実行

```bash
# 特定アプリのみdev
pnpm --filter frontend dev
pnpm --filter backend dev

# 特定アプリのみテスト
pnpm --filter frontend test
```

## アーキテクチャ

### ワークスペース構成

- `apps/frontend` - フロントエンドアプリ（TanStack Router + File-based routing前提）
- `apps/backend` - バックエンドアプリ（REST API前提）
- `packages/` - 共有パッケージ（`@ops/ui`, `@ops/utils`, `@ops/types`等）

### フロントエンド構成（apps/frontend）

- `src/routes/` - TanStack Routerのファイルベースルーティング
- `src/features/[feature]/` - 機能ベースのモジュール（api, components, hooks, stores, types等）
- `src/components/` - アプリ全体の共有コンポーネント（`ui/`にはshadcn/ui等）
- `src/hooks/`, `src/stores/`, `src/utils/`, `src/lib/` - 共有リソース

### バックエンド構成（apps/backend）

- `src/routes/` - エンドポイント定義
- `src/services/` - ビジネスロジック
- `src/data/` - DBアクセスとクエリ実行
- `src/database/` - DB接続設定

## コーディング規約

**`docs/rules/folder-structure.md` を厳守すること。**

**REST API実装時は `docs/rules/api-response.md` を遵守すること。**

**Hono を使用したバックエンド実装時は `docs/rules/hono/` 配下のガイドラインを必ず遵守すること。**
- `docs/rules/hono/crud-guide.md` - CRUD API の実装パターン・ルーティング構成・テスト方法
- `docs/rules/hono/error-handling.md` - エラーハンドリング規約（RFC 9457 準拠）
- `docs/rules/hono/validation.md` - Zod + @hono/zod-validator によるバリデーション規約

**TanStack Router を使用したフロントエンド実装時は `docs/rules/tanstack-router/` 配下のガイドラインを必ず遵守すること。**
- `docs/rules/tanstack-router/file-based-routing.md` - ファイルベースルーティング構成・命名規則・セットアップ
- `docs/rules/tanstack-router/data-loading.md` - データローディング・キャッシュ制御・ローディング状態管理
- `docs/rules/tanstack-router/navigation.md` - ナビゲーション・Link / useNavigate / リダイレクト・プリロード
- `docs/rules/tanstack-router/search-params.md` - Search Params の Zod バリデーション・型安全な管理
- `docs/rules/tanstack-router/code-splitting.md` - コード分割・自動/手動分割・遅延ルート
- `docs/rules/tanstack-router/authentication.md` - 認証ガード・beforeLoad パターン・RBAC

**TanStack Table を使用したデータテーブル実装時は `docs/rules/tanstack-table/` 配下のガイドラインを必ず遵守すること。**
- `docs/rules/tanstack-table/basic-setup.md` - 基本セットアップ・カラム定義・useReactTable・flexRender
- `docs/rules/tanstack-table/sorting-filtering.md` - ソート・カラムフィルタ・グローバルフィルタ・ファジー検索
- `docs/rules/tanstack-table/pagination-selection.md` - ページネーション・行選択・カラム表示切替
- `docs/rules/tanstack-table/advanced-patterns.md` - 再利用可能コンポーネント・Context Provider・TanStack Query統合・TanStack Virtual仮想化（行/カラム/無限スクロール）

**TanStack Form を使用したフォーム実装時は `docs/rules/tanstack-form/` 配下のガイドラインを必ず遵守すること。**
- `docs/rules/tanstack-form/basic-setup.md` - 基本セットアップ・useForm・Field コンポーネント・フォーム送信
- `docs/rules/tanstack-form/validation.md` - Zod バリデーション・非同期バリデーション・クロスフィールドバリデーション
- `docs/rules/tanstack-form/form-composition.md` - createFormHook・再利用可能コンポーネント・withForm・withFieldGroup
- `docs/rules/tanstack-form/arrays-dynamic-fields.md` - 配列フィールド・動的フィールド・配列操作メソッド
- `docs/rules/tanstack-form/reactivity-state.md` - リアクティビティ・useStore・form.Subscribe・shadcn/ui 統合パターン

**TanStack Query を使用したデータフェッチ実装時は `docs/rules/tanstack-query/` 配下のガイドラインを必ず遵守すること。**
- `docs/rules/tanstack-query/setup.md` - セットアップ・QueryClient 設定・プロバイダー構成
- `docs/rules/tanstack-query/query-options.md` - queryOptions / Query Key Factory パターン・型安全なクエリ定義
- `docs/rules/tanstack-query/mutations.md` - useMutation・楽観的更新・キャッシュ無効化
- `docs/rules/tanstack-query/error-handling.md` - エラーハンドリング・リトライ・Error Boundary 連携
- `docs/rules/tanstack-query/advanced-patterns.md` - 依存/並列クエリ・無限スクロール・Suspense・テスト

- features同士の依存は極力排除する
- `features/[feature]/index.ts`でパブリックAPIをエクスポート
- `features/components/`配下にはフォルダを作成しない
- ルートコンポーネント（`[screen-name].tsx`）は100行前後でレイアウトを記述
- インポートにはアットマークのエイリアスを用いること


# AI-DLC and Spec-Driven Development

Kiro-style Spec Driven Development implementation on AI-DLC (AI Development Life Cycle)

## Project Context

### Paths
- Steering: `.kiro/steering/`
- Specs: `.kiro/specs/`

### Steering vs Specification

**Steering** (`.kiro/steering/`) - Guide AI with project-wide rules and context
**Specs** (`.kiro/specs/`) - Formalize development process for individual features

### Active Specifications
- Check `.kiro/specs/` for active specifications
- Use `/kiro:spec-status [feature-name]` to check progress

## Development Guidelines
- Think in English, generate responses in Japanese. All Markdown content written to project files (e.g., requirements.md, design.md, tasks.md, research.md, validation reports) MUST be written in the target language configured for this specification (see spec.json.language).

## Minimal Workflow
- Phase 0 (optional): `/kiro:steering`, `/kiro:steering-custom`
- Phase 1 (Specification):
  - `/kiro:spec-init "description"`
  - `/kiro:spec-requirements {feature}`
  - `/kiro:validate-gap {feature}` (optional: for existing codebase)
  - `/kiro:spec-design {feature} [-y]`
  - `/kiro:validate-design {feature}` (optional: design review)
  - `/kiro:spec-tasks {feature} [-y]`
- Phase 2 (Implementation): `/kiro:spec-impl {feature} [tasks]`
  - `/kiro:validate-impl {feature}` (optional: after implementation)
- Progress check: `/kiro:spec-status {feature}` (use anytime)

## Development Rules
- 3-phase approval workflow: Requirements → Design → Tasks → Implementation
- Human review required each phase; use `-y` only for intentional fast-track
- Keep steering current and verify alignment with `/kiro:spec-status`
- Follow the user's instructions precisely, and within that scope act autonomously: gather the necessary context and complete the requested work end-to-end in this run, asking questions only when essential information is missing or the instructions are critically ambiguous.

## Steering Configuration
- Load entire `.kiro/steering/` as project memory
- Default files: `product.md`, `tech.md`, `structure.md`
- Custom files are supported (managed via `/kiro:steering-custom`)
