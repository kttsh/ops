# Gap Analysis: workload-layout

## 1. 現状調査

### 対象ファイルとレイアウト構造

```
index.lazy.tsx (L160)
└── div.flex.h-full.flex-col           ← ページルート
    ├── ヘッダーバー (border-b)
    ├── BU選択 (border-b)
    └── div.flex-1.overflow-hidden     ← L176: メインコンテンツ ★問題箇所1
        └── SidePanel
            ├── サイドパネル (w-[600px])
            └── div.flex.flex-1.flex-col.overflow-hidden  ← SidePanel L81 ★問題箇所2
                └── div.flex-1.overflow-y-auto            ← SidePanel L95: children表示エリア
                    └── div.grid.grid-cols-1.gap-6.p-6.h-full ← L225 ★問題箇所3
                        ├── チャート+凡例カード (rounded-3xl)
                        │   └── div.flex
                        │       ├── WorkloadChart (div.h-[400px]) ★問題箇所4
                        │       └── LegendPanel (div.h-full.w-72)
                        └── テーブルカード (rounded-3xl)
```

### 特定された問題箇所

| # | ファイル | 行 | 現状 | 問題 |
|---|---------|-----|------|------|
| 1 | index.lazy.tsx | 176 | `overflow-hidden` | viewモードに関わらず常に overflow-hidden |
| 2 | SidePanel.tsx | 81 | `overflow-hidden` | メインエリアも overflow-hidden で固定 |
| 3 | index.lazy.tsx | 225 | `h-full` on grid | コンテンツが親の高さに制約される |
| 4 | WorkloadChart.tsx | 157 | `h-[400px]` 固定 | chart単独時にカード内いっぱいに拡張しない |

### overflow チェーン分析

SidePanel L95 の `overflow-y-auto` はスクロールを許可しているが、`both` モードでチャート(400px固定)+テーブルの合計高さが表示領域を超えた場合、以下の問題がある:

- L225 の `h-full` がグリッドコンテナの高さを親に制約 → コンテンツが溢れてもスクロール領域が正しく計算されない可能性
- SidePanel L81 の `overflow-hidden` が二重にかかっている

### 凡例パネル高さ不整合

- `WorkloadChart`: `h-[400px]` 固定（padding含まず）
- `LegendPanel`: `h-full` で親の flex コンテナに依存
- 親カードの `div.flex` に明示的な高さ指定なし → チャートの固定高さが flex アイテムの高さを決定するが、LegendPanel のヘッダー+コンテンツ+padding と WorkloadChart の高さが一致しない

## 2. 要件との技術的マッピング

| 要件 | 技術的ニーズ | 現状 | ギャップ |
|------|-------------|------|---------|
| Req1: both時スクロール | overflow-y-auto + 高さ制約解除 | overflow-hidden + h-full制約 | **修正必要** |
| Req2: chart単独時フル高さ | flex-1 + h-full on chart | h-[400px] 固定 | **修正必要** |
| Req3: table単独時画面内収容 | overflow-hidden維持 | overflow-hidden | 現状維持（条件分岐追加） |
| Req4: チャート-凡例高さ整合 | flex レイアウト調整 | 固定高さと h-full の不整合 | **修正必要** |
| Req5: 既存機能非退行 | 変更後の動作確認 | 正常動作中 | 回帰テスト必要 |

## 3. 実装アプローチ分析

### Option A: 既存ファイルの最小修正（推奨）

viewモードに応じたCSSクラスの条件分岐を追加する。

**変更対象:**
1. **index.lazy.tsx**:
   - L176: `overflow-hidden` → viewに応じて `overflow-y-auto`（both時）/ `overflow-hidden`（その他）
   - L225: `h-full` を削除（both時はコンテンツの自然な高さで表示）
   - chart単独時: チャートカードに `flex-1` を追加してカード内フル高さ
2. **WorkloadChart.tsx**:
   - L157: `h-[400px]` → props で制御（both時は固定高さ、chart単独時は `h-full`/`flex-1`）
3. **SidePanel.tsx**:
   - L81: `overflow-hidden` → viewモードに応じた制御（またはchildrenコンテナ側で対応）

**トレードオフ:**
- ✅ 変更ファイル数が最小（2-3ファイル）
- ✅ 既存パターンの延長で理解しやすい
- ❌ viewモードをWorkloadChartに渡すためのprops追加が必要
- ❌ SidePanelにviewモードの知識が漏れる可能性

### Option B: レイアウトコンテナの分離

viewモードごとのレイアウトラッパーコンポーネントを新規作成する。

**新規コンポーネント:**
- `WorkloadLayout.tsx`: viewモードに応じたレイアウト切り替えロジックを集約

**トレードオフ:**
- ✅ レイアウトロジックが一箇所に集約
- ✅ index.lazy.tsx の見通しが良くなる
- ❌ 新規ファイル作成が必要
- ❌ この規模の変更にはオーバーエンジニアリング

### Option C: SidePanel のメインエリア overflow を外部制御可能にする

SidePanel に `mainClassName` や `scrollable` props を追加する。

**トレードオフ:**
- ✅ SidePanelの汎用性向上
- ❌ SidePanelの責務が曖昧になる
- ❌ 現時点でSidePanelを他画面で使い回す予定がない

## 4. 複雑度・リスク評価

- **工数**: **S**（1-3日）— CSSクラスの条件分岐が主な変更。既存パターンの延長。
- **リスク**: **Low** — UIレイアウトのみの変更。ビジネスロジック・データフロー・API に影響なし。

## 5. 設計フェーズへの推奨事項

### 推奨アプローチ: Option A（既存ファイルの最小修正）

変更規模が小さく、レイアウトのCSS調整が主体であるため、新規コンポーネント作成は不要。

### 設計時の検討ポイント

1. **WorkloadChart への props 設計**: `fullHeight?: boolean` のような単純なフラグか、`className` のオーバーライドか
2. **SidePanel の overflow 制御**: SidePanel内部（L81, L95）の修正 vs index.lazy.tsx 側での対応
3. **chart単独時の高さ計算**: `flex-1` で親コンテナいっぱいに広がるか、CSS的に検証が必要

### Research Needed
- なし（既知のCSS Flexboxパターンで対応可能）
