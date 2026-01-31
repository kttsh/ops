# Research & Design Decisions

## Summary
- **Feature**: `monthly-headcount-plan-crud-api`
- **Discovery Scope**: Simple Addition（既存ファクトテーブル CRUD パターンの踏襲）
- **Key Findings**:
  - project_load CRUD API の実装パターンをほぼそのまま適用可能
  - 3カラム複合ユニーク制約 (`headcount_plan_case_id`, `business_unit_code`, `year_month`) が主な差分
  - business_units テーブルへの外部キー検証が追加で必要

## Research Log

### project_load との構造比較
- **Context**: 既存の project_load CRUD API パターンとの差異を特定
- **Sources Consulted**: `docs/database/table-spec.md`、`project-load-crud-api/design.md`
- **Findings**:
  - project_load: ユニーク制約は 2カラム (project_case_id, year_month)
  - monthly_headcount_plan: ユニーク制約は 3カラム (headcount_plan_case_id, business_unit_code, year_month)
  - headcount は INT（project_load の manhour は DECIMAL(10,2)）
  - business_units テーブルへの追加外部キーがある
- **Implications**: MERGE 文の ON 条件が3カラムに拡張。バルク Upsert 時の重複チェックも (businessUnitCode, yearMonth) の組み合わせで行う必要がある

### business_units 存在確認
- **Context**: 作成・更新・バルク操作時に businessUnitCode の有効性を検証する必要がある
- **Sources Consulted**: `docs/database/table-spec.md`（business_units テーブル定義）
- **Findings**:
  - business_units は論理削除対応（deleted_at カラムあり）
  - 有効なBUかどうかは `deleted_at IS NULL` で判定
  - 既存の headcount_plan_cases CRUD API で businessUnitExists チェックの実装パターンあり
- **Implications**: data 層に businessUnitExists メソッドを追加

## Design Decisions

### Decision: フィルタリングの実装方式
- **Context**: 一覧取得時に businessUnitCode でフィルタリングする要件（1.5）
- **Alternatives Considered**:
  1. クエリパラメータ `businessUnitCode` を SQL の WHERE 句で直接フィルタ
  2. 全件取得後に JavaScript でフィルタ
- **Selected Approach**: Option 1 — SQL の WHERE 句でフィルタ
- **Rationale**: データ量が増えた場合のパフォーマンスを考慮。DB レベルでフィルタする方が効率的
- **Trade-offs**: SQL のクエリが条件分岐で若干複雑になるが、パフォーマンス面のメリットが大きい

### Decision: バルク Upsert の MERGE 条件
- **Context**: project_load は 2カラム（project_case_id, year_month）でマッチングだが、monthly_headcount_plan は 3カラム必要
- **Selected Approach**: MERGE 文の ON 条件に business_unit_code を追加
- **Rationale**: ユニーク制約に完全一致する条件でマッチングする必要がある

## Risks & Mitigations
- business_units テーブルにバルク操作で複数の異なる businessUnitCode が含まれる場合、全コードの存在確認が必要 — バルク操作前に一括で存在チェックを行いパフォーマンスを確保
