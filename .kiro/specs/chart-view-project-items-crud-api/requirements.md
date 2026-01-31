# Requirements Document

## Introduction

チャートビューに含まれる案件項目（chart_view_project_items）のCRUD APIを実装する。このテーブルはチャートビュー（chart_views）と案件（projects）/ 案件ケース（project_cases）を関連付ける中間テーブルであり、チャート上にどの案件をどの順序で表示するかを管理する。関連テーブルのため論理削除は行わず物理削除を採用する。APIは親リソース（chart_views）のネストされたエンドポイントとして実装する。

**対象テーブル:** `chart_view_project_items`

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| chart_view_project_item_id | INT | NO | IDENTITY(1,1) | 主キー。自動採番 |
| chart_view_id | INT | NO | - | 外部キー → chart_views |
| project_id | INT | NO | - | 外部キー → projects |
| project_case_id | INT | YES | NULL | 外部キー → project_cases |
| display_order | INT | NO | 0 | 表示順序 |
| is_visible | BIT | NO | 1 | 表示フラグ |
| created_at | DATETIME2 | NO | GETDATE() | 作成日時 |
| updated_at | DATETIME2 | NO | GETDATE() | 更新日時 |

**外部キー:**
- FK_chart_view_project_items_view → chart_views(chart_view_id) ON DELETE CASCADE
- FK_chart_view_project_items_project → projects(project_id)
- FK_chart_view_project_items_case → project_cases(project_case_id)

---

## Requirements

### Requirement 1: 案件項目一覧取得

**Objective:** As a 事業部リーダー, I want 特定のチャートビューに紐づく案件項目の一覧を取得したい, so that チャートに表示される案件の構成を確認できる

#### Acceptance Criteria

1. When GET リクエストが `/chart-views/:chartViewId/project-items` に送信された場合, the Chart View Project Items API shall 指定されたチャートビューに紐づく案件項目の一覧を `display_order` 昇順で返却する
2. If 指定された `chartViewId` のチャートビューが存在しない場合, the Chart View Project Items API shall 404 Not Found エラーをRFC 9457 Problem Details形式で返却する
3. If 指定された `chartViewId` のチャートビューが論理削除済みの場合, the Chart View Project Items API shall 404 Not Found エラーを返却する
4. The Chart View Project Items API shall レスポンスに関連する案件情報（`projectCode`, `projectName`）と案件ケース情報（`caseName`、`project_case_id` が設定されている場合）を含める

---

### Requirement 2: 案件項目単一取得

**Objective:** As a 事業部リーダー, I want 特定の案件項目の詳細を取得したい, so that 個別の項目設定を確認できる

#### Acceptance Criteria

1. When GET リクエストが `/chart-views/:chartViewId/project-items/:id` に送信された場合, the Chart View Project Items API shall 指定されたIDの案件項目を返却する
2. If 指定されたIDの案件項目が存在しない場合, the Chart View Project Items API shall 404 Not Found エラーをRFC 9457 Problem Details形式で返却する
3. If 指定された案件項目が指定の `chartViewId` に属していない場合, the Chart View Project Items API shall 404 Not Found エラーを返却する

---

### Requirement 3: 案件項目新規作成

**Objective:** As a 事業部リーダー, I want チャートビューに案件項目を追加したい, so that チャート上に表示する案件を設定できる

#### Acceptance Criteria

1. When POST リクエストが `/chart-views/:chartViewId/project-items` に有効なデータで送信された場合, the Chart View Project Items API shall 新しい案件項目を作成し、201 Created で返却する
2. The Chart View Project Items API shall レスポンスに `Location` ヘッダ（`/chart-views/{chartViewId}/project-items/{id}`）を含める
3. The Chart View Project Items API shall `projectId`（必須、正の整数）、`projectCaseId`（任意、正の整数またはnull）、`displayOrder`（任意、非負整数、デフォルト0）、`isVisible`（任意、boolean、デフォルトtrue）をリクエストボディとして受け付ける
4. If リクエストボディのバリデーションに失敗した場合, the Chart View Project Items API shall 422 Validation Error をRFC 9457形式で返却する
5. If 指定された `projectId` の案件が存在しない場合, the Chart View Project Items API shall 422 Validation Error を返却する
6. If 指定された `projectCaseId` の案件ケースが存在しないか、指定された `projectId` に属していない場合, the Chart View Project Items API shall 422 Validation Error を返却する
7. If 指定された `chartViewId` のチャートビューが存在しないまたは論理削除済みの場合, the Chart View Project Items API shall 404 Not Found エラーを返却する

---

### Requirement 4: 案件項目更新

**Objective:** As a 事業部リーダー, I want 案件項目の表示設定を更新したい, so that チャート上の案件表示順序や表示有無を変更できる

#### Acceptance Criteria

1. When PUT リクエストが `/chart-views/:chartViewId/project-items/:id` に有効なデータで送信された場合, the Chart View Project Items API shall 指定されたIDの案件項目を更新し、200 OK で返却する
2. The Chart View Project Items API shall `projectCaseId`（任意、正の整数またはnull）、`displayOrder`（任意、非負整数）、`isVisible`（任意、boolean）を更新フィールドとして受け付ける
3. If 指定されたIDの案件項目が存在しない場合, the Chart View Project Items API shall 404 Not Found エラーをRFC 9457形式で返却する
4. If リクエストボディのバリデーションに失敗した場合, the Chart View Project Items API shall 422 Validation Error をRFC 9457形式で返却する
5. If 指定された `projectCaseId` の案件ケースが存在しないか、該当案件項目の `projectId` に属していない場合, the Chart View Project Items API shall 422 Validation Error を返却する
6. The Chart View Project Items API shall `projectId` の変更を受け付けない（案件の差し替えは削除→再作成で行う）

---

### Requirement 5: 案件項目削除

**Objective:** As a 事業部リーダー, I want チャートビューから案件項目を削除したい, so that 不要な案件をチャート表示から除外できる

#### Acceptance Criteria

1. When DELETE リクエストが `/chart-views/:chartViewId/project-items/:id` に送信された場合, the Chart View Project Items API shall 指定されたIDの案件項目を物理削除し、204 No Content を返却する
2. If 指定されたIDの案件項目が存在しない場合, the Chart View Project Items API shall 404 Not Found エラーを返却する
3. If 指定された案件項目が指定の `chartViewId` に属していない場合, the Chart View Project Items API shall 404 Not Found エラーを返却する

---

### Requirement 6: 案件項目一括更新（表示順序）

**Objective:** As a 事業部リーダー, I want 案件項目の表示順序を一括で変更したい, so that チャートの積み上げ順序を効率的に調整できる

#### Acceptance Criteria

1. When PUT リクエストが `/chart-views/:chartViewId/project-items/display-order` に送信された場合, the Chart View Project Items API shall 指定された案件項目の表示順序を一括更新し、200 OK で返却する
2. The Chart View Project Items API shall `items` 配列（各要素に `chartViewProjectItemId` と `displayOrder` を含む）をリクエストボディとして受け付ける
3. If `items` 配列内のIDに指定の `chartViewId` に属さない項目が含まれる場合, the Chart View Project Items API shall 422 Validation Error を返却する
4. If リクエストボディのバリデーションに失敗した場合, the Chart View Project Items API shall 422 Validation Error をRFC 9457形式で返却する

---

### Requirement 7: APIレスポンス形式

**Objective:** As a フロントエンド開発者, I want 統一されたレスポンス形式でデータを受け取りたい, so that クライアント側の実装を簡素化できる

#### Acceptance Criteria

1. The Chart View Project Items API shall 成功時のレスポンスを `{ data: ... }` 形式で返却する
2. The Chart View Project Items API shall エラー時のレスポンスをRFC 9457 Problem Details形式（Content-Type: `application/problem+json`）で返却する
3. The Chart View Project Items API shall レスポンスフィールドをcamelCase（`chartViewProjectItemId`, `chartViewId`, `projectId`, `projectCaseId`, `displayOrder`, `isVisible`, `createdAt`, `updatedAt`）で返却する
4. The Chart View Project Items API shall 日時フィールド（`createdAt`, `updatedAt`）をISO 8601形式の文字列で返却する
5. The Chart View Project Items API shall 一覧取得時に関連リソース情報（`project.projectCode`, `project.projectName`, `projectCase.caseName`）を含めて返却する

---

### Requirement 8: バリデーション

**Objective:** As a システム管理者, I want 不正なデータの登録を防止したい, so that データの整合性を保てる

#### Acceptance Criteria

1. The Chart View Project Items API shall 作成時のリクエストボディ（`projectId` 必須・正の整数、`projectCaseId` 任意・正の整数またはnull、`displayOrder` 任意・非負整数、`isVisible` 任意・boolean）をZodスキーマでバリデーションする
2. The Chart View Project Items API shall 更新時のリクエストボディ（`projectCaseId` 任意・正の整数またはnull、`displayOrder` 任意・非負整数、`isVisible` 任意・boolean）をバリデーションする
3. The Chart View Project Items API shall 一括表示順序更新時の `items` 配列（`chartViewProjectItemId` 必須・正の整数、`displayOrder` 必須・非負整数）をバリデーションする
4. The Chart View Project Items API shall パスパラメータ `chartViewId` および `id` を正の整数としてバリデーションする
5. If バリデーションエラーが発生した場合, the Chart View Project Items API shall `errors` 配列にフィールドごとのエラー詳細（pointer, keyword, message, params）を含める
6. The Chart View Project Items API shall 外部キー参照先（projects, project_cases）の存在検証を行う

---

### Requirement 9: テスト

**Objective:** As a 開発者, I want CRUD APIの各エンドポイントが正しく動作することを確認したい, so that 品質を担保できる

#### Acceptance Criteria

1. The Chart View Project Items API shall 各CRUDエンドポイント（一覧取得、単一取得、作成、更新、削除、一括表示順序更新）のユニットテストを提供する
2. The Chart View Project Items API shall バリデーションエラーケース（必須項目欠落、型不正、範囲外値）のテストを提供する
3. The Chart View Project Items API shall エラーケース（存在しないチャートビューID、存在しない案件ID、存在しない案件ケースID、所属不一致）のテストを提供する
4. The Chart View Project Items API shall Vitestフレームワークと `app.request()` メソッドを使用してテストを実行する
