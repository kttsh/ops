# Research & Design Decisions

## Summary
- **Feature**: `aggregated-chart-data-api`
- **Discovery Scope**: Extension（既存バックエンドアーキテクチャへの新エンドポイント追加）
- **Key Findings**:
  - 既存の3層アーキテクチャ（routes → services → data）に完全に準拠して新エンドポイントを追加可能
  - 間接工数の種類別内訳は `indirect_work_type_ratios` と `work_types` のJOINで動的導出可能。年度判定ロジック（会計年度4月始まり）が必要
  - 新規ライブラリ追加不要。既存の mssql + Hono + Zod スタックで完結

## Research Log

### 既存アーキテクチャとの整合性
- **Context**: 新規集約APIが既存パターンに従えるか確認
- **Sources Consulted**: `apps/backend/src/` 配下の全レイヤーファイル
- **Findings**:
  - routes → services → data の3層パターンが全22エンドポイントで統一されている
  - 読み取り専用のGETエンドポイントはCRUDルートと同じ構造で作成可能
  - 既存ルートはCRUD操作に特化しているが、集約（読み取り専用）エンドポイントも同じパターンで問題なく追加可能
  - transform層は本APIでは不要（SQLレベルで直接APIレスポンス形式にマッピングする方が効率的）
- **Implications**: 新規ファイル4つ（routes, services, data, types）で完結。transform層は省略可能

### データモデルと集約クエリの設計
- **Context**: 3種のファクトテーブルを効率的に集約するクエリ戦略
- **Sources Consulted**: `docs/database/table-spec.md`, `docs/database/create-tables.sql`
- **Findings**:
  - `project_load`: PK=project_load_id, UK=(project_case_id, year_month), manhour=DECIMAL(10,2)
  - `monthly_indirect_work_load`: UK=(indirect_work_case_id, business_unit_code, year_month), manhour=DECIMAL(10,2), source=VARCHAR(20)
  - `monthly_capacity`: UK=(capacity_scenario_id, business_unit_code, year_month), capacity=DECIMAL(10,2)
  - `indirect_work_type_ratios`: UK=(indirect_work_case_id, work_type_code, fiscal_year), ratio=DECIMAL(5,4)
  - 各テーブルにINTERSECTするカラムは`year_month`（CHAR 6, YYYYMM形式）
- **Implications**: 3種のデータは独立したクエリで取得し、サービス層で結合する方がSQL複雑度を抑えられる

### chartViewId指定時のデータ選択ロジック
- **Context**: `chart_view_project_items` / `chart_view_indirect_work_items` からのフィルタリング
- **Sources Consulted**: `apps/backend/src/data/chartViewProjectItemData.ts`, `apps/backend/src/types/chartViewProjectItem.ts`
- **Findings**:
  - `chart_view_project_items` は `project_id` + optional `project_case_id` で案件を指定
  - `project_case_id` がNULLの場合、その案件の `is_primary = true` のケースをフォールバック選択する必要がある
  - `chart_view_indirect_work_items` は `indirect_work_case_id` で間接作業ケースを直接指定
  - `is_visible = 1` でフィルタリング
- **Implications**: chartViewId指定時は2段階の結合（ビューアイテム → ファクトテーブル）が必要

### 間接工数種類別内訳の導出
- **Context**: `indirect_work_type_ratios` から種類別内訳を動的計算
- **Sources Consulted**: `docs/requirements/indirect-work-type-breakdown-spec.md`
- **Findings**:
  - 会計年度判定: month >= 4 → fiscalYear = year, month < 4 → fiscalYear = year - 1
  - 計算式: `type_manhour = total_manhour * ratio`、DECIMAL(10,2)で丸め
  - 比率未設定時: breakdown=空配列, breakdownCoverage=0
  - 比率合計>1.0: エラーとせず計算続行、breakdownCoverageで通知
  - 丸め誤差は許容（フロントエンドでは合計行にtotal manhourを使用）
- **Implications**: SQLのCASE式で年度判定し、JOINで一度に取得可能。breakdownCoverageはSUM(ratio)で算出

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| 3独立クエリ + サービス結合 | 案件工数/間接工数/キャパシティを個別クエリで取得し、サービス層で統合 | クエリの可読性、独立テスト、メンテナンス性 | 3回のDB往復 | 推奨。各クエリが50行未満で管理可能 |
| 単一巨大クエリ | UNION ALLやCTEで全データを1クエリで取得 | DB往復1回 | SQLの複雑度が極めて高い、型変換が煩雑 | 不採用 |
| 並列クエリ + Promise.all | 3つのクエリを並列実行 | レイテンシ最小化 | コネクションプール圧迫の可能性 | 将来のパフォーマンス改善として検討可 |

## Design Decisions

### Decision: 3独立クエリ + サービス層結合パターン
- **Context**: 3種のファクトデータを効率的かつ保守性高く取得する方法
- **Alternatives Considered**:
  1. 単一巨大クエリ — 1回のDB往復だがSQLが極めて複雑
  2. 3独立クエリ + サービス結合 — シンプルなSQL × 3回
  3. 並列クエリ — Promise.allで同時実行
- **Selected Approach**: 3独立クエリ + サービス結合（オプション2）
- **Rationale**: 既存コードベースのパターンに最も整合。各クエリが独立テスト可能。SQL Serverのコネクションプールは10接続上限のため、並列実行は初期段階では不要
- **Trade-offs**: 3回のDB往復によるレイテンシ増加があるが、各クエリは単純なので合計2秒以内の要件は十分達成可能
- **Follow-up**: パフォーマンスプロファイリング後、必要に応じて並列実行に切り替え

### Decision: Transform層の省略
- **Context**: 集約APIのレスポンス変換をどこで行うか
- **Alternatives Considered**:
  1. transform層ファイルを作成 — 既存パターンに完全準拠
  2. data層のSQLで直接APIレスポンス形式にマッピング — transform不要
- **Selected Approach**: data層でcamelCaseエイリアスを使用し、transform層を省略
- **Rationale**: 集約APIのレスポンスは1:1のカラムマッピングではなく、GROUP BY + SUM の結果をネスト構造に変換する必要がある。単純なカラム名変換ではないため、サービス層でレスポンス構造を構築する方が自然
- **Trade-offs**: 既存パターンとの若干の乖離があるが、集約APIの性質上合理的
- **Follow-up**: なし

## Risks & Mitigations
- **パフォーマンスリスク**: 500案件×36ヶ月の大量データ集約 → SQLのGROUP BYとINDEXで対応。既存UKインデックスが活用される
- **年度境界の丸め**: 4月と3月で異なる比率が適用される → 仕様通りの正しい動作として処理
- **breakdownCoverageの精度**: DECIMAL(5,4)のSUM → 十分な精度で問題なし

## References
- `docs/requirements/chart-data-api-spec.md` — APIエンドポイント仕様
- `docs/requirements/indirect-work-type-breakdown-spec.md` — 間接工数内訳導出仕様
- `docs/database/table-spec.md` — 全テーブルスキーマ定義
- `docs/database/create-tables.sql` — DDLスクリプト
