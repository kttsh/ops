# Research & Design Decisions: color-profiling-extend

## Summary
- **Feature**: `color-profiling-extend`
- **Discovery Scope**: Extension（既存システムの拡張）
- **Key Findings**:
  - SQL MERGE による bulkUpsert パターンが `chartColorSettingData` 等で確立済み。ChartViewProjectItem にも同パターンを適用可能
  - 色情報は現在 `chart_color_settings` テーブルでグローバル管理されているが、プロファイル固有の色設定には `chart_view_project_items` テーブルに `color_code` カラムを追加するのが最適
  - フロントエンドの色・並び順はローカル state（`useState`）で管理されており、プロファイル保存/適用時にバックエンドとの同期が必要

## Research Log

### 色の保存場所：chart_view_project_items vs chart_color_settings
- **Context**: Issue #25 ではプロファイルごとの色設定保存を要求。現在 `chart_color_settings` はグローバルスコープ
- **Sources Consulted**: DB スキーマ (`docs/database/table-spec.md`)、`chartColorSettingData.ts`、`chartViewProjectItemData.ts`
- **Findings**:
  - `chart_color_settings` は (target_type, target_id) にユニーク制約があり、ChartView スコープを追加するとユニーク制約変更が必要
  - `chart_view_project_items` は既に ChartView にスコープされており、`color_code` カラム追加だけで要件を満たせる
  - 色・並び順・表示状態を1テーブルで管理すると、一括 API で完全同期が可能
- **Implications**: Option A（`chart_view_project_items` に `color_code` 追加）を採用。最小限のスキーマ変更で要件を満たす

### 既存 Bulk Upsert パターン
- **Context**: プロファイル保存時に複数の project items を一括 upsert する必要がある
- **Sources Consulted**: `chartColorSettingData.bulkUpsert`、`chartStackOrderSettingData.bulkUpsert`
- **Findings**:
  - SQL MERGE + Transaction パターンが確立: ループ内で個別 MERGE → commit/rollback
  - `chart_view_project_items` の場合、MERGE ON 条件は `(chart_view_id, project_id, project_case_id)` が適切
  - リクエストに含まれないアイテムの削除（完全同期）には、MERGE 後に DELETE WHERE NOT IN を実行
- **Implications**: 既存パターンを踏襲しつつ、完全同期のための DELETE ロジックを追加

### フロントエンド状態管理フロー
- **Context**: ProfileManager の props 設計と適用時の状態復元方法
- **Sources Consulted**: `ProfileManager.tsx`、`SidePanelSettings.tsx`
- **Findings**:
  - `SidePanelSettings` は `projColors`（Record<number, string>）と `projOrder`（number[]）をローカル state で保持
  - `ProfileManager` は現在 `chartType`, `startYearMonth`, `endYearMonth` のみ受け取る
  - 適用時の `onApply` コールバックは `{chartViewId, startYearMonth, endYearMonth}` のみ返す
  - 適用時に `chart_view_project_items` を fetch し、SidePanelSettings のローカル state を更新する必要がある
- **Implications**: ProfileManager の props に projColors, projOrder, selectedProjectIds を追加。onApply コールバックを拡張して items 情報も返す

### グローバル色設定との共存
- **Context**: プロファイル固有の色が導入された後、`chart_color_settings` の役割
- **Findings**:
  - プロファイル適用時: `chart_view_project_items.color_code` が `NULL` でなければそれを使用、`NULL` なら `chart_color_settings` からフォールバック
  - プロファイル非適用時（デフォルト表示）: 従来通り `chart_color_settings` を使用
  - 新規プロファイル保存時: 現在の画面表示色（ローカル state）を `chart_view_project_items.color_code` に保存
- **Implications**: `chart_color_settings` は引き続きデフォルト色として維持。プロファイル固有色は `chart_view_project_items` で管理

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| A: color を chart_view_project_items に追加 | 1テーブルで色・並び順・表示状態を管理 | シンプル、一括 API で完全同期、既存 MERGE パターン再利用 | ALTER TABLE が必要 | **採用** |
| B: chart_color_settings を ChartView スコープに拡張 | 既存テーブルにスコープカラム追加 | 既存 bulkUpsert インフラ利用 | ユニーク制約変更、色と並び順が分散 | 非採用 |
| C: ハイブリッド | 色はグローバル、並び順・表示のみプロファイル | DB 変更最小 | プロファイル固有色が不可能 | 非採用 |

## Design Decisions

### Decision: 色の保存場所
- **Context**: プロファイルごとの色設定を永続化する場所
- **Alternatives Considered**:
  1. `chart_view_project_items` に `color_code` カラム追加
  2. `chart_color_settings` に `chart_view_id` カラム追加
  3. 新規テーブル `chart_view_project_item_colors` 作成
- **Selected Approach**: Option 1 — `chart_view_project_items` に `color_code VARCHAR(7) NULL` を追加
- **Rationale**: 色・並び順・表示状態を1レコードで管理でき、一括 API の設計がシンプル。既存テーブルへの ALTER TABLE のみで済む
- **Trade-offs**: グローバル色設定と異なるテーブルに色が分散するが、用途が異なる（デフォルト vs プロファイル固有）ため許容範囲
- **Follow-up**: ALTER TABLE スクリプトの作成と `docs/database/table-spec.md` の更新

### Decision: 一括更新の同期方式
- **Context**: プロファイル保存/上書き時に project items を同期する方式
- **Alternatives Considered**:
  1. 差分更新（新規追加・更新・削除を個別判定）
  2. 完全同期（既存全削除 → 一括挿入）
  3. MERGE + DELETE NOT IN（upsert + 不要分削除）
- **Selected Approach**: Option 3 — MERGE + DELETE NOT IN
- **Rationale**: MERGE で既存レコードの更新と新規作成を効率的に処理。DELETE NOT IN でリクエストに含まれないアイテムを削除
- **Trade-offs**: 全削除 → 挿入よりも SQL が複雑だが、`created_at` を保持でき、ID の連番も安定する

## Risks & Mitigations
- **ALTER TABLE の影響**: SQL Server の ALTER TABLE ADD は既存データに影響なし（NULL 許容カラム追加のため）。ダウンタイム不要
- **フロントエンド状態の不整合**: プロファイル適用時に React Query キャッシュとローカル state を同時に更新する必要がある。`onApply` コールバックを通じて SidePanelSettings が state を直接セットする設計で対応
- **旧プロファイルの後方互換性**: `color_code = NULL` のアイテムはグローバル色設定にフォールバック。フロントエンドで条件分岐を実装

## References
- SQL Server MERGE ステートメント: 既存コードベース内の `chartColorSettingData.bulkUpsert` パターン
- GitHub Issue #25: プロファイル管理拡張の要件詳細
