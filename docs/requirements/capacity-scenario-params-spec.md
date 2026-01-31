# キャパシティシナリオ パラメータ拡張 変更仕様書

> **Version**: 1.0.0
> **Last Updated**: 2026-01-31
> **Status**: ドラフト
> **親文書**: dashboard-requirements.md

---

## 1. 背景と課題

### 1.1 ドメイン定義

ドメイン知識整理（`docs/domain/overview.md`）では、キャパシティ（能力）を以下のように定義している。

> **能力 = 人員数 × 1人当たり労働時間**

労働時間のケースは複数存在する：
- 定時ベース（例：128時間/月）
- 残業込みケース（例：162時間/月、200時間/月など）

シナリオごとに異なる「1人当たり労働時間」を設定することで、定時/残業込み等の複数ケースを表現する。

### 1.2 現状のデータモデル

現在、キャパシティは `monthly_capacity` テーブルに**計算済みの値**として直接格納されている。

```
capacity_scenarios
  ├── scenario_name    -- シナリオ名（例：標準シナリオ、楽観シナリオ）
  └── monthly_capacity
        └── capacity   -- キャパシティ（人時）← 計算済みの値を手入力
```

seed data のコメントには計算式の前提が記載されているが、DB上には保持されていない：

```sql
-- 月160時間 × 人数 × 稼働率80% = capacity
-- PLANT 2025年度 (165人 × 160h × 80% = 21,120h)
```

### 1.3 問題点

| # | 問題 | 影響 |
|---|------|------|
| 1 | **計算根拠の不透明性** | `capacity = 21,120` という値だけでは、人数と労働時間のどちらを前提としているか追跡できない |
| 2 | **シナリオ比較の困難** | 「定時 vs 残業込み」の違いが数値の差としてしか表現されず、1人当たり労働時間の前提が不明瞭 |
| 3 | **人員計画変更時の手動再計算** | 人員数が変更された場合、`monthly_capacity` の全データを手動で再計算・再入力する必要がある |
| 4 | **What-if分析の不可** | 「労働時間を128h→150hに変えたら？」といったシミュレーションが不可能 |

---

## 2. 要件

### 2.1 機能要件

| ID | 要件 | 優先度 |
|----|------|:------:|
| CSP-001 | `capacity_scenarios` テーブルに1人当たり月間労働時間（`hours_per_person`）を保持する | 高 |
| CSP-002 | キャパシティシナリオの CRUD API で `hoursPerPerson` を入出力可能にする | 高 |
| CSP-003 | キャパシティの自動計算エンドポイントを提供する（人員計画 × 労働時間 → `monthly_capacity` を一括生成） | 中 |
| CSP-004 | 既存の `monthly_capacity` への直接入力（手動設定）も引き続きサポートする | 高 |

### 2.2 非機能要件

| 項目 | 目標値 |
|------|--------|
| 後方互換性 | 既存APIの `hoursPerPerson` を含まないリクエストが正常動作すること |
| データ整合性 | 自動計算結果と手動入力値の競合時は、後から実行された操作が優先 |

---

## 3. DB スキーマ変更

### 3.1 capacity_scenarios テーブル（変更）

**追加カラム:**

| カラム名 | データ型 | NULL | デフォルト | 説明 |
|---------|---------|------|-----------|------|
| hours_per_person | DECIMAL(10,2) | NO | 160.00 | 1人当たり月間労働時間（時間） |

**DDL:**

```sql
ALTER TABLE capacity_scenarios
  ADD hours_per_person DECIMAL(10, 2) NOT NULL
    CONSTRAINT DF_capacity_scenarios_hours_per_person DEFAULT 160.00;

-- バリデーション制約
ALTER TABLE capacity_scenarios
  ADD CONSTRAINT CK_capacity_scenarios_hours_per_person
    CHECK (hours_per_person > 0 AND hours_per_person <= 744);
    -- 744 = 31日 × 24時間（理論上限）
```

### 3.2 既存シードデータのマイグレーション

既存シナリオに対し、seed data のコメントに基づいてパラメータを設定する。
1人当たり労働時間は、定時時間と稼働率等の前提条件を織り込んだ実効値として設定する：

| scenario_name | hours_per_person | 根拠 |
|---------------|:----------------:|------|
| 標準シナリオ | 128.00 | 定時160h × 稼働率80% = 128h |
| 楽観シナリオ | 162.00 | 残業込み180h × 稼働率90% = 162h |

```sql
UPDATE capacity_scenarios
SET hours_per_person = 128.00
WHERE scenario_name = N'標準シナリオ';

UPDATE capacity_scenarios
SET hours_per_person = 162.00
WHERE scenario_name = N'楽観シナリオ';
```

---

## 4. API 変更

### 4.1 キャパシティシナリオ CRUD（変更）

既存の `capacity-scenarios` エンドポイントに `hoursPerPerson` フィールドを追加する。

#### GET /capacity-scenarios レスポンス（変更後）

```json
{
  "data": [
    {
      "capacityScenarioId": 1,
      "scenarioName": "標準シナリオ",
      "isPrimary": true,
      "description": "通常の稼働率を想定したベースシナリオ",
      "hoursPerPerson": 128.00,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "meta": { "pagination": { "..." : "..." } }
}
```

#### POST /capacity-scenarios リクエストボディ（変更後）

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|:----:|--------------|------|
| `scenarioName` | string | ✅ | 1〜100文字 | シナリオ名 |
| `isPrimary` | boolean | - | デフォルト false | プライマリシナリオフラグ |
| `description` | string \| null | - | 最大500文字 | 説明 |
| `hoursPerPerson` | number | - | 0超〜744以下、デフォルト 160.00 | 1人当たり月間労働時間 |

#### PUT /capacity-scenarios/:id リクエストボディ（変更後）

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|:----:|--------------|------|
| `scenarioName` | string | - | 1〜100文字 | シナリオ名 |
| `isPrimary` | boolean | - | - | プライマリシナリオフラグ |
| `description` | string \| null | - | 最大500文字 | 説明 |
| `hoursPerPerson` | number | - | 0超〜744以下 | 1人当たり月間労働時間 |

### 4.2 キャパシティ自動計算エンドポイント（新規）

人員計画データと `capacity_scenarios.hours_per_person` から `monthly_capacity` を一括生成する。

#### POST /capacity-scenarios/:capacityScenarioId/actions/calculate

**リクエストボディ:**

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|:----:|--------------|------|
| `headcountPlanCaseId` | number | ✅ | 正の整数 | 計算に使用する人員計画ケースID |
| `businessUnitCodes` | string[] | - | 省略時は全BU | 対象BUコードの配列 |
| `yearMonthFrom` | string | - | YYYYMM形式 | 計算開始年月（省略時は人員計画の最小年月） |
| `yearMonthTo` | string | - | YYYYMM形式 | 計算終了年月（省略時は人員計画の最大年月） |

**計算ロジック:**

```
monthly_capacity.capacity =
  monthly_headcount_plan.headcount × capacity_scenarios.hours_per_person
```

**処理フロー:**

1. `capacity_scenarios` から `hours_per_person` を取得
2. `monthly_headcount_plan` から指定条件の人員データを取得
3. 各（BU × 年月）に対して `headcount × hours_per_person` を計算
4. `monthly_capacity` に MERGE（upsert）で格納
5. 生成/更新された `monthly_capacity` の一覧を返却

**レスポンス（200）:**

```json
{
  "data": {
    "calculated": 36,
    "hoursPerPerson": 128.00,
    "items": [
      {
        "monthlyCapacityId": 1,
        "capacityScenarioId": 1,
        "businessUnitCode": "PLANT",
        "yearMonth": "202504",
        "capacity": 21120.00
      }
    ]
  }
}
```

**エラーケース:**

| 条件 | ステータス | type |
|------|:----------:|------|
| キャパシティシナリオが存在しない | 404 | `not-found` |
| 人員計画ケースが存在しない | 404 | `not-found` |
| 指定BUに人員計画データがない | 422 | `validation-error` |

---

## 5. 計算例

### 5.1 標準シナリオ（定時ベース）

| パラメータ | 値 |
|-----------|-----|
| hours_per_person | 128.00 |

| BU | 年月 | headcount | capacity |
|----|------|:---------:|:--------:|
| PLANT | 202504 | 165 | 165 × 128 = **21,120.00** |
| PLANT | 202604 | 175 | 175 × 128 = **22,400.00** |

### 5.2 楽観シナリオ（残業込み）

| パラメータ | 値 |
|-----------|-----|
| hours_per_person | 162.00 |

| BU | 年月 | headcount | capacity |
|----|------|:---------:|:--------:|
| PLANT | 202504 | 165 | 165 × 162 = **26,730.00** |
| PLANT | 202604 | 175 | 175 × 162 = **28,350.00** |

---

## 6. 影響範囲

### 6.1 バックエンド

| 対象 | 変更内容 |
|------|---------|
| `src/types/capacityScenario.ts` | Zod スキーマに `hoursPerPerson` を追加 |
| `src/data/capacityScenarioData.ts` | INSERT/UPDATE クエリに `hours_per_person` カラムを追加 |
| `src/transform/capacityScenarioTransform.ts` | snake_case → camelCase 変換に `hoursPerPerson` を追加 |
| `src/services/capacityScenarioService.ts` | create/update に `hoursPerPerson` を追加 |
| `src/routes/capacityScenarios.ts` | 新エンドポイント `POST /:id/actions/calculate` を追加 |
| `src/services/monthlyCapacityService.ts` | `calculate` メソッドを新規追加 |
| `src/data/monthlyCapacityData.ts` | 自動計算の bulk upsert ロジックを追加（既存 `bulkUpsert` を活用可能） |
| テスト全般 | 既存テストのサンプルデータに `hoursPerPerson` を追加、自動計算エンドポイントのテストを新規追加 |

### 6.2 フロントエンド

| 対象 | 変更内容 |
|------|---------|
| キャパシティシナリオ管理画面 | `hoursPerPerson` の入力フォームを追加 |
| キャパシティ一括計算UI | 人員計画ケース選択 + 計算実行ボタンを追加 |
| API型定義 | `CapacityScenario` 型に `hoursPerPerson` を追加 |

### 6.3 関連仕様への影響

| 仕様書 | 影響 |
|--------|------|
| `chart-data-api-spec.md` | キャパシティデータの取得部分に変更なし（`monthly_capacity` の構造は不変） |
| `dashboard-requirements.md` | キャパシティライン表示には影響なし（表示データは `monthly_capacity.capacity` を参照） |
| `api-spec.md` | Capacity Scenarios API セクションの更新が必要 |
| `table-spec.md` | `capacity_scenarios` テーブル定義の更新が必要 |

---

## 7. 設計判断

### 7.1 パラメータの配置場所

**採用:** `capacity_scenarios` テーブルにカラム追加

**理由:**
- シナリオは「労働時間の前提条件パターン」を表現するエンティティであり、`hours_per_person` はシナリオの本質的な属性である
- 月ごとに労働時間が変動するケースは稀であり、シナリオ単位の固定値で十分
- テーブル追加なしで実現でき、既存のCRUD APIへの影響が最小限

**不採用案:** 月別に労働時間を管理する新テーブル `monthly_working_hours`
- 月によって労働時間が変わるケース（祝日の多い月など）に対応可能だが、現時点では過剰設計

### 7.2 `hours_per_person` の意味

**方針:** `hours_per_person` は稼働率等の前提条件を織り込んだ**実効労働時間**を表す。

- 「定時160h × 稼働率80%」のようなケースは、`hours_per_person = 128.00` として設定する
- 稼働率を別カラムとして分離せず、シナリオの `hours_per_person` に一本化することで、モデルをシンプルに保つ
- シナリオ名や説明フィールドで前提条件（定時/残業込み等）を記述することで、運用上の可読性を確保する

### 7.3 自動計算と手動入力の共存

**方針:** `monthly_capacity` は引き続き手動入力も可能とし、自動計算は明示的な操作（`POST /actions/calculate`）として提供する。

**理由:**
- 既存の運用（手動入力）を破壊しない
- 計算結果を確認してから反映するワークフローに対応
- 部分的な手動補正（特定月だけ値を変更）も可能

### 7.4 デフォルト値

**採用:** デフォルト `160.00`

**理由:**
- dashboard-requirements.md で定義されている月間標準時間（160時間）と整合する
- 既存データの後方互換性を保つ（カラム追加時に既存行に自動設定）
- マイグレーション後に各シナリオの実際の実効労働時間を設定する想定
