# Research & Design Decisions

## Summary
- **Feature**: `headcount-plan-linear-interpolation`
- **Discovery Scope**: Extension（既存ダイアログへのモード追加）
- **Key Findings**:
  - BulkInputDialog は単純な props ベースのコンポーネントで、`onApply(year, headcount)` コールバックで親に通知する構造
  - 親コンポーネント MonthlyHeadcountGrid の `handleBulkSet` が yearMonth → headcount のマッピングを生成しており、按分モードではこの部分を拡張する必要がある
  - shadcn/ui の Switch コンポーネントが利用可能で、モード切替 UI に適している

## Research Log

### コンポーネント構造の分析
- **Context**: BulkInputDialog の現在の構造と拡張ポイントの特定
- **Sources Consulted**: `BulkInputDialog.tsx`, `MonthlyHeadcountGrid.tsx`, `headcount-plan.ts`
- **Findings**:
  - BulkInputDialog は `onApply: (year: number, headcount: number) => void` という単一値コールバック
  - MonthlyHeadcountGrid の `handleBulkSet` が `MONTHS` 配列をイテレートして全月に同一値を設定
  - `getYearMonth(fiscalYear, monthStr)` ヘルパーで yearMonth キーを生成
  - `MONTHS` と `MONTH_LABELS` 定数が MonthlyHeadcountGrid に定義済み
- **Implications**: 按分モード用に新しいコールバック `onApplyInterpolation` を追加するか、`onApply` のシグネチャを拡張する必要がある

### UIコンポーネントの選定
- **Context**: モード切替に適した既存UIコンポーネントの調査
- **Sources Consulted**: `apps/frontend/src/components/ui/` ディレクトリ
- **Findings**:
  - `switch.tsx` が利用可能 — 2値切替に最適
  - `tabs` / `radio-group` / `toggle` は未導入
  - Switch + Label の組み合わせでシンプルなモード切替を実現可能
- **Implications**: 新規 shadcn/ui コンポーネントの追加不要、既存の Switch で十分

### 線形補間ロジック
- **Context**: 計算ロジックの仕様確認
- **Sources Consulted**: GitHub Issue #63
- **Findings**:
  - `value[i] = Math.round(startValue + (endValue - startValue) * i / 11)` で i=0..11
  - 4月（i=0）= startValue、3月（i=11）= endValue
  - 四捨五入により整数化（Math.round）
  - 減員パターン（startValue > endValue）も同一ロジックで対応可能
- **Implications**: 純粋関数として切り出し、テスト可能にすべき

## Design Decisions

### Decision: コールバックインターフェースの拡張方式
- **Context**: 按分モードで12ヶ月分の個別値を親に渡す必要がある
- **Alternatives Considered**:
  1. `onApply` のシグネチャを変更して union 型にする
  2. 新しいコールバック `onApplyInterpolation` を追加する
  3. BulkInputDialog 内部で補間計算し、MonthlyHeadcountGrid の handleBulkSet 相当の処理も行う
- **Selected Approach**: 新しいコールバック `onApplyInterpolation` を追加
- **Rationale**: 既存の `onApply` を変更しないことで後方互換性を維持。呼び出し側で按分結果のハンドリングを明示的に記述できる
- **Trade-offs**: props が1つ増えるが、型安全性と互換性のメリットが上回る
- **Follow-up**: MonthlyHeadcountGrid 側の handleBulkInterpolation の実装

### Decision: モード切替UIの選定
- **Context**: 「全月同一値」と「按分入力」の2モード切替
- **Alternatives Considered**:
  1. Switch コンポーネント（トグル）
  2. Tabs コンポーネント（未導入のため追加必要）
  3. Select ドロップダウン
- **Selected Approach**: Switch + Label
- **Rationale**: 2値切替に最適、既存コンポーネントで実現可能、ダイアログ内のスペースに収まる
- **Trade-offs**: 3モード以上への拡張時は再設計が必要だが、現時点では不要

## Risks & Mitigations
- **リスク1**: `onApply` の既存呼び出しが破壊される → 新しい `onApplyInterpolation` で分離することで回避
- **リスク2**: 補間計算の精度（浮動小数点誤差）→ Math.round で最終値を整数化することで許容範囲内
- **リスク3**: ダイアログのレイアウトが崩れる（プレビュー追加により高さ増加）→ スクロール可能なエリアの検討

## References
- GitHub Issue #63: 人員計画の按分入力（線形補間）機能
- `docs/requirements/user-feedback-requirements.md` Issue #1
