# Requirements Document

## Introduction

チャートの積み上げ表示順序設定（`chart_stack_order_settings`）を管理するCRUD APIの要件定義。本APIは、チャート上の各要素（案件・間接作業等）の積み上げ順序をユーザーが制御するための設定エンドポイントを提供する。設定テーブルのため論理削除は使用せず、物理削除を行う。

## Requirements

### Requirement 1: 積み上げ順序設定の一覧取得

**Objective:** As a フロントエンドクライアント, I want 積み上げ順序設定の一覧を取得したい, so that チャート描画時に各要素の積み上げ順序を反映できる

#### Acceptance Criteria

1. When GET `/chart-stack-order-settings` リクエストを受信した場合, the API shall 積み上げ順序設定の一覧をページネーション付きで返却する
2. When `page` および `pageSize` クエリパラメータが指定された場合, the API shall 指定されたページネーション条件に基づいて結果を返却する
3. When `page` および `pageSize` クエリパラメータが省略された場合, the API shall デフォルト値（page=1, pageSize=20）を適用する
4. When `targetType` クエリパラメータが指定された場合, the API shall 該当する対象タイプの設定のみにフィルタリングして返却する
5. The API shall レスポンスに `data` 配列と `meta.pagination`（currentPage, pageSize, totalItems, totalPages）を含める
6. The API shall 各設定項目に `chartStackOrderSettingId`, `targetType`, `targetId`, `stackOrder`, `createdAt`, `updatedAt` を含める

### Requirement 2: 積み上げ順序設定の個別取得

**Objective:** As a フロントエンドクライアント, I want 特定の積み上げ順序設定を取得したい, so that 個別の設定内容を確認・表示できる

#### Acceptance Criteria

1. When GET `/chart-stack-order-settings/:id` リクエストを受信した場合, the API shall 指定IDの設定を `data` オブジェクトとして返却する
2. If 指定されたIDの設定が存在しない場合, the API shall 404 ステータスコードと RFC 9457 Problem Details 形式のエラーレスポンスを返却する

### Requirement 3: 積み上げ順序設定の新規作成

**Objective:** As a フロントエンドクライアント, I want 新しい積み上げ順序設定を作成したい, so that チャート要素の積み上げ順序を指定できる

#### Acceptance Criteria

1. When POST `/chart-stack-order-settings` リクエストを有効なリクエストボディで受信した場合, the API shall 新しい設定を作成し、201 ステータスコードと作成された設定データを返却する
2. When 設定が正常に作成された場合, the API shall `Location` ヘッダーに作成されたリソースのURLを設定する
3. If `targetType` または `targetId` または `stackOrder` が欠落している場合, the API shall 422 ステータスコードとバリデーションエラーを返却する
4. If 同一の `targetType` と `targetId` の組み合わせが既に存在する場合, the API shall 409 ステータスコードと重複エラーを返却する

### Requirement 4: 積み上げ順序設定の更新

**Objective:** As a フロントエンドクライアント, I want 既存の積み上げ順序設定を更新したい, so that 積み上げ順序を変更できる

#### Acceptance Criteria

1. When PUT `/chart-stack-order-settings/:id` リクエストを有効なリクエストボディで受信した場合, the API shall 指定IDの設定を更新し、200 ステータスコードと更新後の設定データを返却する
2. If 指定されたIDの設定が存在しない場合, the API shall 404 ステータスコードと RFC 9457 Problem Details 形式のエラーレスポンスを返却する
3. If リクエストボディのバリデーションに失敗した場合, the API shall 422 ステータスコードとバリデーションエラーを返却する
4. If 更新によって `targetType` と `targetId` の組み合わせが既存レコードと重複する場合, the API shall 409 ステータスコードと重複エラーを返却する

### Requirement 5: 積み上げ順序設定の削除

**Objective:** As a フロントエンドクライアント, I want 積み上げ順序設定を削除したい, so that 不要になった順序設定を除去できる

#### Acceptance Criteria

1. When DELETE `/chart-stack-order-settings/:id` リクエストを受信した場合, the API shall 指定IDの設定を物理削除し、204 ステータスコード（空レスポンス）を返却する
2. If 指定されたIDの設定が存在しない場合, the API shall 404 ステータスコードと RFC 9457 Problem Details 形式のエラーレスポンスを返却する

### Requirement 6: 積み上げ順序設定の一括更新

**Objective:** As a フロントエンドクライアント, I want 複数の積み上げ順序設定を一括で更新（upsert）したい, so that ドラッグ&ドロップ等による順序変更を効率的にサーバーへ反映できる

#### Acceptance Criteria

1. When PUT `/chart-stack-order-settings/bulk` リクエストを有効なリクエストボディで受信した場合, the API shall 全アイテムを一括でupsert（存在すれば更新、なければ作成）し、200 ステータスコードと更新後の設定データ一覧を返却する
2. If リクエストボディの `items` 配列内に `targetType` と `targetId` の重複がある場合, the API shall 422 ステータスコードと重複エラーを返却する
3. If リクエストボディのバリデーションに失敗した場合, the API shall 422 ステータスコードとバリデーションエラーを返却する
4. The API shall 一括更新をトランザクション内で実行し、一部でも失敗した場合は全体をロールバックする

### Requirement 7: バリデーション

**Objective:** As a システム管理者, I want リクエストデータが適切にバリデーションされることを保証したい, so that データの整合性が維持される

#### Acceptance Criteria

1. The API shall `targetType` を必須の文字列フィールドとしてバリデーションする
2. The API shall `targetId` を必須の正の整数としてバリデーションする
3. The API shall `stackOrder` を必須の整数としてバリデーションする
4. The API shall Zod スキーマによる型安全なバリデーションを実施する
5. If バリデーションエラーが発生した場合, the API shall 422 ステータスコードと RFC 9457 Problem Details 形式でエラー詳細を返却する

### Requirement 8: エラーハンドリング

**Objective:** As a フロントエンドクライアント, I want 一貫したエラーレスポンス形式を受け取りたい, so that エラー処理を統一的に実装できる

#### Acceptance Criteria

1. The API shall すべてのエラーレスポンスを RFC 9457 Problem Details 形式（type, status, title, detail, instance, timestamp）で返却する
2. If サーバー内部エラーが発生した場合, the API shall 500 ステータスコードと適切なエラーメッセージを返却する
3. If パスパラメータの `id` が正の整数でない場合, the API shall 422 ステータスコードとバリデーションエラーを返却する
