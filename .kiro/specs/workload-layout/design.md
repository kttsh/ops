# Design Document: workload-layout

## Overview

**Purpose**: Workload画面のviewモード（chart / table / both）に応じたレイアウトの動的切り替えにより、スクロール制御・チャート高さ・凡例整合の問題を解決する。

**Users**: 事業部リーダー・プロジェクトマネージャーがWorkloadダッシュボードでチャートとテーブルを切り替えて利用する。

**Impact**: 既存の `index.lazy.tsx`、`WorkloadChart.tsx` のCSSクラスとpropsを変更する。機能追加ではなくレイアウト修正。

### Goals
- viewモードに応じた適切なスクロール制御の実現
- チャート単独表示時のフル高さ表示
- チャートと凡例パネルの高さ整合
- 既存機能（凡例ホバー/ピン、ビュー切替）の非退行

### Non-Goals
- テーブルのレイアウト変更やカラム構成の変更
- SidePanelの汎用化やprops拡張
- チャートの描画ロジックやデータフローの変更

## Architecture

### Existing Architecture Analysis

現在のレイアウト階層:

```
WorkloadPage (h-full flex-col)
├── ヘッダーバー
├── BU選択バー
└── メインコンテンツ (flex-1 overflow-hidden) ← 問題箇所1
    └── SidePanel
        ├── サイドパネル (w-[600px])
        └── メインエリア (flex-1 overflow-hidden) ← 問題箇所2
            └── children (flex-1 overflow-y-auto)
                └── グリッド (h-full) ← 問題箇所3
                    ├── チャートカード
                    │   ├── WorkloadChart (h-[400px]) ← 問題箇所4
                    │   └── LegendPanel (h-full w-72)
                    └── テーブルカード
```

**問題の根本原因**:
1. グリッドコンテナの `h-full` がコンテンツの自然な高さを抑制 → `overflow-y-auto` が機能しない
2. `WorkloadChart` の `h-[400px]` 固定 → chart単独時にカード内いっぱいに広がらない
3. チャートカード内の flex レイアウトでチャートと凡例の高さが不整合

### Architecture Pattern & Boundary Map

**Architecture Integration**:
- 選択パターン: 既存コンポーネントの最小修正（Option A from gap-analysis）
- 変更は2ファイルのCSSクラスとpropsに限定
- 新規コンポーネント作成なし
- 既存のデータフロー・状態管理パターンに変更なし

## Requirements Traceability

| Requirement | Summary | Components | Interfaces |
|-------------|---------|------------|------------|
| 1.1 | both時スクロール有効 | WorkloadPage | グリッドコンテナのクラス条件分岐 |
| 1.2 | both時チャート+テーブル完全表示 | WorkloadPage | グリッドコンテナのクラス条件分岐 |
| 2.1 | chart単独時フル高さ | WorkloadPage, WorkloadChart | `fullHeight` prop |
| 2.2 | chart単独時余白なし | WorkloadPage, WorkloadChart | チャートカードのflex制御 |
| 2.3 | chart単独時スクロール無効 | WorkloadPage | グリッドコンテナのクラス条件分岐 |
| 3.1 | table単独時画面内収容 | WorkloadPage | グリッドコンテナのクラス条件分岐 |
| 3.2 | table単独時スクロール無効 | WorkloadPage | グリッドコンテナのクラス条件分岐 |
| 4.1 | チャート-凡例高さ整合 | WorkloadPage | チャートカード内flex調整 |
| 4.2 | チャート-凡例余白なし | WorkloadPage | チャートカード内flex調整 |
| 5.1-5.4 | 既存機能非退行 | 全コンポーネント | 変更なし（目視確認） |

## Components and Interfaces

| Component | Domain/Layer | Intent | Req Coverage | Key Dependencies | Contracts |
|-----------|-------------|--------|-------------|-----------------|-----------|
| WorkloadPage | UI / Route | viewモードに応じたレイアウト制御 | 1.1-4.2 | WorkloadChart (P0) | State |
| WorkloadChart | UI / Feature | チャート高さの動的制御 | 2.1, 2.2 | ResponsiveContainer (P0) | State |

### UI / Route

#### WorkloadPage (`index.lazy.tsx`)

| Field | Detail |
|-------|--------|
| Intent | viewモードに応じたグリッドコンテナのCSSクラスとチャートカードのレイアウトを制御する |
| Requirements | 1.1, 1.2, 2.1, 2.2, 2.3, 3.1, 3.2, 4.1, 4.2 |

**Responsibilities & Constraints**
- viewモード（`chart` / `table` / `both`）に応じたグリッドコンテナの高さ・overflow制御
- chart単独時のチャートカードへの `flex-1` 付与
- チャートカード内のflex配置による凡例との高さ整合

**Contracts**: State [x]

##### State Management

**グリッドコンテナのクラス条件分岐**:

| viewモード | グリッドコンテナのクラス | スクロール |
|-----------|----------------------|----------|
| `both` | `grid grid-cols-1 gap-6 p-6`（`h-full` なし） | 有効（親の `overflow-y-auto` が機能） |
| `chart` | `flex flex-col gap-6 p-6 h-full` | 無効（コンテンツが画面内に収まる） |
| `table` | `flex flex-col gap-6 p-6 h-full` | 無効（コンテンツが画面内に収まる） |

**チャートカードのレイアウト条件分岐**:

| viewモード | チャートカードの追加クラス | 内部flex |
|-----------|------------------------|---------|
| `chart` | `flex-1 flex flex-col` | 内部の `div.flex` に `flex-1` を追加 |
| `both` | なし（現状維持） | 現状維持 |

**Implementation Notes**
- `cn()` ユーティリティで条件分岐を実装
- `showChart` / `showTable` の既存フラグに加え、`filters.view` の値で分岐
- チャートカード内の `div.flex` は `items-stretch`（flexデフォルト）で高さを揃える

### UI / Feature

#### WorkloadChart (`WorkloadChart.tsx`)

| Field | Detail |
|-------|--------|
| Intent | `fullHeight` prop に応じてチャートコンテナの高さを動的に制御する |
| Requirements | 2.1, 2.2 |

**Responsibilities & Constraints**
- `fullHeight` が `true` の場合: `h-full flex-1` で親コンテナいっぱいに拡張
- `fullHeight` が `false` または未指定の場合: 従来の `h-[400px]` 固定高さを維持
- `ResponsiveContainer` が親の高さ変更に追従してリサイズ

**Contracts**: State [x]

##### State Management

```typescript
interface WorkloadChartProps {
  data: MonthlyDataPoint[];
  seriesConfig: ChartSeriesConfig;
  activeMonth: string | null;
  dispatch: React.Dispatch<LegendAction>;
  isFetching?: boolean;
  fullHeight?: boolean; // 追加: chart単独モード時にtrue
}
```

**高さクラスの決定ロジック**:

| `fullHeight` | コンテナクラス |
|-------------|--------------|
| `true` | `relative h-full flex-1 w-full` + `style={{ contain: "content" }}` |
| `false` / 未指定 | `relative h-[400px] w-full` + `style={{ contain: "content" }}`（現状維持） |

**Implementation Notes**
- `fullHeight` は optional prop として追加（後方互換性維持）
- `ResponsiveContainer` は `width="100%" height="100%"` のため、親要素の高さ変更に自動追従
- `ChartFullscreenDialog` ボタンの位置は `absolute` のため影響なし

## Testing Strategy

### 目視確認チェックリスト

CSSレイアウト変更のため、自動テストではなく目視確認が適切:

1. **both モード**: チャート+テーブルが画面を超える場合に縦スクロール可能
2. **both モード**: チャートとテーブルの両方が完全に表示される
3. **chart モード**: チャートがカード内いっぱいに表示される（余白なし）
4. **chart モード**: 縦スクロールが発生しない
5. **table モード**: テーブルが画面内に収まる
6. **table モード**: 縦スクロールが発生しない
7. **チャート-凡例**: 高さが揃っている（余白なし）
8. **凡例ホバー**: ホバーハイライトが正常動作
9. **凡例ピン**: ピン操作が正常動作
10. **ビュー切替**: 各モード切り替え時にレイアウトが即座に更新
11. **サイドパネル**: 開閉時にレイアウトが崩れない
12. **TypeScript**: `npx tsc -b` でエラーなし
