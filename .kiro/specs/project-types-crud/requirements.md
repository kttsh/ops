# Requirements Document

## Introduction

`project_types` テーブルに対する CRUD API を実装する。案件タイプはマスタデータであり、主キーに自然キー（`project_type_code`）を使用する。論理削除（`deleted_at`）に対応し、API レスポンスは `docs/rules/api-response.md` に準拠する。バックエンドは Hono フレームワークで実装し、`docs/rules/hono/crud-guide.md` に従ったレイヤー構成（routes / services / data / transform / types）を採用する。

## Requirements

### Requirement 1: 案件タイプ一覧取得

**Objective:** As a API利用者, I want 案件タイプの一覧をページネーション付きで取得したい, so that 登録済みの案件タイプを一覧画面に表示できる

#### Acceptance Criteria

1. When GET `/project-types` リクエストを受信した場合, the API shall 論理削除されていない案件タイプの一覧を `display_order` 昇順で返却する
2. When `page[number]` および `page[size]` クエリパラメータが指定された場合, the API shall 指定されたページ番号とページサイズに基づくページネーション結果を `data` 配列と `meta.pagination`（currentPage / pageSize / totalItems / totalPages）を含むレスポンスで返却する
3. When `filter[includeDisabled]=true` クエリパラメータが指定された場合, the API shall 論理削除済みの案件タイプも含めた一覧を返却する
4. When クエリパラメータにバリデーションエラーがある場合, the API shall RFC 9457 Problem Details 形式で `422 Unprocessable Entity` エラーを返却する

### Requirement 2: 案件タイプ単一取得

**Objective:** As a API利用者, I want 特定の案件タイプをコードで取得したい, so that 案件タイプの詳細情報を確認できる

#### Acceptance Criteria

1. When GET `/project-types/:projectTypeCode` リクエストを受信した場合, the API shall 指定されたコードに一致する案件タイプを `data` オブジェクトとして返却する
2. If 指定されたコードの案件タイプが存在しないか論理削除済みの場合, the API shall RFC 9457 Problem Details 形式で `404 Not Found` エラーを返却する

### Requirement 3: 案件タイプ新規作成

**Objective:** As a API利用者, I want 新しい案件タイプを登録したい, so that 新たな案件種別をシステムに追加できる

#### Acceptance Criteria

1. When POST `/project-types` リクエストを有効なリクエストボディで受信した場合, the API shall 案件タイプを作成し、`201 Created` ステータスと `Location` ヘッダ（`/project-types/{projectTypeCode}`）を含むレスポンスを返却する
2. The API shall リクエストボディに `projectTypeCode`（必須, 最大20文字）、`name`（必須, 最大100文字）、`displayOrder`（任意, 整数, デフォルト0）を受け付ける
3. If 同一の `projectTypeCode` が既に存在する場合（論理削除済みを含む）, the API shall RFC 9457 Problem Details 形式で `409 Conflict` エラーを返却する
4. When リクエストボディにバリデーションエラーがある場合, the API shall RFC 9457 Problem Details 形式で `422 Unprocessable Entity` エラーを返却する

### Requirement 4: 案件タイプ更新

**Objective:** As a API利用者, I want 既存の案件タイプの情報を更新したい, so that 案件タイプ名や表示順序を変更できる

#### Acceptance Criteria

1. When PUT `/project-types/:projectTypeCode` リクエストを有効なリクエストボディで受信した場合, the API shall 案件タイプを更新し、`200 OK` ステータスで更新後のリソースを返却する
2. The API shall リクエストボディに `name`（必須, 最大100文字）、`displayOrder`（任意, 整数）を受け付ける
3. The API shall 更新時に `updated_at` を現在日時に自動更新する
4. If 指定されたコードの案件タイプが存在しないか論理削除済みの場合, the API shall RFC 9457 Problem Details 形式で `404 Not Found` エラーを返却する
5. When リクエストボディにバリデーションエラーがある場合, the API shall RFC 9457 Problem Details 形式で `422 Unprocessable Entity` エラーを返却する

### Requirement 5: 案件タイプ削除（論理削除）

**Objective:** As a API利用者, I want 案件タイプを削除したい, so that 不要になった案件種別を非表示にできる

#### Acceptance Criteria

1. When DELETE `/project-types/:projectTypeCode` リクエストを受信した場合, the API shall 該当レコードの `deleted_at` に現在日時を設定し、`204 No Content` を返却する
2. If 指定されたコードの案件タイプが存在しないか既に論理削除済みの場合, the API shall RFC 9457 Problem Details 形式で `404 Not Found` エラーを返却する
3. If 該当案件タイプが他テーブル（projects, standard_effort_masters 等）から参照されている場合, the API shall RFC 9457 Problem Details 形式で `409 Conflict` エラーを返却し、削除を拒否する

### Requirement 6: 案件タイプ復元

**Objective:** As a API利用者, I want 論理削除された案件タイプを復元したい, so that 誤って削除したデータを元に戻せる

#### Acceptance Criteria

1. When POST `/project-types/:projectTypeCode/actions/restore` リクエストを受信した場合, the API shall 該当レコードの `deleted_at` を `NULL` に設定し、`200 OK` ステータスで復元後のリソースを返却する
2. If 指定されたコードの案件タイプが存在しない場合, the API shall RFC 9457 Problem Details 形式で `404 Not Found` エラーを返却する
3. If 指定された案件タイプが論理削除されていない場合, the API shall RFC 9457 Problem Details 形式で `409 Conflict` エラーを返却する

### Requirement 7: API レスポンス形式

**Objective:** As a API利用者, I want 統一されたレスポンス形式で応答を受け取りたい, so that クライアント側で一貫した処理が可能になる

#### Acceptance Criteria

1. The API shall 成功時のレスポンスを `{ data, meta?, links? }` 構造で返却する
2. The API shall エラー時のレスポンスを RFC 9457 Problem Details 形式（`application/problem+json`）で返却する
3. The API shall レスポンスのフィールド名を camelCase で返却する（`projectTypeCode`, `displayOrder`, `createdAt`, `updatedAt`, `deletedAt`）
4. The API shall 案件タイプリソースに `projectTypeCode`, `name`, `displayOrder`, `createdAt`, `updatedAt` フィールドを含める

### Requirement 8: バリデーション

**Objective:** As a API利用者, I want 入力値が適切にバリデーションされることを期待したい, so that 不正なデータがシステムに登録されることを防止できる

#### Acceptance Criteria

1. The API shall `projectTypeCode` を VARCHAR(20) 相当の文字列（1〜20文字、英数字とハイフン・アンダースコアのみ）としてバリデーションする
2. The API shall `name` を NVARCHAR(100) 相当の文字列（1〜100文字）としてバリデーションする
3. The API shall `displayOrder` を 0 以上の整数としてバリデーションする
4. When バリデーションエラーが複数ある場合, the API shall すべてのエラーを `errors` 配列にまとめて返却する
