# Requirements Document

## Introduction

チャートの各要素（案件、間接作業など）に割り当てる色を管理する `chart_color_settings` テーブルに対する CRUD API を実装する。本テーブルは設定テーブルに分類され、論理削除（`deleted_at`）を持たず物理削除を行う。`target_type` と `target_id` の組み合わせでユニーク制約が設定されており、チャート表示時の色設定を永続化する。

## Requirements

### Requirement 1: チャート色設定の一覧取得

**Objective:** As a フロントエンドアプリケーション, I want チャート色設定の一覧をページネーション付きで取得したい, so that チャート表示時に各要素の色を適用できる

#### Acceptance Criteria

1. When GET `/chart-color-settings` リクエストを受信した場合, the API shall ページネーション付きで chart_color_settings の一覧を `{ data, meta }` 形式で返却する
2. When `page[number]` および `page[size]` クエリパラメータが指定された場合, the API shall 指定されたページ番号とページサイズに基づいてオフセットベースのページネーションを適用する
3. When `page[number]` および `page[size]` が省略された場合, the API shall デフォルト値（page[number]=1, page[size]=20）を適用する
4. When `filter[targetType]` クエリパラメータが指定された場合, the API shall 指定された target_type に一致するレコードのみを返却する
5. The API shall レスポンスの `meta.pagination` に `currentPage`, `pageSize`, `totalItems`, `totalPages` を含める

### Requirement 2: チャート色設定の個別取得

**Objective:** As a フロントエンドアプリケーション, I want 特定のチャート色設定を ID で取得したい, so that 個別の色設定の詳細を確認・利用できる

#### Acceptance Criteria

1. When GET `/chart-color-settings/:id` リクエストを受信した場合, the API shall 指定された ID の chart_color_setting を `{ data }` 形式で返却する
2. If 指定された ID のレコードが存在しない場合, the API shall HTTP 404 ステータスと RFC 9457 Problem Details 形式のエラーレスポンスを返却する

### Requirement 3: チャート色設定の作成

**Objective:** As a フロントエンドアプリケーション, I want 新しいチャート色設定を登録したい, so that チャートの各要素に色を割り当てられる

#### Acceptance Criteria

1. When POST `/chart-color-settings` リクエストを有効なデータで受信した場合, the API shall 新しいレコードを作成し、HTTP 201 ステータスと `{ data }` 形式で作成されたリソースを返却する
2. When レコードが正常に作成された場合, the API shall `Location` ヘッダーに `/chart-color-settings/{id}` を設定する
3. The API shall リクエストボディに `targetType`（VARCHAR(20)、必須）、`targetId`（INT、必須）、`colorCode`（VARCHAR(7)、必須）を要求する
4. If `colorCode` が `#` で始まる6桁の16進数カラーコード形式でない場合, the API shall HTTP 422 ステータスとバリデーションエラーを返却する
5. If 同一の `targetType` と `targetId` の組み合わせが既に存在する場合, the API shall HTTP 409 ステータスと RFC 9457 Problem Details 形式のエラーレスポンスを返却する

### Requirement 4: チャート色設定の更新

**Objective:** As a フロントエンドアプリケーション, I want 既存のチャート色設定を変更したい, so that チャートの色をカスタマイズできる

#### Acceptance Criteria

1. When PUT `/chart-color-settings/:id` リクエストを有効なデータで受信した場合, the API shall 指定された ID のレコードを更新し、HTTP 200 ステータスと `{ data }` 形式で更新されたリソースを返却する
2. The API shall リクエストボディに `targetType`、`targetId`、`colorCode` をすべてオプショナルとして受け付ける
3. If 指定された ID のレコードが存在しない場合, the API shall HTTP 404 ステータスと RFC 9457 Problem Details 形式のエラーレスポンスを返却する
4. If 更新後の `targetType` と `targetId` の組み合わせが他のレコードと重複する場合, the API shall HTTP 409 ステータスと RFC 9457 Problem Details 形式のエラーレスポンスを返却する
5. If `colorCode` が指定されており、`#` で始まる6桁の16進数カラーコード形式でない場合, the API shall HTTP 422 ステータスとバリデーションエラーを返却する

### Requirement 5: チャート色設定の削除

**Objective:** As a フロントエンドアプリケーション, I want 不要なチャート色設定を削除したい, so that 使われなくなった色設定をクリーンアップできる

#### Acceptance Criteria

1. When DELETE `/chart-color-settings/:id` リクエストを受信した場合, the API shall 指定された ID のレコードを物理削除し、HTTP 204 ステータスを返却する
2. If 指定された ID のレコードが存在しない場合, the API shall HTTP 404 ステータスと RFC 9457 Problem Details 形式のエラーレスポンスを返却する

### Requirement 6: 一括更新（Upsert）

**Objective:** As a フロントエンドアプリケーション, I want 複数のチャート色設定を一括で登録・更新したい, so that チャートの色変更を効率的に反映できる

#### Acceptance Criteria

1. When PUT `/chart-color-settings/bulk` リクエストを色設定の配列で受信した場合, the API shall 各要素の `targetType` と `targetId` の組み合わせに基づいて、存在すれば更新・存在しなければ作成（Upsert）を実行する
2. When 一括更新が正常に完了した場合, the API shall HTTP 200 ステータスと `{ data }` 形式で更新後の全レコードを返却する
3. If 配列内のいずれかの要素がバリデーションエラーとなった場合, the API shall 全体をロールバックし、HTTP 422 ステータスとエラー詳細を返却する
4. The API shall 配列の各要素に `targetType`（必須）、`targetId`（必須）、`colorCode`（必須）を要求する

### Requirement 7: バリデーションとエラーハンドリング

**Objective:** As a システム管理者, I want 入力データが適切にバリデーションされることを保証したい, so that データの整合性が維持される

#### Acceptance Criteria

1. The API shall すべてのリクエストボディとクエリパラメータを Zod スキーマでバリデーションする
2. If バリデーションエラーが発生した場合, the API shall RFC 9457 Problem Details 形式で `errors` 配列にフィールドごとのエラー詳細（`pointer`, `keyword`, `message`）を含めたレスポンスを返却する
3. The API shall `targetType` の値として `project`、`indirect_work` などの有効な対象タイプを受け付ける
4. The API shall `colorCode` の値として `#` で始まる6桁の16進数形式（例: `#FF5733`）のみを受け付ける
