# Research & Design Decisions

## Summary
- **Feature**: `chart-view-project-items-crud-api`
- **Discovery Scope**: Simple Addition（既存CRUD APIパターンの拡張）
- **Key Findings**:
  - ネストされたリソースのパターンは projectLoads, monthlyHeadcountPlans 等で確立済み
  - 関連テーブル（物理削除）のためソフトデリート関連の処理は不要
  - 外部キー参照先（projects, project_cases）の存在検証にはデータ層でEXISTS句を使用するパターンが確立済み

## Research Log

### ネストされたルートのマウントパターン
- **Context**: chart_view_project_items は chart_views の子リソースとして `/chart-views/:chartViewId/project-items` にマウントする必要がある
- **Sources Consulted**: `apps/backend/src/index.ts`, `apps/backend/src/routes/projectLoads.ts`
- **Findings**:
  - `app.route('/parent/:parentId/child-resources', childRoute)` パターンで index.ts にマウント
  - 子ルート内で `c.req.param('parentId')` で親IDを取得
  - `parseIntParam()` ユーティリティで正の整数バリデーション
  - バルクエンドポイント（`/bulk` や `/display-order`）は `/:id` より前に定義（ルート競合回避）
- **Implications**: 既存パターンをそのまま踏襲可能

### 関連テーブルの物理削除パターン
- **Context**: chart_view_project_items は関連テーブルのため物理削除を採用する
- **Sources Consulted**: `docs/database/table-spec.md`, `apps/backend/src/data/projectLoadData.ts`
- **Findings**:
  - projectLoads も物理削除パターン（`DELETE FROM` を使用）
  - `deleted_at` カラムが存在しないため、復元APIは不要
  - `findAll` では WHERE 句にソフトデリートフィルタが不要
- **Implications**: projectLoads のデータ層パターンをベースに実装

### 外部キー参照検証パターン
- **Context**: 作成・更新時に projects, project_cases の存在を検証する必要がある
- **Sources Consulted**: `apps/backend/src/data/projectLoadData.ts`（`projectCaseExists` メソッド）
- **Findings**:
  - EXISTS句でCAST(1 AS BIT) / CAST(0 AS BIT) パターン
  - 親リソースの存在検証は子リソースのデータ層に配置
  - ソフトデリート対象テーブルの参照検証には `deleted_at IS NULL` を含める
- **Implications**: chart_views（ソフトデリートあり）→ `deleted_at IS NULL` 条件付き検証、projects（ソフトデリートあり）→ 同様、project_cases（ソフトデリートあり）→ 同様 + project_id 所属チェック

### JOINを含む一覧取得パターン
- **Context**: 一覧取得時に関連案件情報（projectCode, projectName）と案件ケース情報（caseName）を含めて返却する必要がある
- **Sources Consulted**: 既存の一覧取得パターンを調査
- **Findings**:
  - 既存CRUD APIの多くはJOINなしの単純SELECT
  - chart_view_project_items は projects テーブル（必須JOIN）と project_cases テーブル（LEFT JOIN、NULLable）を結合する必要がある
  - DB行型にJOINフィールドを含め、Transform層で整形する
- **Implications**: SELECT_COLUMNS に JOIN先のカラムを追加、DB行型を拡張、Transform で入れ子オブジェクト（`project`, `projectCase`）を構築

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| 既存レイヤードパターン踏襲 | routes → services → data + transform + types | 一貫性、学習コスト低、パターン確立済み | なし | 最適 |

## Design Decisions

### Decision: 一括表示順序更新のエンドポイント設計
- **Context**: 表示順序の一括更新を効率的に行う必要がある
- **Alternatives Considered**:
  1. `PUT /display-order` — 専用の一括更新エンドポイント
  2. `PUT /bulk` — 汎用的なバルク更新エンドポイント
- **Selected Approach**: `PUT /display-order` — 責務が明確で、表示順序のみを更新するセマンティクス
- **Rationale**: 既存の `PUT /bulk`（projectLoads）はupsertパターン。表示順序更新は更新のみで意味が異なるため、専用エンドポイントが適切
- **Trade-offs**: エンドポイントが増えるが、APIの意図が明確になる

### Decision: レスポンスでの関連リソース情報の返却方法
- **Context**: 一覧・単一取得で案件情報と案件ケース情報を含める
- **Alternatives Considered**:
  1. フラットレスポンス — 全フィールドをトップレベルに展開
  2. ネストオブジェクト — `project: { projectCode, projectName }`, `projectCase: { caseName } | null`
- **Selected Approach**: ネストオブジェクト
- **Rationale**: フロントエンド側で関連リソースの情報が構造的に明確になる。既存のレスポンス型との一貫性も保たれる
- **Trade-offs**: Transform層での変換がやや複雑になるが、APIの可読性が向上

## Risks & Mitigations
- Risk: project_case_id がNULLの場合のLEFT JOINハンドリング — Transform層でnullチェックを実装
- Risk: 一括表示順序更新でのトランザクション整合性 — トランザクション内で実行し、エラー時はロールバック

## References
- 既存実装: `apps/backend/src/routes/projectLoads.ts` — ネストリソースパターン
- 既存実装: `apps/backend/src/services/projectLoadService.ts` — 親リソース存在検証パターン
- テーブル仕様: `docs/database/table-spec.md` — chart_view_project_items 定義
