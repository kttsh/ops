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

- features同士の依存は極力排除する
- `features/[feature]/index.ts`でパブリックAPIをエクスポート
- `features/components/`配下にはフォルダを作成しない
- ルートコンポーネント（`[screen-name].tsx`）は100行前後でレイアウトを記述


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
