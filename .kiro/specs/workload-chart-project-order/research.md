# Research & Design Decisions

## Summary
- **Feature**: `workload-chart-project-order`
- **Discovery Scope**: Extension
- **Key Findings**:
  - 色設定（`onProjectColorsChange`）の橋渡しパターンが確立済みで、並び順も同一パターンで伝播可能
  - `useChartData` の `useMemo` 内で areas と legendMap を構築しており、ソートロジックの追加箇所が明確
  - `SidePanelSettings` のプロファイル適用（`handleProfileApply`）は内部で `setProjOrder` を呼ぶが、外部通知が欠落

## Research Log

### 既存データフローの分析
- **Context**: 並び順が親コンポーネントに伝播しない根本原因の特定
- **Sources Consulted**: `SidePanelSettings.tsx`, `useChartData.ts`, `index.lazy.tsx` のソースコード
- **Findings**:
  - `SidePanelSettings` は `projOrder` を `useState` で管理するが、`onProjectColorsChange` のような外部通知コールバックがない
  - `useChartData` は `rawResponse.projectLoads.forEach` で areas を構築し、API レスポンス順を使用
  - `WorkloadPage` は `projectColors` state の橋渡しのみ実装済み（`projectOrder` なし）
  - `LegendPanel` は `data.projects` の配列順をそのまま `.map()` で表示
- **Implications**: `onProjectColorsChange` と同じ props-callback-state パターンで `projectOrder` を追加すれば、既存アーキテクチャに自然に統合できる

### useMemo 依存配列の影響
- **Context**: `projectOrder` を `useMemo` 依存配列に追加する際のパフォーマンス影響
- **Findings**:
  - `projectOrder` は `number[]` で参照比較のため、並び替えごとに新配列が生成され `useMemo` が再計算される
  - 再計算内容は areas 配列のソート（O(n log n)、n = 案件数）のみで軽微
  - 案件数は通常数十件程度のため、パフォーマンス懸念なし

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| A: 既存拡張 | 色設定と同じ callback + state パターン | 一貫性、最小変更、後方互換 | WorkloadPage の state 増加（軽微） | **採用** |
| B: 描画側ソート | Chart/LegendPanel でソート | useChartData 変更不要 | ソートロジック分散、一貫性リスク | 不採用 |
| C: グローバル state | zustand 等で管理 | Props drilling 回避 | オーバーエンジニアリング、既存パターンと不整合 | 不採用 |

## Design Decisions

### Decision: 並び順の伝播パターン
- **Context**: `SidePanelSettings` の `projOrder` を `useChartData` に伝播させる方法
- **Alternatives Considered**:
  1. Option A — 色設定と同じ props-callback-state パターン
  2. Option B — 描画コンポーネント側でのソート
  3. Option C — zustand によるグローバル state
- **Selected Approach**: Option A（props-callback-state パターン）
- **Rationale**: 色設定（`onProjectColorsChange` → `projectColors` → `useChartData` options）と同一のデータフローを踏襲し、コードの一貫性を維持。3ファイルの限定的変更で完結する
- **Trade-offs**: WorkloadPage の state が1つ増えるが、色設定と同じ構造のため認知負荷は最小
- **Follow-up**: なし

### Decision: ソート実行箇所
- **Context**: `projectOrder` に基づくソートを useChartData 内 vs 各描画コンポーネント内のどちらで行うか
- **Selected Approach**: `useChartData` 内で areas と legendMap の projects を同時にソート
- **Rationale**: 単一箇所でソートすることで、チャートと凡例の順序一貫性を構造的に保証。描画コンポーネントはソートロジックを持たない
- **Trade-offs**: `useChartData` の責務がわずかに増えるが、データ変換フック内の責務として適切

## Risks & Mitigations
- **リスク**: `projOrder` の初期値通知タイミング — 初回表示で不整合の可能性
  - **軽減策**: `projOrder` を監視する単一の `useEffect` で `onProjectOrderChange` を呼び出す方式を採用。全ての変更契機（moveProjUp、moveProjDown、handleProfileApply、初期ロード）を一箇所でカバーし、通知漏れを構造的に防止
