# Research & Design Decisions

## Summary
- **Feature**: `main-dashboard`
- **Discovery Scope**: New Feature（グリーンフィールド）
- **Key Findings**:
  - Recharts v3 の ComposedChart は 60 データポイント × 10+ シリーズで十分なパフォーマンスを発揮。`dot={false}` + `isAnimationActive={false}` が必須最適化
  - TanStack Virtual v3 と TanStack Table v8 の統合は CSS Grid レイアウト + `position: sticky` による列ピン固定で確立されたパターンあり
  - バックエンド `GET /chart-data` API は全集約データを単一レスポンスで返却。フロントエンドでのデータ変換が設計の中心

## Research Log

### Recharts v3 ComposedChart パフォーマンス
- **Context**: Req 1, 2, 20 — 60ヶ月×10+シリーズの積み上げエリアチャート描画性能
- **Sources**: [Recharts v3 Performance Guide](https://recharts.github.io/en-US/guide/performance/), [v3 API Docs](https://recharts.github.io/en-US/api/)
- **Findings**:
  - 60 データポイント × 13 シリーズは約 50-100 SVG 要素（dot 無効時）で問題なし
  - `dot={false}` で 780+ の `<circle>` 要素を削減（最大の最適化効果）
  - `isAnimationActive={false}` を各 Area/Line に個別設定が必要（チャートレベルの一括無効化なし）
  - v3 で `react-smooth` 依存が削除されバンドルサイズ削減
  - `reverseStackOrder` は v3.5.0 で修正済み
  - JSX の記述順が SVG の Z-index を決定（Area → Line の順で記述）
- **Implications**: パフォーマンスリスクは低い。`useMemo` でデータとシリーズ設定を安定化させること

### Recharts v3 カスタムカーソルとツールチップ制御
- **Context**: Req 4 — 縦線カーソル表示 + ツールチップ非表示
- **Sources**: [Tooltip API](https://recharts.github.io/en-US/api/Tooltip/), [Issue #1816](https://github.com/recharts/recharts/issues/1816)
- **Findings**:
  - `<Tooltip content={() => null} cursor={<CustomCursorLine />} />` でツールチップ非表示+カスタムカーソル実現
  - カスタムカーソルは `points` プロパティで座標を受け取り、SVG `<line>` を描画
  - v3 で `CategoricalChartState` が削除。`onClick`/`onMouseMove` のイベントデータ形式が変更
  - `activePayload`、`activeLabel`、`activeTooltipIndex` はイベントデータから引き続きアクセス可能
- **Implications**: 凡例パネルの状態管理と連動する設計が必要

### TanStack Virtual + Table 統合パターン
- **Context**: Req 12 — 最大 1,000 行の仮想スクロールテーブル
- **Sources**: [TanStack Table Virtualization Guide](https://tanstack.com/table/v8/docs/guide/virtualization), [Virtual API](https://tanstack.com/virtual/latest/docs/api/virtualizer)
- **Findings**:
  - `useVirtualizer` + `useReactTable` の組み合わせで実現
  - CSS Grid レイアウト（`display: grid`）が必須：`<table>`, `<thead>`, `<tbody>` を Grid 化
  - 固定行高さ 48px の場合、`measureElement` は不要（`estimateSize: () => 48` のみ）
  - `overscan: 5` で十分なスクロール体験
  - 列ピン固定は `position: sticky` + `column.getStart('left')` でオフセット計算
  - `border-collapse: separate` が sticky に必要
  - 列リサイズは `columnResizeMode: 'onEnd'`（パフォーマンス優先）+ `header.getResizeHandler()`
- **Implications**: `@tanstack/react-virtual` パッケージの追加が必要。列ピン固定とリサイズは TanStack Table 組み込み機能で実現可能

### 状態管理アプローチ
- **Context**: Req 4, 6, 7, 11 — 複合的な UI 状態管理
- **Sources**: 既存コードベース分析
- **Findings**:
  - 既存パターン: URL Search Params + TanStack Query（状態管理ライブラリなし）
  - ダッシュボード固有の状態: BU 選択、期間、ビューモード、凡例固定月、サイドパネル開閉
  - URL パーシスト対象: BU コード、期間、ビューモード（ブックマーク可能）
  - ローカル state 対象: 凡例固定月、ホバー月、サイドパネルタブ、テーブル年
- **Implications**: Zustand は不要。URL Search Params（永続化）+ React useState/useReducer（一時状態）で十分

### DnD ライブラリ選定
- **Context**: Req 9, 10 — スタック順序変更
- **Sources**: npm 調査
- **Findings**:
  - 要件は「ドラッグ&ドロップまたは上下ボタン」— 上下ボタンのみで MVP 実現可能
  - `@dnd-kit` は高品質だが追加依存が増加
  - 順序変更対象は案件タイプ（最大 10-20 項目）と間接作業ケース（最大 10 項目）— 少量
- **Implications**: MVP では上下ボタン方式を採用。将来 DnD が必要になった場合に `@dnd-kit` を追加

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| Feature Module | `features/workload/` として独立モジュール化 | 責務分離、独立テスト可能、既存 Feature への影響ゼロ | ファイル数が多い | 既存パターンに準拠 |
| Page-level Components | ルートファイルにロジックを集約 | ファイル数最小 | 巨大コンポーネント化、テスト困難 | 非推奨 |

**選択**: Feature Module パターン — 既存コードベースの確立されたパターンに準拠し、複雑なダッシュボード機能を管理可能な単位に分割

## Design Decisions

### Decision: データ変換層の配置
- **Context**: バックエンド API レスポンス（ProjectLoadAggregation 等）を Recharts データ形式に変換する必要がある
- **Alternatives**:
  1. カスタムフック内で変換
  2. 専用 Transform ユーティリティ
- **Selected**: カスタムフック `useChartData` 内で `useMemo` による変換
- **Rationale**: TanStack Query の `select` オプションと同等のパターン。変換ロジックとデータ取得を近接配置
- **Trade-offs**: フック内のロジック量が増えるが、単一責務（データ取得+変換）を維持

### Decision: 凡例パネルの状態管理
- **Context**: ホバー/クリック/固定の 3 状態を管理
- **Alternatives**:
  1. useState 個別管理
  2. useReducer による状態マシン
- **Selected**: useReducer による状態マシン
- **Rationale**: ホバー→固定→解除の状態遷移が複雑で、不正な状態遷移を防ぐ必要がある
- **Trade-offs**: 初期コードが増えるが、状態遷移の予測可能性が向上

### Decision: サイドパネル実装方式
- **Context**: 600px 幅の開閉式パネル（AppShell サイドバーとは別）
- **Alternatives**:
  1. 既存 Sheet コンポーネント（Radix UI）
  2. CSS transition ベースのカスタムパネル
- **Selected**: CSS transition ベースのカスタムパネル
- **Rationale**: Sheet はオーバーレイ型で、ダッシュボードのサイドパネルはインライン型（コンテンツを押し出す）。要件と異なる UX
- **Trade-offs**: カスタム実装が必要だが、レイアウトの柔軟性が高い

### Decision: 低スペック PC 対応のチャート描画戦略
- **Context**: ユーザーに低スペック PC（CPU 2コア、メモリ 4-8GB、統合 GPU）利用者が含まれる。Recharts の SVG 描画は CPU 負荷が高い
- **Alternatives**:
  1. アニメーション無効化のみ
  2. アニメーション無効化 + ドット全廃 + イベントスロットリング + CSS contain（包括的最適化）
  3. Canvas ベースのチャートライブラリに変更（ECharts 等）
- **Selected**: Option 2 — 包括的最適化
- **Rationale**: Recharts はインストール済みで TanStack エコシステムとの親和性が高い。Canvas 変更は学習コスト・実装コストが大きすぎる。SVG ベースでも最適化を徹底すれば低スペック PC で十分動作する（推定 50-100 SVG 要素）
- **Trade-offs**: ドット非表示によりデータポイントの視認性がやや低下するが、カスタムカーソル+凡例パネルで補完。アニメーション非表示で初回ロードの「洗練された感」は減るが、動作の安定性を優先
- **Key optimizations**:
  - `isAnimationActive={false}` + `animationDuration={0}` — 全 Area/Line/Tooltip
  - `dot={false}` + `activeDot={false}` — 全 Area（600+ circle 要素排除）
  - `accessibilityLayer={false}` — ARIA 要素生成抑制
  - `type="monotone"` — 軽量カーブ補間
  - `requestAnimationFrame` による onMouseMove スロットリング
  - `React.memo` + `useMemo` + `useCallback` — 不要な再レンダリング防止
  - `contain: content` — CSS リフロー範囲制限

### Decision: テーブルの仮想スクロール
- **Context**: 最大 1,000 行のデータテーブル
- **Alternatives**:
  1. 仮想スクロール（@tanstack/react-virtual）
  2. ページネーション
- **Selected**: 仮想スクロール
- **Rationale**: 要件が仮想スクロールを明示。ページネーションでは全データの俯瞰が困難
- **Follow-up**: `@tanstack/react-virtual` パッケージを追加インストール

## Risks & Mitigations
- **Recharts v3 初回統合リスク** — 既存使用実績がない。PoC として基本チャートを先行実装し、パフォーマンスを早期検証
- **仮想テーブル + 列ピン固定の複合パターン** — CSS Grid + sticky の組み合わせは実績あるが、列リサイズとの同時動作検証が必要
- **大量コンポーネントの管理** — Feature モジュール内で適切にサブディレクトリ分割し、index.ts でパブリック API を制御

## References
- [Recharts v3 Official Docs](https://recharts.github.io/en-US/api/) — チャートコンポーネント API
- [Recharts v3 Performance Guide](https://recharts.github.io/en-US/guide/performance/) — パフォーマンス最適化
- [TanStack Table Virtualization Guide](https://tanstack.com/table/v8/docs/guide/virtualization) — 仮想化テーブル
- [TanStack Table Column Pinning](https://tanstack.com/table/v8/docs/guide/column-pinning) — 列ピン固定
- [TanStack Virtual API](https://tanstack.com/virtual/latest/docs/api/virtualizer) — 仮想化ライブラリ API
