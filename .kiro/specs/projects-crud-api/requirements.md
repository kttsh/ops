# 要件定義書

## はじめに

本ドキュメントは、案件（projects）エンティティに対する CRUD API の要件を定義する。`projects` テーブルはビジネスユニット（`business_units`）および案件タイプ（`project_types`）への外部キーを持ち、API レスポンスでは JOIN によりこれらの名称も含めて返却する。既存のマスタテーブル CRUD（business_units / project_types / work_types）と同一のアーキテクチャパターン（routes → services → data → transform → types）に従い、RFC 9457 準拠のエラーハンドリング、ソフトデリート、ページネーションを実装する。

## 要件

### 要件 1: 案件一覧取得

**目的:** プロジェクトマネージャーとして、登録済みの案件を一覧で取得したい。リソース計画の全体像を把握するためである。

#### 受け入れ基準

1. When `GET /projects` リクエストを受信した場合, the Projects API shall ページネーション付きで案件一覧を `{ data, meta: { pagination } }` 形式で返却する（ステータス 200）
2. When `page[number]` および `page[size]` クエリパラメータが指定された場合, the Projects API shall 指定されたページ番号とページサイズに基づいてオフセットベースのページネーションを適用する
3. When `filter[includeDisabled]=true` クエリパラメータが指定された場合, the Projects API shall 論理削除済みの案件も含めて返却する
4. While `filter[includeDisabled]` が未指定またはfalseの場合, the Projects API shall `deleted_at IS NULL` の案件のみを返却する
5. The Projects API shall 各案件レスポンスに外部キー先の `businessUnitName`（business_units.name）および `projectTypeName`（project_types.name）を JOIN で取得して含める
6. When `filter[businessUnitCode]` クエリパラメータが指定された場合, the Projects API shall 指定されたビジネスユニットコードで案件をフィルタリングする
7. When `filter[status]` クエリパラメータが指定された場合, the Projects API shall 指定されたステータスで案件をフィルタリングする

### 要件 2: 案件単一取得

**目的:** プロジェクトマネージャーとして、特定の案件の詳細情報を取得したい。案件の内容を確認・編集するためである。

#### 受け入れ基準

1. When `GET /projects/:id` リクエストを受信した場合, the Projects API shall 該当案件を `{ data }` 形式で返却する（ステータス 200）
2. The Projects API shall レスポンスに外部キー先の `businessUnitName` および `projectTypeName` を JOIN で取得して含める
3. If 指定された ID の案件が存在しないまたは論理削除済みの場合, the Projects API shall RFC 9457 Problem Details 形式で 404 エラーを返却する

### 要件 3: 案件新規作成

**目的:** プロジェクトマネージャーとして、新しい案件を登録したい。工数管理の対象として追加するためである。

#### 受け入れ基準

1. When `POST /projects` リクエストを有効なリクエストボディで受信した場合, the Projects API shall 新規案件を作成し `{ data }` 形式で返却する（ステータス 201）
2. The Projects API shall レスポンスに `Location` ヘッダとして `/projects/{id}` を設定する
3. When リクエストボディの `projectCode` が既存の有効な案件と重複する場合, the Projects API shall RFC 9457 Problem Details 形式で 409 Conflict エラーを返却する
4. If リクエストボディが Zod スキーマのバリデーションに失敗した場合, the Projects API shall RFC 9457 Problem Details 形式で 422 エラーを返却する
5. The Projects API shall 以下のフィールドを必須として検証する: `projectCode`（NVARCHAR(120)）, `name`（NVARCHAR(120)）, `businessUnitCode`（VARCHAR(20)、存在する business_units を参照）, `startYearMonth`（CHAR(6)、YYYYMM形式）, `totalManhour`（正の整数）, `status`（VARCHAR(20)）
6. The Projects API shall 以下のフィールドを任意として受け付ける: `projectTypeCode`（VARCHAR(20)、存在する project_types を参照）, `durationMonths`（正の整数）
7. If 指定された `businessUnitCode` が business_units テーブルに存在しない場合, the Projects API shall RFC 9457 Problem Details 形式で 422 エラーを返却する
8. If 指定された `projectTypeCode` が project_types テーブルに存在しない場合, the Projects API shall RFC 9457 Problem Details 形式で 422 エラーを返却する

### 要件 4: 案件更新

**目的:** プロジェクトマネージャーとして、既存の案件情報を更新したい。計画変更を反映するためである。

#### 受け入れ基準

1. When `PUT /projects/:id` リクエストを有効なリクエストボディで受信した場合, the Projects API shall 該当案件を更新し `{ data }` 形式で返却する（ステータス 200）
2. If 指定された ID の案件が存在しないまたは論理削除済みの場合, the Projects API shall RFC 9457 Problem Details 形式で 404 エラーを返却する
3. If リクエストボディが Zod スキーマのバリデーションに失敗した場合, the Projects API shall RFC 9457 Problem Details 形式で 422 エラーを返却する
4. When `projectCode` を変更する場合に他の有効な案件と重複する場合, the Projects API shall RFC 9457 Problem Details 形式で 409 Conflict エラーを返却する
5. The Projects API shall `updated_at` カラムを現在日時に自動更新する
6. The Projects API shall 更新レスポンスに外部キー先の `businessUnitName` および `projectTypeName` を含める
7. If 指定された `businessUnitCode` が business_units テーブルに存在しない場合, the Projects API shall RFC 9457 Problem Details 形式で 422 エラーを返却する
8. If 指定された `projectTypeCode` が project_types テーブルに存在しない場合, the Projects API shall RFC 9457 Problem Details 形式で 422 エラーを返却する

### 要件 5: 案件論理削除

**目的:** プロジェクトマネージャーとして、不要な案件を削除したい。一覧の整理を行うためである。

#### 受け入れ基準

1. When `DELETE /projects/:id` リクエストを受信した場合, the Projects API shall 該当案件を論理削除し 204 No Content を返却する
2. The Projects API shall `deleted_at` カラムに現在日時を設定することで論理削除を実現する
3. If 指定された ID の案件が存在しないまたはすでに論理削除済みの場合, the Projects API shall RFC 9457 Problem Details 形式で 404 エラーを返却する
4. If 該当案件が他テーブル（project_cases 等）から参照されている場合, the Projects API shall RFC 9457 Problem Details 形式で 409 Conflict エラーを返却する

### 要件 6: 案件復元

**目的:** プロジェクトマネージャーとして、誤って削除した案件を復元したい。データの誤操作を回復するためである。

#### 受け入れ基準

1. When `POST /projects/:id/actions/restore` リクエストを受信した場合, the Projects API shall 該当案件の `deleted_at` を NULL に設定して復元し `{ data }` 形式で返却する（ステータス 200）
2. If 指定された ID の案件が存在しない場合, the Projects API shall RFC 9457 Problem Details 形式で 404 エラーを返却する
3. If 指定された ID の案件が論理削除されていない場合, the Projects API shall RFC 9457 Problem Details 形式で 409 Conflict エラーを返却する
4. When `projectCode` が復元先で他の有効な案件と重複する場合, the Projects API shall RFC 9457 Problem Details 形式で 409 Conflict エラーを返却する

### 要件 7: リクエストバリデーション

**目的:** API利用者として、不正なリクエストに対して明確なエラーメッセージを受け取りたい。迅速にリクエストを修正するためである。

#### 受け入れ基準

1. The Projects API shall Zod スキーマと `@hono/zod-validator` によるリクエストバリデーションを実施する
2. If バリデーションエラーが発生した場合, the Projects API shall RFC 9457 Problem Details 形式で `errors` 配列にフィールドごとのエラー詳細（pointer, keyword, message）を含めて 422 エラーを返却する
3. The Projects API shall `projectCode` を 1〜120文字の文字列として検証する
4. The Projects API shall `name` を 1〜120文字の文字列として検証する
5. The Projects API shall `businessUnitCode` を 1〜20文字の英数字・ハイフン・アンダースコアとして検証する
6. The Projects API shall `startYearMonth` を YYYYMM 形式（6桁数字）として検証する
7. The Projects API shall `totalManhour` を正の整数として検証する
8. The Projects API shall `status` を 1〜20文字の文字列として検証する
9. Where `projectTypeCode` が指定された場合, the Projects API shall 1〜20文字の英数字・ハイフン・アンダースコアとして検証する
10. Where `durationMonths` が指定された場合, the Projects API shall 正の整数として検証する

### 要件 8: レスポンス形式

**目的:** API利用者として、一貫したレスポンス形式を受け取りたい。クライアント側の実装を統一するためである。

#### 受け入れ基準

1. The Projects API shall 成功レスポンスを `{ data, meta?, links? }` 形式で返却する
2. The Projects API shall エラーレスポンスを RFC 9457 Problem Details 形式（`application/problem+json`）で返却する
3. The Projects API shall API レスポンスフィールドを camelCase（`projectCode`, `businessUnitCode`, `startYearMonth` 等）で返却する
4. The Projects API shall DB の snake_case カラムを API の camelCase フィールドに Transform 層で変換する
5. The Projects API shall 日時フィールド（`createdAt`, `updatedAt`）を ISO 8601 形式の文字列として返却する
6. The Projects API shall 案件レスポンスに以下のフィールドを含める: `projectId`, `projectCode`, `name`, `businessUnitCode`, `businessUnitName`, `projectTypeCode`, `projectTypeName`, `startYearMonth`, `totalManhour`, `status`, `durationMonths`, `createdAt`, `updatedAt`

### 要件 9: テスト

**目的:** 開発者として、API の動作を自動テストで検証したい。品質を担保するためである。

#### 受け入れ基準

1. The Projects API shall Vitest を使用したユニットテストを `src/__tests__/` 配下に配置する
2. The Projects API shall 各 CRUD 操作（一覧取得・単一取得・作成・更新・削除・復元）の正常系テストを含む
3. The Projects API shall 各エラーケース（404・409・422）の異常系テストを含む
4. The Projects API shall Hono の `app.request()` メソッドを使用してハンドラを直接テストする

### 要件 10: コードアーキテクチャ

**目的:** 開発者として、既存のコードベースと一貫したアーキテクチャで実装したい。保守性を維持するためである。

#### 受け入れ基準

1. The Projects API shall 既存パターンに従い `routes/projects.ts`, `services/projectService.ts`, `data/projectData.ts`, `transform/projectTransform.ts`, `types/project.ts` の各層にコードを分離する
2. The Projects API shall `src/index.ts` にルートを `/projects` パスでマウントする
3. The Projects API shall TypeScript strict mode に準拠し `any` 型を使用しない
4. The Projects API shall `@/*` エイリアスを使用したインポートを行う
5. The Projects API shall Zod スキーマから TypeScript 型を導出する
