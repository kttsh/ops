# Research & Design Decisions

## Summary
- **Feature**: `simulation-bu-selector-ux`
- **Discovery Scope**: Extension（既存UI改修）
- **Key Findings**:
  - `useIndirectSimulation` フックは `businessUnitCode` 変更時の状態リセット処理を既に実装済み（prev-value 比較パターン）
  - 既存の `BusinessUnitSelector` はマルチセレクト専用（`selectedCodes: string[]`）のため、シングルセレクト版の新規作成が必要
  - フロントエンドのみの変更で完結し、バックエンドやDB変更は不要

## Research Log

### 既存 BusinessUnitSelector の再利用可能性
- **Context**: 山積ダッシュボードの `BusinessUnitSelector` をそのまま再利用できるか調査
- **Sources Consulted**: `apps/frontend/src/features/workload/components/BusinessUnitSelector.tsx`
- **Findings**:
  - props は `selectedCodes: string[]` + `onChange: (codes: string[]) => void` のマルチセレクト設計
  - 内部で `toggleUnit`（トグル）、`selectAll`/`clearAll`（全選択/全解除）のロジックを持つ
  - チップの視覚スタイル（`border-primary bg-primary/10`、`Building2` アイコン）は共通利用可能
- **Implications**: マルチセレクトのロジックがコンポーネント内に密結合しているため、シングルセレクト版を別コンポーネントとして作成する。視覚スタイルはコピーして一貫性を維持する。

### useIndirectSimulation のBU変更リセット機構
- **Context**: BU切替時のケース選択・計算結果のリセットが正しく行われるか確認
- **Sources Consulted**: `apps/frontend/src/features/indirect-case-study/hooks/useIndirectSimulation.ts` L96-105
- **Findings**:
  - `prevBusinessUnitCode` との比較で BU 変更を検知し、選択状態（3種）・計算結果・dirty フラグをすべてリセット済み
  - TanStack Query のクエリは `businessUnitCode` を key に含むため、BU 変更で自動的に再フェッチされる
- **Implications**: フック側の変更は不要。ページコンポーネントのUI配置変更のみで要件4を満たせる。

### コンポーネント配置場所
- **Context**: 新コンポーネントの配置先を決定
- **Sources Consulted**: steering `structure.md`、既存コードの features 構成
- **Findings**:
  - `BusinessUnitSelector` は `features/workload/components/` に配置（workload 固有）
  - シミュレーション画面は `features/indirect-case-study/` に属する
  - features 間の依存は禁止されている（CLAUDE.md）
- **Implications**: 新コンポーネントは `features/indirect-case-study/components/` に配置する。将来的に共通化が必要になれば `components/` や `packages/` へ移動する。

## Design Decisions

### Decision: シングルセレクト版を新規コンポーネントとして作成
- **Context**: 既存 `BusinessUnitSelector` はマルチセレクト前提の設計
- **Alternatives Considered**:
  1. `BusinessUnitSelector` に `mode: "single" | "multi"` props を追加して共用化
  2. シングルセレクト版を独立コンポーネントとして新規作成
- **Selected Approach**: Option 2 — 独立コンポーネント `BusinessUnitSingleSelector` を新規作成
- **Rationale**: features 間の依存禁止ルールを遵守。マルチ/シングルの切り替えロジックを混在させるより、責務の明確な独立コンポーネントが保守しやすい。
- **Trade-offs**: スタイルの重複が発生するが、コード量が少ないため許容範囲。
- **Follow-up**: 将来的に複数画面でシングルセレクトBU選択が必要になった場合は `components/` への共通化を検討。

## Risks & Mitigations
- **スタイルの乖離**: `BusinessUnitSelector` と `BusinessUnitSingleSelector` のスタイルが別々にメンテされるため、将来的に乖離する可能性 → 同じ Tailwind クラスを明示的に揃えて対応
- **BU 0件時の表示**: BUデータが空の場合のエッジケース → 既存の `buLoading` ガードでカバー済み

## References
- `apps/frontend/src/features/workload/components/BusinessUnitSelector.tsx` — 既存マルチセレクトBU選択コンポーネント
- `apps/frontend/src/routes/indirect/simulation/index.lazy.tsx` — 現行シミュレーション画面
- `apps/frontend/src/features/indirect-case-study/hooks/useIndirectSimulation.ts` — BU変更リセットロジック
