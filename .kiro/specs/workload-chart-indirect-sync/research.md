# Research & Design Decisions

## Summary
- **Feature**: `workload-chart-indirect-sync`
- **Discovery Scope**: Extension（既存の案件色・順序パターンを間接作業に横展開）
- **Key Findings**:
  - 案件の色・順序反映は State Lifting パターンで完全に動作しており、そのまま間接作業に適用可能
  - `SidePanelIndirect` は既にバックエンド保存ロジックを持つが、親への通知コールバックが欠落
  - `LegendPanel` は `seriesConfig` 経由で色を取得済みのため、`useChartData` が正しい色を出力すれば自動反映される

## Research Log

### 既存の案件色・順序パターン分析
- **Context**: 間接作業に同一パターンを適用するため、案件側の実装を詳細に調査
- **Sources Consulted**: `index.lazy.tsx` L66-82, `SidePanelSettings.tsx` L77-138, `useChartData.ts` L33-36/L85-87/L173-187
- **Findings**:
  - `WorkloadPage` が `projectColors: Record<number, string>` と `projectOrder: number[]` を state として保持
  - `SidePanelSettings` が `onProjectColorsChange` / `onProjectOrderChange` コールバックで親に通知
  - `useChartData` が `UseChartDataOptions` 経由で受け取り、シリーズ構築時に参照
  - `sortAreasByProjectOrder` が案件シリーズのソートを担当（間接シリーズは位置維持）
- **Implications**: 間接作業も同一の3層構造（state保持→コールバック通知→options受け取り）で実装可能

### SidePanelIndirect の現状分析
- **Context**: 既存の色・順序変更ロジックの確認
- **Sources Consulted**: `SidePanelIndirect.tsx`
- **Findings**:
  - `items` state で `workTypeCode`, `color`, `displayOrder` を管理
  - `setColor` / `moveUp` / `moveDown` で state を更新し、同時にバックエンドに保存
  - コールバック props が存在しない（自己完結型）
  - キー型は `string`（workTypeCode）で案件の `number`（projectId）と異なる
- **Implications**: コールバック props を追加するだけで橋渡し可能。キーが string 型であることに注意

### useChartData の間接作業シリーズ構築分析
- **Context**: 色・順序のハードコード箇所の特定
- **Sources Consulted**: `useChartData.ts` L144-157, L345-346
- **Findings**:
  - 色: `INDIRECT_COLORS[wtIdx % INDIRECT_COLORS.length]` でハードコード（L150-151）
  - 順序: `workTypeMap` の挿入順（APIレスポンス出現順）で決定
  - 凡例データ `legendMap` の `indirectWorkTypes` も同じ出現順
  - `sortAreasByProjectOrder` は間接シリーズを `a.type === "indirect"` でフィルタし位置維持
- **Implications**: 色はオプション参照に変更、順序は新規ソート関数で対応。凡例データのソートも必要

### LegendPanel の色取得メカニズム
- **Context**: 凡例パネルが色変更に自動追従するか確認
- **Sources Consulted**: `LegendPanel.tsx` L38-41
- **Findings**:
  - `getAreaColor("indirect", wt.workTypeCode)` で `seriesConfig.areas` から色を検索
  - `seriesConfig` が正しい色を持てば、凡例の色は自動的に正しくなる
  - 凡例の表示順は `data.indirectWorkTypes` 配列の順序に依存
- **Implications**: 凡例の色は `useChartData` の修正で自動反映。表示順は `legendMap` 構築時にソートが必要

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| State Lifting（採用） | 案件と同一の親コンポーネント経由の state 橋渡し | 実績あるパターン、一貫性、最小変更 | `index.lazy.tsx` の state が増加 | 案件パターンとの対称性が保たれる |
| Context Provider | 間接作業設定を Context で共有 | コンポーネント階層に依存しない | 過剰設計、既存パターンとの不整合 | 将来的なリファクタ候補 |
| Custom Hook 抽出 | `useIndirectSettings` に state 管理を集約 | ルートコンポーネントの簡素化 | 新規ファイル追加、案件パターンとの非対称性 | Option A の後にリファクタ可能 |

## Design Decisions

### Decision: State Lifting パターンの採用
- **Context**: 間接作業の色・順序変更をチャートに反映する仕組みの選択
- **Alternatives Considered**:
  1. State Lifting — 案件と同じ親コンポーネント経由の橋渡し
  2. Context Provider — React Context での状態共有
  3. TanStack Query キャッシュ直接参照 — mutation 後にクエリキャッシュを更新
- **Selected Approach**: State Lifting
- **Rationale**: 案件で実績のあるパターンをそのまま横展開でき、コードの一貫性と可読性を維持できる。変更ファイルは3つのみで影響範囲が明確
- **Trade-offs**: ルートコンポーネントの state が増えるが、案件パターンとの対称性により認知負荷は低い
- **Follow-up**: 将来的に案件・間接作業の設定管理を統一 hook に抽出するリファクタを検討

### Decision: 間接作業キーを string 型で統一
- **Context**: 案件は `Record<number, string>` / `number[]` だが、間接作業は `workTypeCode: string`
- **Selected Approach**: `Record<string, string>` / `string[]` を使用
- **Rationale**: `workTypeCode` が string 型であり、不要な型変換を避ける

## Risks & Mitigations
- `index.lazy.tsx` の複雑化 — 案件パターンとの対称構造により理解しやすさを維持
- `useMemo` 依存配列の増加 — 新規オプションを依存配列に追加し再計算を保証
- 凡例の表示順が `legendMap` の構築順に依存 — ソートロジックを `useChartData` 内に追加
