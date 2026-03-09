# Requirements Document

## Introduction

GitHub Issue #55 および #56 で報告されたフロントエンドのバグ2件を修正する。Issue #55 は `/master/indirect-work-cases` 画面における比率表示の浮動小数点精度エラー、Issue #56 は `/workload` ダッシュボードのAreaチャートクリック時に表示されるブラウザデフォルトのフォーカス枠（黒枠）である。いずれもユーザー体験に直接影響するUI表示の不具合であり、データ整合性や操作感の改善を目的とする。

## Requirements

### Requirement 1: 比率表示の浮動小数点精度エラー修正（Issue #55）

**Objective:** ユーザーとして、間接業務比率の入力値が正確に表示されることで、データの信頼性を確認できるようにしたい

#### Acceptance Criteria

1. When 間接業務比率がDBから取得され画面に表示される場合, the IndirectWorkRatioMatrix shall 浮動小数点の丸め誤差なく、入力時の値を正確に百分率で表示する（例: 7と入力した値は7と表示される）
2. When 比率値 `0.07` をDB（DECIMAL(5,4)）から取得して百分率に変換する場合, the IndirectWorkRatioMatrix shall `7.000000000000001` ではなく `7` と表示する
3. When 小数点を含む比率（例: 33.3%）が保存・再表示される場合, the IndirectWorkRatioMatrix shall 入力された小数桁数を維持し、丸め誤差を含まない値を表示する
4. While 間接シミュレーション画面（`/indirect/simulation`）に比率表示がある場合, the CalculationResultTable shall IndirectWorkRatioMatrix と同等の精度で比率を表示する
5. The 比率表示の修正 shall 既存の保存ロジック（UI → DB への `ratio / 100` 変換）に影響を与えない

### Requirement 2: Areaチャートのフォーカス枠（黒枠）除去（Issue #56）

**Objective:** ユーザーとして、Workloadチャートのエリアをクリックしても不要な黒枠が表示されないことで、クリーンなUI体験を得たい

#### Acceptance Criteria

1. When `/workload` ダッシュボードのAreaチャート部分をクリックした場合, the WorkloadChart shall ブラウザデフォルトのフォーカス枠（黒枠・outline）を表示しない
2. When Areaチャート部分をクリックした場合, the WorkloadChart shall Chrome および Edge の両ブラウザでフォーカス枠が表示されないこと
3. While フォーカス枠の抑制が適用されている場合, the WorkloadChart shall ツールチップ、凡例、その他のインタラクティブ機能に影響を与えない
4. The フォーカス枠の抑制スタイル shall Rechartsが内部生成するSVG要素（`<path>`, `<rect>` 等）に対しても適用される

### Requirement 3: 回帰防止

**Objective:** 開発者として、修正が既存機能を壊さないことを確認できるようにしたい

#### Acceptance Criteria

1. The 修正対象のコンポーネント shall TypeScript のコンパイルエラーを含まない
2. The 修正後のコード shall 既存のテストスイートをすべてパスする
3. The 修正 shall ESLint のエラーを新たに発生させない
