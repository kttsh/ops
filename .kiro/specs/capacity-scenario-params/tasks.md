# Implementation Plan

- [x] 1. DB スキーマ変更と既存データ更新
- [x] 1.1 既存テーブル変更用のマイグレーション SQL を作成する
  - `capacity_scenarios` テーブルに `hours_per_person` カラム（DECIMAL(10,2)、NOT NULL、デフォルト 160.00）を追加する ALTER 文を作成する
  - CHECK 制約（0 超 744 以下）を追加する
  - 既存シナリオのシードデータ更新 SQL を含める（標準シナリオ: 128.00、楽観シナリオ: 162.00）
  - マイグレーション SQL ファイルを `docs/database/` 配下に配置する
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 1.2 テーブル定義ドキュメントを更新する
  - `docs/database/create-tables.sql` の `capacity_scenarios` テーブル定義に `hours_per_person` カラム、デフォルト制約、CHECK 制約を追加する
  - _Requirements: 1.1, 1.5_

- [x] 1.3 シードデータドキュメントを更新する
  - `docs/database/seed-data.sql` の `capacity_scenarios` INSERT 文に `hours_per_person` 値を追加する（標準シナリオ: 128.00、楽観シナリオ: 162.00）
  - _Requirements: 6.1, 6.2_

- [x] 2. キャパシティシナリオの型定義・バリデーション拡張
- [x] 2.1 キャパシティシナリオの Zod スキーマと型定義に hoursPerPerson を追加する
  - 作成用スキーマに `hoursPerPerson` を optional（デフォルト 160.00）として追加する
  - 更新用スキーマに `hoursPerPerson` を optional として追加する
  - バリデーションルール: 0 超、744 以下
  - DB 行型に `hours_per_person` を追加する
  - API レスポンス型に `hoursPerPerson` を追加する
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.6_

- [x] 2.2 (P) 自動計算リクエスト用のスキーマと型を定義する
  - `headcountPlanCaseId`（必須、正の整数）のバリデーション
  - `businessUnitCodes`（任意、文字列配列）のバリデーション
  - `yearMonthFrom` / `yearMonthTo`（任意、YYYYMM 形式）のバリデーション
  - 計算結果のレスポンス型（calculated 件数、hoursPerPerson、items 配列）を定義する
  - _Requirements: 3.1, 3.3, 3.5_

- [x] 3. データアクセス層の拡張
- [x] 3.1 キャパシティシナリオのデータアクセス層に hoursPerPerson を追加する
  - 全 SELECT クエリの選択カラムに `hours_per_person` を追加する
  - INSERT クエリに `hours_per_person` を追加する
  - UPDATE クエリの動的 SET 句に `hours_per_person` の条件分岐を追加する
  - _Requirements: 1.1, 1.5, 2.1, 2.2, 2.3, 2.4_

- [x] 3.2 (P) 月別人員計画データの自動計算用クエリメソッドを追加する
  - `headcountPlanCaseId` を必須条件、`businessUnitCodes`（IN 句）と `yearMonthFrom` / `yearMonthTo`（範囲条件）を任意条件とするフィルタリングクエリを実装する
  - 結果を事業部コード・年月の昇順でソートする
  - パラメータ化クエリで SQL インジェクションを防止する
  - _Requirements: 3.3, 3.4, 3.5, 3.6_

- [x] 4. Transform 層の拡張
- [x] 4.1 (P) キャパシティシナリオのレスポンス変換に hoursPerPerson を追加する
  - `hours_per_person`（snake_case）から `hoursPerPerson`（camelCase）へのマッピングを追加する
  - _Requirements: 2.1, 2.2_

- [x] 5. サービス層の拡張と自動計算ロジック実装
- [x] 5.1 キャパシティシナリオサービスの既存 CRUD で hoursPerPerson を処理する
  - create メソッドで hoursPerPerson をデータ層に渡す
  - update メソッドで hoursPerPerson をデータ層に渡す（未指定時は既存値を維持）
  - _Requirements: 2.3, 2.4, 2.5_

- [x] 5.2 キャパシティ自動計算メソッドを実装する
  - シナリオの存在確認を行い、存在しない場合は 404 エラーを返す
  - 人員計画ケースの存在確認を行い、存在しない場合は 404 エラーを返す
  - 指定条件で人員計画データを取得し、データが存在しない場合は 422 エラーを返す
  - 各レコードについて `headcount × hoursPerPerson` でキャパシティを計算する
  - 計算結果を月別キャパシティの一括 upsert で格納する
  - 生成/更新件数、使用した hoursPerPerson、アイテム詳細をレスポンスとして返却する
  - _Requirements: 3.1, 3.2, 3.7, 3.8, 4.1, 4.2, 4.3, 5.2, 5.3_

- [x] 6. ルート層の拡張
- [x] 6.1 自動計算エンドポイントをルートに追加する
  - `POST /:id/actions/calculate` エンドポイントを定義する
  - 自動計算リクエストスキーマによるバリデーションミドルウェアを適用する
  - パスパラメータの数値変換とサービスメソッドの呼び出しを実装する
  - レスポンスを `{ data: result }` 形式で 200 ステータスで返却する
  - _Requirements: 3.1, 4.4_

- [x] 7. テスト
- [x] 7.1 hoursPerPerson のバリデーションテストを作成する
  - 作成用スキーマ: デフォルト値 160.00 の適用、0 以下の拒否、744 超の拒否、境界値（0.01, 744）の受理
  - 更新用スキーマ: optional として省略可、値指定時のバリデーション
  - 自動計算リクエストスキーマ: 必須フィールド、YYYYMM 形式、配列バリデーション
  - _Requirements: 1.2, 1.3, 1.4_

- [x] 7.2 キャパシティシナリオ CRUD API の hoursPerPerson テストを作成する
  - GET 一覧・詳細で hoursPerPerson がレスポンスに含まれることを検証する
  - POST で hoursPerPerson 指定時・未指定時（デフォルト適用）の動作を検証する
  - PUT で hoursPerPerson 更新・省略時の既存値維持を検証する
  - hoursPerPerson を含まないリクエストの後方互換性を検証する
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 7.3 自動計算エンドポイントのテストを作成する
  - 正常系: 人員計画データからキャパシティが正しく計算・格納されること（計算式 `headcount × hoursPerPerson` の検証）
  - フィルタリング: `businessUnitCodes` 指定、`yearMonthFrom` / `yearMonthTo` 指定、全パラメータ省略時の全範囲計算
  - エラー系: シナリオ不在時 404、人員計画ケース不在時 404、対象データ不在時 422
  - レスポンス構造: `calculated` 件数、`hoursPerPerson`、`items` 配列の検証
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 4.1, 4.2, 4.3_
