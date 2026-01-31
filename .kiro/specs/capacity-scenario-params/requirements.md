# Requirements Document

## Introduction

キャパシティシナリオに「1人当たり月間労働時間（`hoursPerPerson`）」パラメータを追加し、キャパシティの計算根拠を明確化する。これにより、定時ベース・残業込み等の複数ケースをパラメータとして表現可能にし、人員計画データからキャパシティを自動計算する機能を提供する。

### 背景

現在のデータモデルでは、`monthly_capacity` テーブルに計算済みのキャパシティ値が直接格納されており、計算根拠（人員数・労働時間）が追跡できない。シナリオごとに「1人当たり労働時間」をパラメータとして保持することで、計算の透明性確保・what-if 分析・人員計画変更時の自動再計算を実現する。

### 参照仕様

- `docs/requirements/capacity-scenario-params-spec.md`

## Requirements

### Requirement 1: キャパシティシナリオへの hoursPerPerson パラメータ追加

**Objective:** As a 事業部リーダー, I want キャパシティシナリオに1人当たり月間労働時間を設定できること, so that シナリオの計算前提（定時/残業込み等）を明確に管理できる

#### Acceptance Criteria

1. The Capacity Scenarios API shall `capacity_scenarios` エンティティに `hoursPerPerson`（1人当たり月間労働時間）フィールドを保持する
2. The Capacity Scenarios API shall `hoursPerPerson` のデフォルト値を `160.00` とする
3. When `hoursPerPerson` が指定されない POST リクエストを受信した場合, the Capacity Scenarios API shall デフォルト値 `160.00` を適用してシナリオを作成する
4. If `hoursPerPerson` が 0 以下または 744 を超える値で指定された場合, the Capacity Scenarios API shall バリデーションエラーを返却する
5. The Capacity Scenarios API shall `hoursPerPerson` を `DECIMAL(10,2)` 相当の精度で管理する

### Requirement 2: キャパシティシナリオ CRUD API の拡張

**Objective:** As a システム利用者, I want キャパシティシナリオの作成・取得・更新・削除時に hoursPerPerson を操作できること, so that 既存のシナリオ管理ワークフローの中で労働時間パラメータを扱える

#### Acceptance Criteria

1. When GET `/capacity-scenarios` リクエストを受信した場合, the Capacity Scenarios API shall 各シナリオの `hoursPerPerson` をレスポンスに含める
2. When GET `/capacity-scenarios/:id` リクエストを受信した場合, the Capacity Scenarios API shall 該当シナリオの `hoursPerPerson` をレスポンスに含める
3. When POST `/capacity-scenarios` リクエストに `hoursPerPerson` が含まれる場合, the Capacity Scenarios API shall 指定された値でシナリオを作成する
4. When PUT `/capacity-scenarios/:id` リクエストに `hoursPerPerson` が含まれる場合, the Capacity Scenarios API shall 該当シナリオの `hoursPerPerson` を更新する
5. When PUT `/capacity-scenarios/:id` リクエストに `hoursPerPerson` が含まれない場合, the Capacity Scenarios API shall 既存の `hoursPerPerson` 値を維持する
6. The Capacity Scenarios API shall `hoursPerPerson` を含まない既存クライアントからのリクエストを正常に処理する（後方互換性）

### Requirement 3: キャパシティ自動計算エンドポイント

**Objective:** As a 事業部リーダー, I want 人員計画データとシナリオの労働時間パラメータからキャパシティを自動計算できること, so that 人員変更時の手動再計算が不要になり、what-if 分析が可能になる

#### Acceptance Criteria

1. When POST `/capacity-scenarios/:capacityScenarioId/actions/calculate` リクエストを受信した場合, the Capacity Scenarios API shall 指定された人員計画ケースの人員数とシナリオの `hoursPerPerson` を乗算し、`monthly_capacity` を一括生成する
2. The Capacity Scenarios API shall 計算式 `capacity = headcount × hoursPerPerson` を使用する
3. When リクエストに `businessUnitCodes` が指定された場合, the Capacity Scenarios API shall 指定された事業部のみを計算対象とする
4. When リクエストに `businessUnitCodes` が省略された場合, the Capacity Scenarios API shall 全事業部を計算対象とする
5. When リクエストに `yearMonthFrom` / `yearMonthTo` が指定された場合, the Capacity Scenarios API shall 指定範囲の年月のみを計算対象とする
6. When リクエストに `yearMonthFrom` / `yearMonthTo` が省略された場合, the Capacity Scenarios API shall 人員計画データの最小〜最大年月を計算対象とする
7. The Capacity Scenarios API shall 計算結果を `monthly_capacity` に MERGE（upsert）で格納する
8. The Capacity Scenarios API shall 生成/更新された件数（`calculated`）、使用した `hoursPerPerson`、および各アイテムの詳細をレスポンスに含める

### Requirement 4: 自動計算エンドポイントのエラーハンドリング

**Objective:** As a システム利用者, I want 不正なリクエストに対して明確なエラーメッセージを受け取れること, so that 問題の原因を迅速に特定し修正できる

#### Acceptance Criteria

1. If 指定された `capacityScenarioId` に対応するシナリオが存在しない場合, the Capacity Scenarios API shall HTTP 404 ステータスと `not-found` タイプのエラーレスポンスを返却する
2. If 指定された `headcountPlanCaseId` に対応する人員計画ケースが存在しない場合, the Capacity Scenarios API shall HTTP 404 ステータスと `not-found` タイプのエラーレスポンスを返却する
3. If 指定された `businessUnitCodes` に人員計画データが存在しない場合, the Capacity Scenarios API shall HTTP 422 ステータスと `validation-error` タイプのエラーレスポンスを返却する
4. The Capacity Scenarios API shall エラーレスポンスを RFC 9457 Problem Details 形式で返却する

### Requirement 5: 手動入力との共存

**Objective:** As a システム利用者, I want 自動計算後も monthly_capacity の手動入力・個別修正が可能であること, so that 特定月の例外的な値調整など、既存の運用フローを維持できる

#### Acceptance Criteria

1. The Capacity Scenarios API shall 既存の `monthly_capacity` 手動入力（直接 CRUD）機能を引き続きサポートする
2. When 自動計算と手動入力が同一データに対して競合する場合, the Capacity Scenarios API shall 後から実行された操作を優先する
3. The Capacity Scenarios API shall 自動計算は明示的な操作（`POST /actions/calculate`）としてのみ実行し、シナリオの更新時に自動的にキャパシティを再計算しない

### Requirement 6: 既存データのマイグレーション

**Objective:** As a システム管理者, I want 既存のキャパシティシナリオに適切な hoursPerPerson が設定されること, so that マイグレーション後にデータの整合性が保たれる

#### Acceptance Criteria

1. The システム shall 既存の「標準シナリオ」に `hoursPerPerson = 128.00` を設定する（定時160h × 稼働率80%）
2. The システム shall 既存の「楽観シナリオ」に `hoursPerPerson = 162.00` を設定する（残業込み180h × 稼働率90%）
3. The システム shall マイグレーション時にデフォルト値 `160.00` を未設定の既存シナリオに適用する

