# ギャップ分析: capacity-line-auto-generation

## 1. 現状調査

### 現在のキャパシティ計算フロー

```
[手動トリガー] POST /capacity-scenarios/:id/actions/calculate
  → capacityScenarioService.calculate(scenarioId, headcountPlanCaseId, buCodes, range)
    → monthly_headcount_plan から人員数取得
    → capacity = headcount × hoursPerPerson
    → monthly_capacity テーブルに結果を永続化（bulk upsert）

[チャート表示] GET /chart-data?capacityScenarioIds=1,2
  → chartDataData.getCapacities() → monthly_capacity テーブルから読み取り
  → chartDataService.transformCapacities() → シナリオ別に月次集計
  → フロントエンドに CapacityAggregation[] として返却
```

### 現在のデータモデル

| テーブル | キー | 役割 |
|---------|------|------|
| `capacity_scenarios` | scenario_id | シナリオ定義（hours_per_person） |
| `headcount_plan_cases` | case_id | 人員計画ケース定義 |
| `monthly_headcount_plan` | case_id + bu + year_month | 月別人員数（入力データ） |
| `monthly_capacity` | scenario_id + bu + year_month | **計算済みキャパシティ（永続化）** |
| `chart_view_capacity_items` | view_id + scenario_id | 表示設定（visibility, color） |

### 現在のフロントエンド構造

- **useChartData.ts**: `rawResponse.capacities` を `capacity_{scenarioId}` のキーで LineSeriesConfig に変換
- **SidePanelSettings.tsx**: `capacityScenarios[]` をループし、シナリオ単位で Switch（表示/非表示）+ ColorPicker を表示
- **WorkloadChart.tsx**: Recharts の ComposedChart で Line コンポーネントとしてキャパシティラインを描画

### 主要な規約・パターン

- バックエンド: routes → services → data のレイヤードアーキテクチャ
- API レスポンス: `{ data: T }` ラッパー
- フロントエンド: features/ 配下に api, components, hooks, types を配置
- チャートデータ: 単一 GET エンドポイントで全データ種別を集約返却

---

## 2. 要件−既存資産マッピング

| 要件 | 既存資産 | ギャップ |
|------|---------|---------|
| **Req 1: n×m自動生成** | `capacityScenarioService.calculate()` は1:1計算・DB永続化 | **Missing**: n×m全組み合わせの一括計算。現在はシナリオ単位の事前計算のみ |
| **Req 2: 命名規則** | `scenarioName` のみ返却 | **Missing**: `{ケース名}({シナリオ名})` 形式の複合命名。headcountPlanCase名をキャパシティデータに含めていない |
| **Req 3: デフォルトOFF** | `chart_view_capacity_items.is_visible` で制御 | **Constraint**: 現在はシナリオ単位のキー。n×m対応には複合キー（case_id + scenario_id）が必要 |
| **Req 4: 破線表示** | `WorkloadChart.tsx` で Line コンポーネント使用 | **Missing**: 現在は実線。破線（strokeDasharray）の指定が未実装 |
| **Req 5: オンザフライ計算** | 現在は `monthly_capacity` に永続化 | **Missing**: DB読み取りではなく動的計算への切り替えが必要 |
| **Req 6: データ整合性** | 永続化モデルのため手動再計算が必要 | **Missing → Resolved by Req 5**: オンザフライにすれば自動的に整合性が保たれる |

---

## 3. 実装アプローチ選択肢

### Option A: バックエンド chart-data API の拡張（推奨）

**概要**: `GET /chart-data` のキャパシティ部分を、`monthly_capacity` テーブル読み取りからオンザフライ計算に置き換える。

**変更対象ファイル**:
- `chartDataData.ts`: `getCapacities()` → 新 `getCapacityLines()` に置き換え。`monthly_headcount_plan` と `capacity_scenarios` を JOIN して動的計算
- `chartDataService.ts`: `transformCapacities()` を n×m 組み合わせに対応する変換に更新
- `types/chartData.ts`: `CapacityAggregation` に `headcountPlanCaseId`, `caseName` を追加、複合キーに変更
- `chartData.ts`（route）: クエリパラメータに `headcountPlanCaseIds` を追加（任意）
- **フロントエンド**: useChartData.ts のキー生成を `capacity_{caseId}_{scenarioId}` に変更、SidePanelSettings の設定UI を n×m 対応

**トレードオフ**:
- ✅ DB保存不要（Issue の要望通り）
- ✅ データ整合性が自動的に担保
- ✅ 既存の chart-data エンドポイントの拡張で済む
- ✅ 単一リクエストで全データ取得（現行パターン維持）
- ❌ SQL が複雑化（CROSS JOIN + 集計）
- ❌ n×m が大きい場合のパフォーマンス考慮が必要

### Option B: フロントエンドで組み合わせ計算

**概要**: バックエンドは headcount_plan データと capacity_scenarios を個別に返し、フロントエンドで n×m を計算。

**変更対象ファイル**:
- フロントエンド: useChartData.ts に計算ロジック追加
- API: headcount plan の月別データ取得 API（既存 or 新規）
- capacity scenarios の一覧取得（既存）

**トレードオフ**:
- ✅ バックエンド変更が最小
- ✅ UIの柔軟性が高い
- ❌ フロントエンドにビジネスロジックが分散
- ❌ 複数API呼び出しが必要
- ❌ データ量が増える（全 headcount plan の月別データを転送）

### Option C: ハイブリッド（新規エンドポイント）

**概要**: `GET /capacity-lines` 専用エンドポイントを新設し、n×m の計算結果を返す。既存の chart-data は変更しない。

**変更対象ファイル**:
- 新規: `routes/capacityLines.ts`, `services/capacityLineService.ts`, `data/capacityLineData.ts`
- フロントエンド: 新規 API クライアント + useChartData での統合

**トレードオフ**:
- ✅ 既存コードへの影響が最小
- ✅ 責務の分離が明確
- ❌ chart-data の「単一エンドポイントで全データ」パターンから逸脱
- ❌ フロントエンドで2つのAPIを統合する複雑性
- ❌ 新規ファイルが多い

---

## 4. 複雑性・リスク評価

| 項目 | 評価 | 根拠 |
|------|------|------|
| **工数** | **M（3〜7日）** | 既存パターンの拡張が主。バックエンド計算ロジック + フロントエンドUI変更 + 表示設定の複合キー対応 |
| **リスク** | **Medium** | オンザフライ計算のパフォーマンス影響が未検証。chart_view_capacity_items の複合キー化が既存データに影響する可能性 |

---

## 5. 推奨事項と設計フェーズへの引き継ぎ

### 推奨アプローチ: Option A（バックエンド chart-data API 拡張）

**理由**:
- Issue の「オンザフライ計算」要望に最も直接的に応える
- 既存の chart-data 統合パターンを維持
- ビジネスロジックがバックエンドに集約される

### 設計フェーズでの要調査事項（Research Needed）

1. **パフォーマンス**: n×m が大きい場合（例: 5ケース × 5シナリオ = 25本）の SQL 実行時間とレスポンスサイズ
2. **表示設定の永続化**: `chart_view_capacity_items` を複合キー（case_id + scenario_id）に拡張するか、フロントエンドのみでローカル状態管理するか
3. **既存 `monthly_capacity` テーブルの扱い**: 廃止するか、既存の calculate API との後方互換性を維持するか
4. **破線スタイル**: 複数ライン表示時の色・破線パターンの区別方法（Recharts の strokeDasharray バリエーション）
5. **クエリパラメータ設計**: 全ケース×全シナリオを常に返すか、フィルタリングオプションを設けるか
