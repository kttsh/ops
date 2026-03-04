# Gap Analysis: workload-chart-project-order

## 1. 現状調査

### 対象ファイルとデータフロー

```
SidePanelSettings (projOrder: number[] ← ローカル state)
  ↓ onProjectColorsChange のみ親に通知（並び順の通知なし）
WorkloadPage (projectColors state → useChartData に渡す)
  ↓
useChartData (rawResponse.projectLoads.forEach で areas を構築 → API 順固定)
  ↓ seriesConfig / legendDataByMonth
WorkloadChart (seriesConfig.areas の順序でエリアを描画)
LegendPanel (data.projects の順序で凡例を表示)
```

### 既存コンポーネントの状態

| ファイル | 役割 | 並び順との関係 |
|---------|------|---------------|
| `SidePanelSettings.tsx` | 案件色・並び順・プロファイル管理 | `projOrder` を `useState` で保持。`moveProjUp`/`moveProjDown` で操作。**親への通知コールバックなし** |
| `useChartData.ts` | API データ → チャートデータ変換 | `rawResponse.projectLoads.forEach` で areas 構築。**projectOrder パラメータなし** |
| `WorkloadPage` (`index.lazy.tsx`) | 全体オーケストレーション | `projectColors` state を橋渡し。**projectOrder state なし** |
| `LegendPanel.tsx` | 凡例表示 | `data.projects` の順序をそのまま表示。`data` は `legendDataByMonth` から取得 |
| `WorkloadChart.tsx` | チャート描画 | `seriesConfig.areas` の順序で `<Area>` を `.map()` |

### 既存パターン・規約

- **色設定の橋渡しパターン**: `SidePanelSettings` → `onProjectColorsChange` → `WorkloadPage` → `useChartData(params, { projectColors })` が確立済み。並び順も同じパターンで伝播可能
- **プロファイル適用**: `handleProfileApply` で `projOrder` と `projColors` を復元済み（`SidePanelSettings` 内部）。ただし並び順は外部に通知されない

## 2. 要件 × 既存資産マッピング

| 要件 | 既存資産 | ギャップ |
|------|---------|---------|
| Req 1: チャートシリーズ順序の同期 | `useChartData` に areas 構築ロジックあり | **Missing**: `projectOrder` パラメータ。areas のソートロジック |
| Req 1: 並び順の親通知 | `onProjectColorsChange` パターンあり | **Missing**: `onProjectOrderChange` コールバック |
| Req 2: 凡例パネルの順序同期 | `legendDataByMonth.projects` は API 順 | **Missing**: legendMap 構築時の並び替え、または LegendPanel 側でのソート |
| Req 3: プロファイル復元 | `handleProfileApply` で `setProjOrder` 済み | **Missing**: 並び順の外部通知（`onProjectOrderChange` 呼び出し） |
| Req 4: 型安全性 | `UseChartDataOptions` 型あり | **Missing**: `projectOrder?: number[]` プロパティ |

## 3. 実装アプローチ評価

### Option A: 既存コンポーネント拡張（推奨）

変更範囲が最小限で、確立済みの色設定パターン（`onProjectColorsChange`）と同一のデータフローを踏襲する。

**変更ファイル（3ファイル）:**

1. **`SidePanelSettings.tsx`**
   - `SidePanelSettingsProps` に `onProjectOrderChange?: (order: number[]) => void` 追加
   - `moveProjUp` / `moveProjDown` / `handleProfileApply` 内で `onProjectOrderChange` を呼び出し

2. **`useChartData.ts`**
   - `UseChartDataOptions` に `projectOrder?: number[]` 追加
   - `useMemo` 依存配列に `projectOrder` 追加
   - areas 構築後に `projectOrder` に基づいて案件シリーズをソート
   - `legendMap` 構築時も `projects` 配列を同じ順序でソート

3. **`index.lazy.tsx`（WorkloadPage）**
   - `projectOrder` state 追加
   - `handleProjectOrderChange` コールバック追加
   - `SidePanelSettings` に `onProjectOrderChange` 渡し
   - `useChartData` の options に `projectOrder` 渡し

**トレードオフ:**
- ✅ 色設定と同じパターンを踏襲（コードの一貫性）
- ✅ 変更ファイル最小（3ファイル）
- ✅ 後方互換（`projectOrder` 未指定時は既存動作）
- ❌ `WorkloadPage` の state が1つ増える（ただし色設定と同じ構造）

### Option B: useChartData でソートせず、描画側で対応

`seriesConfig.areas` はAPI順のまま保持し、`WorkloadChart` と `LegendPanel` がそれぞれ `projectOrder` を受け取ってソートする。

**トレードオフ:**
- ✅ `useChartData` の変更が不要
- ❌ ソートロジックが分散する（Chart と LegendPanel の2箇所）
- ❌ 新たな prop の追加がコンポーネント間で増える
- ❌ 一貫性の保証が難しい

### Option C: projOrder をグローバル state（zustand等）で管理

**トレードオフ:**
- ✅ props drilling を回避
- ❌ 現状このスコープのみで zustand 導入はオーバーエンジニアリング
- ❌ 既存の色設定パターン（props 経由）と不整合

## 4. 複雑度とリスク

- **工数見積**: **S（1〜3日）** — 確立済みの色設定パターンを踏襲し、3ファイルの限定的変更
- **リスク**: **Low** — 既存パターンの拡張であり、新規技術・アーキテクチャ変更なし。`useMemo` 依存配列の追加のみでパフォーマンス影響も軽微

## 5. デザインフェーズへの推奨事項

- **推奨アプローチ**: Option A（既存コンポーネント拡張）
- **主要決定事項**: `useChartData` 内でのソートタイミング（areas 構築後 vs forEach 順序変更）
- **Research Needed**: なし — 全ての技術要素は既存パターンで対応可能
