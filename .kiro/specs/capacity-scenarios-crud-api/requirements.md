# Requirements Document

## Introduction

キャパシティシナリオ（capacity_scenarios）のCRUD APIを実装する。キャパシティシナリオは、事業部ごとの人員稼働キャパシティを複数パターン（楽観・標準・悲観等）で管理するためのエンティティである。APIは既存のバックエンドアーキテクチャ（Hono + レイヤードアーキテクチャ）に準拠する。

**対象テーブル:** `capacity_scenarios`

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| capacity_scenario_id | INT | NO | IDENTITY(1,1) | 主キー。自動採番 |
| scenario_name | NVARCHAR(100) | NO | - | シナリオ名 |
| is_primary | BIT | NO | 0 | プライマリシナリオフラグ |
| description | NVARCHAR(500) | YES | NULL | 説明 |
| created_at | DATETIME2 | NO | GETDATE() | 作成日時 |
| updated_at | DATETIME2 | NO | GETDATE() | 更新日時 |
| deleted_at | DATETIME2 | YES | NULL | 削除日時（論理削除） |

---

## Requirements

### Requirement 1: キャパシティシナリオ一覧取得

**Objective:** As a 事業部リーダー, I want キャパシティシナリオの一覧をページネーション付きで取得したい, so that 登録済みのシナリオを確認し管理できる

#### Acceptance Criteria

1. When GET リクエストが `/capacity-scenarios` に送信された場合, the Capacity Scenarios API shall ページネーション付きでキャパシティシナリオの一覧を返却する（デフォルト: page=1, pageSize=20）
2. The Capacity Scenarios API shall 論理削除されたシナリオ（`deleted_at IS NOT NULL`）をデフォルトで一覧から除外する
3. When クエリパラメータ `filter[includeDisabled]=true` が指定された場合, the Capacity Scenarios API shall 論理削除済みのシナリオも含めた一覧を返却する
4. The Capacity Scenarios API shall レスポンスに `meta.pagination`（currentPage, pageSize, totalItems, totalPages）を含める

---

### Requirement 2: キャパシティシナリオ単一取得

**Objective:** As a 事業部リーダー, I want 特定のキャパシティシナリオの詳細を取得したい, so that シナリオの内容を確認できる

#### Acceptance Criteria

1. When GET リクエストが `/capacity-scenarios/:id` に送信された場合, the Capacity Scenarios API shall 指定されたIDのキャパシティシナリオを返却する
2. If 指定されたIDのキャパシティシナリオが存在しない場合, the Capacity Scenarios API shall 404 Not Found エラーをRFC 9457 Problem Details形式で返却する
3. If 指定されたIDのキャパシティシナリオが論理削除済みの場合, the Capacity Scenarios API shall 404 Not Found エラーを返却する

---

### Requirement 3: キャパシティシナリオ新規作成

**Objective:** As a 事業部リーダー, I want 新しいキャパシティシナリオを作成したい, so that 新しいパターンでキャパシティ計画を管理できる

#### Acceptance Criteria

1. When POST リクエストが `/capacity-scenarios` に有効なデータで送信された場合, the Capacity Scenarios API shall 新しいキャパシティシナリオを作成し、201 Created で返却する
2. The Capacity Scenarios API shall レスポンスに `Location` ヘッダ（`/capacity-scenarios/{id}`）を含める
3. The Capacity Scenarios API shall `scenarioName`（必須、1〜100文字）、`isPrimary`（任意、デフォルト false）、`description`（任意、最大500文字）をリクエストボディとして受け付ける
4. If リクエストボディのバリデーションに失敗した場合, the Capacity Scenarios API shall 422 Validation Error をRFC 9457形式で返却する（エラー詳細を `errors` 配列に含める）

---

### Requirement 4: キャパシティシナリオ更新

**Objective:** As a 事業部リーダー, I want 既存のキャパシティシナリオを更新したい, so that シナリオの内容を修正できる

#### Acceptance Criteria

1. When PUT リクエストが `/capacity-scenarios/:id` に有効なデータで送信された場合, the Capacity Scenarios API shall 指定されたIDのキャパシティシナリオを更新し、200 OK で返却する
2. The Capacity Scenarios API shall `scenarioName`（任意、1〜100文字）、`isPrimary`（任意）、`description`（任意、最大500文字、null許可）を更新フィールドとして受け付ける
3. If 指定されたIDのキャパシティシナリオが存在しない場合, the Capacity Scenarios API shall 404 Not Found エラーをRFC 9457形式で返却する
4. If リクエストボディのバリデーションに失敗した場合, the Capacity Scenarios API shall 422 Validation Error をRFC 9457形式で返却する

---

### Requirement 5: キャパシティシナリオ論理削除

**Objective:** As a 事業部リーダー, I want 不要になったキャパシティシナリオを削除したい, so that 一覧から除外し整理できる

#### Acceptance Criteria

1. When DELETE リクエストが `/capacity-scenarios/:id` に送信された場合, the Capacity Scenarios API shall 指定されたIDのキャパシティシナリオを論理削除し、204 No Content を返却する
2. The Capacity Scenarios API shall 論理削除時に `deleted_at` カラムに現在日時を設定する
3. If 指定されたIDのキャパシティシナリオが存在しない場合, the Capacity Scenarios API shall 404 Not Found エラーを返却する
4. If 指定されたIDのキャパシティシナリオが他のリソース（monthly_capacity等）から参照されている場合, the Capacity Scenarios API shall 409 Conflict エラーを返却する

---

### Requirement 6: キャパシティシナリオ復元

**Objective:** As a 事業部リーダー, I want 論理削除したキャパシティシナリオを復元したい, so that 誤って削除したシナリオを元に戻せる

#### Acceptance Criteria

1. When POST リクエストが `/capacity-scenarios/:id/actions/restore` に送信された場合, the Capacity Scenarios API shall 指定されたIDの論理削除済みキャパシティシナリオを復元し、200 OK で返却する
2. The Capacity Scenarios API shall 復元時に `deleted_at` を NULL に、`updated_at` を現在日時に設定する
3. If 指定されたIDのキャパシティシナリオが存在しないか、論理削除されていない場合, the Capacity Scenarios API shall 404 Not Found エラーを返却する

---

### Requirement 7: APIレスポンス形式

**Objective:** As a フロントエンド開発者, I want 統一されたレスポンス形式でデータを受け取りたい, so that クライアント側の実装を簡素化できる

#### Acceptance Criteria

1. The Capacity Scenarios API shall 成功時のレスポンスを `{ data: ... }` 形式で返却する
2. The Capacity Scenarios API shall 一覧取得時に `{ data: [...], meta: { pagination: {...} } }` 形式で返却する
3. The Capacity Scenarios API shall エラー時のレスポンスをRFC 9457 Problem Details形式（Content-Type: `application/problem+json`）で返却する
4. The Capacity Scenarios API shall レスポンスフィールドをcamelCase（`capacityScenarioId`, `scenarioName`, `isPrimary`, `description`, `createdAt`, `updatedAt`）で返却する
5. The Capacity Scenarios API shall 日時フィールド（`createdAt`, `updatedAt`）をISO 8601形式の文字列で返却する

---

### Requirement 8: バリデーション

**Objective:** As a システム管理者, I want 不正なデータの登録を防止したい, so that データの整合性を保てる

#### Acceptance Criteria

1. The Capacity Scenarios API shall 一覧取得時のクエリパラメータ（`page[number]`、`page[size]`、`filter[includeDisabled]`）をZodスキーマでバリデーションする
2. The Capacity Scenarios API shall 作成時のリクエストボディ（`scenarioName` 必須・1〜100文字、`isPrimary` 任意・boolean、`description` 任意・最大500文字）をバリデーションする
3. The Capacity Scenarios API shall 更新時のリクエストボディをバリデーションする
4. If バリデーションエラーが発生した場合, the Capacity Scenarios API shall `errors` 配列にフィールドごとのエラー詳細（pointer, keyword, message, params）を含める

---

### Requirement 9: テスト

**Objective:** As a 開発者, I want CRUD APIの各エンドポイントが正しく動作することを確認したい, so that 品質を担保できる

#### Acceptance Criteria

1. The Capacity Scenarios API shall 各CRUDエンドポイント（一覧取得、単一取得、作成、更新、削除、復元）のユニットテストを提供する
2. The Capacity Scenarios API shall バリデーションエラーケース（必須項目欠落、型不正、範囲外値）のテストを提供する
3. The Capacity Scenarios API shall エラーケース（存在しないID、論理削除済みリソース、参照整合性違反）のテストを提供する
4. The Capacity Scenarios API shall Vitestフレームワークと `app.request()` メソッドを使用してテストを実行する
