# Research & Design Decisions: work-types-display-order

## Summary

- **Feature**: `work-types-display-order`
- **Discovery Scope**: Extension（既存実装の検証・補完）
- **Key Findings**:
  1. 間接作業 Area が案件 Area の下部に固定される制約は `sortAreasByIndirectOrder()` で保証済み
  2. 保存済み stackOrder がページ初期化時にロードされていない（ページリロードで順序がリセットされる）
  3. API 失敗時のロールバック処理が未実装

## Research Log

### チャートの積み上げ順制御メカニズム

- **Context**: Requirement 3（チャートへの即時反映）の検証
- **Sources Consulted**: `WorkloadChart.tsx`, `useChartData.ts`
- **Findings**:
  - Recharts の `<Area>` は JSX の先頭が下、末尾が上に積み上げられる
  - `seriesConfig.areas` 配列の順序がそのままチャートの積み上げ順となる
  - `sortAreasByIndirectOrder()` が `[...classified, ...unclassified, ...projectAreas]` を返すため、**間接作業は必ず案件の下部**に配置される
  - `sortAreasByProjectOrder()` は案件 Area を逆順にして凡例順と一致させている
- **Implications**: Requirement 3.2, 3.3 は既存実装で保証済み。追加の制約実装は不要

### 保存済み順序のページ初期化時ロード

- **Context**: Requirement 2（永続化）の検証 — 保存した順序がリロード後に反映されるか
- **Sources Consulted**: `workload/index.lazy.tsx`, `SidePanelIndirect.tsx`, `mutations.ts`, `queries.ts`
- **Findings**:
  - `indirectOrder` state は `useState<string[]>([])` で空配列に初期化される
  - `stackOrderSettingsQueryOptions` クエリは定義されているが、ページ初期化時に使用されていない
  - 保存 API（`PUT /chart-stack-order-settings/bulk`）は呼ばれるが、取得 API の結果が state に反映されない
  - **結果**: ページリロードするとユーザーが設定した順序がリセットされる
- **Implications**: 永続化の「保存」はできているが「読み込み」ができていない。ページ初期化時に `stackOrderSettingsQueryOptions` を使って保存済み順序をロードする必要がある

### エラー時のロールバック処理

- **Context**: Requirement 2.2（保存失敗時のロールバック）の検証
- **Sources Consulted**: `SidePanelIndirect.tsx`, `mutations.ts`
- **Findings**:
  - `moveUp` / `moveDown` は `setItems()` 内で state を先に更新し、`orderMutation.mutate()` を fire-and-forget で呼び出す
  - `useBulkUpsertStackOrderSettings` に `onError` ハンドラが定義されていない
  - mutation 失敗時、UI state は変更されたまま残り、サーバーとの不整合が生じる
- **Implications**: mutation に `onError` コールバックを追加し、失敗時に state をロールバックする仕組みが必要

## Design Decisions

### Decision: 保存済み順序のロード方式

- **Context**: ページ初期化時に `chart_stack_order_settings` から保存済み順序をロードする必要がある
- **Alternatives Considered**:
  1. `workload/index.lazy.tsx` の `loader` で prefetch し、state を初期化
  2. `SidePanelIndirect` 内で `useQuery` を使い、取得完了後に `setItems` を更新
- **Selected Approach**: Option 2 — `SidePanelIndirect` 内でのクエリ
- **Rationale**: SidePanelIndirect が順序の state を所有しているため、同コンポーネント内でロードするのが責務的に自然。ルートコンポーネントの肥大化を避けられる
- **Trade-offs**: SidePanelIndirect が開かれるまでロードされないが、チャートの順序は `indirectOrder` state 経由で即座に反映される必要があるため、ルート側での初期ロードも検討すべき
- **Follow-up**: `indirectOrder` がルートの state で管理されている点を考慮し、ルート側での初期ロードを採用する可能性あり

### Decision: エラーハンドリング方式

- **Context**: mutation 失敗時に UI をロールバックする方法
- **Alternatives Considered**:
  1. `useMutation` の `onError` で前回の state に戻す
  2. TanStack Query の `onMutate` / `onError` による楽観的更新パターン
- **Selected Approach**: Option 1 — シンプルな `onError` ロールバック
- **Rationale**: 隣接2項目のスワップという単純な操作のため、前回 state の保持と復元で十分
- **Trade-offs**: 複数回連続操作した場合のロールバックが最後の操作のみになるが、実用上問題なし

## Risks & Mitigations

- **リスク 1**: ページ初期化時のロード追加により、初期表示のちらつき（フラッシュ）が発生する可能性 → ロード完了まで SidePanelIndirect のリスト表示を `Skeleton` にする
- **リスク 2**: 順序の state がルート側と SidePanelIndirect 側で二重管理になる可能性 → state の所有権を明確にし、単一の情報源を維持する
