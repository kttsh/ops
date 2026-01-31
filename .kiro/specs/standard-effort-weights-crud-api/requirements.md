# Requirements Document

## Introduction

標準工数ウェイト（standard_effort_weights）のCRUD APIを実装する。標準工数ウェイトは、標準工数マスタ（standard_effort_masters）に紐づく子テーブルであり、進捗率ごとの工数配分の重み値を管理する。ファクトテーブルとして物理削除が適用され、親テーブルの削除時にはカスケード削除される。APIは `standard-effort-masters` のサブリソースとして、ネストされたエンドポイント構成で実装する。

**対象テーブル:** `standard_effort_weights`

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| standard_effort_weight_id | INT | NO | IDENTITY(1,1) | 主キー。自動採番 |
| standard_effort_id | INT | NO | - | 外部キー → standard_effort_masters |
| progress_rate | INT | NO | - | 進捗率（0, 5, 10, ... 100） |
| weight | INT | NO | - | 重み（非負整数） |
| created_at | DATETIME2 | NO | GETDATE() | 作成日時 |
| updated_at | DATETIME2 | NO | GETDATE() | 更新日時 |

**ユニーク制約:** `(standard_effort_id, progress_rate)`

**親テーブル:** `standard_effort_masters`（ON DELETE CASCADE）

**テーブル種別:** ファクトテーブル（物理削除・論理削除なし）

---

## Requirements

### Requirement 1: 標準工数ウェイト一覧取得

**Objective:** As a 事業部リーダー, I want 特定の標準工数マスタに紐づくウェイト一覧を取得したい, so that 進捗率ごとの工数配分パターンを確認できる

#### Acceptance Criteria

1. When GET リクエストが `/standard-effort-masters/:standardEffortId/weights` に送信された場合, the Standard Effort Weights API shall 指定された標準工数マスタに紐づくウェイトの一覧を `progress_rate` 昇順で返却する
2. If 指定された `standardEffortId` の標準工数マスタが存在しない場合, the Standard Effort Weights API shall 404 Not Found エラーをRFC 9457 Problem Details形式で返却する
3. If 指定された `standardEffortId` の標準工数マスタが論理削除済みの場合, the Standard Effort Weights API shall 404 Not Found エラーを返却する
4. The Standard Effort Weights API shall ウェイトが0件の場合も空配列で正常レスポンスを返却する

---

### Requirement 2: 標準工数ウェイト一括更新（全置換）

**Objective:** As a 事業部リーダー, I want 標準工数マスタの重みデータを一括で更新したい, so that 工数配分パターン全体を効率的に設定・変更できる

#### Acceptance Criteria

1. When PUT リクエストが `/standard-effort-masters/:standardEffortId/weights` に有効なデータで送信された場合, the Standard Effort Weights API shall 既存のウェイトを全削除し、送信されたデータで全置換して200 OKで返却する
2. The Standard Effort Weights API shall リクエストボディとして `weights` 配列（各要素: `progressRate` 必須・0〜100の整数、`weight` 必須・0以上の整数）を受け付ける
3. If 指定された `standardEffortId` の標準工数マスタが存在しない場合, the Standard Effort Weights API shall 404 Not Found エラーをRFC 9457 Problem Details形式で返却する
4. If 指定された `standardEffortId` の標準工数マスタが論理削除済みの場合, the Standard Effort Weights API shall 404 Not Found エラーを返却する
5. If `weights` 配列内に同一の `progressRate` が重複して含まれる場合, the Standard Effort Weights API shall 422 Validation Error を返却する
6. If リクエストボディのバリデーションに失敗した場合, the Standard Effort Weights API shall 422 Validation Error をRFC 9457形式で返却する（エラー詳細を `errors` 配列に含める）
7. When `weights` 配列が空配列で送信された場合, the Standard Effort Weights API shall 既存のウェイトを全削除し、空の状態で200 OKを返却する

---

### Requirement 3: 標準工数ウェイト個別追加

**Objective:** As a 事業部リーダー, I want 個別の進捗率ポイントのウェイトを追加したい, so that パターンを段階的に構築できる

#### Acceptance Criteria

1. When POST リクエストが `/standard-effort-masters/:standardEffortId/weights` に有効なデータで送信された場合, the Standard Effort Weights API shall 新しいウェイトレコードを作成し、201 Createdで返却する
2. The Standard Effort Weights API shall リクエストボディとして `progressRate`（必須、0〜100の整数）と `weight`（必須、0以上の整数）を受け付ける
3. The Standard Effort Weights API shall レスポンスに `Location` ヘッダ（`/standard-effort-masters/{standardEffortId}/weights/{weightId}`）を含める
4. If 指定された `standardEffortId` の標準工数マスタが存在しない場合, the Standard Effort Weights API shall 404 Not Found エラーをRFC 9457 Problem Details形式で返却する
5. If 同一の `standardEffortId` + `progressRate` の組み合わせが既に存在する場合, the Standard Effort Weights API shall 409 Conflict エラーを返却する
6. If リクエストボディのバリデーションに失敗した場合, the Standard Effort Weights API shall 422 Validation Error をRFC 9457形式で返却する

---

### Requirement 4: 標準工数ウェイト個別更新

**Objective:** As a 事業部リーダー, I want 特定の進捗率ポイントのウェイト値を変更したい, so that 個別の重みを微調整できる

#### Acceptance Criteria

1. When PUT リクエストが `/standard-effort-masters/:standardEffortId/weights/:weightId` に有効なデータで送信された場合, the Standard Effort Weights API shall 指定されたウェイトレコードを更新し、200 OKで返却する
2. The Standard Effort Weights API shall `weight`（必須、0以上の整数）を更新フィールドとして受け付ける
3. If 指定された `standardEffortId` の標準工数マスタが存在しない場合, the Standard Effort Weights API shall 404 Not Found エラーをRFC 9457形式で返却する
4. If 指定された `weightId` のウェイトが存在しない、または指定された `standardEffortId` に属していない場合, the Standard Effort Weights API shall 404 Not Found エラーを返却する
5. If リクエストボディのバリデーションに失敗した場合, the Standard Effort Weights API shall 422 Validation Error をRFC 9457形式で返却する

---

### Requirement 5: 標準工数ウェイト個別削除

**Objective:** As a 事業部リーダー, I want 不要な進捗率ポイントのウェイトを削除したい, so that パターンから不要なデータポイントを除去できる

#### Acceptance Criteria

1. When DELETE リクエストが `/standard-effort-masters/:standardEffortId/weights/:weightId` に送信された場合, the Standard Effort Weights API shall 指定されたウェイトレコードを物理削除し、204 No Contentを返却する
2. If 指定された `standardEffortId` の標準工数マスタが存在しない場合, the Standard Effort Weights API shall 404 Not Found エラーを返却する
3. If 指定された `weightId` のウェイトが存在しない、または指定された `standardEffortId` に属していない場合, the Standard Effort Weights API shall 404 Not Found エラーを返却する

---

### Requirement 6: APIレスポンス形式

**Objective:** As a フロントエンド開発者, I want 統一されたレスポンス形式でデータを受け取りたい, so that クライアント側の実装を簡素化できる

#### Acceptance Criteria

1. The Standard Effort Weights API shall 成功時のレスポンスを `{ data: ... }` 形式で返却する
2. The Standard Effort Weights API shall 一覧取得時に `{ data: [...] }` 形式で返却する（ファクトテーブルのためページネーション不要）
3. The Standard Effort Weights API shall エラー時のレスポンスをRFC 9457 Problem Details形式（Content-Type: `application/problem+json`）で返却する
4. The Standard Effort Weights API shall レスポンスフィールドをcamelCase（`standardEffortWeightId`, `standardEffortId`, `progressRate`, `weight`, `createdAt`, `updatedAt`）で返却する
5. The Standard Effort Weights API shall 日時フィールド（`createdAt`, `updatedAt`）をISO 8601形式の文字列で返却する

---

### Requirement 7: バリデーション

**Objective:** As a システム管理者, I want 不正なデータの登録を防止したい, so that データの整合性を保てる

#### Acceptance Criteria

1. The Standard Effort Weights API shall パスパラメータ `standardEffortId` を正の整数としてバリデーションする
2. The Standard Effort Weights API shall パスパラメータ `weightId` を正の整数としてバリデーションする
3. The Standard Effort Weights API shall 一括更新時のリクエストボディ（`weights` 配列、各要素: `progressRate` 必須・0〜100の整数、`weight` 必須・0以上の整数）をZodスキーマでバリデーションする
4. The Standard Effort Weights API shall 個別追加時のリクエストボディ（`progressRate` 必須・0〜100の整数、`weight` 必須・0以上の整数）をZodスキーマでバリデーションする
5. The Standard Effort Weights API shall 個別更新時のリクエストボディ（`weight` 必須・0以上の整数）をZodスキーマでバリデーションする
6. If バリデーションエラーが発生した場合, the Standard Effort Weights API shall `errors` 配列にフィールドごとのエラー詳細（pointer, keyword, message, params）を含める

---

### Requirement 8: テスト

**Objective:** As a 開発者, I want CRUD APIの各エンドポイントが正しく動作することを確認したい, so that 品質を担保できる

#### Acceptance Criteria

1. The Standard Effort Weights API shall 各CRUDエンドポイント（一覧取得、一括更新、個別追加、個別更新、個別削除）のユニットテストを提供する
2. The Standard Effort Weights API shall バリデーションエラーケース（必須項目欠落、型不正、範囲外値、progressRate重複）のテストを提供する
3. The Standard Effort Weights API shall エラーケース（存在しないstandardEffortId、存在しないweightId、親子不一致、ユニーク制約違反）のテストを提供する
4. The Standard Effort Weights API shall Vitestフレームワークと `app.request()` メソッドを使用してテストを実行する
