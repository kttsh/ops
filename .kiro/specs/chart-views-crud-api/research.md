# Research & Design Decisions: chart-views-crud-api

## Summary
- **Feature**: `chart-views-crud-api`
- **Discovery Scope**: Simple Addition（既存CRUDパターンの拡張）
- **Key Findings**:
  - 既存の6エンティティ（businessUnits, projectTypes, workTypes, projects, projectCases, headcountPlanCases）のCRUD APIが確立されたパターンで実装済み
  - chart_views は外部キーを持たず、JOINが不要なため headcountPlanCases よりシンプル
  - `startYearMonth` ≤ `endYearMonth` のクロスフィールドバリデーションが固有の設計ポイント

## Research Log

### 既存CRUDパターンの調査
- **Context**: chart_views のCRUD API設計にあたり、既存の実装パターンを確認
- **Sources Consulted**: apps/backend/src/ 配下の routes/, services/, data/, transform/, types/ の各ファイル
- **Findings**:
  - 全エンティティが routes → services → data + transform + types のレイヤードパターンに従う
  - IDENTITY主キーのエンティティ（projects, projectCases, headcountPlanCases）では `findByIdIncludingDeleted` メソッドが復元時に使用される
  - 参照チェック（`hasReferences`）は子テーブルが存在する場合に実装
  - 外部キーのないエンティティ（businessUnits, projectTypes, workTypes）は重複チェック（`findByCode`）を持つ
- **Implications**: chart_views は IDENTITY主キー＋外部キーなし＋子テーブルCASCADE削除のため、最もシンプルな部類

### chart_views のテーブル構造分析
- **Context**: 固有のバリデーション要件の特定
- **Sources Consulted**: docs/database/table-spec.md
- **Findings**:
  - `chart_type` は VARCHAR(50) で制約なし（enum定義なし）
  - `start_year_month` / `end_year_month` は CHAR(6) で YYYYMM 形式
  - 関連テーブル（chart_view_project_items, chart_view_indirect_work_items）は ON DELETE CASCADE のため、論理削除時の参照チェック不要
  - `is_default` は BIT 型でデフォルト 0
- **Implications**: `hasReferences` メソッドは不要。年月フィールドのクロスフィールドバリデーションが必要

### 年月バリデーションパターン
- **Context**: `startYearMonth` ≤ `endYearMonth` のバリデーション方式を検討
- **Findings**:
  - Zod の `.refine()` でスキーマレベルのクロスフィールドバリデーションが可能
  - YYYYMM形式の文字列は辞書順比較で大小関係が正しく判定できる（例: "202601" < "202612"）
  - 更新時は部分更新のため、送信されなかったフィールドは既存値を使ってバリデーションする必要がある → サービス層でのバリデーションが適切
- **Implications**: 作成時は Zod の `.refine()` でスキーマバリデーション、更新時はサービス層で既存値とマージ後にバリデーション

## Design Decisions

### Decision: 参照チェック（hasReferences）の省略
- **Context**: 論理削除時に子テーブルの参照を確認するかどうか
- **Alternatives Considered**:
  1. hasReferences を実装して chart_view_project_items / chart_view_indirect_work_items の参照チェック
  2. hasReferences を省略（CASCADE削除に依存）
- **Selected Approach**: hasReferences を省略
- **Rationale**: chart_views の論理削除は `deleted_at` を設定するだけで子テーブルに影響しない。子テーブルは chart_views の物理削除時に CASCADE で削除される設計。論理削除で子テーブルデータが残ることは問題ない（ビュー復元時に子アイテムも復活するため望ましい動作）
- **Trade-offs**: 論理削除したビューの子アイテムが残り続けるが、復元時に利用可能
- **Follow-up**: 物理削除APIを将来的に追加する場合は CASCADE 動作を確認

### Decision: 年月クロスフィールドバリデーションの実装箇所
- **Context**: `startYearMonth` ≤ `endYearMonth` の検証をどの層で行うか
- **Alternatives Considered**:
  1. Zod スキーマの `.refine()` のみ（作成時・更新時共通）
  2. 作成時は Zod `.refine()`、更新時はサービス層
- **Selected Approach**: 作成時は Zod `.refine()`、更新時はサービス層で既存値とマージ後にバリデーション
- **Rationale**: 更新時は一方のフィールドだけが送信される可能性があり、スキーマレベルでは両フィールドが揃わないため
- **Trade-offs**: バリデーションロジックが2箇所に分散するが、各層の責務に適切に合致
- **Follow-up**: なし

## Risks & Mitigations
- `chartType` に制約がないため、将来的にenum化が必要になる可能性がある — 現時点では自由文字列として許容し、フロントエンドで選択肢を提供

## References
- `docs/database/table-spec.md` — chart_views テーブル定義
- `docs/rules/api-response.md` — APIレスポンス規約（RFC 9457）
- `.kiro/specs/headcount-plan-cases-crud-api/design.md` — 参照パターン（IDENTITY主キー CRUD）
