# Requirements Document

## Introduction

チャートビュー間接作業項目（chart_view_indirect_work_items）のCRUD APIを実装する。チャートビュー間接作業項目は、特定のチャートビューにどの間接作業ケースを含めるかを管理する関連テーブルである。物理削除方式を採用し、親テーブル（chart_views）の削除時にはカスケード削除される。APIは既存のバックエンドアーキテクチャ（Hono + レイヤードアーキテクチャ）に準拠し、チャートビューをスコープとしたネストURLで提供する。

**対象テーブル:** `chart_view_indirect_work_items`

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| chart_view_indirect_work_item_id | INT | NO | IDENTITY(1,1) | 主キー。自動採番 |
| chart_view_id | INT | NO | - | 外部キー → chart_views |
| indirect_work_case_id | INT | NO | - | 外部キー → indirect_work_cases |
| display_order | INT | NO | 0 | 表示順序 |
| is_visible | BIT | NO | 1 | 表示フラグ |
| created_at | DATETIME2 | NO | GETDATE() | 作成日時 |
| updated_at | DATETIME2 | NO | GETDATE() | 更新日時 |

---

## Requirements

### Requirement 1: チャートビュー間接作業項目一覧取得

**Objective:** As a 事業部リーダー, I want 特定チャートビューに紐づく間接作業項目の一覧を取得したい, so that チャートに含まれる間接作業ケースを確認できる

#### Acceptance Criteria

1. When GET リクエストが `/chart-views/:chartViewId/indirect-work-items` に送信された場合, the Chart View Indirect Work Items API shall 指定されたチャートビューに紐づく間接作業項目の一覧を返却する
2. The Chart View Indirect Work Items API shall 各項目のレスポンスに `indirectWorkCaseId` に対応する `caseName`（indirect_work_cases テーブルからJOINで取得）を含める
3. The Chart View Indirect Work Items API shall 一覧を `displayOrder` の昇順でソートして返却する
4. If 指定された `chartViewId` に対応するチャートビューが存在しない場合, the Chart View Indirect Work Items API shall 404 Not Found エラーをRFC 9457 Problem Details形式で返却する
5. If 指定された `chartViewId` に対応するチャートビューが論理削除済みの場合, the Chart View Indirect Work Items API shall 404 Not Found エラーを返却する

---

### Requirement 2: チャートビュー間接作業項目単一取得

**Objective:** As a 事業部リーダー, I want 特定の間接作業項目の詳細を取得したい, so that 項目の設定内容を確認できる

#### Acceptance Criteria

1. When GET リクエストが `/chart-views/:chartViewId/indirect-work-items/:id` に送信された場合, the Chart View Indirect Work Items API shall 指定されたIDの間接作業項目を返却する
2. The Chart View Indirect Work Items API shall レスポンスに `indirectWorkCaseId` に対応する `caseName` を含める
3. If 指定されたIDの間接作業項目が存在しない場合, the Chart View Indirect Work Items API shall 404 Not Found エラーをRFC 9457 Problem Details形式で返却する
4. If 指定された `chartViewId` と項目の `chartViewId` が一致しない場合, the Chart View Indirect Work Items API shall 404 Not Found エラーを返却する

---

### Requirement 3: チャートビュー間接作業項目新規作成

**Objective:** As a 事業部リーダー, I want チャートビューに間接作業ケースを追加したい, so that チャートに表示する間接作業を設定できる

#### Acceptance Criteria

1. When POST リクエストが `/chart-views/:chartViewId/indirect-work-items` に有効なデータで送信された場合, the Chart View Indirect Work Items API shall 新しい間接作業項目を作成し、201 Created で返却する
2. The Chart View Indirect Work Items API shall レスポンスに `Location` ヘッダ（`/chart-views/{chartViewId}/indirect-work-items/{id}`）を含める
3. The Chart View Indirect Work Items API shall `indirectWorkCaseId`（必須）、`displayOrder`（任意、デフォルト 0）、`isVisible`（任意、デフォルト true）をリクエストボディとして受け付ける
4. If `chartViewId` に対応するチャートビューが存在しない場合, the Chart View Indirect Work Items API shall 404 Not Found エラーを返却する
5. If `indirectWorkCaseId` に対応する間接作業ケースが存在しない場合, the Chart View Indirect Work Items API shall 422 Validation Error をRFC 9457形式で返却する
6. If 同一チャートビュー内に同じ `indirectWorkCaseId` の項目が既に存在する場合, the Chart View Indirect Work Items API shall 409 Conflict エラーをRFC 9457形式で返却する
7. If リクエストボディのバリデーションに失敗した場合, the Chart View Indirect Work Items API shall 422 Validation Error をRFC 9457形式で返却する（エラー詳細を `errors` 配列に含める）

---

### Requirement 4: チャートビュー間接作業項目更新

**Objective:** As a 事業部リーダー, I want 間接作業項目の表示設定を変更したい, so that チャートの表示をカスタマイズできる

#### Acceptance Criteria

1. When PUT リクエストが `/chart-views/:chartViewId/indirect-work-items/:id` に有効なデータで送信された場合, the Chart View Indirect Work Items API shall 指定されたIDの間接作業項目を更新し、200 OK で返却する
2. The Chart View Indirect Work Items API shall `displayOrder`（任意）、`isVisible`（任意）を更新フィールドとして受け付ける
3. If 指定されたIDの間接作業項目が存在しない場合, the Chart View Indirect Work Items API shall 404 Not Found エラーをRFC 9457形式で返却する
4. If 指定された `chartViewId` と項目の `chartViewId` が一致しない場合, the Chart View Indirect Work Items API shall 404 Not Found エラーを返却する
5. If リクエストボディのバリデーションに失敗した場合, the Chart View Indirect Work Items API shall 422 Validation Error をRFC 9457形式で返却する

---

### Requirement 5: チャートビュー間接作業項目削除

**Objective:** As a 事業部リーダー, I want チャートビューから間接作業ケースを除外したい, so that 不要な間接作業をチャート表示から取り除ける

#### Acceptance Criteria

1. When DELETE リクエストが `/chart-views/:chartViewId/indirect-work-items/:id` に送信された場合, the Chart View Indirect Work Items API shall 指定されたIDの間接作業項目を物理削除し、204 No Content を返却する
2. If 指定されたIDの間接作業項目が存在しない場合, the Chart View Indirect Work Items API shall 404 Not Found エラーを返却する
3. If 指定された `chartViewId` と項目の `chartViewId` が一致しない場合, the Chart View Indirect Work Items API shall 404 Not Found エラーを返却する

---

### Requirement 6: APIレスポンス形式

**Objective:** As a フロントエンド開発者, I want 統一されたレスポンス形式でデータを受け取りたい, so that クライアント側の実装を簡素化できる

#### Acceptance Criteria

1. The Chart View Indirect Work Items API shall 成功時のレスポンスを `{ data: ... }` 形式で返却する
2. The Chart View Indirect Work Items API shall 一覧取得時に `{ data: [...] }` 形式で返却する（関連テーブルのためページネーション不要）
3. The Chart View Indirect Work Items API shall エラー時のレスポンスをRFC 9457 Problem Details形式（Content-Type: `application/problem+json`）で返却する
4. The Chart View Indirect Work Items API shall レスポンスフィールドをcamelCase（`chartViewIndirectWorkItemId`, `chartViewId`, `indirectWorkCaseId`, `caseName`, `displayOrder`, `isVisible`, `createdAt`, `updatedAt`）で返却する
5. The Chart View Indirect Work Items API shall 日時フィールド（`createdAt`, `updatedAt`）をISO 8601形式の文字列で返却する

---

### Requirement 7: バリデーション

**Objective:** As a システム管理者, I want 不正なデータの登録を防止したい, so that データの整合性を保てる

#### Acceptance Criteria

1. The Chart View Indirect Work Items API shall パスパラメータ `chartViewId` および `id` を正の整数としてバリデーションする
2. The Chart View Indirect Work Items API shall 作成時のリクエストボディ（`indirectWorkCaseId` 必須・正の整数、`displayOrder` 任意・0以上の整数、`isVisible` 任意・boolean）をZodスキーマでバリデーションする
3. The Chart View Indirect Work Items API shall 更新時のリクエストボディ（`displayOrder` 任意・0以上の整数、`isVisible` 任意・boolean）をZodスキーマでバリデーションする
4. If バリデーションエラーが発生した場合, the Chart View Indirect Work Items API shall `errors` 配列にフィールドごとのエラー詳細（pointer, keyword, message, params）を含める

---

### Requirement 8: テスト

**Objective:** As a 開発者, I want CRUD APIの各エンドポイントが正しく動作することを確認したい, so that 品質を担保できる

#### Acceptance Criteria

1. The Chart View Indirect Work Items API shall 各CRUDエンドポイント（一覧取得、単一取得、作成、更新、削除）のユニットテストを提供する
2. The Chart View Indirect Work Items API shall バリデーションエラーケース（必須項目欠落、型不正、範囲外値）のテストを提供する
3. The Chart View Indirect Work Items API shall エラーケース（存在しないチャートビューID、存在しない項目ID、chartViewIdの不一致、重複する間接作業ケース）のテストを提供する
4. The Chart View Indirect Work Items API shall Vitestフレームワークと `app.request()` メソッドを使用してテストを実行する
