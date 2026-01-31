# Research & Design Decisions

## Summary
- **Feature**: `business-units-master-ui`
- **Discovery Scope**: Extension（既存バックエンド API に対するフロントエンド UI の新規構築）
- **Key Findings**:
  - 既存 `business-units` CRUD API は完全に実装済み（一覧・単一取得・作成・更新・削除・復元）で、フロントエンドはそのままコンシューマーとして接続可能
  - フロントエンドアプリ（`apps/frontend`）はまだ空ディレクトリであり、初期セットアップ（Vite + React + TanStack Router + shadcn/ui）が必要
  - nani.now のデザイン言語は shadcn/ui のテーマカスタマイズ（CSS 変数の上書き）で実現可能

## Research Log

### 既存 API コントラクトの確認
- **Context**: フロントエンドが呼び出す API エンドポイントの仕様を確認
- **Sources Consulted**: `apps/backend/src/routes/businessUnits.ts`, `apps/backend/src/types/businessUnit.ts`
- **Findings**:
  - 6 エンドポイント: `GET /`, `GET /:code`, `POST /`, `PUT /:code`, `DELETE /:code`, `POST /:code/actions/restore`
  - レスポンス形式: `{ data, meta? }` 構造、ページネーション付き一覧対応
  - API レスポンス型 `BusinessUnit`: `businessUnitCode`, `name`, `displayOrder`, `createdAt`, `updatedAt`（camelCase）
  - 一覧取得パラメータ: `page[number]`, `page[size]`, `filter[includeDisabled]`
- **Implications**: フロントエンドの型定義は API 型と完全に一致させる。Zod スキーマはバックエンドの定義を参考にフロントエンド側にも配置

### フロントエンドプロジェクト状態
- **Context**: `apps/frontend` のセットアップ状況を確認
- **Sources Consulted**: ファイルシステム調査
- **Findings**:
  - `apps/frontend` は空ディレクトリ（ファイルなし）
  - 初回は Vite + React + TypeScript のプロジェクト初期化が必要
  - TanStack Router, Query, Table, Form, shadcn/ui のインストールとセットアップが前提
- **Implications**: 本 spec の実装タスクにフロントエンドプロジェクトの初期セットアップを含める必要あり

### TanStack エコシステムの統合パターン
- **Context**: プロジェクトルールに定められた TanStack 各ライブラリの使用パターンを確認
- **Sources Consulted**: `docs/rules/tanstack-router/`, `docs/rules/tanstack-query/`, `docs/rules/tanstack-table/`, `docs/rules/tanstack-form/`
- **Findings**:
  - Router: ファイルベースルーティング + `@tanstack/router-vite-plugin` + Zod adapter で search params バリデーション
  - Query: `queryOptions` パターンで queryKey/queryFn を co-locate。`features/*/api/queries.ts` に配置
  - Table: `@tanstack/react-table` v8 + shadcn/ui `<Table />`。`features/*/components/columns.tsx` + `data-table.tsx`
  - Form: TanStack Form v1 + Standard Schema（Zod 直接）。`@tanstack/zod-form-adapter` は非推奨
- **Implications**: 各ライブラリのルールに厳密に従い、feature ディレクトリ内に統一的に配置

### nani.now デザイン言語の適用方法
- **Context**: nani.now のビジュアルスタイルを shadcn/ui ベースの管理画面に適用する方法
- **Sources Consulted**: nani.now サイト調査結果
- **Findings**:
  - nani.now の特徴: ゆとりのある余白、大きな角丸（`rounded-2xl`〜`rounded-full`）、控えめなシャドウ（`shadow-sm`）、スムーズなトランジション、ステータスバッジ
  - shadcn/ui はCSS変数ベースのテーマシステムを持ち、`--radius` 変数でグローバルに角丸を調整可能
  - Tailwind CSS のカスタム設定で `rounded-xl`, `rounded-2xl` をデフォルトに適用可能
- **Implications**: shadcn/ui の `globals.css` で CSS 変数をオーバーライドし、Tailwind のユーティリティクラスで補完

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| Feature-first SPA | `features/business-units/` に api/components/hooks/types を凝集 | steering 準拠、高い凝集度、独立性 | feature 間の共有コンポーネントに課題 | 採用。steering の feature-first パターンと一致 |

## Design Decisions

### Decision: API クライアント層の実装方針
- **Context**: バックエンド API 呼び出しの抽象化レベル
- **Alternatives Considered**:
  1. fetch API 直接使用 — シンプルだが重複コードが増える
  2. 薄いラッパー関数（`api-client.ts`） — 適度な抽象化
  3. axios 導入 — 過剰な依存
- **Selected Approach**: 薄い fetch ラッパー関数を `features/business-units/api/api-client.ts` に配置
- **Rationale**: 外部依存を最小化しつつ、レスポンス型の統一処理（エラーハンドリング、JSON パース）を一箇所に集約
- **Trade-offs**: インターセプター等の高度な機能は手動実装が必要だが、現時点では不要
- **Follow-up**: 将来的に共通 API クライアントが必要になれば `lib/` に抽出

### Decision: サーバーサイド vs クライアントサイドページネーション
- **Context**: テーブルのページネーションをどこで処理するか
- **Selected Approach**: サーバーサイドページネーション（API の `page[number]`/`page[size]` を利用）
- **Rationale**: 既存 API がページネーション対応済み。データ量増加時にもスケーラブル
- **Trade-offs**: クライアントサイドソート/フィルタと組み合わせると一部の UX で制約が生じるが、マスタデータは少量が想定されるため問題なし

### Decision: 検索フィルタの実装方針
- **Context**: テキスト検索をサーバーサイドかクライアントサイドで行うか
- **Selected Approach**: クライアントサイドフィルタ（TanStack Table のグローバルフィルタ機能）
- **Rationale**: マスタデータは件数が限定的（数十〜数百件）。ページ内のデータに対するクライアントサイドフィルタで十分な応答性を実現
- **Trade-offs**: 大量データの場合はサーバーサイド検索 API の追加が必要になるが、BU マスタでは不要

## Risks & Mitigations
- フロントエンドプロジェクト未初期化 — 初期セットアップタスクを明示的に切り出し、依存関係を管理
- API の CORS 設定 — バックエンド側で `cors()` ミドルウェアの設定が必要。実装タスクに含める
- shadcn/ui テーマカスタマイズの範囲 — 過度なカスタマイズは保守コスト増。CSS 変数レベルの調整に留め、コンポーネント自体の fork は避ける

## References
- [TanStack Router Docs](https://tanstack.com/router) — ファイルベースルーティング
- [TanStack Query Docs](https://tanstack.com/query) — queryOptions パターン
- [TanStack Table Docs](https://tanstack.com/table) — ヘッドレス UI テーブル
- [TanStack Form Docs](https://tanstack.com/form) — Standard Schema バリデーション
- [shadcn/ui](https://ui.shadcn.com) — コンポーネントライブラリ
- [nani.now](https://nani.now) — デザイン言語参考
