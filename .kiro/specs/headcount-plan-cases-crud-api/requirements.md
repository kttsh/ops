# Requirements Document

## Introduction

人員計画ケース（headcount_plan_cases）のCRUD APIを実装する。人員計画ケースは、事業部ごとの将来人員数の見通しを複数シナリオ（楽観・標準・悲観等）で管理するためのエンティティである。APIは既存のバックエンドアーキテクチャ（Hono + レイヤードアーキテクチャ）に準拠し、外部キー（business_unit_code）に対応するビジネスユニット名をJOINで取得してレスポンスに含める。

**対象テーブル:** `headcount_plan_cases`

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| headcount_plan_case_id | INT | NO | IDENTITY(1,1) | 主キー。自動採番 |
| case_name | NVARCHAR(100) | NO | - | ケース名 |
| is_primary | BIT | NO | 0 | プライマリケースフラグ |
| description | NVARCHAR(500) | YES | NULL | 説明 |
| business_unit_code | VARCHAR(20) | YES | NULL | 外部キー → business_units |
| created_at | DATETIME2 | NO | GETDATE() | 作成日時 |
| updated_at | DATETIME2 | NO | GETDATE() | 更新日時 |
| deleted_at | DATETIME2 | YES | NULL | 削除日時（論理削除） |

---

## Requirements

### Requirement 1: 人員計画ケース一覧取得

**Objective:** As a 事業部リーダー, I want 人員計画ケースの一覧をページネーション付きで取得したい, so that 登録済みのケースを確認し管理できる

#### Acceptance Criteria

1. When GET リクエストが `/headcount-plan-cases` に送信された場合, the Headcount Plan Cases API shall ページネーション付きで人員計画ケースの一覧を返却する（デフォルト: page=1, pageSize=20）
2. The Headcount Plan Cases API shall 各ケースのレスポンスに `businessUnitCode` に対応する `businessUnitName`（business_units テーブルからJOINで取得）を含める
3. The Headcount Plan Cases API shall 論理削除されたケース（`deleted_at IS NOT NULL`）をデフォルトで一覧から除外する
4. When クエリパラメータ `filter[includeDisabled]=true` が指定された場合, the Headcount Plan Cases API shall 論理削除済みのケースも含めた一覧を返却する
5. The Headcount Plan Cases API shall レスポンスに `meta.pagination`（currentPage, pageSize, totalItems, totalPages）を含める

---

### Requirement 2: 人員計画ケース単一取得

**Objective:** As a 事業部リーダー, I want 特定の人員計画ケースの詳細を取得したい, so that ケースの内容を確認できる

#### Acceptance Criteria

1. When GET リクエストが `/headcount-plan-cases/:id` に送信された場合, the Headcount Plan Cases API shall 指定されたIDの人員計画ケースを返却する
2. The Headcount Plan Cases API shall レスポンスに `businessUnitCode` に対応する `businessUnitName` を含める
3. If 指定されたIDの人員計画ケースが存在しない場合, the Headcount Plan Cases API shall 404 Not Found エラーをRFC 9457 Problem Details形式で返却する
4. If 指定されたIDの人員計画ケースが論理削除済みの場合, the Headcount Plan Cases API shall 404 Not Found エラーを返却する

---

### Requirement 3: 人員計画ケース新規作成

**Objective:** As a 事業部リーダー, I want 新しい人員計画ケースを作成したい, so that 新しいシナリオで人員計画を管理できる

#### Acceptance Criteria

1. When POST リクエストが `/headcount-plan-cases` に有効なデータで送信された場合, the Headcount Plan Cases API shall 新しい人員計画ケースを作成し、201 Created で返却する
2. The Headcount Plan Cases API shall レスポンスに `Location` ヘッダ（`/headcount-plan-cases/{id}`）を含める
3. The Headcount Plan Cases API shall `caseName`（必須、1〜100文字）、`isPrimary`（任意、デフォルト false）、`description`（任意、最大500文字）、`businessUnitCode`（任意、最大20文字）をリクエストボディとして受け付ける
4. If `businessUnitCode` が指定され、対応するビジネスユニットが存在しない場合, the Headcount Plan Cases API shall 422 Validation Error をRFC 9457形式で返却する
5. If リクエストボディのバリデーションに失敗した場合, the Headcount Plan Cases API shall 422 Validation Error をRFC 9457形式で返却する（エラー詳細を `errors` 配列に含める）
6. If 論理削除済みの同一IDのケースが存在する場合, the Headcount Plan Cases API shall 復元を促すメッセージを含む 409 Conflict エラーを返却する

---

### Requirement 4: 人員計画ケース更新

**Objective:** As a 事業部リーダー, I want 既存の人員計画ケースを更新したい, so that ケースの内容を修正できる

#### Acceptance Criteria

1. When PUT リクエストが `/headcount-plan-cases/:id` に有効なデータで送信された場合, the Headcount Plan Cases API shall 指定されたIDの人員計画ケースを更新し、200 OK で返却する
2. The Headcount Plan Cases API shall `caseName`（任意、1〜100文字）、`isPrimary`（任意）、`description`（任意、最大500文字）、`businessUnitCode`（任意、最大20文字、null許可）を更新フィールドとして受け付ける
3. If 指定されたIDの人員計画ケースが存在しない場合, the Headcount Plan Cases API shall 404 Not Found エラーをRFC 9457形式で返却する
4. If `businessUnitCode` が指定され、対応するビジネスユニットが存在しない場合, the Headcount Plan Cases API shall 422 Validation Error を返却する
5. If リクエストボディのバリデーションに失敗した場合, the Headcount Plan Cases API shall 422 Validation Error をRFC 9457形式で返却する

---

### Requirement 5: 人員計画ケース論理削除

**Objective:** As a 事業部リーダー, I want 不要になった人員計画ケースを削除したい, so that 一覧から除外し整理できる

#### Acceptance Criteria

1. When DELETE リクエストが `/headcount-plan-cases/:id` に送信された場合, the Headcount Plan Cases API shall 指定されたIDの人員計画ケースを論理削除し、204 No Content を返却する
2. The Headcount Plan Cases API shall 論理削除時に `deleted_at` カラムに現在日時を設定する
3. If 指定されたIDの人員計画ケースが存在しない場合, the Headcount Plan Cases API shall 404 Not Found エラーを返却する
4. If 指定されたIDの人員計画ケースが他のリソース（monthly_headcount_plan等）から参照されている場合, the Headcount Plan Cases API shall 409 Conflict エラーを返却する

---

### Requirement 6: 人員計画ケース復元

**Objective:** As a 事業部リーダー, I want 論理削除した人員計画ケースを復元したい, so that 誤って削除したケースを元に戻せる

#### Acceptance Criteria

1. When POST リクエストが `/headcount-plan-cases/:id/actions/restore` に送信された場合, the Headcount Plan Cases API shall 指定されたIDの論理削除済み人員計画ケースを復元し、200 OK で返却する
2. The Headcount Plan Cases API shall 復元時に `deleted_at` を NULL に、`updated_at` を現在日時に設定する
3. If 指定されたIDの人員計画ケースが存在しないか、論理削除されていない場合, the Headcount Plan Cases API shall 404 Not Found エラーを返却する

---

### Requirement 7: APIレスポンス形式

**Objective:** As a フロントエンド開発者, I want 統一されたレスポンス形式でデータを受け取りたい, so that クライアント側の実装を簡素化できる

#### Acceptance Criteria

1. The Headcount Plan Cases API shall 成功時のレスポンスを `{ data: ... }` 形式で返却する
2. The Headcount Plan Cases API shall 一覧取得時に `{ data: [...], meta: { pagination: {...} } }` 形式で返却する
3. The Headcount Plan Cases API shall エラー時のレスポンスをRFC 9457 Problem Details形式（Content-Type: `application/problem+json`）で返却する
4. The Headcount Plan Cases API shall レスポンスフィールドをcamelCase（`headcountPlanCaseId`, `caseName`, `isPrimary`, `description`, `businessUnitCode`, `businessUnitName`, `createdAt`, `updatedAt`）で返却する
5. The Headcount Plan Cases API shall 日時フィールド（`createdAt`, `updatedAt`）をISO 8601形式の文字列で返却する

---

### Requirement 8: バリデーション

**Objective:** As a システム管理者, I want 不正なデータの登録を防止したい, so that データの整合性を保てる

#### Acceptance Criteria

1. The Headcount Plan Cases API shall 一覧取得時のクエリパラメータ（`page[number]`、`page[size]`、`filter[includeDisabled]`）をZodスキーマでバリデーションする
2. The Headcount Plan Cases API shall 作成時のリクエストボディ（`caseName` 必須・1〜100文字、`isPrimary` 任意・boolean、`description` 任意・最大500文字、`businessUnitCode` 任意・最大20文字・英数字とハイフン・アンダースコアのみ）をバリデーションする
3. The Headcount Plan Cases API shall 更新時のリクエストボディをバリデーションする
4. If バリデーションエラーが発生した場合, the Headcount Plan Cases API shall `errors` 配列にフィールドごとのエラー詳細（pointer, keyword, message, params）を含める

---

### Requirement 9: テスト

**Objective:** As a 開発者, I want CRUD APIの各エンドポイントが正しく動作することを確認したい, so that 品質を担保できる

#### Acceptance Criteria

1. The Headcount Plan Cases API shall 各CRUDエンドポイント（一覧取得、単一取得、作成、更新、削除、復元）のユニットテストを提供する
2. The Headcount Plan Cases API shall バリデーションエラーケース（必須項目欠落、型不正、範囲外値）のテストを提供する
3. The Headcount Plan Cases API shall エラーケース（存在しないID、論理削除済みリソース、参照整合性違反）のテストを提供する
4. The Headcount Plan Cases API shall Vitestフレームワークと `app.request()` メソッドを使用してテストを実行する
