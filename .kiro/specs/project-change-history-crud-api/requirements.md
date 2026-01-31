# Requirements Document

## Introduction

本ドキュメントは、案件変更履歴（project_change_history）テーブルに対する CRUD API の要件を定義する。

project_change_history は、案件（projects）に紐づく変更履歴を記録する関連テーブルである。案件の各種フィールドの変更内容（変更前後の値、変更者、変更日時）を時系列で記録し、変更の追跡・監査を可能にする。

**テーブル分類:** 関連テーブル（物理削除・deleted_at なし）

project_change_history は projects の子リソースであり、API エンドポイントは `/projects/:projectId/change-history` の階層構造で提供する。

**対象テーブル:** `project_change_history`

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| project_change_history_id | INT | NO | IDENTITY(1,1) | 主キー。自動採番 |
| project_id | INT | NO | - | 外部キー → projects |
| change_type | VARCHAR(50) | NO | - | 変更タイプ |
| field_name | VARCHAR(100) | YES | NULL | 変更フィールド名 |
| old_value | NVARCHAR(1000) | YES | NULL | 変更前の値 |
| new_value | NVARCHAR(1000) | YES | NULL | 変更後の値 |
| changed_by | NVARCHAR(100) | NO | - | 変更者 |
| changed_at | DATETIME2 | NO | GETDATE() | 変更日時 |

**外部キー:** FK_project_change_history_project → projects(project_id) ON DELETE CASCADE
**インデックス:** IX_project_change_history_changed_at (changed_at) — 変更日時での検索用

---

## Requirements

### Requirement 1: 変更履歴一覧取得

**Objective:** As a プロジェクトマネージャー, I want 特定の案件に紐づく変更履歴一覧を取得したい, so that 案件の変更経緯を時系列で確認できる

#### Acceptance Criteria

1. When GET リクエストが `/projects/:projectId/change-history` に送信された場合, the Project Change History API shall 指定された projectId に紐づく変更履歴一覧を返却する
2. The Project Change History API shall レスポンスを `{ data: [...] }` 形式で返却する
3. The Project Change History API shall 一覧を `changed_at` の降順（新しい変更が先頭）でソートして返却する
4. If 指定された projectId に該当する案件が存在しないか、論理削除済みの場合, the Project Change History API shall 404 Not Found を RFC 9457 Problem Details 形式で返却する

---

### Requirement 2: 変更履歴単一取得

**Objective:** As a プロジェクトマネージャー, I want 特定の変更履歴の詳細を取得したい, so that 個別の変更内容を確認できる

#### Acceptance Criteria

1. When GET リクエストが `/projects/:projectId/change-history/:projectChangeHistoryId` に送信された場合, the Project Change History API shall 指定された変更履歴の詳細を `{ data: {...} }` 形式で返却する
2. If 指定された projectChangeHistoryId に該当する変更履歴が存在しない場合, the Project Change History API shall 404 Not Found を RFC 9457 Problem Details 形式で返却する
3. If 指定された projectChangeHistoryId の project_id が URL の projectId と一致しない場合, the Project Change History API shall 404 Not Found を返却する

---

### Requirement 3: 変更履歴新規作成

**Objective:** As a システム, I want 案件の変更内容を変更履歴として記録したい, so that 変更の追跡・監査が可能になる

#### Acceptance Criteria

1. When POST リクエストが `/projects/:projectId/change-history` に有効なリクエストボディで送信された場合, the Project Change History API shall 新しい変更履歴を作成し、201 Created と作成されたリソースを返却する
2. The Project Change History API shall レスポンスヘッダに `Location` として作成されたリソースの URL を含める
3. The Project Change History API shall リクエストボディを Zod スキーマでバリデーションする（changeType: 必須・VARCHAR(50)以内、fieldName: 任意・VARCHAR(100)以内、oldValue: 任意・NVARCHAR(1000)以内、newValue: 任意・NVARCHAR(1000)以内、changedBy: 必須・NVARCHAR(100)以内）
4. If バリデーションに失敗した場合, the Project Change History API shall 422 Unprocessable Entity を RFC 9457 形式で返却する
5. If 指定された projectId に該当する案件が存在しないか、論理削除済みの場合, the Project Change History API shall 404 Not Found を返却する

---

### Requirement 4: 変更履歴物理削除

**Objective:** As a システム管理者, I want 不要な変更履歴を削除したい, so that データの整理ができる

#### Acceptance Criteria

1. When DELETE リクエストが `/projects/:projectId/change-history/:projectChangeHistoryId` に送信された場合, the Project Change History API shall 変更履歴を物理削除し、204 No Content を返却する
2. If 指定された projectChangeHistoryId に該当する変更履歴が存在しない場合, the Project Change History API shall 404 Not Found を返却する
3. If 指定された projectChangeHistoryId の project_id が URL の projectId と一致しない場合, the Project Change History API shall 404 Not Found を返却する

---

### Requirement 5: APIレスポンス形式

**Objective:** As a フロントエンド開発者, I want 統一されたレスポンス形式でデータを受け取りたい, so that クライアント側の実装を簡素化できる

#### Acceptance Criteria

1. The Project Change History API shall 成功時のレスポンスを `{ data: ... }` 形式で返却する
2. The Project Change History API shall エラー時のレスポンスを RFC 9457 Problem Details 形式（Content-Type: `application/problem+json`）で返却する
3. The Project Change History API shall レスポンスフィールドを camelCase（`projectChangeHistoryId`, `projectId`, `changeType`, `fieldName`, `oldValue`, `newValue`, `changedBy`, `changedAt`）で返却する
4. The Project Change History API shall 日時フィールド（`changedAt`）を ISO 8601 形式の文字列で返却する

---

### Requirement 6: バリデーション

**Objective:** As a システム管理者, I want 不正なデータの登録を防止したい, so that データの整合性を保てる

#### Acceptance Criteria

1. The Project Change History API shall パスパラメータ projectId および projectChangeHistoryId を正の整数として Zod スキーマでバリデーションする
2. If 不正なパスパラメータ（非数値など）が指定された場合, the Project Change History API shall 422 Unprocessable Entity を返却する
3. The Project Change History API shall changeType フィールドを空文字でない50文字以内の文字列としてバリデーションする
4. The Project Change History API shall changedBy フィールドを空文字でない100文字以内の文字列としてバリデーションする

---

### Requirement 7: テスト

**Objective:** As a 開発者, I want CRUD APIの各エンドポイントが正しく動作することを確認したい, so that 品質を担保できる

#### Acceptance Criteria

1. The Project Change History API shall 各エンドポイント（GET一覧, GET単一, POST, DELETE）に対する正常系テストを持つ
2. The Project Change History API shall エラーケース（404, 422）に対する異常系テストを持つ
3. The Project Change History API shall Vitest + `app.request()` パターンでテストを実装する
4. The Project Change History API shall テストファイルを `src/__tests__/routes/projectChangeHistory.test.ts` に配置する
