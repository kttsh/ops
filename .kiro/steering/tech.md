# Technology Stack

## Architecture

Turborepo + pnpm によるモノレポ構成。バックエンドは Hono による REST API、フロントエンドは TanStack エコシステムによる SPA。レイヤードアーキテクチャ（routes → services → data）で責務を分離し、Zod スキーマを軸に型安全性を担保する。

## Core Technologies

- **Language**: TypeScript 5.9.x（strict mode）
- **Runtime**: Node.js 20+
- **Package Manager**: pnpm 10.x + Turborepo 2.x
- **Backend Framework**: Hono v4
- **Frontend Framework**: React 19 + Vite 7 + TanStack Router + TanStack Query + TanStack Table + TanStack Form + shadcn/ui
- **Styling**: Tailwind CSS v4
- **Database**: Microsoft SQL Server（mssql ライブラリ、ORM なし・直接 SQL）
- **Validation**: Zod（バックエンド Zod v4 / フロントエンド Zod v3）

## Key Libraries

| 領域 | ライブラリ | 用途 |
|------|-----------|------|
| API サーバー | `hono`, `@hono/node-server` | HTTP サーバーとルーティング |
| バリデーション | `zod`, `@hono/zod-validator` | スキーマ定義・リクエスト検証 |
| DB アクセス | `mssql` | SQL Server 接続・クエリ実行 |
| テスト | `vitest` v4 | ユニットテスト |
| スタイリング | `tailwindcss` v4, `@tailwindcss/vite` | ユーティリティ CSS |
| UI プリミティブ | `@radix-ui/*`, `lucide-react` | shadcn/ui の基盤コンポーネント |
| 通知 | `sonner` | トースト通知 |
| 開発 | `tsx` | TypeScript の実行・ホットリロード |

## Development Standards

### Type Safety

- TypeScript strict mode 必須
- `any` 型の使用禁止
- Zod スキーマから TypeScript 型を導出（`z.infer<typeof schema>`）
- Hono のメソッドチェインによるルート型推論を活用

### Code Quality

- ESLint 9 導入済み（フロントエンド）、バックエンドは今後導入予定
- `docs/rules/` 配下の規約ドキュメントがコード品質の基準
- API レスポンスは RFC 9457 Problem Details 形式に準拠

### Testing

- **Framework**: Vitest（globals 有効）
- **テスト配置**: `src/__tests__/` にソース構造をミラー
- **命名**: `[module-name].test.ts`
- **API テスト**: Hono の `app.request()` メソッドでハンドラを直接テスト

## Development Environment

### Required Tools

- Node.js 20+
- pnpm 10+
- SQL Server インスタンス（接続情報は `.env` で管理）

### Common Commands

```bash
# Dev:   pnpm dev（全体）/ pnpm --filter backend dev
# Build: pnpm build
# Test:  pnpm test / pnpm --filter backend test
# Lint:  pnpm lint
# Clean: pnpm clean
```

## Key Technical Decisions

| 決定事項 | 選択 | 理由 |
|----------|------|------|
| ORM を使わない | 直接 SQL | SQL Server 固有機能の活用・クエリの可読性・パフォーマンス制御 |
| Hono 採用 | Hono v4 | 軽量・型推論が強力・Edge 対応の将来性 |
| TanStack エコシステム | Router/Query/Table/Form | 型安全・ファイルベースルーティング・統一的な開発体験 |
| モノレポ | Turborepo + pnpm | フロントエンド・バックエンド・共有パッケージの統合管理 |
| Zod 統一 | Zod v4（backend）/ v3（frontend） | バリデーションと型定義の一元化（バージョン統一は今後の課題） |

---
_Document standards and patterns, not every dependency_
