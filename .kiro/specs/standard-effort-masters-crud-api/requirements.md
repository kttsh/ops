# Requirements Document

## Introduction

標準工数マスタ（standard_effort_masters）のCRUD APIを実装する。標準工数マスタは、BU×案件タイプごとの標準工数パターン（Sカーブ・バスタブカーブ等）を管理するエンティティである。各パターンには子テーブル `standard_effort_weights` に進捗率ごとの重み値が紐づく。APIは既存のバックエンドアーキテクチャ（Hono + レイヤードアーキテクチャ）に準拠する。

**対象テーブル:** `standard_effort_masters`

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| standard_effort_id | INT | NO | IDENTITY(1,1) | 主キー。自動採番 |
| business_unit_code | VARCHAR(20) | NO | - | 外部キー → business_units |
| project_type_code | VARCHAR(20) | NO | - | 外部キー → project_types |
| name | NVARCHAR(100) | NO | - | パターン名 |
| created_at | DATETIME2 | NO | GETDATE() | 作成日時 |
| updated_at | DATETIME2 | NO | GETDATE() | 更新日時 |
| deleted_at | DATETIME2 | YES | NULL | 削除日時（論理削除） |

**ユニーク制約:** `(business_unit_code, project_type_code, name)` — `deleted_at IS NULL` の場合

**子テーブル:** `standard_effort_weights`

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| standard_effort_weight_id | INT | NO | IDENTITY(1,1) | 主キー。自動採番 |
| standard_effort_id | INT | NO | - | 外部キー → standard_effort_masters |
| progress_rate | INT | NO | - | 進捗率（0, 5, 10, ... 100） |
| weight | INT | NO | - | 重み（非負整数） |
| created_at | DATETIME2 | NO | GETDATE() | 作成日時 |
| updated_at | DATETIME2 | NO | GETDATE() | 更新日時 |

---

## Requirements

### Requirement 1: 標準工数マスタ一覧取得

**Objective:** As a 事業部リーダー, I want 標準工数マスタの一覧をページネーション付きで取得したい, so that 登録済みの標準工数パターンを確認し管理できる

#### Acceptance Criteria

1. When GET リクエストが `/standard-effort-masters` に送信された場合, the Standard Effort Masters API shall ページネーション付きで標準工数マスタの一覧を返却する（デフォルト: page=1, pageSize=20）
2. The Standard Effort Masters API shall 論理削除されたマスタ（`deleted_at IS NOT NULL`）をデフォルトで一覧から除外する
3. When クエリパラメータ `filter[includeDisabled]=true` が指定された場合, the Standard Effort Masters API shall 論理削除済みのマスタも含めた一覧を返却する
4. When クエリパラメータ `filter[businessUnitCode]` が指定された場合, the Standard Effort Masters API shall 指定されたビジネスユニットコードで絞り込んだ一覧を返却する
5. When クエリパラメータ `filter[projectTypeCode]` が指定された場合, the Standard Effort Masters API shall 指定された案件タイプコードで絞り込んだ一覧を返却する
6. The Standard Effort Masters API shall レスポンスに `meta.pagination`（currentPage, pageSize, totalItems, totalPages）を含める

---

### Requirement 2: 標準工数マスタ単一取得

**Objective:** As a 事業部リーダー, I want 特定の標準工数マスタの詳細を取得したい, so that パターンの内容と重み設定を確認できる

#### Acceptance Criteria

1. When GET リクエストが `/standard-effort-masters/:id` に送信された場合, the Standard Effort Masters API shall 指定されたIDの標準工数マスタを、関連する `weights`（standard_effort_weights）の配列を含めて返却する
2. If 指定されたIDの標準工数マスタが存在しない場合, the Standard Effort Masters API shall 404 Not Found エラーをRFC 9457 Problem Details形式で返却する
3. If 指定されたIDの標準工数マスタが論理削除済みの場合, the Standard Effort Masters API shall 404 Not Found エラーを返却する

---

### Requirement 3: 標準工数マスタ新規作成

**Objective:** As a 事業部リーダー, I want 新しい標準工数マスタを作成したい, so that BU×案件タイプごとの標準工数パターンを登録できる

#### Acceptance Criteria

1. When POST リクエストが `/standard-effort-masters` に有効なデータで送信された場合, the Standard Effort Masters API shall 新しい標準工数マスタを作成し、201 Created で返却する
2. The Standard Effort Masters API shall レスポンスに `Location` ヘッダ（`/standard-effort-masters/{id}`）を含める
3. The Standard Effort Masters API shall `businessUnitCode`（必須、1〜20文字）、`projectTypeCode`（必須、1〜20文字）、`name`（必須、1〜100文字）、`weights`（任意、重み配列）をリクエストボディとして受け付ける
4. The Standard Effort Masters API shall `weights` の各要素として `progressRate`（必須、0〜100の整数）と `weight`（必須、0以上の整数）を受け付ける
5. If 指定された `businessUnitCode` が business_units テーブルに存在しない場合, the Standard Effort Masters API shall 422 Validation Error を返却する
6. If 指定された `projectTypeCode` が project_types テーブルに存在しない場合, the Standard Effort Masters API shall 422 Validation Error を返却する
7. If 同一の `businessUnitCode` + `projectTypeCode` + `name` の組み合わせが既に存在する場合, the Standard Effort Masters API shall 409 Conflict エラーを返却する
8. If リクエストボディのバリデーションに失敗した場合, the Standard Effort Masters API shall 422 Validation Error をRFC 9457形式で返却する（エラー詳細を `errors` 配列に含める）

---

### Requirement 4: 標準工数マスタ更新

**Objective:** As a 事業部リーダー, I want 既存の標準工数マスタを更新したい, so that パターンの名称や重み設定を修正できる

#### Acceptance Criteria

1. When PUT リクエストが `/standard-effort-masters/:id` に有効なデータで送信された場合, the Standard Effort Masters API shall 指定されたIDの標準工数マスタを更新し、200 OK で返却する
2. The Standard Effort Masters API shall `name`（任意、1〜100文字）、`weights`（任意、重み配列で全置換）を更新フィールドとして受け付ける
3. When `weights` が指定された場合, the Standard Effort Masters API shall 既存の standard_effort_weights を全削除し、新しい重みデータで置換する
4. If 更新後の `name` が同一 `businessUnitCode` + `projectTypeCode` の他レコードと重複する場合, the Standard Effort Masters API shall 409 Conflict エラーを返却する
5. If 指定されたIDの標準工数マスタが存在しない場合, the Standard Effort Masters API shall 404 Not Found エラーをRFC 9457形式で返却する
6. If リクエストボディのバリデーションに失敗した場合, the Standard Effort Masters API shall 422 Validation Error をRFC 9457形式で返却する

---

### Requirement 5: 標準工数マスタ論理削除

**Objective:** As a 事業部リーダー, I want 不要になった標準工数マスタを削除したい, so that 一覧から除外し整理できる

#### Acceptance Criteria

1. When DELETE リクエストが `/standard-effort-masters/:id` に送信された場合, the Standard Effort Masters API shall 指定されたIDの標準工数マスタを論理削除し、204 No Content を返却する
2. The Standard Effort Masters API shall 論理削除時に `deleted_at` カラムに現在日時を設定する
3. If 指定されたIDの標準工数マスタが存在しない場合, the Standard Effort Masters API shall 404 Not Found エラーを返却する
4. If 指定されたIDの標準工数マスタが他のリソース（project_cases等）から参照されている場合, the Standard Effort Masters API shall 409 Conflict エラーを返却する

---

### Requirement 6: 標準工数マスタ復元

**Objective:** As a 事業部リーダー, I want 論理削除した標準工数マスタを復元したい, so that 誤って削除したパターンを元に戻せる

#### Acceptance Criteria

1. When POST リクエストが `/standard-effort-masters/:id/actions/restore` に送信された場合, the Standard Effort Masters API shall 指定されたIDの論理削除済み標準工数マスタを復元し、200 OK で返却する
2. The Standard Effort Masters API shall 復元時に `deleted_at` を NULL に、`updated_at` を現在日時に設定する
3. If 復元後の `businessUnitCode` + `projectTypeCode` + `name` の組み合わせが既存の有効レコードと重複する場合, the Standard Effort Masters API shall 409 Conflict エラーを返却する
4. If 指定されたIDの標準工数マスタが存在しないか、論理削除されていない場合, the Standard Effort Masters API shall 404 Not Found エラーを返却する

---

### Requirement 7: APIレスポンス形式

**Objective:** As a フロントエンド開発者, I want 統一されたレスポンス形式でデータを受け取りたい, so that クライアント側の実装を簡素化できる

#### Acceptance Criteria

1. The Standard Effort Masters API shall 成功時のレスポンスを `{ data: ... }` 形式で返却する
2. The Standard Effort Masters API shall 一覧取得時に `{ data: [...], meta: { pagination: {...} } }` 形式で返却する
3. The Standard Effort Masters API shall エラー時のレスポンスをRFC 9457 Problem Details形式（Content-Type: `application/problem+json`）で返却する
4. The Standard Effort Masters API shall レスポンスフィールドをcamelCase（`standardEffortId`, `businessUnitCode`, `projectTypeCode`, `name`, `createdAt`, `updatedAt`）で返却する
5. The Standard Effort Masters API shall 日時フィールド（`createdAt`, `updatedAt`）をISO 8601形式の文字列で返却する
6. The Standard Effort Masters API shall 単一取得時のレスポンスに `weights` 配列（`standardEffortWeightId`, `progressRate`, `weight`）を含める

---

### Requirement 8: バリデーション

**Objective:** As a システム管理者, I want 不正なデータの登録を防止したい, so that データの整合性を保てる

#### Acceptance Criteria

1. The Standard Effort Masters API shall 一覧取得時のクエリパラメータ（`page[number]`、`page[size]`、`filter[includeDisabled]`、`filter[businessUnitCode]`、`filter[projectTypeCode]`）をZodスキーマでバリデーションする
2. The Standard Effort Masters API shall 作成時のリクエストボディ（`businessUnitCode` 必須・1〜20文字、`projectTypeCode` 必須・1〜20文字、`name` 必須・1〜100文字、`weights` 任意・配列）をバリデーションする
3. The Standard Effort Masters API shall `weights` 配列の各要素（`progressRate` 必須・0〜100の整数、`weight` 必須・0以上の整数）をバリデーションする
4. The Standard Effort Masters API shall 更新時のリクエストボディをバリデーションする
5. If バリデーションエラーが発生した場合, the Standard Effort Masters API shall `errors` 配列にフィールドごとのエラー詳細（pointer, keyword, message, params）を含める

---

### Requirement 9: テスト

**Objective:** As a 開発者, I want CRUD APIの各エンドポイントが正しく動作することを確認したい, so that 品質を担保できる

#### Acceptance Criteria

1. The Standard Effort Masters API shall 各CRUDエンドポイント（一覧取得、単一取得、作成、更新、削除、復元）のユニットテストを提供する
2. The Standard Effort Masters API shall バリデーションエラーケース（必須項目欠落、型不正、範囲外値）のテストを提供する
3. The Standard Effort Masters API shall エラーケース（存在しないID、論理削除済みリソース、参照整合性違反、ユニーク制約違反）のテストを提供する
4. The Standard Effort Masters API shall Vitestフレームワークと `app.request()` メソッドを使用してテストを実行する
