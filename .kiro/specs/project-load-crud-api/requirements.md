# Requirements Document

## Introduction

本ドキュメントは、案件負荷データ（project_load）テーブルに対する CRUD API の要件を定義する。

project_load は、案件ケース（project_cases）に紐づく月次負荷データを管理するファクトテーブルである。案件ケースごとの年月別工数（manhour）を記録し、積み上げチャートでの工数需要可視化の基盤データとなる。

**テーブル分類:** ファクトテーブル（物理削除・deleted_at なし）

project_load は project_cases の子リソースであり、API エンドポイントは `/project-cases/:projectCaseId/project-loads` の階層構造で提供する。

**対象テーブル:** `project_load`

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| project_load_id | INT | NO | IDENTITY(1,1) | 主キー。自動採番 |
| project_case_id | INT | NO | - | 外部キー → project_cases |
| year_month | CHAR(6) | NO | - | 年月（YYYYMM形式） |
| manhour | DECIMAL(10,2) | NO | - | 工数（人時） |
| created_at | DATETIME2 | NO | GETDATE() | 作成日時 |
| updated_at | DATETIME2 | NO | GETDATE() | 更新日時 |

**ユニーク制約:** (project_case_id, year_month) — 同一ケース内で年月の重複不可
**外部キー:** FK_project_load_case → project_cases(project_case_id) ON DELETE CASCADE

---

## Requirements

### Requirement 1: 案件負荷データ一覧取得

**Objective:** As a プロジェクトマネージャー, I want 特定の案件ケースに紐づく月次負荷データ一覧を取得したい, so that ケースの工数配分を確認できる

#### Acceptance Criteria

1. When GET リクエストが `/project-cases/:projectCaseId/project-loads` に送信された場合, the Project Load API shall 指定された projectCaseId に紐づく負荷データ一覧を返却する
2. The Project Load API shall レスポンスを `{ data: [...] }` 形式で返却する
3. The Project Load API shall 一覧を `year_month` の昇順でソートして返却する
4. If 指定された projectCaseId に該当する案件ケースが存在しないか、論理削除済みの場合, the Project Load API shall 404 Not Found を RFC 9457 Problem Details 形式で返却する

---

### Requirement 2: 案件負荷データ単一取得

**Objective:** As a プロジェクトマネージャー, I want 特定の月次負荷データの詳細を取得したい, so that 個別の月次工数を確認できる

#### Acceptance Criteria

1. When GET リクエストが `/project-cases/:projectCaseId/project-loads/:projectLoadId` に送信された場合, the Project Load API shall 指定された負荷データの詳細を `{ data: {...} }` 形式で返却する
2. If 指定された projectLoadId に該当する負荷データが存在しない場合, the Project Load API shall 404 Not Found を RFC 9457 Problem Details 形式で返却する
3. If 指定された projectLoadId の project_case_id が URL の projectCaseId と一致しない場合, the Project Load API shall 404 Not Found を返却する

---

### Requirement 3: 案件負荷データ新規作成

**Objective:** As a プロジェクトマネージャー, I want 案件ケースに月次負荷データを登録したい, so that 工数計画を入力できる

#### Acceptance Criteria

1. When POST リクエストが `/project-cases/:projectCaseId/project-loads` に有効なリクエストボディで送信された場合, the Project Load API shall 新しい負荷データを作成し、201 Created と作成されたリソースを返却する
2. The Project Load API shall レスポンスヘッダに `Location` として作成されたリソースの URL を含める
3. The Project Load API shall リクエストボディを Zod スキーマでバリデーションする（yearMonth: 必須・YYYYMM形式6桁、manhour: 必須・DECIMAL(10,2)・0以上）
4. If バリデーションに失敗した場合, the Project Load API shall 422 Unprocessable Entity を RFC 9457 形式で返却する
5. If 指定された projectCaseId に該当する案件ケースが存在しないか、論理削除済みの場合, the Project Load API shall 404 Not Found を返却する
6. If 同一 projectCaseId かつ同一 yearMonth のレコードが既に存在する場合, the Project Load API shall 409 Conflict を RFC 9457 形式で返却する

---

### Requirement 4: 案件負荷データ更新

**Objective:** As a プロジェクトマネージャー, I want 既存の月次負荷データの工数を更新したい, so that 計画変更を反映できる

#### Acceptance Criteria

1. When PUT リクエストが `/project-cases/:projectCaseId/project-loads/:projectLoadId` に有効なリクエストボディで送信された場合, the Project Load API shall 負荷データを更新し、200 OK と更新されたリソースを返却する
2. The Project Load API shall リクエストボディを Zod スキーマでバリデーションする（yearMonth: 任意・YYYYMM形式6桁、manhour: 任意・DECIMAL(10,2)・0以上）
3. If 指定された projectLoadId に該当する負荷データが存在しない場合, the Project Load API shall 404 Not Found を返却する
4. If バリデーションに失敗した場合, the Project Load API shall 422 Unprocessable Entity を返却する
5. The Project Load API shall 更新時に `updated_at` を現在日時に更新する
6. If yearMonth を変更した結果、同一 projectCaseId 内で年月が重複する場合, the Project Load API shall 409 Conflict を返却する

---

### Requirement 5: 案件負荷データ物理削除

**Objective:** As a プロジェクトマネージャー, I want 不要な月次負荷データを削除したい, so that 計画から除外できる

#### Acceptance Criteria

1. When DELETE リクエストが `/project-cases/:projectCaseId/project-loads/:projectLoadId` に送信された場合, the Project Load API shall 負荷データを物理削除し、204 No Content を返却する
2. If 指定された projectLoadId に該当する負荷データが存在しない場合, the Project Load API shall 404 Not Found を返却する
3. If 指定された projectLoadId の project_case_id が URL の projectCaseId と一致しない場合, the Project Load API shall 404 Not Found を返却する

---

### Requirement 6: 案件負荷データ一括登録・更新（バルクUpsert）

**Objective:** As a プロジェクトマネージャー, I want 案件ケースの月次負荷データを一括で登録・更新したい, so that 複数月の工数計画をまとめて入力できる

#### Acceptance Criteria

1. When PUT リクエストが `/project-cases/:projectCaseId/project-loads/bulk` に有効なリクエストボディで送信された場合, the Project Load API shall 配列内の各負荷データを一括で登録または更新（Upsert）し、200 OK と処理結果を返却する
2. The Project Load API shall リクエストボディとして `{ items: [{ yearMonth, manhour }, ...] }` 形式の配列を受け付ける
3. The Project Load API shall 各アイテムを Zod スキーマでバリデーションする（yearMonth: 必須・YYYYMM形式6桁、manhour: 必須・DECIMAL(10,2)・0以上）
4. The Project Load API shall 既存レコード（同一 projectCaseId + yearMonth）は更新、存在しないレコードは新規作成する
5. If バリデーションに失敗した場合, the Project Load API shall 422 Unprocessable Entity をRFC 9457形式で返却し、いずれのレコードも変更しない
6. If 指定された projectCaseId に該当する案件ケースが存在しないか、論理削除済みの場合, the Project Load API shall 404 Not Found を返却する
7. If リクエスト配列内に同一 yearMonth が重複して含まれる場合, the Project Load API shall 422 Unprocessable Entity を返却する
8. The Project Load API shall バルク操作をトランザクション内で実行し、一部失敗時は全体をロールバックする

---

### Requirement 7: APIレスポンス形式

**Objective:** As a フロントエンド開発者, I want 統一されたレスポンス形式でデータを受け取りたい, so that クライアント側の実装を簡素化できる

#### Acceptance Criteria

1. The Project Load API shall 成功時のレスポンスを `{ data: ... }` 形式で返却する
2. The Project Load API shall エラー時のレスポンスを RFC 9457 Problem Details 形式（Content-Type: `application/problem+json`）で返却する
3. The Project Load API shall レスポンスフィールドを camelCase（`projectLoadId`, `projectCaseId`, `yearMonth`, `manhour`, `createdAt`, `updatedAt`）で返却する
4. The Project Load API shall 日時フィールド（`createdAt`, `updatedAt`）を ISO 8601 形式の文字列で返却する
5. The Project Load API shall `manhour` フィールドを数値型（小数点以下2桁）で返却する

---

### Requirement 8: バリデーション

**Objective:** As a システム管理者, I want 不正なデータの登録を防止したい, so that データの整合性を保てる

#### Acceptance Criteria

1. The Project Load API shall パスパラメータ projectCaseId および projectLoadId を正の整数として Zod スキーマでバリデーションする
2. If 不正なパスパラメータ（非数値など）が指定された場合, the Project Load API shall 422 Unprocessable Entity を返却する
3. The Project Load API shall yearMonth フィールドの形式を YYYYMM（6桁数字、月は01〜12の範囲）としてバリデーションする
4. The Project Load API shall manhour フィールドを 0 以上 99999999.99 以下の数値としてバリデーションする

---

### Requirement 9: テスト

**Objective:** As a 開発者, I want CRUD APIの各エンドポイントが正しく動作することを確認したい, so that 品質を担保できる

#### Acceptance Criteria

1. The Project Load API shall 各エンドポイント（GET一覧, GET単一, POST, PUT, DELETE, バルクUpsert）に対する正常系テストを持つ
2. The Project Load API shall エラーケース（404, 409, 422）に対する異常系テストを持つ
3. The Project Load API shall Vitest + `app.request()` パターンでテストを実装する
4. The Project Load API shall テストファイルを `src/__tests__/routes/projectLoads.test.ts` に配置する
