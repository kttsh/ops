# Requirements Document

## Introduction

`indirect_work_type_ratios`（間接作業種別配分比率）テーブルに対する CRUD API を実装する。このテーブルはファクトテーブルであり、間接作業ケース（`indirect_work_cases`）配下で、作業種別（`work_types`）ごとの年度別配分比率を管理する。ファクトテーブルのため物理削除を採用し、親リソース削除時はカスケード削除される。既存の `projectLoads` API と同様のネストリソースパターンに従う。

## Requirements

### Requirement 1: 間接作業種別配分比率の一覧取得

**Objective:** As a 事業部リーダー, I want 特定の間接作業ケースに紐づく配分比率の一覧を取得したい, so that 各作業種別への工数配分を確認できる

#### Acceptance Criteria

1. When GET リクエストが `/indirect-work-cases/:indirectWorkCaseId/indirect-work-type-ratios` に送信された場合, the API shall 指定された間接作業ケースに紐づく全配分比率レコードを `{ "data": [...] }` 形式で返却する
2. When 存在する間接作業ケースIDが指定された場合, the API shall HTTP ステータスコード 200 を返却する
3. If 指定された `indirectWorkCaseId` に該当する間接作業ケースが存在しない場合, the API shall HTTP ステータスコード 404 と RFC 9457 Problem Details 形式のエラーレスポンスを返却する
4. The API shall レスポンスの各レコードに `indirectWorkTypeRatioId`, `indirectWorkCaseId`, `workTypeCode`, `fiscalYear`, `ratio`, `createdAt`, `updatedAt` フィールドを含める

### Requirement 2: 間接作業種別配分比率の単一取得

**Objective:** As a 事業部リーダー, I want 特定の配分比率レコードの詳細を取得したい, so that 個別の配分設定を確認できる

#### Acceptance Criteria

1. When GET リクエストが `/indirect-work-cases/:indirectWorkCaseId/indirect-work-type-ratios/:indirectWorkTypeRatioId` に送信された場合, the API shall 指定された配分比率レコードを `{ "data": {...} }` 形式で返却する
2. When 存在するレコードIDが指定された場合, the API shall HTTP ステータスコード 200 を返却する
3. If 指定された `indirectWorkTypeRatioId` に該当するレコードが存在しない場合, the API shall HTTP ステータスコード 404 と RFC 9457 Problem Details 形式のエラーレスポンスを返却する
4. If 指定された `indirectWorkCaseId` に該当する間接作業ケースが存在しない場合, the API shall HTTP ステータスコード 404 と RFC 9457 Problem Details 形式のエラーレスポンスを返却する

### Requirement 3: 間接作業種別配分比率の新規作成

**Objective:** As a 事業部リーダー, I want 新しい配分比率レコードを作成したい, so that 作業種別への工数配分を設定できる

#### Acceptance Criteria

1. When POST リクエストが `/indirect-work-cases/:indirectWorkCaseId/indirect-work-type-ratios` に有効なリクエストボディで送信された場合, the API shall 新規レコードを作成し HTTP ステータスコード 201 と `Location` ヘッダを返却する
2. The API shall リクエストボディに `workTypeCode`（VARCHAR(20)、必須）、`fiscalYear`（整数、必須）、`ratio`（0.0000〜1.0000 の小数、必須）を受け付ける
3. If リクエストボディのバリデーションに失敗した場合, the API shall HTTP ステータスコード 422 と RFC 9457 Problem Details 形式のエラーレスポンスを返却する
4. If 指定された `indirectWorkCaseId` に該当する間接作業ケースが存在しない場合, the API shall HTTP ステータスコード 404 と RFC 9457 Problem Details 形式のエラーレスポンスを返却する
5. If 同一の `indirectWorkCaseId` + `workTypeCode` + `fiscalYear` の組み合わせが既に存在する場合, the API shall HTTP ステータスコード 409 と RFC 9457 Problem Details 形式のエラーレスポンスを返却する
6. If 指定された `workTypeCode` に該当する作業種別マスタが存在しない場合, the API shall HTTP ステータスコード 422 と RFC 9457 Problem Details 形式のエラーレスポンスを返却する

### Requirement 4: 間接作業種別配分比率の更新

**Objective:** As a 事業部リーダー, I want 既存の配分比率レコードを更新したい, so that 配分設定を変更できる

#### Acceptance Criteria

1. When PUT リクエストが `/indirect-work-cases/:indirectWorkCaseId/indirect-work-type-ratios/:indirectWorkTypeRatioId` に有効なリクエストボディで送信された場合, the API shall レコードを更新し HTTP ステータスコード 200 と更新後のレコードを返却する
2. The API shall リクエストボディに `workTypeCode`（任意）、`fiscalYear`（任意）、`ratio`（任意）を受け付ける
3. If リクエストボディのバリデーションに失敗した場合, the API shall HTTP ステータスコード 422 と RFC 9457 Problem Details 形式のエラーレスポンスを返却する
4. If 指定された `indirectWorkTypeRatioId` に該当するレコードが存在しない場合, the API shall HTTP ステータスコード 404 と RFC 9457 Problem Details 形式のエラーレスポンスを返却する
5. If 更新後の `indirectWorkCaseId` + `workTypeCode` + `fiscalYear` の組み合わせが他のレコードと重複する場合, the API shall HTTP ステータスコード 409 と RFC 9457 Problem Details 形式のエラーレスポンスを返却する

### Requirement 5: 間接作業種別配分比率の削除

**Objective:** As a 事業部リーダー, I want 不要な配分比率レコードを削除したい, so that 不要な配分設定を除去できる

#### Acceptance Criteria

1. When DELETE リクエストが `/indirect-work-cases/:indirectWorkCaseId/indirect-work-type-ratios/:indirectWorkTypeRatioId` に送信された場合, the API shall レコードを物理削除し HTTP ステータスコード 204 を返却する
2. When 削除が成功した場合, the API shall レスポンスボディを空にする
3. If 指定された `indirectWorkTypeRatioId` に該当するレコードが存在しない場合, the API shall HTTP ステータスコード 404 と RFC 9457 Problem Details 形式のエラーレスポンスを返却する
4. If 指定された `indirectWorkCaseId` に該当する間接作業ケースが存在しない場合, the API shall HTTP ステータスコード 404 と RFC 9457 Problem Details 形式のエラーレスポンスを返却する

### Requirement 6: 間接作業種別配分比率の一括登録・更新

**Objective:** As a 事業部リーダー, I want 複数の配分比率レコードを一括で登録・更新したい, so that 年度ごとの配分比率を効率的に設定できる

#### Acceptance Criteria

1. When PUT リクエストが `/indirect-work-cases/:indirectWorkCaseId/indirect-work-type-ratios/bulk` に有効なリクエストボディで送信された場合, the API shall 複数レコードを一括で登録または更新（UPSERT）し HTTP ステータスコード 200 を返却する
2. The API shall リクエストボディに配分比率レコードの配列を受け付け、各要素は `workTypeCode`（必須）、`fiscalYear`（必須）、`ratio`（必須）を含む
3. The API shall `indirectWorkCaseId` + `workTypeCode` + `fiscalYear` の組み合わせが既存の場合は更新、存在しない場合は新規作成する
4. If リクエストボディのバリデーションに失敗した場合, the API shall HTTP ステータスコード 422 と RFC 9457 Problem Details 形式のエラーレスポンスを返却する
5. If 指定された `indirectWorkCaseId` に該当する間接作業ケースが存在しない場合, the API shall HTTP ステータスコード 404 と RFC 9457 Problem Details 形式のエラーレスポンスを返却する
6. The API shall 一括操作をトランザクション内で実行し、一部失敗時は全体をロールバックする

### Requirement 7: バリデーション仕様

**Objective:** As a API利用者, I want 入力値が適切にバリデーションされることを期待する, so that データの整合性が保たれる

#### Acceptance Criteria

1. The API shall `workTypeCode` を最大20文字の文字列として検証する
2. The API shall `fiscalYear` を整数として検証する
3. The API shall `ratio` を 0.0000 以上 1.0000 以下の小数（最大小数点以下4桁）として検証する
4. The API shall `indirectWorkCaseId` および `indirectWorkTypeRatioId` のパスパラメータを正の整数として検証する
5. If パスパラメータが正の整数でない場合, the API shall HTTP ステータスコード 422 と RFC 9457 Problem Details 形式のエラーレスポンスを返却する

### Requirement 8: レスポンス形式

**Objective:** As a API利用者, I want API レスポンスが統一された形式で返却されることを期待する, so that クライアント側の実装を標準化できる

#### Acceptance Criteria

1. The API shall 成功レスポンスを `application/json; charset=utf-8` コンテンツタイプで返却する
2. The API shall エラーレスポンスを `application/problem+json; charset=utf-8` コンテンツタイプで返却する
3. The API shall レスポンスフィールド名を camelCase で返却する（DB の snake_case から変換）
4. The API shall `createdAt` および `updatedAt` を ISO 8601 形式の文字列で返却する
5. The API shall `ratio` を数値型で返却する
