# Requirements Document

## Introduction

本ドキュメントは、月次キャパシティデータ（monthly_capacity）テーブルに対する CRUD API の要件を定義する。

monthly_capacity は、キャパシティシナリオ（capacity_scenarios）に紐づく月次キャパシティデータを管理するファクトテーブルである。シナリオごと・事業部ごとの年月別キャパシティ（人時）を記録し、積み上げチャートでの供給キャパシティ可視化の基盤データとなる。

**テーブル分類:** ファクトテーブル（物理削除・deleted_at なし）

monthly_capacity は capacity_scenarios の子リソースであり、API エンドポイントは `/capacity-scenarios/:capacityScenarioId/monthly-capacities` の階層構造で提供する。

**対象テーブル:** `monthly_capacity`

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| monthly_capacity_id | INT | NO | IDENTITY(1,1) | 主キー。自動採番 |
| capacity_scenario_id | INT | NO | - | 外部キー → capacity_scenarios |
| business_unit_code | VARCHAR(20) | NO | - | 外部キー → business_units |
| year_month | CHAR(6) | NO | - | 年月（YYYYMM形式） |
| capacity | DECIMAL(10,2) | NO | - | キャパシティ（人時） |
| created_at | DATETIME2 | NO | GETDATE() | 作成日時 |
| updated_at | DATETIME2 | NO | GETDATE() | 更新日時 |

**ユニーク制約:** (capacity_scenario_id, business_unit_code, year_month) — 同一シナリオ・同一事業部内で年月の重複不可
**外部キー:**
- FK_monthly_capacity_scenario → capacity_scenarios(capacity_scenario_id) ON DELETE CASCADE
- FK_monthly_capacity_bu → business_units(business_unit_code)

---

## Requirements

### Requirement 1: 月次キャパシティデータ一覧取得

**Objective:** As a 事業部リーダー, I want 特定のキャパシティシナリオに紐づく月次キャパシティデータ一覧を取得したい, so that シナリオごとのキャパシティ配分を確認できる

#### Acceptance Criteria

1. When GET リクエストが `/capacity-scenarios/:capacityScenarioId/monthly-capacities` に送信された場合, the Monthly Capacity API shall 指定された capacityScenarioId に紐づくキャパシティデータ一覧を返却する
2. The Monthly Capacity API shall レスポンスを `{ data: [...] }` 形式で返却する
3. The Monthly Capacity API shall 一覧を `business_unit_code` 昇順、`year_month` 昇順でソートして返却する
4. If 指定された capacityScenarioId に該当するキャパシティシナリオが存在しないか、論理削除済みの場合, the Monthly Capacity API shall 404 Not Found を RFC 9457 Problem Details 形式で返却する

---

### Requirement 2: 月次キャパシティデータ単一取得

**Objective:** As a 事業部リーダー, I want 特定の月次キャパシティデータの詳細を取得したい, so that 個別の月次キャパシティを確認できる

#### Acceptance Criteria

1. When GET リクエストが `/capacity-scenarios/:capacityScenarioId/monthly-capacities/:monthlyCapacityId` に送信された場合, the Monthly Capacity API shall 指定されたキャパシティデータの詳細を `{ data: {...} }` 形式で返却する
2. If 指定された monthlyCapacityId に該当するキャパシティデータが存在しない場合, the Monthly Capacity API shall 404 Not Found を RFC 9457 Problem Details 形式で返却する
3. If 指定された monthlyCapacityId の capacity_scenario_id が URL の capacityScenarioId と一致しない場合, the Monthly Capacity API shall 404 Not Found を返却する

---

### Requirement 3: 月次キャパシティデータ新規作成

**Objective:** As a 事業部リーダー, I want キャパシティシナリオに月次キャパシティデータを登録したい, so that キャパシティ計画を入力できる

#### Acceptance Criteria

1. When POST リクエストが `/capacity-scenarios/:capacityScenarioId/monthly-capacities` に有効なリクエストボディで送信された場合, the Monthly Capacity API shall 新しいキャパシティデータを作成し、201 Created と作成されたリソースを返却する
2. The Monthly Capacity API shall レスポンスヘッダに `Location` として作成されたリソースの URL を含める
3. The Monthly Capacity API shall リクエストボディを Zod スキーマでバリデーションする（businessUnitCode: 必須・文字列・最大20文字、yearMonth: 必須・YYYYMM形式6桁、capacity: 必須・DECIMAL(10,2)・0以上）
4. If バリデーションに失敗した場合, the Monthly Capacity API shall 422 Unprocessable Entity を RFC 9457 形式で返却する
5. If 指定された capacityScenarioId に該当するキャパシティシナリオが存在しないか、論理削除済みの場合, the Monthly Capacity API shall 404 Not Found を返却する
6. If 指定された businessUnitCode に該当する事業部が存在しないか、論理削除済みの場合, the Monthly Capacity API shall 422 Unprocessable Entity を返却する
7. If 同一 capacityScenarioId かつ同一 businessUnitCode かつ同一 yearMonth のレコードが既に存在する場合, the Monthly Capacity API shall 409 Conflict を RFC 9457 形式で返却する

---

### Requirement 4: 月次キャパシティデータ更新

**Objective:** As a 事業部リーダー, I want 既存の月次キャパシティデータを更新したい, so that 計画変更を反映できる

#### Acceptance Criteria

1. When PUT リクエストが `/capacity-scenarios/:capacityScenarioId/monthly-capacities/:monthlyCapacityId` に有効なリクエストボディで送信された場合, the Monthly Capacity API shall キャパシティデータを更新し、200 OK と更新されたリソースを返却する
2. The Monthly Capacity API shall リクエストボディを Zod スキーマでバリデーションする（businessUnitCode: 任意・文字列・最大20文字、yearMonth: 任意・YYYYMM形式6桁、capacity: 任意・DECIMAL(10,2)・0以上）
3. If 指定された monthlyCapacityId に該当するキャパシティデータが存在しない場合, the Monthly Capacity API shall 404 Not Found を返却する
4. If バリデーションに失敗した場合, the Monthly Capacity API shall 422 Unprocessable Entity を返却する
5. The Monthly Capacity API shall 更新時に `updated_at` を現在日時に更新する
6. If businessUnitCode, yearMonth を変更した結果、同一 capacityScenarioId 内で事業部・年月の組み合わせが重複する場合, the Monthly Capacity API shall 409 Conflict を返却する
7. If 変更後の businessUnitCode に該当する事業部が存在しないか、論理削除済みの場合, the Monthly Capacity API shall 422 Unprocessable Entity を返却する

---

### Requirement 5: 月次キャパシティデータ物理削除

**Objective:** As a 事業部リーダー, I want 不要な月次キャパシティデータを削除したい, so that 計画から除外できる

#### Acceptance Criteria

1. When DELETE リクエストが `/capacity-scenarios/:capacityScenarioId/monthly-capacities/:monthlyCapacityId` に送信された場合, the Monthly Capacity API shall キャパシティデータを物理削除し、204 No Content を返却する
2. If 指定された monthlyCapacityId に該当するキャパシティデータが存在しない場合, the Monthly Capacity API shall 404 Not Found を返却する
3. If 指定された monthlyCapacityId の capacity_scenario_id が URL の capacityScenarioId と一致しない場合, the Monthly Capacity API shall 404 Not Found を返却する

---

### Requirement 6: 月次キャパシティデータ一括登録・更新（バルクUpsert）

**Objective:** As a 事業部リーダー, I want キャパシティシナリオの月次キャパシティデータを一括で登録・更新したい, so that 複数月・複数事業部のキャパシティ計画をまとめて入力できる

#### Acceptance Criteria

1. When PUT リクエストが `/capacity-scenarios/:capacityScenarioId/monthly-capacities/bulk` に有効なリクエストボディで送信された場合, the Monthly Capacity API shall 配列内の各キャパシティデータを一括で登録または更新（Upsert）し、200 OK と処理結果を返却する
2. The Monthly Capacity API shall リクエストボディとして `{ items: [{ businessUnitCode, yearMonth, capacity }, ...] }` 形式の配列を受け付ける
3. The Monthly Capacity API shall 各アイテムを Zod スキーマでバリデーションする（businessUnitCode: 必須・文字列・最大20文字、yearMonth: 必須・YYYYMM形式6桁、capacity: 必須・DECIMAL(10,2)・0以上）
4. The Monthly Capacity API shall 既存レコード（同一 capacityScenarioId + businessUnitCode + yearMonth）は更新、存在しないレコードは新規作成する
5. If バリデーションに失敗した場合, the Monthly Capacity API shall 422 Unprocessable Entity を RFC 9457 形式で返却し、いずれのレコードも変更しない
6. If 指定された capacityScenarioId に該当するキャパシティシナリオが存在しないか、論理削除済みの場合, the Monthly Capacity API shall 404 Not Found を返却する
7. If リクエスト配列内に同一 businessUnitCode + yearMonth の組み合わせが重複して含まれる場合, the Monthly Capacity API shall 422 Unprocessable Entity を返却する
8. The Monthly Capacity API shall バルク操作をトランザクション内で実行し、一部失敗時は全体をロールバックする
9. If いずれかの businessUnitCode に該当する事業部が存在しないか、論理削除済みの場合, the Monthly Capacity API shall 422 Unprocessable Entity を返却し、いずれのレコードも変更しない

---

### Requirement 7: APIレスポンス形式

**Objective:** As a フロントエンド開発者, I want 統一されたレスポンス形式でデータを受け取りたい, so that クライアント側の実装を簡素化できる

#### Acceptance Criteria

1. The Monthly Capacity API shall 成功時のレスポンスを `{ data: ... }` 形式で返却する
2. The Monthly Capacity API shall エラー時のレスポンスを RFC 9457 Problem Details 形式（Content-Type: `application/problem+json`）で返却する
3. The Monthly Capacity API shall レスポンスフィールドを camelCase（`monthlyCapacityId`, `capacityScenarioId`, `businessUnitCode`, `yearMonth`, `capacity`, `createdAt`, `updatedAt`）で返却する
4. The Monthly Capacity API shall 日時フィールド（`createdAt`, `updatedAt`）を ISO 8601 形式の文字列で返却する
5. The Monthly Capacity API shall `capacity` フィールドを数値型（小数点以下2桁）で返却する

---

### Requirement 8: バリデーション

**Objective:** As a システム管理者, I want 不正なデータの登録を防止したい, so that データの整合性を保てる

#### Acceptance Criteria

1. The Monthly Capacity API shall パスパラメータ capacityScenarioId および monthlyCapacityId を正の整数として Zod スキーマでバリデーションする
2. If 不正なパスパラメータ（非数値など）が指定された場合, the Monthly Capacity API shall 422 Unprocessable Entity を返却する
3. The Monthly Capacity API shall yearMonth フィールドの形式を YYYYMM（6桁数字、月は01〜12の範囲）としてバリデーションする
4. The Monthly Capacity API shall capacity フィールドを 0 以上 99999999.99 以下の数値としてバリデーションする
5. The Monthly Capacity API shall businessUnitCode フィールドを 1文字以上20文字以下の文字列としてバリデーションする

---

### Requirement 9: テスト

**Objective:** As a 開発者, I want CRUD APIの各エンドポイントが正しく動作することを確認したい, so that 品質を担保できる

#### Acceptance Criteria

1. The Monthly Capacity API shall 各エンドポイント（GET一覧, GET単一, POST, PUT, DELETE, バルクUpsert）に対する正常系テストを持つ
2. The Monthly Capacity API shall エラーケース（404, 409, 422）に対する異常系テストを持つ
3. The Monthly Capacity API shall Vitest + `app.request()` パターンでテストを実装する
4. The Monthly Capacity API shall テストファイルを `src/__tests__/routes/monthlyCapacities.test.ts` に配置する
