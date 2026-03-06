# Research & Design Decisions

## Summary
- **Feature**: `workload-layout`
- **Discovery Scope**: Extension / Simple Addition
- **Key Findings**:
  - スクロール不可の根本原因は `h-full` によるグリッドコンテナの高さ制約
  - SidePanel 内の `overflow-y-auto`（L95）は機能しているが、子要素が親高さに制約されているためスクロールが発生しない
  - チャートの固定高さ `h-[400px]` と凡例の `h-full` の組み合わせでは、カードの flex コンテナ内で高さが揃わない

## Research Log

### スクロール不可の原因特定
- **Context**: `both` モードでテーブルが見切れる問題
- **Findings**:
  - `SidePanel.tsx` L95 に `overflow-y-auto` があるため、スクロールコンテナ自体は存在する
  - `index.lazy.tsx` L225 の `<div className="grid grid-cols-1 gap-6 p-6 h-full">` が原因
  - `h-full`（`height: 100%`）がグリッドコンテナを親の高さに制約 → コンテンツが溢れてもグリッド自体が伸びない → スクロール不発生
- **Implications**: `h-full` を削除すればグリッドが自然な高さになり、`overflow-y-auto` が正常に機能する

### チャート単独時のフル高さ表示
- **Context**: `chart` モード時にチャートがカード内いっぱいに表示されない
- **Findings**:
  - `WorkloadChart.tsx` L157 の `h-[400px]` が固定高さを設定
  - `chart` 単独時はグリッドコンテナに `h-full` + チャートカードに `flex-1 flex flex-col` + チャート要素に `flex-1` を適用すればフル高さ表示可能
  - `both` 時は固定高さ `h-[400px]` を維持してテーブルとの共存を保証
- **Implications**: viewモードに応じた高さ制御が必要（props or className切り替え）

### 凡例パネルとの高さ整合
- **Context**: チャートと凡例パネルの間に余白が発生
- **Findings**:
  - チャートカード内の `div.flex` コンテナに高さ指定がない
  - `WorkloadChart` が `h-[400px]` でコンテンツの高さを決定し、`LegendPanel` は `h-full` で追従
  - しかしカード全体の padding（`p-6`）やチャート内の余白が不整合の原因
  - 解決策: flex コンテナに `items-stretch` を明示（デフォルトだが確認）し、チャートと凡例の高さを同一にする
- **Implications**: チャートカード内の flex レイアウト調整で解決可能

## Design Decisions

### Decision: viewモードに応じたグリッドコンテナの高さ制御
- **Context**: `both` 時はスクロール可能、`chart`/`table` 単独時は画面内収容が必要
- **Alternatives Considered**:
  1. グリッドコンテナの `h-full` を常に削除し、`chart`/`table` 時は `min-h-full` に変更
  2. viewモードに応じて `h-full` / クラスなし を条件分岐
- **Selected Approach**: Option 2 — viewモードで条件分岐
- **Rationale**: `chart`/`table` 単独時は `h-full` が必要（flex-1で親いっぱいに広がるため）。`both` 時のみ `h-full` を外してコンテンツの自然な高さでスクロール可能にする。
- **Trade-offs**: 条件分岐のCSSクラスが増えるが、動作が明確

### Decision: WorkloadChart の高さ制御方法
- **Context**: chart単独時はフル高さ、both時は固定高さが必要
- **Alternatives Considered**:
  1. `fullHeight` boolean prop を追加
  2. `className` prop で外部から高さクラスを注入
- **Selected Approach**: Option 1 — `fullHeight` prop
- **Rationale**: 意図が明確で、コンポーネントの責務内で高さを制御できる。className 注入はスタイル結合度が高い。
- **Trade-offs**: props が1つ増えるが、型安全で意図が明確

## Risks & Mitigations
- チャートのフル高さ表示時に ResponsiveContainer のリサイズが追従しない可能性 → flex-1 + h-full の組み合わせで検証
- 凡例パネル内のスクロールがチャート高さ変更で崩れる可能性 → items-stretch で高さを揃えることで回避
