# Research & Design Decisions: capacity-scenarios-crud-api

---
**Purpose**: 設計判断の背景となるリサーチ結果を記録する。
---

## Summary
- **Feature**: `capacity-scenarios-crud-api`
- **Discovery Scope**: Simple Addition（既存CRUDパターンの踏襲）
- **Key Findings**:
  - capacity_scenarios テーブルは外部キーを持たないシンプルなエンティティであり、headcount_plan_cases から JOINロジック・FK存在チェックを除去するだけで実装可能
  - 子テーブル `monthly_capacity` が `capacity_scenario_id` を参照（ON DELETE CASCADE）するが、API側では論理削除前の参照チェックが必要
  - 既存の headcount_plan_cases 実装パターンがほぼそのまま適用可能で、新規のアーキテクチャ判断は不要

## Research Log

### 既存CRUDパターンとの差分分析
- **Context**: capacity_scenarios の設計にあたり、headcount_plan_cases との差分を特定する
- **Sources Consulted**: headcount_plan_cases の全レイヤー実装ファイル、table-spec.md
- **Findings**:
  - capacity_scenarios は外部キーを持たない → `businessUnitData` への依存が不要
  - `scenario_name` フィールド名（`case_name` ではない）
  - Row型・Response型に `business_unit_code` / `business_unit_name` フィールドが不要
  - Data層で LEFT JOIN が不要（単一テーブルのみの操作）
  - Service層で FK存在チェックが不要
- **Implications**: headcount_plan_cases より実装がシンプルになる。5ファイル構成は維持

### 参照整合性チェック対象
- **Context**: 論理削除時の参照チェック対象テーブルの特定
- **Sources Consulted**: table-spec.md
- **Findings**:
  - `monthly_capacity` テーブルが `capacity_scenario_id` を外部キーとして参照（ON DELETE CASCADE）
  - DB側は CASCADE 設定だが、論理削除の場合は物理削除しないためCASCADEは発動しない
  - API側で明示的に `monthly_capacity` の参照チェック（EXISTS）が必要
- **Implications**: `hasReferences()` メソッドで `monthly_capacity` テーブルを検査

## Design Decisions

### Decision: 外部キー関連コードの省略
- **Context**: headcount_plan_cases は business_unit_code で business_units と JOIN するが、capacity_scenarios は外部キーを持たない
- **Selected Approach**: Data層から LEFT JOIN を除去、Service層から FK存在チェックを除去
- **Rationale**: テーブル定義に忠実に、不要なコードを追加しない
- **Trade-offs**: 将来的に外部キーが追加される場合は拡張が必要だが、現時点では YAGNI 原則を適用

## Risks & Mitigations
- **リスク**: 特になし。既存パターンの単純な適用であり、アーキテクチャ上の新規リスクは存在しない

## References
- headcount_plan_cases 実装: `apps/backend/src/` 配下の各レイヤーファイル
- テーブル仕様書: `docs/database/table-spec.md`
- API レスポンス規約: `docs/rules/api-response.md`
- Hono CRUD ガイド: `docs/rules/hono/crud-guide.md`
