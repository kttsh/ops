# Research & Design Decisions

## Summary
- **Feature**: `indirect-work-cases-crud-api`
- **Discovery Scope**: Simple Addition（既存 headcount-plan-cases-crud-api パターンの踏襲）
- **Key Findings**:
  - headcount_plan_cases と同一のレイヤード構成で実装可能
  - `business_unit_code` が NOT NULL のため、JOIN 方式と作成時バリデーションに差異あり
  - 参照チェック対象テーブルが3テーブル（monthly_indirect_work_load, indirect_work_type_ratios, chart_view_indirect_work_items）

## Research Log

### business_unit_code の NULL 制約の違い
- **Context**: headcount_plan_cases では `business_unit_code` が NULL 許可だが、indirect_work_cases では NOT NULL
- **Sources Consulted**: `docs/database/table-spec.md`
- **Findings**:
  - indirect_work_cases は事業部ごとの間接作業計画であり、必ず事業部に紐づく
  - headcount_plan_cases は特定BUに紐づかないケースも許容していた
- **Implications**:
  - JOIN は LEFT JOIN を維持（business_units 側が論理削除されている可能性を考慮）
  - 作成時のバリデーションで `businessUnitCode` を必須とする
  - 更新時にも `businessUnitCode` に null を許可しない（省略は可能だが null 設定は不可）

### 参照チェック対象テーブル
- **Context**: 論理削除前に子テーブルの参照有無を確認する必要がある
- **Sources Consulted**: `docs/database/table-spec.md`
- **Findings**:
  - `monthly_indirect_work_load`: indirect_work_case_id を外部キーとして持つ（ON DELETE CASCADE）
  - `indirect_work_type_ratios`: indirect_work_case_id を外部キーとして持つ（ON DELETE CASCADE）
  - `chart_view_indirect_work_items`: indirect_work_case_id を外部キーとして持つ
- **Implications**:
  - 論理削除前にこれら3テーブルへの EXISTS チェックを実行
  - DBレベルでは CASCADE 設定だが、論理削除は UPDATE なのでカスケードは発動しない

## Design Decisions

### Decision: business_unit_code の JOIN 方式
- **Context**: business_unit_code が NOT NULL のため INNER JOIN にすべきか
- **Alternatives Considered**:
  1. INNER JOIN — NOT NULL なので必ず一致するはず
  2. LEFT JOIN — business_units 側の論理削除を考慮
- **Selected Approach**: LEFT JOIN（`bu.deleted_at IS NULL` 条件付き）
- **Rationale**: business_units が論理削除された場合、INNER JOIN だと indirect_work_cases のレコード自体が取得できなくなる。LEFT JOIN にすることで、BU が削除されていても case レコードは取得でき、businessUnitName が null になるだけで済む
- **Trade-offs**: INNER JOIN に比べて若干の性能差があるが、データ整合性とユーザビリティを優先
- **Follow-up**: headcount_plan_cases と同じ JOIN パターンで統一

### Decision: 更新時の businessUnitCode の扱い
- **Context**: NOT NULL 制約があるため、更新時に null を設定できない
- **Alternatives Considered**:
  1. headcount_plan_cases と同じく nullable を許可（DB制約と矛盾）
  2. 省略可能だが null 設定は不可
- **Selected Approach**: 更新スキーマで businessUnitCode は optional だが nullable は不可
- **Rationale**: DB の NOT NULL 制約に合わせる。フィールドを省略すれば既存値を維持、値を指定すれば新しい値に更新
- **Trade-offs**: headcount_plan_cases との API レスポンス互換性がやや異なるが、DB 設計に忠実

## Risks & Mitigations
- 参照チェックが3テーブルに分散 — 単一の hasReferences メソッド内で3つの EXISTS を OR 結合して1クエリで完結させる
- business_units の論理削除時に orphan レコードが発生 — LEFT JOIN で対応済み、フロントエンドで警告表示は将来課題

## References
- `docs/database/table-spec.md` — テーブル定義の正式仕様
- `.kiro/specs/headcount-plan-cases-crud-api/design.md` — 参照パターン
- `docs/rules/api-response.md` — APIレスポンス規約
- `docs/rules/hono/crud-guide.md` — Hono CRUD 実装ガイド
