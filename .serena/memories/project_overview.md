# Project Overview

## プロジェクト概要
Turborepo + pnpm を使用したモノレポ構成のフルスタックアプリケーション。業務管理系のWebアプリケーション。

## ワークスペース構成
- `apps/frontend` - フロントエンドアプリ（Vite 7 + React 19 + TypeScript 5.9）
- `apps/backend` - バックエンドアプリ（Hono v4 REST API）
- `packages/` - 共有パッケージ（`@ops/ui`, `@ops/utils`, `@ops/types`等）

## フロントエンド技術スタック
- **ビルド**: Vite 7
- **UI**: React 19 + TypeScript 5.9 (strict mode, erasableSyntaxOnly)
- **ルーティング**: TanStack Router (file-based routing, autoCodeSplitting)
- **データフェッチ**: TanStack Query v5 (queryOptions pattern, Query Key Factory)
- **テーブル**: TanStack Table v8
- **フォーム**: TanStack Form v1 (field-level Zod validators)
- **UIコンポーネント**: shadcn/ui + Tailwind CSS v4
- **バリデーション**: Zod v3
- **トースト**: Sonner
- **デザイン言語**: nani.now スタイル (oklch colors, rounded-xl/2xl, hover:scale)

## バックエンド技術スタック
- **フレームワーク**: Hono v4
- **バリデーション**: Zod v4 + @hono/zod-validator
- **DB**: SQL Server (mssql パッケージ)
- **エラーハンドリング**: RFC 9457 Problem Details

## パスエイリアス
- フロントエンド: `@/*` → `./src/*`

## API設計
- RESTful API with RFC 9457 Problem Details for errors
- レスポンス形式: `{ data, meta, links }` (一覧), `{ data }` (単体)
- ソフトデリート対応 (deletedAt フィールド)
