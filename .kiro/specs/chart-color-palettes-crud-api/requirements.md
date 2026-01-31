# Requirements Document

## Introduction

チャートカラーパレット（chart_color_palettes）のCRUD APIを実装する。チャートカラーパレットは、積み上げチャートで使用する色の定義を管理する設定テーブルである。各レコードはパレット名、カラーコード、表示順序を持ち、チャート描画時に利用可能な色の選択肢を提供する。設定テーブルとして物理削除が適用され、論理削除（`deleted_at`）は使用しない。

**対象テーブル:** `chart_color_palettes`

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| chart_color_palette_id | INT | NO | IDENTITY(1,1) | 主キー。自動採番 |
| name | NVARCHAR(100) | NO | - | パレット名 |
| color_code | VARCHAR(7) | NO | - | カラーコード（例: #FF5733） |
| display_order | INT | NO | 0 | 表示順序 |
| created_at | DATETIME2 | NO | GETDATE() | 作成日時 |
| updated_at | DATETIME2 | NO | GETDATE() | 更新日時 |

**テーブル種別:** 設定テーブル（物理削除・論理削除なし）

---

## Requirements

### Requirement 1: カラーパレット一覧取得

**Objective:** As a フロントエンド開発者, I want チャートで利用可能なカラーパレットの一覧を取得したい, so that チャート描画時に色の選択肢を表示できる

#### Acceptance Criteria

1. When GET リクエストが `/chart-color-palettes` に送信された場合, the Chart Color Palettes API shall カラーパレットの一覧を `display_order` 昇順で返却する
2. The Chart Color Palettes API shall パレットが0件の場合も空配列で正常レスポンスを返却する

---

### Requirement 2: カラーパレット個別取得

**Objective:** As a フロントエンド開発者, I want 特定のカラーパレットの詳細情報を取得したい, so that 個別のパレット情報を画面に表示できる

#### Acceptance Criteria

1. When GET リクエストが `/chart-color-palettes/:paletteId` に送信された場合, the Chart Color Palettes API shall 指定されたカラーパレットの詳細情報を返却する
2. If 指定された `paletteId` のカラーパレットが存在しない場合, the Chart Color Palettes API shall 404 Not Found エラーをRFC 9457 Problem Details形式で返却する

---

### Requirement 3: カラーパレット作成

**Objective:** As a システム管理者, I want 新しいカラーパレットを登録したい, so that チャートで使用可能な色の選択肢を追加できる

#### Acceptance Criteria

1. When POST リクエストが `/chart-color-palettes` に有効なデータで送信された場合, the Chart Color Palettes API shall 新しいカラーパレットレコードを作成し、201 Createdで返却する
2. The Chart Color Palettes API shall リクエストボディとして `name`（必須、1〜100文字）、`colorCode`（必須、`#` + 6桁の16進数）、`displayOrder`（任意、整数、デフォルト0）を受け付ける
3. The Chart Color Palettes API shall レスポンスに `Location` ヘッダ（`/chart-color-palettes/{paletteId}`）を含める
4. If リクエストボディのバリデーションに失敗した場合, the Chart Color Palettes API shall 422 Validation Error をRFC 9457形式で返却する

---

### Requirement 4: カラーパレット更新

**Objective:** As a システム管理者, I want 既存のカラーパレットの情報を変更したい, so that パレット名や色、表示順序を修正できる

#### Acceptance Criteria

1. When PUT リクエストが `/chart-color-palettes/:paletteId` に有効なデータで送信された場合, the Chart Color Palettes API shall 指定されたカラーパレットレコードを更新し、200 OKで返却する
2. The Chart Color Palettes API shall リクエストボディとして `name`（必須、1〜100文字）、`colorCode`（必須、`#` + 6桁の16進数）、`displayOrder`（任意、整数）を受け付ける
3. If 指定された `paletteId` のカラーパレットが存在しない場合, the Chart Color Palettes API shall 404 Not Found エラーをRFC 9457 Problem Details形式で返却する
4. If リクエストボディのバリデーションに失敗した場合, the Chart Color Palettes API shall 422 Validation Error をRFC 9457形式で返却する

---

### Requirement 5: カラーパレット削除

**Objective:** As a システム管理者, I want 不要なカラーパレットを削除したい, so that 使わない色の選択肢を除去できる

#### Acceptance Criteria

1. When DELETE リクエストが `/chart-color-palettes/:paletteId` に送信された場合, the Chart Color Palettes API shall 指定されたカラーパレットレコードを物理削除し、204 No Contentを返却する
2. If 指定された `paletteId` のカラーパレットが存在しない場合, the Chart Color Palettes API shall 404 Not Found エラーをRFC 9457 Problem Details形式で返却する

---

### Requirement 6: APIレスポンス形式

**Objective:** As a フロントエンド開発者, I want 統一されたレスポンス形式でデータを受け取りたい, so that クライアント側の実装を簡素化できる

#### Acceptance Criteria

1. The Chart Color Palettes API shall 成功時のレスポンスを `{ data: ... }` 形式で返却する
2. The Chart Color Palettes API shall 一覧取得時に `{ data: [...] }` 形式で返却する（設定テーブルのためページネーション不要）
3. The Chart Color Palettes API shall エラー時のレスポンスをRFC 9457 Problem Details形式（Content-Type: `application/problem+json`）で返却する
4. The Chart Color Palettes API shall レスポンスフィールドをcamelCase（`chartColorPaletteId`, `name`, `colorCode`, `displayOrder`, `createdAt`, `updatedAt`）で返却する
5. The Chart Color Palettes API shall 日時フィールド（`createdAt`, `updatedAt`）をISO 8601形式の文字列で返却する

---

### Requirement 7: バリデーション

**Objective:** As a システム管理者, I want 不正なデータの登録を防止したい, so that データの整合性を保てる

#### Acceptance Criteria

1. The Chart Color Palettes API shall パスパラメータ `paletteId` を正の整数としてバリデーションする
2. The Chart Color Palettes API shall 作成・更新時のリクエストボディ（`name` 必須・1〜100文字、`colorCode` 必須・`#` + 6桁16進数形式、`displayOrder` 任意・整数）をZodスキーマでバリデーションする
3. If バリデーションエラーが発生した場合, the Chart Color Palettes API shall `errors` 配列にフィールドごとのエラー詳細（pointer, keyword, message, params）を含める

---

### Requirement 8: テスト

**Objective:** As a 開発者, I want CRUD APIの各エンドポイントが正しく動作することを確認したい, so that 品質を担保できる

#### Acceptance Criteria

1. The Chart Color Palettes API shall 各CRUDエンドポイント（一覧取得、個別取得、作成、更新、削除）のユニットテストを提供する
2. The Chart Color Palettes API shall バリデーションエラーケース（必須項目欠落、型不正、カラーコード形式不正、文字数超過）のテストを提供する
3. The Chart Color Palettes API shall エラーケース（存在しないpaletteId）のテストを提供する
4. The Chart Color Palettes API shall Vitestフレームワークと `app.request()` メソッドを使用してテストを実行する
