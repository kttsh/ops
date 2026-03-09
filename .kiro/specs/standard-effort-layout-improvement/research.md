# Research & Design Decisions

## Summary
- **Feature**: `standard-effort-layout-improvement`
- **Discovery Scope**: Extension（既存UIコンポーネントのレイアウト修正）
- **Key Findings**:
  - 変更対象は3コンポーネントのみ。バックエンド・型定義・バリデーションへの影響なし
  - テーブル転置（21行→21列）が最大の設計課題。横スクロール不要制約のためセル幅の最適化が必要
  - 新規依存ライブラリ不要。既存のTailwind CSSクラス変更のみで対応可能

## Research Log

### テーブル21列の横幅フィット検証
- **Context**: 進捗率0%〜100%（21列）を横スクロールなしで表示する制約
- **Sources Consulted**: 既存コードの `StandardEffortMasterForm.tsx`、Tailwind CSS ドキュメント
- **Findings**:
  - カード上下配置（全幅）時のコンテナ幅: 約1200px（padding除外後）
  - 1列あたり約57px（1200px / 21列）。ヘッダーラベル最大3文字（100%）+ パディング
  - 読み取り専用セル: `text-xs tabular-nums` で十分収まる
  - 編集モードInput: `w-full` + `min-w-0` + `text-xs text-right` で3桁数値は表示可能
  - ヘッダーラベル: `0%`〜`100%` を `text-[10px]` または `text-xs` で表示
- **Implications**: カード全幅前提であれば横スクロール不要で21列を収容可能。Requirement 4（上下配置）が Requirement 5（横方向テーブル）の前提条件

### カード背景色 `bg-card` vs `bg-white`
- **Context**: カード透過問題（Q14-1）への対応
- **Sources Consulted**: shadcn/ui の CSS 変数定義、既存コンポーネント
- **Findings**:
  - `bg-card` は shadcn/ui の CSS 変数 `--card` を参照。ライトテーマでは `#ffffff` 相当
  - `bg-white` はハードコーディング。ダークテーマ対応時に問題になる
  - Detail コンポーネントは `bg-white` を使用中、Form の重みカードは背景色未指定
- **Implications**: `bg-card` への統一がテーマ対応の観点で最適。透過問題も解決される

### グラフ高さの最適化
- **Context**: カード上下配置後、グラフが全幅を使用する際の高さ調整（Q8-2）
- **Sources Consulted**: Recharts `ResponsiveContainer` ドキュメント、既存 `WeightDistributionChart.tsx`
- **Findings**:
  - 現在: `h-[256px]`（半幅カード前提）
  - 全幅カード時にグラフのアスペクト比が横長になりすぎる可能性
  - `h-[200px]` ～ `h-[240px]` の範囲で視認性を維持しつつ、横長比率を抑制可能
- **Implications**: 設計段階では `h-[200px]` を初期値として指定し、実装時に微調整

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| Option A: 既存直接修正 | 3コンポーネントを直接編集 | 新規ファイル不要、影響範囲最小 | Form内のdiffが大きくなる | **採用** |
| Option B: テーブル抽出 | WeightDistributionTable コンポーネントを新規作成 | テーブルロジック一元化 | TanStack Form fieldバインディングの設計が複雑 | 見送り |

## Design Decisions

### Decision: テーブル構造の転置方式
- **Context**: 21行×2列 → 1行×21列へのテーブル転置
- **Alternatives Considered**:
  1. ネイティブ `<table>` で横方向テーブルを構築
  2. CSS Grid (`grid-cols-21`) でカスタムレイアウト
  3. TanStack Table を導入して転置対応
- **Selected Approach**: ネイティブ `<table>` 要素で横方向テーブルを構築
- **Rationale**: 既存コードがネイティブ `<table>` を使用しており、パターンの一貫性を維持。21列程度であれば `<table>` で十分管理可能。TanStack Table の導入はオーバーエンジニアリング
- **Trade-offs**: セル幅の微調整が必要だが、Tailwind のユーティリティクラスで対応可能
- **Follow-up**: 実装後に主要ブレークポイント（1280px、1440px）での表示確認

### Decision: フォームフィールドの横並び範囲
- **Context**: BU + 案件タイプの横並び配置時の `max-w-md` 制約
- **Selected Approach**: BU + 案件タイプのみ `grid-cols-2` で横並び。パターン名は別行で全幅表示。`max-w-md` は削除または `max-w-2xl` 等に拡大
- **Rationale**: BU + 案件タイプは関連性が高く横並びが自然。パターン名は独立した情報で全幅が適切

## Risks & Mitigations
- テーブル21列のレスポンシブ対応 — カード全幅（上下配置）を前提条件とし、狭いビューポートは対象外
- 編集モードInputの幅 — `min-w-0` + `w-full` で親セル幅に追従させる
- グラフ高さの最適値 — 初期値 `h-[200px]` で実装し、レビュー時に調整
