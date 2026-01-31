# Requirements Document

## Introduction

本ドキュメントは、月次人員計画データ（monthly_headcount_plan）テーブルに対する CRUD API の要件を定義する。

monthly_headcount_plan は、人員計画ケース（headcount_plan_cases）に紐づく月次人員数データを管理するファクトテーブルである。人員計画ケースごとに、ビジネスユニット別・年月別の人員数（headcount）を記録し、キャパシティ計画における人員供給側の基盤データとなる。

**テーブル分類:** ファクトテーブル（物理削除・deleted_at なし）

monthly_headcount_plan は headcount_plan_cases の子リソースであり、API エンドポイントは `/headcount-plan-cases/:headcountPlanCaseId/monthly-headcount-plans` の階層構造で提供する。

**対象テーブル:** `monthly_headcount_plan`

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| monthly_headcount_plan_id | INT | NO | IDENTITY(1,1) | 主キー。自動採番 |
| headcount_plan_case_id | INT | NO | - | 外部キー → headcount_plan_cases |
| business_unit_code | VARCHAR(20) | NO | - | 外部キー → business_units |
| year_month | CHAR(6) | NO | - | 年月（YYYYMM形式） |
| headcount | INT | NO | - | 人数 |
| created_at | DATETIME2 | NO | GETDATE() | 作成日時 |
| updated_at | DATETIME2 | NO | GETDATE() | 更新日時 |

**ユニーク制約:** (headcount_plan_case_id, business_unit_code, year_month) — 同一ケース・同一BU内で年月の重複不可
**外部キー:**
- FK_monthly_headcount_plan_case → headcount_plan_cases(headcount_plan_case_id) ON DELETE CASCADE
- FK_monthly_headcount_plan_bu → business_units(business_unit_code)

---

## Requirements

### Requirement 1: 月次人員計画データ一覧取得

**Objective:** As a 事業部リーダー, I want 特定の人員計画ケースに紐づく月次人員計画データ一覧を取得したい, so that ケースの人員配分を確認できる

#### Acceptance Criteria

1. When GET リクエストが `/headcount-plan-cases/:headcountPlanCaseId/monthly-headcount-plans` に送信された場合, the Monthly Headcount Plan API shall 指定された headcountPlanCaseId に紐づく人員計画データ一覧を返却する
2. The Monthly Headcount Plan API shall レスポンスを `{ data: [...] }` 形式で返却する
3. The Monthly Headcount Plan API shall 一覧を `business_unit_code` 昇順、`year_month` 昇順でソートして返却する
4. If 指定された headcountPlanCaseId に該当する人員計画ケースが存在しないか、論理削除済みの場合, the Monthly Headcount Plan API shall 404 Not Found を RFC 9457 Problem Details 形式で返却する
5. Where クエリパラメータ `businessUnitCode` が指定された場合, the Monthly Headcount Plan API shall 該当するビジネスユニットコードでフィルタリングした結果を返却する

---

### Requirement 2: 月次人員計画データ単一取得

**Objective:** As a 事業部リーダー, I want 特定の月次人員計画データの詳細を取得したい, so that 個別の月次人員数を確認できる

#### Acceptance Criteria

1. When GET リクエストが `/headcount-plan-cases/:headcountPlanCaseId/monthly-headcount-plans/:monthlyHeadcountPlanId` に送信された場合, the Monthly Headcount Plan API shall 指定された人員計画データの詳細を `{ data: {...} }` 形式で返却する
2. If 指定された monthlyHeadcountPlanId に該当する人員計画データが存在しない場合, the Monthly Headcount Plan API shall 404 Not Found を RFC 9457 Problem Details 形式で返却する
3. If 指定された monthlyHeadcountPlanId の headcount_plan_case_id が URL の headcountPlanCaseId と一致しない場合, the Monthly Headcount Plan API shall 404 Not Found を返却する

---

### Requirement 3: 月次人員計画データ新規作成

**Objective:** As a 事業部リーダー, I want 人員計画ケースに月次人員計画データを登録したい, so that 人員計画を入力できる

#### Acceptance Criteria

1. When POST リクエストが `/headcount-plan-cases/:headcountPlanCaseId/monthly-headcount-plans` に有効なリクエストボディで送信された場合, the Monthly Headcount Plan API shall 新しい人員計画データを作成し、201 Created と作成されたリソースを返却する
2. The Monthly Headcount Plan API shall レスポンスヘッダに `Location` として作成されたリソースの URL を含める
3. The Monthly Headcount Plan API shall リクエストボディを Zod スキーマでバリデーションする（businessUnitCode: 必須・VARCHAR(20)、yearMonth: 必須・YYYYMM形式6桁、headcount: 必須・INT・0以上）
4. If バリデーションに失敗した場合, the Monthly Headcount Plan API shall 422 Unprocessable Entity を RFC 9457 形式で返却する
5. If 指定された headcountPlanCaseId に該当する人員計画ケースが存在しないか、論理削除済みの場合, the Monthly Headcount Plan API shall 404 Not Found を返却する
6. If 指定された businessUnitCode に該当するビジネスユニットが存在しないか、論理削除済みの場合, the Monthly Headcount Plan API shall 404 Not Found を返却する
7. If 同一 headcountPlanCaseId かつ同一 businessUnitCode かつ同一 yearMonth のレコードが既に存在する場合, the Monthly Headcount Plan API shall 409 Conflict を RFC 9457 形式で返却する

---

### Requirement 4: 月次人員計画データ更新

**Objective:** As a 事業部リーダー, I want 既存の月次人員計画データの人員数を更新したい, so that 計画変更を反映できる

#### Acceptance Criteria

1. When PUT リクエストが `/headcount-plan-cases/:headcountPlanCaseId/monthly-headcount-plans/:monthlyHeadcountPlanId` に有効なリクエストボディで送信された場合, the Monthly Headcount Plan API shall 人員計画データを更新し、200 OK と更新されたリソースを返却する
2. The Monthly Headcount Plan API shall リクエストボディを Zod スキーマでバリデーションする（businessUnitCode: 任意・VARCHAR(20)、yearMonth: 任意・YYYYMM形式6桁、headcount: 任意・INT・0以上）
3. If 指定された monthlyHeadcountPlanId に該当する人員計画データが存在しない場合, the Monthly Headcount Plan API shall 404 Not Found を返却する
4. If バリデーションに失敗した場合, the Monthly Headcount Plan API shall 422 Unprocessable Entity を返却する
5. The Monthly Headcount Plan API shall 更新時に `updated_at` を現在日時に更新する
6. If businessUnitCode または yearMonth を変更した結果、同一 headcountPlanCaseId 内で (businessUnitCode, yearMonth) が重複する場合, the Monthly Headcount Plan API shall 409 Conflict を返却する
7. If 変更後の businessUnitCode に該当するビジネスユニットが存在しないか、論理削除済みの場合, the Monthly Headcount Plan API shall 404 Not Found を返却する

---

### Requirement 5: 月次人員計画データ物理削除

**Objective:** As a 事業部リーダー, I want 不要な月次人員計画データを削除したい, so that 計画から除外できる

#### Acceptance Criteria

1. When DELETE リクエストが `/headcount-plan-cases/:headcountPlanCaseId/monthly-headcount-plans/:monthlyHeadcountPlanId` に送信された場合, the Monthly Headcount Plan API shall 人員計画データを物理削除し、204 No Content を返却する
2. If 指定された monthlyHeadcountPlanId に該当する人員計画データが存在しない場合, the Monthly Headcount Plan API shall 404 Not Found を返却する
3. If 指定された monthlyHeadcountPlanId の headcount_plan_case_id が URL の headcountPlanCaseId と一致しない場合, the Monthly Headcount Plan API shall 404 Not Found を返却する

---

### Requirement 6: 月次人員計画データ一括登録・更新（バルクUpsert）

**Objective:** As a 事業部リーダー, I want 人員計画ケースの月次人員計画データを一括で登録・更新したい, so that 複数月・複数BUの人員計画をまとめて入力できる

#### Acceptance Criteria

1. When PUT リクエストが `/headcount-plan-cases/:headcountPlanCaseId/monthly-headcount-plans/bulk` に有効なリクエストボディで送信された場合, the Monthly Headcount Plan API shall 配列内の各人員計画データを一括で登録または更新（Upsert）し、200 OK と処理結果を返却する
2. The Monthly Headcount Plan API shall リクエストボディとして `{ items: [{ businessUnitCode, yearMonth, headcount }, ...] }` 形式の配列を受け付ける
3. The Monthly Headcount Plan API shall 各アイテムを Zod スキーマでバリデーションする（businessUnitCode: 必須・VARCHAR(20)、yearMonth: 必須・YYYYMM形式6桁、headcount: 必須・INT・0以上）
4. The Monthly Headcount Plan API shall 既存レコード（同一 headcountPlanCaseId + businessUnitCode + yearMonth）は更新、存在しないレコードは新規作成する
5. If バリデーションに失敗した場合, the Monthly Headcount Plan API shall 422 Unprocessable Entity を RFC 9457 形式で返却し、いずれのレコードも変更しない
6. If 指定された headcountPlanCaseId に該当する人員計画ケースが存在しないか、論理削除済みの場合, the Monthly Headcount Plan API shall 404 Not Found を返却する
7. If リクエスト配列内に同一 (businessUnitCode, yearMonth) の組み合わせが重複して含まれる場合, the Monthly Headcount Plan API shall 422 Unprocessable Entity を返却する
8. The Monthly Headcount Plan API shall バルク操作をトランザクション内で実行し、一部失敗時は全体をロールバックする
9. If リクエスト配列内の businessUnitCode に該当するビジネスユニットが存在しないか、論理削除済みの場合, the Monthly Headcount Plan API shall 404 Not Found を返却する

---

### Requirement 7: APIレスポンス形式

**Objective:** As a フロントエンド開発者, I want 統一されたレスポンス形式でデータを受け取りたい, so that クライアント側の実装を簡素化できる

#### Acceptance Criteria

1. The Monthly Headcount Plan API shall 成功時のレスポンスを `{ data: ... }` 形式で返却する
2. The Monthly Headcount Plan API shall エラー時のレスポンスを RFC 9457 Problem Details 形式（Content-Type: `application/problem+json`）で返却する
3. The Monthly Headcount Plan API shall レスポンスフィールドを camelCase（`monthlyHeadcountPlanId`, `headcountPlanCaseId`, `businessUnitCode`, `yearMonth`, `headcount`, `createdAt`, `updatedAt`）で返却する
4. The Monthly Headcount Plan API shall 日時フィールド（`createdAt`, `updatedAt`）を ISO 8601 形式の文字列で返却する
5. The Monthly Headcount Plan API shall `headcount` フィールドを整数型で返却する

---

### Requirement 8: バリデーション

**Objective:** As a システム管理者, I want 不正なデータの登録を防止したい, so that データの整合性を保てる

#### Acceptance Criteria

1. The Monthly Headcount Plan API shall パスパラメータ headcountPlanCaseId および monthlyHeadcountPlanId を正の整数として Zod スキーマでバリデーションする
2. If 不正なパスパラメータ（非数値など）が指定された場合, the Monthly Headcount Plan API shall 422 Unprocessable Entity を返却する
3. The Monthly Headcount Plan API shall yearMonth フィールドの形式を YYYYMM（6桁数字、月は01〜12の範囲）としてバリデーションする
4. The Monthly Headcount Plan API shall headcount フィールドを 0 以上の整数としてバリデーションする
5. The Monthly Headcount Plan API shall businessUnitCode フィールドを 1文字以上20文字以下の文字列としてバリデーションする

---

### Requirement 9: テスト

**Objective:** As a 開発者, I want CRUD APIの各エンドポイントが正しく動作することを確認したい, so that 品質を担保できる

#### Acceptance Criteria

1. The Monthly Headcount Plan API shall 各エンドポイント（GET一覧, GET単一, POST, PUT, DELETE, バルクUpsert）に対する正常系テストを持つ
2. The Monthly Headcount Plan API shall エラーケース（404, 409, 422）に対する異常系テストを持つ
3. The Monthly Headcount Plan API shall Vitest + `app.request()` パターンでテストを実装する
4. The Monthly Headcount Plan API shall テストファイルを `src/__tests__/routes/monthlyHeadcountPlans.test.ts` に配置する
