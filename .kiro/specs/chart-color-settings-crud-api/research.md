# Research & Design Decisions

---
**Purpose**: chart-color-settings-crud-api の設計判断に関する調査記録
---

## Summary
- **Feature**: `chart-color-settings-crud-api`
- **Discovery Scope**: Simple Addition（既存 CRUD パターンの踏襲 + 設定テーブル固有の差分対応）
- **Key Findings**:
  - `chart_color_settings` は設定テーブルであり `deleted_at` を持たない → 物理削除・ソフトデリート/リストア不要
  - `target_type` + `target_id` のユニーク制約 → 作成・更新時の重複チェックが必要
  - 一括 Upsert は SQL Server の `MERGE` 文 + トランザクションで実現可能

## Research Log

### 設定テーブルとエンティティテーブルの差分
- **Context**: 既存の CRUD API は `chart_views` 等のエンティティテーブル向けに設計されており、ソフトデリート＋リストアパターンを持つ。設定テーブルではこのパターンが不要。
- **Sources Consulted**: `docs/database/table-spec.md`、既存実装 `apps/backend/src/data/chartViewData.ts`
- **Findings**:
  - 設定テーブルは `deleted_at` カラムを持たず、物理削除を行う
  - `softDelete()` / `restore()` / `findByIdIncludingDeleted()` は不要
  - `filter[includeDisabled]` クエリパラメータも不要
  - WHERE 句から `deleted_at IS NULL` 条件を除外する
- **Implications**: Data 層・Service 層・Route 層すべてでソフトデリート関連コードを除外。DELETE エンドポイントは物理削除（`DELETE FROM`）を実行。

### ユニーク制約の重複チェック
- **Context**: `UQ_chart_color_settings_target (target_type, target_id)` によるユニーク制約が存在。作成・更新時に重複を検知する必要がある。
- **Sources Consulted**: `docs/database/table-spec.md`
- **Findings**:
  - INSERT 時: 同一の `target_type` + `target_id` が既存の場合 → HTTP 409
  - UPDATE 時: 更新後の `target_type` + `target_id` が自身以外のレコードと重複する場合 → HTTP 409
  - DB レベルのユニーク制約違反をキャッチしてアプリケーションレベルで 409 に変換する方法と、事前 SELECT で検証する方法の 2 つがある
- **Implications**: 事前 SELECT による検証を採用（既存パターンとの一貫性、明示的なエラーメッセージ生成のため）

### 一括 Upsert の実現方式
- **Context**: Requirement 6 で複数レコードの一括登録・更新（Upsert）が必要。
- **Sources Consulted**: SQL Server MERGE ステートメント公式ドキュメント
- **Findings**:
  - SQL Server の `MERGE` 文で `target_type` + `target_id` をマッチキーとした Upsert が可能
  - トランザクション内で実行し、バリデーションエラー時は全体ロールバック
  - `MERGE ... OUTPUT` で結果行を取得可能
- **Implications**: Data 層に `bulkUpsert()` メソッドを追加。SQL トランザクションで一括処理。

## Design Decisions

### Decision: 物理削除の採用
- **Context**: 設定テーブルは論理削除を持たない
- **Selected Approach**: `DELETE FROM` による物理削除
- **Rationale**: テーブル仕様に準拠。設定データは履歴管理不要。
- **Trade-offs**: 削除後の復元は不可。要件上も復元は求められていない。

### Decision: 事前チェックによるユニーク制約違反の検出
- **Context**: 重複時に明示的なエラーメッセージを返す必要がある
- **Alternatives Considered**:
  1. DB のユニーク制約違反を catch → 409 に変換
  2. 事前 SELECT で存在チェック → 409 を throw
- **Selected Approach**: 事前 SELECT による検証
- **Rationale**: 既存パターンとの一貫性、明示的なエラーメッセージ制御
- **Trade-offs**: 事前 SELECT は若干のオーバーヘッドがあるが、設定テーブルのデータ量では問題にならない

### Decision: MERGE 文による一括 Upsert
- **Context**: 一括更新を効率的に処理する必要がある
- **Alternatives Considered**:
  1. ループ処理（1 件ずつ INSERT or UPDATE）
  2. SQL Server MERGE 文
- **Selected Approach**: MERGE 文
- **Rationale**: 単一 SQL 文で Upsert を実現でき、パフォーマンスが良い
- **Trade-offs**: MERGE 文の構文が複雑だが、パターン化すれば保守可能

## Risks & Mitigations
- **リスク**: MERGE 文のデッドロック可能性 → 対象テーブルのデータ量が少なく影響は軽微。必要に応じて `HOLDLOCK` ヒントを使用
- **リスク**: `targetType` の値が将来拡張される → バリデーションで受け付ける値を Zod enum で管理し、拡張時はスキーマ更新のみで対応

## References
- `docs/database/table-spec.md` — chart_color_settings テーブル定義
- `docs/rules/api-response.md` — API レスポンス規約
- `docs/rules/hono/crud-guide.md` — CRUD 実装パターン
- 既存実装: `apps/backend/src/routes/chartViews.ts` — 参照パターン
