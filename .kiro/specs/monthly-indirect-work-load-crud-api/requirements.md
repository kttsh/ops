# Requirements Document

## Introduction

本ドキュメントは、月次間接作業負荷データ（monthly_indirect_work_load）テーブルに対する CRUD API の要件を定義する。

monthly_indirect_work_load は、間接作業ケース（indirect_work_cases）に紐づく月次間接作業負荷データを管理するファクトテーブルである。間接作業ケースごと・事業部ごとの年月別工数（manhour）を記録し、積み上げチャートでの間接作業負荷可視化の基盤データとなる。

**テーブル分類:** ファクトテーブル（物理削除・deleted_at なし）

monthly_indirect_work_load は indirect_work_cases の子リソースであり、API エンドポイントは `/indirect-work-cases/:indirectWorkCaseId/monthly-indirect-work-loads` の階層構造で提供する。

**対象テーブル:** `monthly_indirect_work_load`

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| monthly_indirect_work_load_id | INT | NO | IDENTITY(1,1) | 主キー。自動採番 |
| indirect_work_case_id | INT | NO | - | 外部キー → indirect_work_cases |
| business_unit_code | VARCHAR(20) | NO | - | 外部キー → business_units |
| year_month | CHAR(6) | NO | - | 年月（YYYYMM形式） |
| manhour | DECIMAL(10,2) | NO | - | 工数（人時） |
| source | VARCHAR(20) | NO | - | データソース（calculated/manual） |
| created_at | DATETIME2 | NO | GETDATE() | 作成日時 |
| updated_at | DATETIME2 | NO | GETDATE() | 更新日時 |

**ユニーク制約:** (indirect_work_case_id, business_unit_code, year_month) — 同一ケース・同一事業部内で年月の重複不可
**外部キー:**
- FK_monthly_indirect_work_load_case → indirect_work_cases(indirect_work_case_id) ON DELETE CASCADE
- FK_monthly_indirect_work_load_bu → business_units(business_unit_code)

---

## Requirements

### Requirement 1: 月次間接作業負荷データ一覧取得

**Objective:** As a 事業部リーダー, I want 特定の間接作業ケースに紐づく月次間接作業負荷データ一覧を取得したい, so that ケースごとの間接作業負荷配分を確認できる

#### Acceptance Criteria

1. When GET リクエストが `/indirect-work-cases/:indirectWorkCaseId/monthly-indirect-work-loads` に送信された場合, the Monthly Indirect Work Load API shall 指定された indirectWorkCaseId に紐づく間接作業負荷データ一覧を返却する
2. The Monthly Indirect Work Load API shall レスポンスを `{ data: [...] }` 形式で返却する
3. The Monthly Indirect Work Load API shall 一覧を `business_unit_code` 昇順、`year_month` 昇順でソートして返却する
4. If 指定された indirectWorkCaseId に該当する間接作業ケースが存在しないか、論理削除済みの場合, the Monthly Indirect Work Load API shall 404 Not Found を RFC 9457 Problem Details 形式で返却する

---

### Requirement 2: 月次間接作業負荷データ単一取得

**Objective:** As a 事業部リーダー, I want 特定の月次間接作業負荷データの詳細を取得したい, so that 個別の月次間接作業負荷を確認できる

#### Acceptance Criteria

1. When GET リクエストが `/indirect-work-cases/:indirectWorkCaseId/monthly-indirect-work-loads/:monthlyIndirectWorkLoadId` に送信された場合, the Monthly Indirect Work Load API shall 指定された間接作業負荷データの詳細を `{ data: {...} }` 形式で返却する
2. If 指定された monthlyIndirectWorkLoadId に該当する間接作業負荷データが存在しない場合, the Monthly Indirect Work Load API shall 404 Not Found を RFC 9457 Problem Details 形式で返却する
3. If 指定された monthlyIndirectWorkLoadId の indirect_work_case_id が URL の indirectWorkCaseId と一致しない場合, the Monthly Indirect Work Load API shall 404 Not Found を返却する

---

### Requirement 3: 月次間接作業負荷データ新規作成

**Objective:** As a 事業部リーダー, I want 間接作業ケースに月次間接作業負荷データを登録したい, so that 間接作業の工数計画を入力できる

#### Acceptance Criteria

1. When POST リクエストが `/indirect-work-cases/:indirectWorkCaseId/monthly-indirect-work-loads` に有効なリクエストボディで送信された場合, the Monthly Indirect Work Load API shall 新しい間接作業負荷データを作成し、201 Created と作成されたリソースを返却する
2. The Monthly Indirect Work Load API shall レスポンスヘッダに `Location` として作成されたリソースの URL を含める
3. The Monthly Indirect Work Load API shall リクエストボディを Zod スキーマでバリデーションする（businessUnitCode: 必須・文字列・最大20文字、yearMonth: 必須・YYYYMM形式6桁、manhour: 必須・DECIMAL(10,2)・0以上、source: 必須・"calculated" または "manual"）
4. If バリデーションに失敗した場合, the Monthly Indirect Work Load API shall 422 Unprocessable Entity を RFC 9457 形式で返却する
5. If 指定された indirectWorkCaseId に該当する間接作業ケースが存在しないか、論理削除済みの場合, the Monthly Indirect Work Load API shall 404 Not Found を返却する
6. If 指定された businessUnitCode に該当する事業部が存在しないか、論理削除済みの場合, the Monthly Indirect Work Load API shall 422 Unprocessable Entity を返却する
7. If 同一 indirectWorkCaseId かつ同一 businessUnitCode かつ同一 yearMonth のレコードが既に存在する場合, the Monthly Indirect Work Load API shall 409 Conflict を RFC 9457 形式で返却する

---

### Requirement 4: 月次間接作業負荷データ更新

**Objective:** As a 事業部リーダー, I want 既存の月次間接作業負荷データを更新したい, so that 計画変更を反映できる

#### Acceptance Criteria

1. When PUT リクエストが `/indirect-work-cases/:indirectWorkCaseId/monthly-indirect-work-loads/:monthlyIndirectWorkLoadId` に有効なリクエストボディで送信された場合, the Monthly Indirect Work Load API shall 間接作業負荷データを更新し、200 OK と更新されたリソースを返却する
2. The Monthly Indirect Work Load API shall リクエストボディを Zod スキーマでバリデーションする（businessUnitCode: 任意・文字列・最大20文字、yearMonth: 任意・YYYYMM形式6桁、manhour: 任意・DECIMAL(10,2)・0以上、source: 任意・"calculated" または "manual"）
3. If 指定された monthlyIndirectWorkLoadId に該当する間接作業負荷データが存在しない場合, the Monthly Indirect Work Load API shall 404 Not Found を返却する
4. If バリデーションに失敗した場合, the Monthly Indirect Work Load API shall 422 Unprocessable Entity を返却する
5. The Monthly Indirect Work Load API shall 更新時に `updated_at` を現在日時に更新する
6. If businessUnitCode, yearMonth を変更した結果、同一 indirectWorkCaseId 内で事業部・年月の組み合わせが重複する場合, the Monthly Indirect Work Load API shall 409 Conflict を返却する
7. If 変更後の businessUnitCode に該当する事業部が存在しないか、論理削除済みの場合, the Monthly Indirect Work Load API shall 422 Unprocessable Entity を返却する

---

### Requirement 5: 月次間接作業負荷データ物理削除

**Objective:** As a 事業部リーダー, I want 不要な月次間接作業負荷データを削除したい, so that 計画から除外できる

#### Acceptance Criteria

1. When DELETE リクエストが `/indirect-work-cases/:indirectWorkCaseId/monthly-indirect-work-loads/:monthlyIndirectWorkLoadId` に送信された場合, the Monthly Indirect Work Load API shall 間接作業負荷データを物理削除し、204 No Content を返却する
2. If 指定された monthlyIndirectWorkLoadId に該当する間接作業負荷データが存在しない場合, the Monthly Indirect Work Load API shall 404 Not Found を返却する
3. If 指定された monthlyIndirectWorkLoadId の indirect_work_case_id が URL の indirectWorkCaseId と一致しない場合, the Monthly Indirect Work Load API shall 404 Not Found を返却する

---

### Requirement 6: 月次間接作業負荷データ一括登録・更新（バルクUpsert）

**Objective:** As a 事業部リーダー, I want 間接作業ケースの月次間接作業負荷データを一括で登録・更新したい, so that 複数月・複数事業部の間接作業負荷をまとめて入力できる

#### Acceptance Criteria

1. When PUT リクエストが `/indirect-work-cases/:indirectWorkCaseId/monthly-indirect-work-loads/bulk` に有効なリクエストボディで送信された場合, the Monthly Indirect Work Load API shall 配列内の各間接作業負荷データを一括で登録または更新（Upsert）し、200 OK と処理結果を返却する
2. The Monthly Indirect Work Load API shall リクエストボディとして `{ items: [{ businessUnitCode, yearMonth, manhour, source }, ...] }` 形式の配列を受け付ける
3. The Monthly Indirect Work Load API shall 各アイテムを Zod スキーマでバリデーションする（businessUnitCode: 必須・文字列・最大20文字、yearMonth: 必須・YYYYMM形式6桁、manhour: 必須・DECIMAL(10,2)・0以上、source: 必須・"calculated" または "manual"）
4. The Monthly Indirect Work Load API shall 既存レコード（同一 indirectWorkCaseId + businessUnitCode + yearMonth）は更新、存在しないレコードは新規作成する
5. If バリデーションに失敗した場合, the Monthly Indirect Work Load API shall 422 Unprocessable Entity を RFC 9457 形式で返却し、いずれのレコードも変更しない
6. If 指定された indirectWorkCaseId に該当する間接作業ケースが存在しないか、論理削除済みの場合, the Monthly Indirect Work Load API shall 404 Not Found を返却する
7. If リクエスト配列内に同一 businessUnitCode + yearMonth の組み合わせが重複して含まれる場合, the Monthly Indirect Work Load API shall 422 Unprocessable Entity を返却する
8. The Monthly Indirect Work Load API shall バルク操作をトランザクション内で実行し、一部失敗時は全体をロールバックする
9. If いずれかの businessUnitCode に該当する事業部が存在しないか、論理削除済みの場合, the Monthly Indirect Work Load API shall 422 Unprocessable Entity を返却し、いずれのレコードも変更しない

---

### Requirement 7: APIレスポンス形式

**Objective:** As a フロントエンド開発者, I want 統一されたレスポンス形式でデータを受け取りたい, so that クライアント側の実装を簡素化できる

#### Acceptance Criteria

1. The Monthly Indirect Work Load API shall 成功時のレスポンスを `{ data: ... }` 形式で返却する
2. The Monthly Indirect Work Load API shall エラー時のレスポンスを RFC 9457 Problem Details 形式（Content-Type: `application/problem+json`）で返却する
3. The Monthly Indirect Work Load API shall レスポンスフィールドを camelCase（`monthlyIndirectWorkLoadId`, `indirectWorkCaseId`, `businessUnitCode`, `yearMonth`, `manhour`, `source`, `createdAt`, `updatedAt`）で返却する
4. The Monthly Indirect Work Load API shall 日時フィールド（`createdAt`, `updatedAt`）を ISO 8601 形式の文字列で返却する
5. The Monthly Indirect Work Load API shall `manhour` フィールドを数値型（小数点以下2桁）で返却する

---

### Requirement 8: バリデーション

**Objective:** As a システム管理者, I want 不正なデータの登録を防止したい, so that データの整合性を保てる

#### Acceptance Criteria

1. The Monthly Indirect Work Load API shall パスパラメータ indirectWorkCaseId および monthlyIndirectWorkLoadId を正の整数として Zod スキーマでバリデーションする
2. If 不正なパスパラメータ（非数値など）が指定された場合, the Monthly Indirect Work Load API shall 422 Unprocessable Entity を返却する
3. The Monthly Indirect Work Load API shall yearMonth フィールドの形式を YYYYMM（6桁数字、月は01〜12の範囲）としてバリデーションする
4. The Monthly Indirect Work Load API shall manhour フィールドを 0 以上 99999999.99 以下の数値としてバリデーションする
5. The Monthly Indirect Work Load API shall businessUnitCode フィールドを 1文字以上20文字以下の文字列としてバリデーションする
6. The Monthly Indirect Work Load API shall source フィールドを "calculated" または "manual" のいずれかとしてバリデーションする

---

### Requirement 9: テスト

**Objective:** As a 開発者, I want CRUD APIの各エンドポイントが正しく動作することを確認したい, so that 品質を担保できる

#### Acceptance Criteria

1. The Monthly Indirect Work Load API shall 各エンドポイント（GET一覧, GET単一, POST, PUT, DELETE, バルクUpsert）に対する正常系テストを持つ
2. The Monthly Indirect Work Load API shall エラーケース（404, 409, 422）に対する異常系テストを持つ
3. The Monthly Indirect Work Load API shall Vitest + `app.request()` パターンでテストを実装する
4. The Monthly Indirect Work Load API shall テストファイルを `src/__tests__/routes/monthlyIndirectWorkLoads.test.ts` に配置する
