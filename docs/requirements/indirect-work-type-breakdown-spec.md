# 間接工数 種類別内訳の導出 変更仕様書

> **Version**: 1.0.0
> **Last Updated**: 2026-01-31
> **Status**: ドラフト
> **親文書**: dashboard-requirements.md（付録C #3）

---

## 1. 背景と課題

### 1.1 現状のデータモデル

間接工数に関する2つのファクトテーブルが存在する。

**monthly_indirect_work_load（月次間接工数）**

| カラム | 型 | 説明 |
|--------|-----|------|
| indirect_work_case_id | INT | 間接作業ケースID |
| business_unit_code | VARCHAR(20) | ビジネスユニットコード |
| year_month | CHAR(6) | 年月（YYYYMM） |
| manhour | INT | **合計工数**（種類別ではない、0以上の整数） |
| source | VARCHAR(20) | 'calculated' or 'manual' |

**indirect_work_type_ratios（間接作業比率）**

| カラム | 型 | 説明 |
|--------|-----|------|
| indirect_work_case_id | INT | 間接作業ケースID |
| work_type_code | VARCHAR(20) | 作業種類コード |
| fiscal_year | INT | 年度 |
| ratio | DECIMAL(5,4) | 比率（0.0000〜1.0000） |

### 1.2 問題点

`monthly_indirect_work_load` は **ケース×BU×年月粒度の合計値のみ** を格納しており、作業種類（WorkType）別の内訳カラムを持たない。

一方、要件定義書では以下のように種類別の表示が要求されている。

- **F-WC-001**: 間接作業を種別（教育、見積等）ごとに色分けして積み上げ表示
- **F-WC-003**: 凡例パネルに種類別の工数値を表示
- **F-WC-011**: データテーブルに種類別の行を表示

### 1.3 設計判断

種類別内訳を **テーブルに永続化するのではなく、表示時に比率から動的に導出する** アプローチを採用する。

理由:
1. 比率は年度単位で設定されるため、年度の途中で変更しても自動的に再計算される
2. データの二重管理（合計と内訳の不整合）を回避できる
3. 既存テーブルへのカラム追加やスキーマ変更が不要

---

## 2. 導出ロジック

### 2.1 基本計算式

```
種類別間接工数[workTypeCode][yearMonth] =
  月次間接工数[yearMonth].manhour × 比率[workTypeCode][fiscalYear(yearMonth)]
```

### 2.2 年度の判定

日本の会計年度に準拠:

```
4月〜翌3月 = 1年度

yearMonth → fiscalYear の変換:
  月 >= 4 の場合: fiscalYear = 年
  月 <  4 の場合: fiscalYear = 年 - 1

例:
  202604 → 2026年度
  202703 → 2026年度
  202704 → 2027年度
```

### 2.3 具体例

#### 前提データ

**monthly_indirect_work_load:**

| yearMonth | manhour | source |
|-----------|---------|--------|
| 202604 | 800 | calculated |
| 202605 | 820 | calculated |

**indirect_work_type_ratios（2026年度）:**

| workTypeCode | ratio |
|-------------|-------|
| EDU（教育） | 0.2500 |
| EST（見積） | 0.1500 |
| MTG（会議） | 0.3000 |
| ADM（管理） | 0.2000 |
| OTH（その他） | 0.1000 |
| **合計** | **1.0000** |

#### 導出結果

| workTypeCode | 202604 | 202605 |
|-------------|--------|--------|
| EDU | 800 × 0.25 = **200.00** | 820 × 0.25 = **205.00** |
| EST | 800 × 0.15 = **120.00** | 820 × 0.15 = **123.00** |
| MTG | 800 × 0.30 = **240.00** | 820 × 0.30 = **246.00** |
| ADM | 800 × 0.20 = **160.00** | 820 × 0.20 = **164.00** |
| OTH | 800 × 0.10 = **80.00** | 820 × 0.10 = **82.00** |
| **合計** | **800.00** | **820.00** |

---

## 3. 実装方式の選択肢

### 3.1 方式A: バックエンドで導出して返却（推奨）

集約チャートデータAPI（`GET /chart-data`）のレスポンスに種類別内訳を含める。

**メリット:**
- フロントエンドの計算ロジックを最小化
- SQLのJOINで効率的に導出可能
- 種類別データの一貫性を保証

**レスポンス構造（chart-data-api-spec.md の `indirectWorkLoads` を拡張）:**

```jsonc
{
  "indirectWorkLoads": [
    {
      "indirectWorkCaseId": 1,
      "caseName": "2026年度計画",
      "businessUnitCode": "BU001",
      "monthly": [
        {
          "yearMonth": "202604",
          "manhour": 800,
          "source": "calculated",
          "breakdown": [
            { "workTypeCode": "EDU", "workTypeName": "教育", "manhour": 200.00 },
            { "workTypeCode": "EST", "workTypeName": "見積", "manhour": 120.00 },
            { "workTypeCode": "MTG", "workTypeName": "会議", "manhour": 240.00 },
            { "workTypeCode": "ADM", "workTypeName": "管理", "manhour": 160.00 },
            { "workTypeCode": "OTH", "workTypeName": "その他", "manhour": 80.00 }
          ]
        }
      ]
    }
  ]
}
```

**SQLクエリイメージ:**

```sql
SELECT
  miwl.indirect_work_case_id,
  miwl.business_unit_code,
  miwl.year_month,
  miwl.manhour AS total_manhour,
  miwl.source,
  iwtr.work_type_code,
  wt.name AS work_type_name,
  iwtr.ratio,
  CAST(miwl.manhour * iwtr.ratio AS DECIMAL(10,2)) AS type_manhour
FROM monthly_indirect_work_load miwl
JOIN indirect_work_type_ratios iwtr
  ON miwl.indirect_work_case_id = iwtr.indirect_work_case_id
  AND iwtr.fiscal_year = CASE
    WHEN CAST(RIGHT(miwl.year_month, 2) AS INT) >= 4
    THEN CAST(LEFT(miwl.year_month, 4) AS INT)
    ELSE CAST(LEFT(miwl.year_month, 4) AS INT) - 1
  END
JOIN work_types wt ON iwtr.work_type_code = wt.work_type_code
WHERE miwl.indirect_work_case_id IN (@caseIds)
  AND miwl.business_unit_code IN (@businessUnitCodes)
  AND miwl.year_month BETWEEN @startYearMonth AND @endYearMonth
  AND wt.deleted_at IS NULL
ORDER BY miwl.year_month, wt.display_order
```

### 3.2 方式B: フロントエンドで導出

月次間接工数と比率を個別に取得し、フロントエンドで計算する。

**メリット:**
- 既存APIの変更が不要
- 比率変更のプレビュー表示が容易

**デメリット:**
- フロントエンドに年度判定ロジックの実装が必要
- 複数APIの呼び出しが必要
- ダッシュボードの初回表示でN+1リクエストが発生

### 3.3 推奨: 方式A+B の併用

- **ダッシュボード表示**: 方式A（`GET /chart-data` のレスポンスに含める）
- **間接作業管理画面**: 方式B（個別APIの利用を継続、比率変更時のプレビュー用）

---

## 4. エッジケースと対応

### 4.1 比率未設定の場合

当該年度の比率が `indirect_work_type_ratios` に登録されていない場合。

| ケース | 対応 |
|--------|------|
| 年度全体の比率が未設定 | `breakdown` を空配列で返す。合計工数のみ表示 |
| 一部の作業種類のみ設定 | 設定済み種類のみ `breakdown` に含める。合計と内訳合計が一致しない旨のフラグ付与 |

**レスポンス例（一部未設定時）:**

```jsonc
{
  "yearMonth": "202604",
  "manhour": 800,
  "breakdown": [
    { "workTypeCode": "EDU", "workTypeName": "教育", "manhour": 200.00 },
    { "workTypeCode": "MTG", "workTypeName": "会議", "manhour": 240.00 }
  ],
  "breakdownCoverage": 0.5500  // 内訳でカバーしている比率の合計
}
```

### 4.2 比率合計が1.0000を超える場合

要件定義書（F-IW-005）により、比率合計 > 1.0 はエラーとしない（警告のみ）。この場合、種類別内訳の合計が月次合計を上回ることになる。

| 対応 | 説明 |
|------|------|
| 計算はそのまま実行 | `manhour × ratio` をそのまま返す |
| `breakdownCoverage` で通知 | 1.0 を超えていることをフロントエンドに通知 |
| フロントエンド | 警告アイコン表示（ツールチップで「比率合計が100%を超えています」） |

### 4.3 年度の切り替わり月（4月）

4月のデータには新年度の比率が適用される。年度境界で比率が大きく変わる場合、チャート上で段差が生じるが、これは実際の比率変更を反映した正しい表示である。

### 4.4 丸め誤差

`DECIMAL(10,2)` で計算するため、種類別の合計が月次合計と一致しない可能性がある（最大 ±0.01 × 種類数）。

| 対応 | 説明 |
|------|------|
| サーバー側 | `CAST(manhour * ratio AS DECIMAL(10,2))` で2桁に丸め |
| フロントエンド | 合計行には `monthly_indirect_work_load.manhour` の値を使用し、種類別の合計値は使用しない |

---

## 5. dashboard-requirements.md への反映箇所

本仕様が採用された場合、以下のセクションを更新する。

| セクション | 更新内容 |
|-----------|---------|
| 3.2 F-WC-001 | 間接作業のデータシリーズに「種類別内訳はAPIレスポンスの `breakdown` から取得」を追記 |
| 6.8 F-IW-006 | 注意事項セクションの記述を更新（導出ロジックの詳細は本仕様書を参照する旨） |
| 付録A | `GET /chart-data` を追加 |
| 付録C | 本項目のステータスを更新 |

---

## 6. 型定義（参考）

```typescript
/** 種類別内訳 */
interface IndirectWorkTypeBreakdown {
  workTypeCode: string
  workTypeName: string
  manhour: number
}

/** 月次間接工数（内訳付き） */
interface MonthlyIndirectWorkLoadWithBreakdown {
  yearMonth: string
  manhour: number  // 0以上の整数
  source: 'calculated' | 'manual'
  breakdown: IndirectWorkTypeBreakdown[]
  breakdownCoverage: number  // 比率合計（0.0〜N.0）
}

/** チャートデータ内の間接工数セクション */
interface ChartDataIndirectWorkLoad {
  indirectWorkCaseId: number
  caseName: string
  businessUnitCode: string
  monthly: MonthlyIndirectWorkLoadWithBreakdown[]
}
```

---

## 更新履歴

| 日付 | バージョン | 内容 |
|------|-----------|------|
| 2026-01-31 | 1.0.0 | 初版作成 |
