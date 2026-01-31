# Research & Design Decisions: monthly-capacity-crud-api

## Summary
- **Feature**: `monthly-capacity-crud-api`
- **Discovery Scope**: Simple Addition（既存 CRUD パターンの踏襲）
- **Key Findings**:
  - project_load CRUD API と同一のレイヤードアーキテクチャパターンを踏襲可能
  - 3キーのユニーク制約（capacity_scenario_id + business_unit_code + year_month）により、重複チェックと MERGE 文のキー条件が project_load（2キー）より複雑
  - business_unit_code の外部キー検証が必要（project_load にはない追加要件）

## Research Log

### 既存ファクトテーブル CRUD パターンとの比較
- **Context**: monthly_capacity は project_load と同じファクトテーブルカテゴリ。既存パターンをどこまで流用可能かを確認
- **Sources Consulted**: `.kiro/specs/project-load-crud-api/design.md`, `docs/database/table-spec.md`
- **Findings**:
  - project_load: 2キー ユニーク制約 (project_case_id, year_month)、親テーブル project_cases のみ検証
  - monthly_capacity: 3キー ユニーク制約 (capacity_scenario_id, business_unit_code, year_month)、親テーブル capacity_scenarios + 外部キー business_units の両方を検証
  - バルク Upsert の MERGE 文: ON 句のキー条件が3カラムに拡大
- **Implications**: 基本構造は同一だが、Data 層の MERGE 文とService 層の重複チェック・外部キー検証ロジックを拡張する必要がある

### capacity_scenarios 親テーブルの特性
- **Context**: 親テーブル capacity_scenarios の削除仕様を確認
- **Sources Consulted**: `docs/database/table-spec.md`
- **Findings**:
  - capacity_scenarios はエンティティテーブル（deleted_at あり・論理削除）
  - monthly_capacity は ON DELETE CASCADE で親削除時に自動削除
  - 親テーブルの存在確認では `deleted_at IS NULL` チェックが必要
- **Implications**: project_load の project_cases 存在確認パターンをそのまま適用可能

## Design Decisions

### Decision: business_unit_code の存在検証方式
- **Context**: 作成・更新・バルク操作時に business_unit_code の有効性を検証する必要がある
- **Alternatives Considered**:
  1. Data 層で business_units テーブルを直接参照
  2. 既存の businessUnitData モジュールを利用
- **Selected Approach**: Data 層内で直接 SQL クエリ（`SELECT 1 FROM business_units WHERE business_unit_code = @code AND deleted_at IS NULL`）
- **Rationale**: 既存の project_load パターンとの一貫性。Data 層は他の Data モジュールに依存しない設計方針を維持
- **Trade-offs**: business_units テーブルへの直接参照が必要だが、シンプルかつ高速
- **Follow-up**: バルク操作時は複数の business_unit_code を一括チェックする IN 句を使用

### Decision: バルク Upsert の配列内重複チェック
- **Context**: バルク Upsert で同一 businessUnitCode + yearMonth の組み合わせが配列内に重複する場合の処理
- **Selected Approach**: Service 層で Map<string, number> による重複チェック（キー: `${businessUnitCode}_${yearMonth}`）
- **Rationale**: project_load の yearMonth 単一キーチェック（Set）から、複合キーチェック（Map）に拡張

## Risks & Mitigations
- business_unit_code の存在チェックにおける N+1 問題 → バルク時は IN 句で一括チェック
- MERGE 文の ON 条件が3カラムに増えるため SQL が複雑化 → テストでカバー

## References
- `docs/database/table-spec.md` — monthly_capacity テーブル定義
- `docs/rules/api-response.md` — RFC 9457 エラーレスポンス形式
- `.kiro/specs/project-load-crud-api/design.md` — 参照実装のデザイン
