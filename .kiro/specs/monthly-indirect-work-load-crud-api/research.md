# Research & Design Decisions: monthly-indirect-work-load-crud-api

## Summary
- **Feature**: `monthly-indirect-work-load-crud-api`
- **Discovery Scope**: Simple Addition（既存 CRUD パターンの踏襲）
- **Key Findings**:
  - 既存の project-load-crud-api と monthly-capacity-crud-api と同一のレイヤードアーキテクチャパターンで実装可能
  - monthly_indirect_work_load は monthly_capacity と同様に business_unit_code を持つ 3 キーユニーク制約のファクトテーブル
  - `source` フィールド（"calculated" / "manual"）が本テーブル固有のカラムであり、Zod enum バリデーションが必要

## Research Log

### 既存ファクトテーブル CRUD パターンの分析
- **Context**: monthly_indirect_work_load の設計にあたり、既存のファクトテーブル CRUD 実装パターンを調査
- **Sources Consulted**: `.kiro/specs/project-load-crud-api/design.md`、`.kiro/specs/monthly-capacity-crud-api/requirements.md`
- **Findings**:
  - project_load（2キーユニーク: project_case_id + year_month）: バルク Upsert は MERGE 文で実装
  - monthly_capacity（3キーユニーク: capacity_scenario_id + business_unit_code + year_month）: business_unit_code の存在確認 + deleted_at チェックが追加
  - monthly_indirect_work_load は monthly_capacity と同構造（3キーユニーク: indirect_work_case_id + business_unit_code + year_month）+ `source` フィールド
- **Implications**: monthly_capacity パターンをベースに、source フィールドの追加バリデーションを組み込む

### source フィールドの設計
- **Context**: `source` は "calculated" または "manual" の 2 値を取る VARCHAR(20) フィールド
- **Findings**:
  - Zod の `z.enum(["calculated", "manual"])` で型安全にバリデーション可能
  - 作成・更新・バルク Upsert のすべてのスキーマに含める必要あり
  - DB 行型では `string`、API レスポンス型でも `string`（camelCase 変換は不要だが transform で明示的にマッピング）
- **Implications**: types 層に sourceSchema を追加、他のレイヤーは既存パターンの拡張で対応

## Design Decisions

### Decision: 親リソースのエンドポイント階層
- **Context**: monthly_indirect_work_load は indirect_work_cases の子リソース
- **Alternatives Considered**:
  1. フラット構造 `/monthly-indirect-work-loads`
  2. ネスト構造 `/indirect-work-cases/:indirectWorkCaseId/monthly-indirect-work-loads`
- **Selected Approach**: ネスト構造
- **Rationale**: 既存パターン（project-load, monthly-capacity）との一貫性。親リソースの文脈でデータを操作するのが自然
- **Trade-offs**: URL が長くなるが、リソース関係が明確

### Decision: バルク Upsert の MERGE 文パターン
- **Context**: 既存の project-load で MERGE 文パターンが確立済み
- **Selected Approach**: MERGE 文（SQL Server 固有構文）をトランザクション内でループ実行
- **Rationale**: 既存パターンとの一貫性。3キーでの MERGE は monthly_capacity と同一パターン
- **Trade-offs**: 大量データ時のパフォーマンスは要監視だが、現時点では問題なし

## Risks & Mitigations
- business_unit_code の存在確認で追加クエリが発生するが、ファクトテーブルの操作頻度から問題なし
- source フィールドの値が将来拡張される可能性 → enum の拡張で対応可能

## References
- `docs/database/table-spec.md` — monthly_indirect_work_load テーブル定義
- `.kiro/specs/project-load-crud-api/design.md` — ファクトテーブル CRUD 設計の参照実装
- `.kiro/specs/monthly-capacity-crud-api/requirements.md` — 3キーユニーク制約ファクトテーブルの要件パターン
