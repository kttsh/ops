# Requirements Document

## Introduction

チャートビュー（chart_views）のCRUD APIを実装する。チャートビューは、積み上げチャートの表示設定（表示期間、チャートタイプ、含まれる案件・間接作業項目）を保存・管理するためのエンティティである。APIは既存のバックエンドアーキテクチャ（Hono + レイヤードアーキテクチャ）に準拠する。

**対象テーブル:** `chart_views`

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| chart_view_id | INT | NO | IDENTITY(1,1) | 主キー。自動採番 |
| view_name | NVARCHAR(100) | NO | - | ビュー名 |
| chart_type | VARCHAR(50) | NO | - | チャートタイプ |
| start_year_month | CHAR(6) | NO | - | 表示開始年月（YYYYMM形式） |
| end_year_month | CHAR(6) | NO | - | 表示終了年月（YYYYMM形式） |
| is_default | BIT | NO | 0 | デフォルトビューフラグ |
| description | NVARCHAR(500) | YES | NULL | 説明 |
| created_at | DATETIME2 | NO | GETDATE() | 作成日時 |
| updated_at | DATETIME2 | NO | GETDATE() | 更新日時 |
| deleted_at | DATETIME2 | YES | NULL | 削除日時（論理削除） |

**関連テーブル:**
- `chart_view_project_items` — チャートビューに含まれる案件項目（ON DELETE CASCADE）
- `chart_view_indirect_work_items` — チャートビューに含まれる間接作業項目（ON DELETE CASCADE）

---

## Requirements

### Requirement 1: チャートビュー一覧取得

**Objective:** As a 事業部リーダー, I want チャートビューの一覧をページネーション付きで取得したい, so that 登録済みのビュー設定を確認し管理できる

#### Acceptance Criteria

1. When GET リクエストが `/chart-views` に送信された場合, the Chart Views API shall ページネーション付きでチャートビューの一覧を返却する（デフォルト: page=1, pageSize=20）
2. The Chart Views API shall 論理削除されたビュー（`deleted_at IS NOT NULL`）をデフォルトで一覧から除外する
3. When クエリパラメータ `filter[includeDisabled]=true` が指定された場合, the Chart Views API shall 論理削除済みのビューも含めた一覧を返却する
4. The Chart Views API shall レスポンスに `meta.pagination`（currentPage, pageSize, totalItems, totalPages）を含める

---

### Requirement 2: チャートビュー単一取得

**Objective:** As a 事業部リーダー, I want 特定のチャートビューの詳細を取得したい, so that ビュー設定の内容を確認できる

#### Acceptance Criteria

1. When GET リクエストが `/chart-views/:id` に送信された場合, the Chart Views API shall 指定されたIDのチャートビューを返却する
2. If 指定されたIDのチャートビューが存在しない場合, the Chart Views API shall 404 Not Found エラーをRFC 9457 Problem Details形式で返却する
3. If 指定されたIDのチャートビューが論理削除済みの場合, the Chart Views API shall 404 Not Found エラーを返却する

---

### Requirement 3: チャートビュー新規作成

**Objective:** As a 事業部リーダー, I want 新しいチャートビューを作成したい, so that 独自の表示設定でチャートを管理できる

#### Acceptance Criteria

1. When POST リクエストが `/chart-views` に有効なデータで送信された場合, the Chart Views API shall 新しいチャートビューを作成し、201 Created で返却する
2. The Chart Views API shall レスポンスに `Location` ヘッダ（`/chart-views/{id}`）を含める
3. The Chart Views API shall `viewName`（必須、1〜100文字）、`chartType`（必須、1〜50文字）、`startYearMonth`（必須、YYYYMM形式6文字）、`endYearMonth`（必須、YYYYMM形式6文字）、`isDefault`（任意、デフォルト false）、`description`（任意、最大500文字）をリクエストボディとして受け付ける
4. If リクエストボディのバリデーションに失敗した場合, the Chart Views API shall 422 Validation Error をRFC 9457形式で返却する（エラー詳細を `errors` 配列に含める）
5. If `startYearMonth` が `endYearMonth` より後の値である場合, the Chart Views API shall 422 Validation Error を返却する

---

### Requirement 4: チャートビュー更新

**Objective:** As a 事業部リーダー, I want 既存のチャートビューを更新したい, so that ビューの表示設定を修正できる

#### Acceptance Criteria

1. When PUT リクエストが `/chart-views/:id` に有効なデータで送信された場合, the Chart Views API shall 指定されたIDのチャートビューを更新し、200 OK で返却する
2. The Chart Views API shall `viewName`（任意、1〜100文字）、`chartType`（任意、1〜50文字）、`startYearMonth`（任意、YYYYMM形式6文字）、`endYearMonth`（任意、YYYYMM形式6文字）、`isDefault`（任意）、`description`（任意、最大500文字、null許可）を更新フィールドとして受け付ける
3. If 指定されたIDのチャートビューが存在しない場合, the Chart Views API shall 404 Not Found エラーをRFC 9457形式で返却する
4. If リクエストボディのバリデーションに失敗した場合, the Chart Views API shall 422 Validation Error をRFC 9457形式で返却する
5. If 更新後の `startYearMonth` が `endYearMonth` より後の値になる場合, the Chart Views API shall 422 Validation Error を返却する

---

### Requirement 5: チャートビュー論理削除

**Objective:** As a 事業部リーダー, I want 不要になったチャートビューを削除したい, so that 一覧から除外し整理できる

#### Acceptance Criteria

1. When DELETE リクエストが `/chart-views/:id` に送信された場合, the Chart Views API shall 指定されたIDのチャートビューを論理削除し、204 No Content を返却する
2. The Chart Views API shall 論理削除時に `deleted_at` カラムに現在日時を設定する
3. If 指定されたIDのチャートビューが存在しない場合, the Chart Views API shall 404 Not Found エラーを返却する

---

### Requirement 6: チャートビュー復元

**Objective:** As a 事業部リーダー, I want 論理削除したチャートビューを復元したい, so that 誤って削除したビューを元に戻せる

#### Acceptance Criteria

1. When POST リクエストが `/chart-views/:id/actions/restore` に送信された場合, the Chart Views API shall 指定されたIDの論理削除済みチャートビューを復元し、200 OK で返却する
2. The Chart Views API shall 復元時に `deleted_at` を NULL に、`updated_at` を現在日時に設定する
3. If 指定されたIDのチャートビューが存在しないか、論理削除されていない場合, the Chart Views API shall 404 Not Found エラーを返却する

---

### Requirement 7: APIレスポンス形式

**Objective:** As a フロントエンド開発者, I want 統一されたレスポンス形式でデータを受け取りたい, so that クライアント側の実装を簡素化できる

#### Acceptance Criteria

1. The Chart Views API shall 成功時のレスポンスを `{ data: ... }` 形式で返却する
2. The Chart Views API shall 一覧取得時に `{ data: [...], meta: { pagination: {...} } }` 形式で返却する
3. The Chart Views API shall エラー時のレスポンスをRFC 9457 Problem Details形式（Content-Type: `application/problem+json`）で返却する
4. The Chart Views API shall レスポンスフィールドをcamelCase（`chartViewId`, `viewName`, `chartType`, `startYearMonth`, `endYearMonth`, `isDefault`, `description`, `createdAt`, `updatedAt`）で返却する
5. The Chart Views API shall 日時フィールド（`createdAt`, `updatedAt`）をISO 8601形式の文字列で返却する

---

### Requirement 8: バリデーション

**Objective:** As a システム管理者, I want 不正なデータの登録を防止したい, so that データの整合性を保てる

#### Acceptance Criteria

1. The Chart Views API shall 一覧取得時のクエリパラメータ（`page[number]`、`page[size]`、`filter[includeDisabled]`）をZodスキーマでバリデーションする
2. The Chart Views API shall 作成時のリクエストボディ（`viewName` 必須・1〜100文字、`chartType` 必須・1〜50文字、`startYearMonth` 必須・YYYYMM形式6文字、`endYearMonth` 必須・YYYYMM形式6文字、`isDefault` 任意・boolean、`description` 任意・最大500文字）をバリデーションする
3. The Chart Views API shall 更新時のリクエストボディをバリデーションする
4. The Chart Views API shall `startYearMonth` と `endYearMonth` の大小関係（start ≤ end）を検証する
5. If バリデーションエラーが発生した場合, the Chart Views API shall `errors` 配列にフィールドごとのエラー詳細（pointer, keyword, message, params）を含める

---

### Requirement 9: テスト

**Objective:** As a 開発者, I want CRUD APIの各エンドポイントが正しく動作することを確認したい, so that 品質を担保できる

#### Acceptance Criteria

1. The Chart Views API shall 各CRUDエンドポイント（一覧取得、単一取得、作成、更新、削除、復元）のユニットテストを提供する
2. The Chart Views API shall バリデーションエラーケース（必須項目欠落、型不正、範囲外値、年月大小関係不正）のテストを提供する
3. The Chart Views API shall エラーケース（存在しないID、論理削除済みリソース）のテストを提供する
4. The Chart Views API shall Vitestフレームワークと `app.request()` メソッドを使用してテストを実行する
