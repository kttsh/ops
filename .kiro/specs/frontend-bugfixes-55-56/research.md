# Research & Design Decisions

## Summary
- **Feature**: `frontend-bugfixes-55-56`
- **Discovery Scope**: Simple Addition（既存コンポーネントの軽微バグ修正）
- **Key Findings**:
  - `IndirectWorkRatioMatrix.tsx:53` の `item.ratio * 100` が唯一の浮動小数点精度エラー発生箇所
  - `CalculationResultTable.tsx` は比率のパーセント表示を行っておらず修正不要
  - Rechartsの内部SVG要素はCSSクラス `.recharts-surface` 配下に生成されるため、CSSセレクタで一括制御可能

## Research Log

### IEEE 754 浮動小数点精度とJavaScript
- **Context**: `0.07 * 100` が `7.000000000000001` になる問題
- **Findings**:
  - JavaScriptの`Number`型はIEEE 754倍精度浮動小数点。`0.07`は正確に表現できない
  - `Math.round(value * 10000) / 100` パターンで整数化→再除算することで丸め誤差を排除できる
  - `Number.EPSILON`ベースの比較は複雑で不要。単純な整数化アプローチで十分
- **Implications**: 1行の変更で解決可能。ユーティリティ関数の新規作成は不要（使用箇所が1箇所のみ）

### Recharts SVG要素のフォーカスoutline
- **Context**: `ComposedChart`に`style={{ outline: "none" }}`を設定済みだが、内部SVG要素に黒枠が残る
- **Findings**:
  - Rechartsは内部で`<svg class="recharts-surface">`を生成し、その中に`<path>`・`<rect>`等を配置
  - `accessibilityLayer={false}`を設定済みだが、ブラウザのデフォルトフォーカススタイルは抑制されない
  - CSSで `.recharts-surface *:focus { outline: none; }` を適用することで一括制御可能
- **Implications**: `globals.css`への1ルール追加で全Rechartsチャートに適用。`case-study/WorkloadChart.tsx`も自動的にカバーされる

## Design Decisions

### Decision: インライン丸め vs ユーティリティ関数
- **Context**: 浮動小数点丸め処理の実装方法
- **Alternatives Considered**:
  1. `Math.round(ratio * 10000) / 100` をインラインで適用
  2. `roundPercent(ratio)` ユーティリティ関数を作成
- **Selected Approach**: インライン適用
- **Rationale**: 使用箇所が1箇所のみ。過度な抽象化は不要
- **Trade-offs**: 再利用性は低いが、シンプルさを優先

### Decision: CSS vs インラインスタイル（フォーカス枠抑制）
- **Context**: Recharts SVG要素のフォーカスoutline抑制方法
- **Alternatives Considered**:
  1. `globals.css`にグローバルCSSルールを追加
  2. 各チャートコンポーネントにインラインスタイルを追加
- **Selected Approach**: `globals.css`にグローバルCSSルール追加
- **Rationale**: 全Rechartsチャートに一括適用でき、個別対応の漏れを防止。既存の`@layer base`パターンに沿う
- **Trade-offs**: 全チャートに影響するが、フォーカスoutlineの抑制は意図した動作

## Risks & Mitigations
- **リスク1**: 丸め処理が特定の小数値で精度を失う → `Math.round(ratio * 10000) / 100`は小数第2位まで保証、実用上十分
- **リスク2**: CSSルールがRecharts以外の要素に影響 → セレクタを`.recharts-surface`スコープに限定
