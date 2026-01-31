# 集約チャートデータAPI 変更仕様書

> **Version**: 1.0.0
> **Last Updated**: 2026-01-31
> **Status**: 実装済み
> **親文書**: dashboard-requirements.md（付録C #2）

---

## 1. 背景と課題

### 1.1 現状

操業山積ダッシュボード（F-WC-001〜F-WC-004）は、以下3種類のデータを1つのチャート上に統合して表示する必要がある。

| データ種別 | 現行API | 粒度 |
|-----------|---------|------|
| 案件負荷（ProjectLoad） | `GET /project-cases/:projectCaseId/project-loads` | projectCaseId × yearMonth |
| 月次間接工数（MonthlyIndirectWorkLoad） | `GET /indirect-work-cases/:id/monthly-indirect-work-loads` | indirectWorkCaseId × businessUnitCode × yearMonth |
| 月次キャパシティ（MonthlyCapacity） | `GET /capacity-scenarios/:id/monthly-capacities` | capacityScenarioId × businessUnitCode × yearMonth |

### 1.2 問題点

現行APIは個別エンティティのCRUD操作に特化しており、ダッシュボード描画に必要な **複数エンティティを横断した集約データ** を1回のリクエストで取得する手段がない。

フロントエンドから個別に取得する場合の問題:

1. **N+1リクエスト問題**: チャートビューに含まれる案件×ケース数分のリクエストが発生する
2. **集約処理のクライアント負荷**: 案件タイプ単位の集約、期間フィルタ、BUフィルタをフロントエンドで処理する必要がある
3. **データ不整合リスク**: 複数APIのレスポンスを突き合わせる際のタイミング差

---

## 2. 要件

### 2.1 機能要件

| ID | 要件 | 優先度 |
|----|------|:------:|
| CD-001 | 指定したチャートビューまたはフィルタ条件に基づき、案件工数・間接工数・キャパシティを月別に集約して返す | 高 |
| CD-002 | 案件工数は案件タイプ（projectTypeCode）単位で集約する | 高 |
| CD-003 | 間接工数はケース（indirectWorkCaseId）単位で返す | 高 |
| CD-004 | キャパシティはシナリオ（capacityScenarioId）単位で返す | 高 |
| CD-005 | BU指定、期間指定によるフィルタリングをサポートする | 高 |
| CD-006 | 案件ケースの `isPrimary = true` のケースを自動選択するデフォルト動作を提供する | 中 |

### 2.2 非機能要件

| 項目 | 目標値 |
|------|--------|
| レスポンスタイム | 2秒以内（500案件×36ヶ月） |
| レスポンスサイズ | 適切なJSON構造で返却（不要なフィールドを含まない） |

---

## 3. API設計

### 3.1 エンドポイント

```
GET /chart-data
```

### 3.2 クエリパラメータ

| パラメータ | 型 | 必須 | 説明 | 例 |
|------------|-----|:----:|------|-----|
| `businessUnitCodes` | string (CSV) | ○ | 対象BUコード（カンマ区切り） | `BU001,BU002` |
| `startYearMonth` | string | ○ | 開始年月（YYYYMM） | `202601` |
| `endYearMonth` | string | ○ | 終了年月（YYYYMM） | `202812` |
| `chartViewId` | number | - | チャートビューID（指定時はビュー設定に従う） | `1` |
| `capacityScenarioIds` | string (CSV) | - | キャパシティシナリオID（カンマ区切り） | `1,2,3` |
| `indirectWorkCaseIds` | string (CSV) | - | 間接作業ケースID（カンマ区切り） | `1,2` |

### 3.3 データ取得ロジック

#### chartViewId 指定時

1. `chart_view_project_items` から `isVisible = true` の案件項目を取得
2. `chart_view_indirect_work_items` から `isVisible = true` の間接作業項目を取得
3. 各項目に紐づくファクトデータを期間・BU条件でフィルタして集約

#### chartViewId 未指定時

1. 指定されたBUに紐づく案件を取得し、各案件の `isPrimary = true` のケースを選択
2. `indirectWorkCaseIds` が指定されている場合はそのケースを使用、未指定時は `isPrimary = true` のケースを自動選択
3. `capacityScenarioIds` が指定されている場合はそのシナリオを使用

#### 案件工数の集約

```sql
-- 案件タイプ × 年月 で集約
SELECT
  pt.project_type_code,
  pt.name AS project_type_name,
  pl.year_month,
  SUM(pl.manhour) AS total_manhour
FROM project_load pl
JOIN project_cases pc ON pl.project_case_id = pc.project_case_id
JOIN projects p ON pc.project_id = p.project_id
LEFT JOIN project_types pt ON p.project_type_code = pt.project_type_code
WHERE p.business_unit_code IN (@businessUnitCodes)
  AND pl.year_month BETWEEN @startYearMonth AND @endYearMonth
  AND pc.is_primary = 1       -- chartViewId未指定時
  AND p.deleted_at IS NULL
  AND pc.deleted_at IS NULL
GROUP BY pt.project_type_code, pt.name, pl.year_month
ORDER BY pt.display_order, pl.year_month
```

### 3.4 レスポンス構造

```jsonc
{
  "data": {
    // 案件工数（案件タイプ × 年月で集約）
    "projectLoads": [
      {
        "projectTypeCode": "EPC",
        "projectTypeName": "EPC",
        "monthly": [
          { "yearMonth": "202601", "manhour": 12500.00 },
          { "yearMonth": "202602", "manhour": 11800.00 }
        ]
      },
      {
        "projectTypeCode": "SERVICE",
        "projectTypeName": "サービス",
        "monthly": [
          { "yearMonth": "202601", "manhour": 3200.00 },
          { "yearMonth": "202602", "manhour": 3400.00 }
        ]
      }
    ],

    // 間接工数（ケース × 年月）
    "indirectWorkLoads": [
      {
        "indirectWorkCaseId": 1,
        "caseName": "2026年度計画",
        "businessUnitCode": "BU001",
        "monthly": [
          { "yearMonth": "202601", "manhour": 800.00, "source": "calculated" },
          { "yearMonth": "202602", "manhour": 820.00, "source": "calculated" }
        ]
      }
    ],

    // キャパシティ（シナリオ × 年月）
    "capacities": [
      {
        "capacityScenarioId": 1,
        "scenarioName": "定時のみ",
        "monthly": [
          { "yearMonth": "202601", "capacity": 16000.00 },
          { "yearMonth": "202602", "capacity": 16000.00 }
        ]
      },
      {
        "capacityScenarioId": 2,
        "scenarioName": "残業込み",
        "monthly": [
          { "yearMonth": "202601", "capacity": 20000.00 },
          { "yearMonth": "202602", "capacity": 20000.00 }
        ]
      }
    ],

    // メタ情報
    "period": {
      "startYearMonth": "202601",
      "endYearMonth": "202812"
    },
    "businessUnitCodes": ["BU001", "BU002"]
  }
}
```

---

## 4. 実装方針

### 4.1 バックエンド構成

| ファイル | 責務 |
|----------|------|
| `apps/backend/src/routes/chartData.ts` | エンドポイント定義、パラメータバリデーション |
| `apps/backend/src/services/chartDataService.ts` | 集約ロジック（3種のデータを結合） |
| `apps/backend/src/data/chartDataData.ts` | 集約クエリの実行 |
| `apps/backend/src/types/chartData.ts` | リクエスト/レスポンス型定義 |

### 4.2 バリデーション

| パラメータ | ルール |
|------------|--------|
| `businessUnitCodes` | 1件以上必須、各コードは1〜20文字 |
| `startYearMonth` | YYYYMM形式、月は01〜12 |
| `endYearMonth` | YYYYMM形式、月は01〜12、startYearMonth以降 |
| 期間 | startYearMonth〜endYearMonth が60ヶ月以内 |

### 4.3 index.ts へのマウント

```typescript
import chartData from '@/routes/chartData'
app.route('/chart-data', chartData)
```

---

## 5. 既存APIとの関係

この集約APIは **読み取り専用** であり、既存のCRUD APIを置き換えるものではない。

| 操作 | 使用API |
|------|---------|
| 個別データの登録・更新・削除 | 既存の各CRUD API |
| ダッシュボードチャート描画用のデータ取得 | **新規: `GET /chart-data`** |

---

## 6. 将来拡張

| 項目 | 説明 |
|------|------|
| キャッシュ | stale-while-revalidate パターンによるキャッシュ（TanStack Query側で制御） |
| CSV/Excel出力 | `Accept` ヘッダーによるフォーマット切替 |
| 集約粒度の変更 | 四半期・年単位への集約（将来のクエリパラメータ追加） |

---

## 更新履歴

| 日付 | バージョン | 内容 |
|------|-----------|------|
| 2026-01-31 | 1.0.0 | 初版作成 |
