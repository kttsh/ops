# Research & Design Decisions

## Summary
- **Feature**: `capacity-line-auto-generation`
- **Discovery Scope**: Extension（既存システムの拡張）
- **Key Findings**:
  - 既存の計算ロジック（`headcount × hoursPerPerson`）は TypeScript 側で実行されており、SQL への移行が容易
  - `monthly_capacity` テーブルへの永続化を廃止し、CROSS JOIN ベースのオンザフライ計算に置き換え可能
  - フロントエンドは `LineSeriesConfig.strokeDasharray` を既にサポートしており、破線表示は設定値の追加のみ

## Research Log

### SQL CROSS JOIN パフォーマンス
- **Context**: n×m 組み合わせをオンザフライで計算する際の SQL パフォーマンス
- **Findings**:
  - `monthly_headcount_plan` は `(headcount_plan_case_id, business_unit_code, year_month)` でユニーク制約あり → インデックス効率が高い
  - 想定規模: ケース 5 × シナリオ 5 × BU 10 × 月 60 = 最大 15,000 行 → 軽量
  - CROSS JOIN は capacity_scenarios と headcount_plan_cases の組み合わせ生成のみ（マスタデータのためレコード数が少ない）
  - 乗算を SQL 内で実行することで転送データ量を削減
- **Implications**: パフォーマンスリスクは低い。SQL 内計算が最適

### 表示設定の永続化方式
- **Context**: n×m のキャパシティラインの ON/OFF 設定をどこで管理するか
- **Findings**:
  - 現在の `chart_view_capacity_items` は `(chart_view_id, capacity_scenario_id)` の複合キー
  - n×m 対応には `headcount_plan_case_id` の追加が必要 → テーブルスキーマ変更
  - 代替: フロントエンドローカル状態のみで管理（デフォルト全 OFF のため永続化の必要性が低い）
- **Implications**: 初期実装はフロントエンドローカル状態で管理。チャートビュープロファイル保存が必要になった場合に DB スキーマ拡張を検討

### Recharts 破線スタイル
- **Context**: 複数キャパシティラインの視覚的区別
- **Findings**:
  - Recharts `Line` コンポーネントは `strokeDasharray` プロパティをサポート
  - 既存の `LineSeriesConfig` 型に `strokeDasharray?: string` が定義済み
  - 既存の `WorkloadChart.tsx` が `line.strokeDasharray` を Line に渡している
  - 一律 `"6 3"` で統一し、色で区別する方式が最もシンプル
- **Implications**: フロントエンドの変更は `useChartData.ts` で `strokeDasharray: "6 3"` を設定するのみ

### 既存 monthly_capacity テーブルの扱い
- **Context**: オンザフライ計算への移行後、既存のテーブルと calculate API の扱い
- **Findings**:
  - `POST /capacity-scenarios/:id/actions/calculate` は明示的な計算トリガー
  - チャート表示がオンザフライになれば `monthly_capacity` への書き込みは不要
  - ただし calculate API を削除するとブレイキングチェンジ
- **Implications**: 今回のスコープでは calculate API は変更しない。chart-data API のキャパシティ取得部分のみをオンザフライに置き換える。monthly_capacity テーブルは残すが、chart-data では使用しない

## Architecture Pattern Evaluation

| Option | 説明 | 強み | リスク |
|--------|------|------|--------|
| A: chart-data API 拡張 | getCapacities() をオンザフライ計算に置き換え | 既存パターン維持、単一 API、DB 保存不要 | SQL 複雑化 |
| B: フロントエンド計算 | FE で headcount × hoursPerPerson を計算 | BE 変更最小 | ビジネスロジック分散、複数 API 呼び出し |
| C: 新規エンドポイント | GET /capacity-lines を新設 | 既存コード影響なし | パターン逸脱、FE で 2 API 統合 |

**選択: Option A** — 既存パターンとの整合性、ビジネスロジックの集約、Issue 要望への直接対応

## Design Decisions

### Decision: chart-data API の capacities フィールドを capacityLines に変更
- **Context**: n×m 組み合わせのキャパシティラインを返すために、レスポンス構造の変更が必要
- **Alternatives**:
  1. 既存の `capacities` フィールドの型を拡張 — 後方互換性を損なう
  2. `capacityLines` という新フィールドを追加し `capacities` を廃止 — 明確な命名
- **Selected**: Option 2 — `capacityLines` に改名
- **Rationale**: 内部 API のため後方互換性のコストは低い。新しい意味合い（n×m 組み合わせ）を明確に表現
- **Trade-offs**: フロントエンドの全参照箇所の更新が必要
- **Follow-up**: フロントエンドの型定義を同時に更新すること

### Decision: 表示状態はフロントエンドローカル管理
- **Context**: デフォルト全 OFF のため、永続化の必要性を検討
- **Selected**: React 状態 + URL Search Params での管理
- **Rationale**: デフォルト OFF なので初期状態の永続化が不要。ケース/シナリオの追加・削除に自動追従
- **Trade-offs**: ページリロードで設定がリセットされる（ただしデフォルト OFF なので影響なし）

### Decision: クエリパラメータから capacityScenarioIds を撤廃しない
- **Context**: オンザフライ計算では全シナリオを対象とするが、既存パラメータとの互換性
- **Selected**: `capacityScenarioIds` パラメータは残すが、キャパシティライン生成には使用しない。全ケース × 全シナリオを常に返す
- **Rationale**: 段階的移行を可能にし、既存フロントエンドコードのリファクタリングを最小化
- **Follow-up**: 将来的に `capacityScenarioIds` パラメータの廃止を検討

## Risks & Mitigations
- **パフォーマンス**: n×m が大きい場合の SQL 実行時間 → 想定規模（≤25 ライン）では問題なし。必要に応じてキャッシュ検討
- **後方互換性**: capacities → capacityLines のフィールド名変更 → フロントエンド・バックエンド同時デプロイで対応
- **チャートビュープロファイル**: 既存プロファイル保存ロジックとの整合性 → 初期実装ではプロファイルにキャパシティライン設定を含めない
