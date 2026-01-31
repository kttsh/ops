# Research & Design Decisions

## Summary
- **Feature**: `project-change-history-crud-api`
- **Discovery Scope**: Simple Addition（既存 CRUD パターンの踏襲）
- **Key Findings**:
  - project_change_history は関連テーブルに分類され、物理削除・deleted_at なしの構成
  - テーブルは `created_at`/`updated_at` を持たず `changed_at` のみという特殊なカラム構成
  - 更新（PUT）やバルク Upsert は変更履歴の性質上不要であり、CRUD のうち CRD のみ提供

## Research Log

### 既存 CRUD パターンとの適合性分析
- **Context**: project_change_history の API 設計が既存パターンのどれに近いかを判断する必要があった
- **Sources Consulted**: 既存実装（projectLoads, projectCases など）のルート・サービス・データ層
- **Findings**:
  - 子リソースパターン（親 ID をパスに含む）は projectLoads (`/project-cases/:id/project-loads`) と同一
  - 関連テーブルのため物理削除（projectLoads と同じ動作）
  - ユニーク制約がないため重複チェック（409 Conflict）は不要
  - `changed_at` のみで `created_at`/`updated_at` がないため、Transform 層の変換ロジックが若干異なる
- **Implications**: 既存パターンをほぼそのまま踏襲できるが、更新系エンドポイントの除外と `changed_at` フィールドの取り扱いに注意が必要

### ルーティングマウント方式
- **Context**: change-history を projects ルート内に含めるか、index.ts で独立マウントするかを判断
- **Sources Consulted**: `apps/backend/src/index.ts` のルートマウント一覧
- **Findings**:
  - 既存の子リソースはすべて index.ts で `app.route('/parent/:parentId/child', childRoute)` 形式でマウント
  - projects ルート内に change-history は存在しない
- **Implications**: `/projects/:projectId/change-history` として index.ts で独立マウントする設計が既存パターンに適合

## Design Decisions

### Decision: 更新（PUT）エンドポイントの除外
- **Context**: 変更履歴は一度記録された後に修正されるべきものか
- **Alternatives Considered**:
  1. CRUD 全操作（CRU D）を提供
  2. 作成と参照のみ（CR）、削除も不可
  3. 作成・参照・削除（CRD）を提供
- **Selected Approach**: CRD（作成・参照・削除）
- **Rationale**: 変更履歴は監査目的で記録されるため、一度作成されたレコードの内容変更は不適切。ただし、誤記録や管理者によるデータ整理のために削除は許容する
- **Trade-offs**: 誤記録時は削除→再作成となるが、履歴の信頼性が保たれる

### Decision: ソート順の設定
- **Context**: 一覧取得時のデフォルトソート順
- **Alternatives Considered**:
  1. `changed_at` 昇順（古い順）
  2. `changed_at` 降順（新しい順）
- **Selected Approach**: `changed_at` 降順
- **Rationale**: 変更履歴は直近の変更を確認するユースケースが主であり、新しい変更が先頭に来る方が実用的

## Risks & Mitigations
- projects テーブルの deleted_at チェックが必要 → 既存の projectData.projectExists() パターンを流用
- `changed_at` のデフォルト値（GETDATE()）は DB 側で設定されるため、API リクエストでの指定は不要

## References
- `docs/database/table-spec.md` — project_change_history テーブル定義
- `.kiro/specs/project-load-crud-api/design.md` — 類似パターンの設計リファレンス
