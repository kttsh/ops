# Research & Design Decisions

## Summary
- **Feature**: `chart-color-palettes-crud-api`
- **Discovery Scope**: Simple Addition（独立した設定テーブルの CRUD API）
- **Key Findings**:
  - `chart_color_palettes` は親テーブルを持たない独立した設定テーブルであり、トップレベルエンドポイントとして実装する
  - 設定テーブルのため物理削除を適用し、`deleted_at` カラムは存在しない
  - 既存のレイヤードアーキテクチャ（routes → services → data → transform → types）をそのまま踏襲可能

## Research Log

### 既存 CRUD パターンの確認
- **Context**: 新規設定テーブル API の設計に際し、既存実装パターンとの一貫性を確認
- **Sources Consulted**: `apps/backend/src/` 配下の既存実装（chartViews, projectLoads, indirectWorkTypeRatios 等）
- **Findings**:
  - すべてのエンティティが routes/services/data/transform/types の5層構成
  - マスタ・エンティティテーブルは論理削除（softDelete + restore）、ファクト・設定テーブルは物理削除
  - 独立エンティティ（chartViews, capacityScenarios 等）は `index.ts` にトップレベルルートとして登録
  - ネストリソース（projectLoads, indirectWorkTypeRatios 等）は親パス配下にマウント
- **Implications**: `chart_color_palettes` は親テーブルを持たないため、`/chart-color-palettes` としてトップレベル登録する

### 物理削除パターン
- **Context**: 設定テーブルにおける削除方式の確認
- **Findings**:
  - ファクトテーブル（projectLoad, monthlyCapacity 等）は物理削除を使用
  - 設定テーブル（chart_stack_order_settings, chart_color_settings）も物理削除
  - 物理削除の場合、`deleted_at` カラムなし、restore エンドポイントなし、`filter[includeDisabled]` クエリ不要
- **Implications**: DELETE は `DELETE FROM` SQL、一覧取得は `deleted_at` フィルタ不要

## Design Decisions

### Decision: トップレベルエンドポイント
- **Context**: エンドポイントの URL 設計
- **Alternatives Considered**:
  1. `/chart-color-palettes` — トップレベル独立エンドポイント
  2. `/chart-views/:chartViewId/color-palettes` — chartViews のサブリソース
- **Selected Approach**: トップレベル `/chart-color-palettes`
- **Rationale**: `chart_color_palettes` テーブルは `chart_views` への外部キーを持たず、独立したグローバル設定である
- **Trade-offs**: シンプルな URL 構造、将来的に複数コンテキストからの参照が容易

### Decision: ページネーション不要
- **Context**: 一覧取得時のレスポンス構造
- **Selected Approach**: ページネーションなし、全件返却
- **Rationale**: カラーパレットは少数（通常10〜30件程度）の設定データであり、全件取得で十分

## Risks & Mitigations
- 特段のリスクなし。既存パターンの純粋な適用で完結する Simple Addition

## References
- `docs/database/table-spec.md` — chart_color_palettes テーブル仕様
- `docs/rules/hono/crud-guide.md` — Hono CRUD 実装ガイド
- `docs/rules/api-response.md` — API レスポンス規約
