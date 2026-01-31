# Research & Design Decisions

---
**Purpose**: standard-effort-weights-crud-api の設計調査記録
---

## Summary
- **Feature**: `standard-effort-weights-crud-api`
- **Discovery Scope**: Simple Addition（既存ファクトテーブルCRUDパターンの拡張）
- **Key Findings**:
  - 既存ファクトテーブル（projectLoads, monthlyCapacities等）のネストルートパターンが確立済み
  - ファクトテーブルは bulk upsert（PUT /bulk）エンドポイントを標準的に備える
  - 親IDはルートパラメータから `parseIntParam` で取得する共通パターン

## Research Log

### 既存ファクトテーブルルートパターンの調査
- **Context**: standard_effort_weights のAPI設計にあたり、既存のファクトテーブルCRUDパターンを確認
- **Sources Consulted**: `apps/backend/src/routes/` 配下のファクトテーブルルートファイル群、`apps/backend/src/index.ts`
- **Findings**:
  - ファクトテーブルルートは親リソースの下にネストされる（例: `/project-cases/:projectCaseId/project-loads`）
  - 標準エンドポイント: GET /, GET /:childId, POST /, PUT /bulk, PUT /:childId, DELETE /:childId
  - PUT /bulk は「一括 upsert」で、配列データを受け取り既存データを全置換する
  - 物理削除のみ（soft delete なし、restore なし）
  - `parseIntParam` ヘルパーで親ID・子IDの両方を検証
- **Implications**: requirements.md の Requirement 2（一括更新）は PUT /bulk エンドポイントとして実装すべき（PUTコレクションではなく）

### ルート登録パターンの調査
- **Context**: ネストルートの index.ts への登録方法
- **Sources Consulted**: `apps/backend/src/index.ts`
- **Findings**:
  - `app.route('/standard-effort-masters/:standardEffortId/weights', standardEffortWeights)` の形式で登録
  - ルートファイル内では相対パス（`/`, `/:weightId`, `/bulk`）で定義
- **Implications**: ルートファイルは独立して定義し、index.ts でマウントする標準パターンに従う

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| 既存ファクトテーブルパターン踏襲 | projectLoads等と同一のネストルート+bulk upsert構成 | パターン統一、実装コスト低 | なし | 採用 |

## Design Decisions

### Decision: エンドポイント構成
- **Context**: requirements.md では一覧取得・一括更新・個別CRUD を要件として定義
- **Alternatives Considered**:
  1. コレクションレベルの PUT で一括更新 — RESTful だが既存パターンと不一致
  2. PUT /bulk エンドポイント — 既存ファクトテーブルパターンと一致
- **Selected Approach**: PUT /bulk エンドポイントを使用（既存パターン踏襲）
- **Rationale**: projectLoads, monthlyCapacities等すべてのファクトテーブルが PUT /bulk を使用しており、一貫性を保つ
- **Trade-offs**: RESTful 純粋性はやや低下するが、プロジェクト内の一貫性を優先
- **Follow-up**: requirements.md の Requirement 2 のエンドポイントパスを `/bulk` に反映

### Decision: ページネーション不要
- **Context**: ファクトテーブルの一覧取得にページネーションが必要か
- **Alternatives Considered**:
  1. ページネーション付き — 汎用的だがオーバーキル
  2. ページネーションなし — 単純、既存ファクトテーブルパターンと一致
- **Selected Approach**: ページネーションなし（全件返却）
- **Rationale**: 1つの standard_effort_master に紐づく weights は最大21件（0, 5, 10, ... 100）であり、ページネーションの必要がない。既存ファクトテーブルも親IDでフィルタした結果を全件返却している
- **Trade-offs**: なし

## Risks & Mitigations
- 特記すべきリスクなし（既存パターンの単純な拡張）

## References
- 既存ファクトテーブルルート: `apps/backend/src/routes/projectLoads.ts`, `monthlyCapacities.ts` 等
- テーブル仕様: `docs/database/table-spec.md` — standard_effort_weights セクション
- 親テーブルAPI設計: `.kiro/specs/standard-effort-masters-crud-api/design.md`
