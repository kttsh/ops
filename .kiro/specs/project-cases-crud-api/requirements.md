# Requirements Document

## Introduction

本ドキュメントは、案件ケース（project_cases）テーブルに対する CRUD API の要件を定義する。
案件ケースは、1つの案件（project）に対して複数の工数計画パターン（楽観/標準/悲観等）を管理するためのエンティティである。

project_cases は projects の子リソースであり、API エンドポイントは `/projects/:projectId/project-cases` の階層構造で提供する。
テーブルが正規化されているため、API レスポンスでは外部キーに付随する名称（案件名、標準工数パターン名等）も JOIN で取得して返却する。

既存の businessUnits / projectTypes / workTypes の CRUD 実装パターンを踏襲し、レイヤードアーキテクチャ（routes → services → data → transform → types）で実装する。

## Requirements

### Requirement 1: 案件ケース一覧取得

**Objective:** As a プロジェクトマネージャー, I want 特定案件に紐づくケース一覧をページネーション付きで取得したい, so that 案件の工数計画パターンを一覧で把握できる

#### Acceptance Criteria

1. When `GET /projects/:projectId/project-cases` リクエストを受信した場合, the Project Cases API shall 指定された projectId に紐づく案件ケース一覧をページネーション付きで返却する
2. The Project Cases API shall レスポンスに `data` 配列と `meta.pagination`（currentPage, pageSize, totalItems, totalPages）を含める
3. The Project Cases API shall ソフトデリートされたレコード（deleted_at IS NOT NULL）をデフォルトで除外する
4. When `filter[includeDisabled]=true` クエリパラメータが指定された場合, the Project Cases API shall ソフトデリートされたレコードも含めて返却する
5. The Project Cases API shall レスポンスに外部キーの付随名称（projectName, standardEffortName）を JOIN で取得して含める
6. If 指定された projectId に該当する案件が存在しない場合, the Project Cases API shall 404 Not Found を RFC 9457 Problem Details 形式で返却する
7. The Project Cases API shall 一覧を `created_at` の昇順でソートして返却する

### Requirement 2: 案件ケース単一取得

**Objective:** As a プロジェクトマネージャー, I want 特定の案件ケースの詳細情報を取得したい, so that ケースごとの工数計画詳細を確認できる

#### Acceptance Criteria

1. When `GET /projects/:projectId/project-cases/:projectCaseId` リクエストを受信した場合, the Project Cases API shall 指定された案件ケースの詳細を `{ data: {...} }` 形式で返却する
2. The Project Cases API shall レスポンスに外部キーの付随名称（projectName, standardEffortName）を JOIN で取得して含める
3. If 指定された projectCaseId に該当するケースが存在しないか、ソフトデリート済みの場合, the Project Cases API shall 404 Not Found を RFC 9457 Problem Details 形式で返却する
4. If 指定された projectCaseId の project_id が URL の projectId と一致しない場合, the Project Cases API shall 404 Not Found を返却する

### Requirement 3: 案件ケース新規作成

**Objective:** As a プロジェクトマネージャー, I want 案件に対して新しいケースを作成したい, so that 複数の工数計画パターンで比較検討できる

#### Acceptance Criteria

1. When `POST /projects/:projectId/project-cases` に有効なリクエストボディを受信した場合, the Project Cases API shall 新しい案件ケースを作成し、201 Created と作成されたリソースを返却する
2. The Project Cases API shall レスポンスヘッダに `Location` として作成されたリソースの URL を含める
3. The Project Cases API shall リクエストボディを Zod スキーマでバリデーションする（caseName: 必須・最大100文字、isPrimary: boolean、description: 任意・最大500文字、calculationType: 'MANUAL' または 'STANDARD'、standardEffortId: 任意・整数、startYearMonth: 任意・YYYYMM形式、durationMonths: 任意・正の整数、totalManhour: 任意・非負整数）
4. If バリデーションに失敗した場合, the Project Cases API shall 422 Unprocessable Entity を RFC 9457 形式で返却する
5. If 指定された projectId に該当する案件が存在しない場合, the Project Cases API shall 404 Not Found を返却する
6. If calculationType が 'STANDARD' かつ standardEffortId が未指定の場合, the Project Cases API shall 422 バリデーションエラーを返却する
7. If 指定された standardEffortId に該当する標準工数パターンが存在しない場合, the Project Cases API shall 422 バリデーションエラーを返却する

### Requirement 4: 案件ケース更新

**Objective:** As a プロジェクトマネージャー, I want 既存の案件ケースの情報を更新したい, so that 計画の変更を反映できる

#### Acceptance Criteria

1. When `PUT /projects/:projectId/project-cases/:projectCaseId` に有効なリクエストボディを受信した場合, the Project Cases API shall 案件ケースを更新し、200 OK と更新されたリソースを返却する
2. The Project Cases API shall 更新時にリクエストボディを Zod スキーマでバリデーションする（作成時と同一フィールド、すべて任意）
3. If 指定された projectCaseId に該当するケースが存在しないか、ソフトデリート済みの場合, the Project Cases API shall 404 Not Found を返却する
4. If バリデーションに失敗した場合, the Project Cases API shall 422 Unprocessable Entity を返却する
5. The Project Cases API shall 更新時に `updated_at` を現在日時に更新する
6. If calculationType を 'STANDARD' に変更し standardEffortId が未指定の場合, the Project Cases API shall 422 バリデーションエラーを返却する

### Requirement 5: 案件ケース論理削除

**Objective:** As a プロジェクトマネージャー, I want 不要になった案件ケースを削除したい, so that 一覧から非表示にできる

#### Acceptance Criteria

1. When `DELETE /projects/:projectId/project-cases/:projectCaseId` リクエストを受信した場合, the Project Cases API shall 案件ケースをソフトデリート（deleted_at を設定）し、204 No Content を返却する
2. If 指定された projectCaseId に該当するケースが存在しないか、既にソフトデリート済みの場合, the Project Cases API shall 404 Not Found を返却する
3. If 対象ケースが他のリソース（project_load, chart_view_project_items）から参照されている場合, the Project Cases API shall 409 Conflict を RFC 9457 形式で返却する

### Requirement 6: 案件ケース復元

**Objective:** As a プロジェクトマネージャー, I want 誤って削除したケースを復元したい, so that データを失わずに管理を継続できる

#### Acceptance Criteria

1. When `POST /projects/:projectId/project-cases/:projectCaseId/actions/restore` リクエストを受信した場合, the Project Cases API shall ソフトデリートされた案件ケースの deleted_at を NULL に戻し、200 OK と復元されたリソースを返却する
2. If 指定された projectCaseId に該当するケースが存在しない場合, the Project Cases API shall 404 Not Found を返却する
3. If 指定された projectCaseId がソフトデリートされていない場合, the Project Cases API shall 409 Conflict を返却する

### Requirement 7: バリデーション・共通仕様

**Objective:** As a API利用者, I want 入力値の検証とエラーメッセージが一貫していてほしい, so that クライアント側の実装が容易になる

#### Acceptance Criteria

1. The Project Cases API shall すべてのエラーレスポンスを RFC 9457 Problem Details 形式（Content-Type: application/problem+json）で返却する
2. The Project Cases API shall パスパラメータ projectId および projectCaseId を正の整数としてバリデーションする
3. If 不正なパスパラメータ（非数値など）が指定された場合, the Project Cases API shall 422 Unprocessable Entity を返却する
4. The Project Cases API shall APIレスポンスのフィールド名を camelCase で返却する（DB の snake_case から変換）
5. The Project Cases API shall startYearMonth フィールドの形式を YYYYMM（6桁数字）としてバリデーションする

### Requirement 8: テスト

**Objective:** As a 開発者, I want CRUD 操作に対するテストが網羅されていてほしい, so that リグレッションを防止できる

#### Acceptance Criteria

1. The Project Cases API shall 各エンドポイント（GET一覧, GET単一, POST, PUT, DELETE, restore）に対する正常系テストを持つ
2. The Project Cases API shall エラーケース（404, 409, 422）に対する異常系テストを持つ
3. The Project Cases API shall Vitest + `app.request()` パターンでテストを実装する
4. The Project Cases API shall テストファイルを `src/__tests__/routes/projectCases.test.ts` に配置する
