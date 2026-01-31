# Research & Design Decisions: project-load-crud-api

---
**Purpose**: project_load CRUD API 設計のための調査結果と設計判断を記録する。
---

## Summary
- **Feature**: `project-load-crud-api`
- **Discovery Scope**: Simple Addition（既存 CRUD パターンの拡張）
- **Key Findings**:
  - project_load はファクトテーブルのため、論理削除なし・復元なし・ページネーションなしという既存パターンからの差異がある
  - バルク Upsert エンドポイントは既存 CRUD にない新規パターンで、SQL Server の MERGE 文とトランザクション制御が必要
  - ルーティングは `/project-cases/:projectCaseId/project-loads` のネスト構造（project-cases ルート内ではなく、index.ts で独立マウント）

## Research Log

### ファクトテーブルとエンティティテーブルの CRUD 差異
- **Context**: project_load は `deleted_at` を持たないファクトテーブルであり、既存の CRUD パターン（エンティティテーブル前提）をそのまま適用できない箇所がある
- **Sources Consulted**: `docs/database/table-spec.md`、既存実装（projectCaseData.ts, headcountPlanCaseData.ts）
- **Findings**:
  - 論理削除（softDelete/restore）が不要 → DELETE は物理削除
  - `filter[includeDisabled]` パラメータが不要
  - ページネーションは不要（1ケースあたりのデータ量は限定的、通常12〜60件程度）
  - 親テーブル（project_cases）の `deleted_at` チェックが必要（削除済みケースへの子データ操作を防止）
- **Implications**: service/data 層のメソッド構成がエンティティ CRUD よりシンプルになる。restore エンドポイントなし。

### バルク Upsert の実装方針
- **Context**: 月次工数データは複数月分をまとめて入力・更新するユースケースが主であり、1件ずつ POST/PUT するのは非効率
- **Sources Consulted**: SQL Server MERGE 文の公式ドキュメント、既存バックエンドパターン
- **Findings**:
  - SQL Server の MERGE 文で Upsert を実現可能（`WHEN MATCHED THEN UPDATE` + `WHEN NOT MATCHED THEN INSERT`）
  - mssql ライブラリの `sql.Table` を使用してテーブル値パラメータ（TVP）を渡す方法と、個別パラメータで MERGE を実行する方法がある
  - 項目数が少ない（yearMonth + manhour のみ）ため、個別 MERGE ループをトランザクション内で実行するシンプルな方式で十分
  - トランザクションは `pool.transaction()` + `begin/commit/rollback` パターンで制御
- **Implications**: data 層に `bulkUpsert` メソッドを追加。トランザクション制御は service 層ではなく data 層で実行（DB 操作の原子性は data 層の責務）

### ルーティング構造
- **Context**: project_load は project_cases の子リソース。既存では project_cases は `/projects/:projectId/project-cases` にマウントされている
- **Sources Consulted**: `apps/backend/src/index.ts`、`apps/backend/src/routes/projectCases.ts`
- **Findings**:
  - 要件では `/project-cases/:projectCaseId/project-loads` の階層構造
  - index.ts でのマウント: `app.route('/project-cases/:projectCaseId/project-loads', projectLoads)`
  - バルクエンドポイントの `PUT /bulk` は `:projectLoadId` パラメータと衝突しない（`bulk` は文字列、`:projectLoadId` は数値バリデーション付き）
- **Implications**: index.ts に新規ルートマウントを追加。projectCases ルートには変更なし。

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| 既存レイヤードの踏襲 | routes → services → data → transform → types | 一貫性、学習コストゼロ | なし | 選択 |

## Design Decisions

### Decision: 物理削除の採用
- **Context**: ファクトテーブルは `deleted_at` カラムを持たない
- **Alternatives Considered**:
  1. 論理削除（他テーブルと統一） — deleted_at カラム追加が必要でスキーマ変更が発生
  2. 物理削除（テーブル仕様どおり） — スキーマ変更不要
- **Selected Approach**: 物理削除
- **Rationale**: テーブル仕様で明確にファクトテーブルは物理削除と定義されている。親テーブル削除時も ON DELETE CASCADE で自動削除される設計。
- **Trade-offs**: 削除後の復元不可。ただしファクトデータは再入力が容易であり問題にならない。
- **Follow-up**: なし

### Decision: ページネーションなし
- **Context**: 1ケースあたりの月次データは通常12〜60件程度
- **Alternatives Considered**:
  1. ページネーションあり — 他 CRUD と統一
  2. ページネーションなし — 全件返却
- **Selected Approach**: ページネーションなし
- **Rationale**: データ量が限定的で、フロントエンドで全月分を一括取得してテーブル/チャート表示するユースケースが想定される。
- **Trade-offs**: 万が一データ量が増加した場合は別途対応が必要。
- **Follow-up**: なし

### Decision: バルク Upsert に MERGE 文を使用
- **Context**: 複数月分の工数データを一括入力・更新するユースケース
- **Alternatives Considered**:
  1. 個別 INSERT/UPDATE ループ — シンプルだが非効率
  2. SQL Server MERGE 文 — Upsert を1文で実行可能
- **Selected Approach**: MERGE 文をトランザクション内でループ実行
- **Rationale**: MERGE 文は SQL Server のネイティブ機能で Upsert を簡潔に表現でき、パラメータ化クエリとの相性も良い。
- **Trade-offs**: MERGE 文は SQL Server 固有構文。
- **Follow-up**: なし

## Risks & Mitigations
- バルク操作時のパフォーマンス — 通常60件以下のため問題にならないが、将来的に大量データの場合は TVP による一括 MERGE に切り替え可能
- `PUT /bulk` と `PUT /:projectLoadId` のルーティング衝突 — Hono のルーティングは先に定義したものが優先されるため、`/bulk` を `:projectLoadId` の前に定義する

## References
- テーブル仕様: `docs/database/table-spec.md` — project_load テーブル定義
- API レスポンス規約: `docs/rules/api-response.md` — RFC 9457 Problem Details、レスポンス形式
- 既存 CRUD 設計: `.kiro/specs/project-cases-crud-api/design.md` — レイヤードアーキテクチャパターン
