# Design Document: frontend-bugfixes-55-56

## Overview

**Purpose**: フロントエンドの表示バグ2件（浮動小数点精度エラー、チャートフォーカス枠）を修正し、ユーザーのデータ信頼性とUI操作感を改善する。

**Users**: 事業部リーダー・プロジェクトマネージャーが間接業務比率の管理画面とWorkloadダッシュボードを使用する際に影響する。

**Impact**: 既存コンポーネントの表示ロジックとグローバルCSSに最小限の変更を加える。データモデル・保存ロジック・APIへの変更はない。

### Goals
- 間接業務比率の百分率変換時の浮動小数点丸め誤差を排除する
- RechartsチャートのSVG要素に対するブラウザデフォルトのフォーカスoutlineを抑制する
- 既存機能への回帰を発生させない

### Non-Goals
- 数値丸めユーティリティの汎用化（使用箇所が1箇所のため不要）
- `CalculationResultTable.tsx`の修正（比率のパーセント表示を行っていないため対象外）
- `case-study/WorkloadChart.tsx`の個別修正（グローバルCSS修正で自動的にカバー）

## Architecture

### Existing Architecture Analysis

修正対象はフロントエンドの表示層のみ。アーキテクチャの変更は不要。

- **既存パターン**: features配下のコンポーネントが`@tanstack/react-query`でデータ取得し、ローカルstateで表示管理
- **保持すべき制約**: DB保存ロジック（`ratioPercent / 100`変換）は変更しない
- **グローバルCSS**: `globals.css`の`@layer base`にスタイルルールを追加するパターンが確立済み

### Architecture Pattern & Boundary Map

シンプルなバグ修正のためダイアグラムは省略。変更は以下の2ポイントに限定される:

- **IndirectWorkRatioMatrix.tsx**: データ初期化時の百分率変換ロジック（1行）
- **globals.css**: RechartsフォーカスCSS（1ルール）

**Architecture Integration**:
- Selected pattern: 既存パターンの保持（変更なし）
- 新規コンポーネント: なし
- Steering compliance: feature-first構成・`@layer base`スタイル管理を維持

### Technology Stack

| Layer | Choice / Version | Role in Feature | Notes |
|-------|------------------|-----------------|-------|
| Frontend | React 19 + TypeScript 5.9 | コンポーネント修正 | 既存バージョンのまま |
| Styling | Tailwind CSS v4 | グローバルCSS修正 | `globals.css`の`@layer base` |
| Charts | Recharts | フォーカス枠の抑制対象 | 新規依存なし |

## Requirements Traceability

| Requirement | Summary | Components | Interfaces | Flows |
|-------------|---------|------------|------------|-------|
| 1.1 | 比率の正確な百分率表示 | IndirectWorkRatioMatrix | − | データ初期化フロー |
| 1.2 | `0.07*100`が`7`と表示 | IndirectWorkRatioMatrix | − | データ初期化フロー |
| 1.3 | 小数桁数の維持 | IndirectWorkRatioMatrix | − | データ初期化フロー |
| 1.4 | CalculationResultTable同等精度 | − | − | − |
| 1.5 | 保存ロジックへの非影響 | − | − | − |
| 2.1 | クリック時にoutline非表示 | globals.css | − | − |
| 2.2 | Chrome/Edge対応 | globals.css | − | − |
| 2.3 | ツールチップ等への非影響 | globals.css | − | − |
| 2.4 | 内部SVG要素への適用 | globals.css | − | − |
| 3.1 | TypeScriptコンパイル通過 | 全修正対象 | − | − |
| 3.2 | テストスイート通過 | 全修正対象 | − | − |
| 3.3 | ESLintエラーなし | 全修正対象 | − | − |

**Note**: 1.4は修正不要（CalculationResultTableは比率%表示なし）、1.5は設計上の制約（保存ロジックに触れない）。

## Components and Interfaces

| Component | Domain/Layer | Intent | Req Coverage | Key Dependencies | Contracts |
|-----------|--------------|--------|--------------|------------------|-----------|
| IndirectWorkRatioMatrix | indirect-case-study / UI | 比率データ初期化時の丸め処理追加 | 1.1, 1.2, 1.3 | indirectWorkTypeRatiosQuery (P1) | State |
| globals.css | Styles / Global | Recharts SVGフォーカスoutline抑制 | 2.1, 2.2, 2.3, 2.4 | − | − |

### UI Layer

#### IndirectWorkRatioMatrix（修正）

| Field | Detail |
|-------|--------|
| Intent | APIデータ初期化時の百分率変換に丸め処理を追加し、浮動小数点精度エラーを排除する |
| Requirements | 1.1, 1.2, 1.3 |

**Responsibilities & Constraints**
- データ初期化フロー（line 52-53）で `item.ratio * 100` を `Math.round(item.ratio * 10000) / 100` に変更
- 保存ロジック（`ratioPercent / 100`、line 71）は変更しない
- `localData`の型（`Record<string, number>`）は変更なし

**Dependencies**
- Inbound: `indirectWorkTypeRatiosQueryOptions` — DB比率データ取得 (P1)

**Contracts**: State [x]

##### State Management
- **State model**: `localData: Record<string, number>` — key: `${fiscalYear}-${workTypeCode}`, value: 丸め済み百分率（0-100）
- **変更点**: 初期化時の値が丸め処理済みになる。型・構造・ライフサイクルの変更なし

**Implementation Notes**
- 変更箇所: line 53 の `item.ratio * 100` → `Math.round(item.ratio * 10000) / 100`
- `getTotal`（line 86-95）は`localData`の値を合算するため、丸め済み値が使用され`.toFixed(1)`表示も正確になる
- Input `value`属性（line 141）も丸め済み値を表示するため追加修正不要

### Styles Layer

#### globals.css（修正）

| Field | Detail |
|-------|--------|
| Intent | Recharts SVG要素のフォーカスoutlineを抑制し、チャートクリック時の黒枠を除去する |
| Requirements | 2.1, 2.2, 2.3, 2.4 |

**Implementation Notes**
- `@layer base` ブロック内に以下のCSSルールを追加:
  ```css
  .recharts-surface:focus,
  .recharts-surface *:focus {
    outline: none;
  }
  ```
- セレクタを `.recharts-surface` スコープに限定し、Recharts以外の要素への影響を防止
- `WorkloadChart.tsx`の既存`style={{ outline: "none" }}`は防御的に残置
- Chrome/Edgeの両ブラウザで`:focus`擬似クラスによるoutlineが抑制される
- ツールチップ・凡例等のインタラクションはoutlineとは無関係のため影響なし

## Testing Strategy

### 手動テスト（UI表示の視覚的確認）

1. **浮動小数点修正の確認**:
   - `/master/indirect-work-cases` 画面で比率7%, 33.3%, 50%を入力・保存・再表示し、値が正確に表示されることを確認
   - 合計行の表示も正確であることを確認

2. **フォーカス枠修正の確認**:
   - `/workload` ダッシュボードのAreaチャートをクリックし、Chrome/Edgeで黒枠が出ないことを確認
   - ツールチップ・凡例・フルスクリーン機能が正常に動作することを確認

### 自動テスト（回帰防止）

1. TypeScriptコンパイル: `pnpm build` が成功すること
2. テストスイート: `pnpm test` が全パスすること
3. Lint: `pnpm lint` がエラーなしで完了すること
