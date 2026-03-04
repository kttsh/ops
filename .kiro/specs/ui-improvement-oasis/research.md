# Research & Design Decisions

## Summary
- **Feature**: `ui-improvement-oasis`
- **Discovery Scope**: Extension（既存 UI スタイリングの移行）
- **Key Findings**:
  - Tailwind CSS v4 の `@theme` は hex 値をサポートし、`color-mix()` ベースの opacity modifier（`bg-primary/10`）も動作する
  - Noto Sans JP は `@fontsource/noto-sans-jp` npm パッケージで導入し、400/700 ウェイトのみインポートするのが最適
  - Recharts の複数 Area へのグラデーション適用は `<defs>` 内の `<linearGradient>` + `url(#id)` パターンで実装可能。10+ グラデーションでもパフォーマンス問題なし

## Research Log

### Tailwind CSS v4 @theme カラーフォーマット
- **Context**: Oasis Light は hex 値（#6366F1 等）で色を定義しているが、現行 globals.css は oklch を使用。混在可能かの確認
- **Sources**: Tailwind CSS v4 公式ドキュメント、GitHub Discussions
- **Findings**:
  - `@theme` で hex と oklch の混在は可能
  - opacity modifier（`bg-primary/10`）は `color-mix(in oklch, var(--color-primary) 10%, transparent)` に展開され、hex 値でも動作する
  - hex は sRGB 色域に限定されるが、Oasis Light の色はすべて sRGB 範囲内
- **Implications**: hex 値を直接 `@theme` で定義可能。oklch への変換は不要。可読性と Oasis 仕様との一致を優先し、hex で統一する

### Noto Sans JP 導入方法
- **Context**: 日本語フォントの追加方法と、バンドルサイズへの影響の調査
- **Sources**: @fontsource/noto-sans-jp npm, Google Fonts CDN 比較分析
- **Findings**:
  - Google Fonts CDN: 追加ネットワークリクエスト発生、プライバシー懸念あり
  - `@fontsource/noto-sans-jp`: セルフホスト、バージョン固定、CDN 不要
  - 400 + 700 ウェイトで約 6MB（gzip 後 1.2-1.5MB）
  - `font-display: swap` で FOIT を回避
- **Implications**: `@fontsource/noto-sans-jp` を採用。globals.css の `@import` で 400/700 ウェイトのみ読み込む

### Recharts ComposedChart グラデーション
- **Context**: Workload チャートの複数 stacked Area にグラデーション塗りを適用する方法
- **Sources**: Recharts 公式ドキュメント、shadcn/ui charts、コミュニティ実装例
- **Findings**:
  - `<defs>` セクション内に `<linearGradient>` を定義し、各 Area の `fill` で `url(#gradientId)` 参照
  - 動的生成パターン: `seriesConfig.map()` でグラデーション定義と Area を同時生成
  - React の `useId()` でユニークな ID 生成（コンポーネント複数レンダリング時の衝突防止）
  - 10-20 グラデーションではパフォーマンス影響は無視可能
  - `useMemo` でグラデーション定義をメモ化推奨
- **Implications**: 既存の `useChartData` フック内のシリーズ設定を拡張し、グラデーション ID を生成する。`WorkloadChart.tsx` の `<defs>` セクションを追加

### 角丸の更新戦略
- **Context**: `--radius-*` CSS 変数を変更するだけでは不十分（コンポーネントが直接 `rounded-xl` を使用）
- **Sources**: 既存コードベースの Grep 分析
- **Findings**:
  - `globals.css` の `--radius-*` 変数はコンポーネントから直接参照されていない
  - 各 UI コンポーネント（button, input, select 等）で `rounded-xl` がハードコードされている
  - Tailwind CSS v4 ではカスタム角丸クラスを `@theme` で定義可能だが、既存クラスの置換が必要
- **Implications**: `--radius-*` 変数の更新に加え、各コンポーネントの Tailwind クラスを直接書き換える。変数参照への統一は将来の改善として先送り

## Design Decisions

### Decision: カラーフォーマットの選択
- **Context**: 現行 oklch と Oasis 仕様の hex の間で統一が必要
- **Alternatives**:
  1. oklch に変換して統一
  2. hex で統一
  3. 混在を許容
- **Selected**: hex で統一
- **Rationale**: Oasis Light 仕様と直接一致し、デザイナーとの共通言語として可読性が高い。opacity modifier も `color-mix()` 経由で動作する
- **Trade-offs**: oklch の広色域は失われるが、Oasis パレットでは不要

### Decision: フォント導入方法
- **Context**: Noto Sans JP の追加方法
- **Alternatives**:
  1. Google Fonts CDN
  2. @fontsource/noto-sans-jp npm
  3. セルフホスト（手動最適化）
- **Selected**: @fontsource/noto-sans-jp npm
- **Rationale**: CDN 依存なし、バージョン固定、プライバシー安全。手動最適化の工数不要
- **Trade-offs**: バンドルサイズ増加（gzip 後約 1.2MB）だが、ビジネスアプリとしては許容範囲

### Decision: 実装フェーズ戦略
- **Context**: 15-25 ファイルの変更を安全に適用する方法
- **Alternatives**:
  1. 一括適用
  2. 4 フェーズ段階適用
- **Selected**: 4 フェーズ段階適用
- **Rationale**: Phase 1（デザイントークン）の影響を先に確認し、Phase 2 以降の安全性を担保
- **Trade-offs**: 中間状態でのスタイル不整合が一時的に発生するが、段階的検証のメリットが上回る

## Risks & Mitigations
- **Primary カラー変更の広範囲影響**: 暗灰色 → Indigo への変更で `bg-primary` を使用する全箇所に影響 → Phase 1 で早期確認
- **フォントバンドルサイズ**: CJK フォントは重い → 400/700 のみ、将来的にサブセッティング可能
- **チャートグラデーションのパフォーマンス**: 多数の Area にグラデーション適用 → 10-20 定義は問題なし（調査済み）

## References
- [Tailwind CSS v4 Theme Variables](https://tailwindcss.com/docs/theme) — @theme でのカスタム変数定義
- [Fontsource Noto Sans JP](https://fontsource.org/fonts/noto-sans-jp/install) — npm パッケージドキュメント
- [Recharts Customization Guide](https://recharts.github.io/en-US/guide/customize/) — SVG グラデーション実装パターン
