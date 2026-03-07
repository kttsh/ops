# Research & Design Decisions: numeric-input-ime-support

## Summary
- **Feature**: `numeric-input-ime-support`
- **Discovery Scope**: Extension
- **Key Findings**:
  - FormTextField に確立済みの全角→半角変換パターンが存在するが、小数点（`.`）が `[^0-9]` で除去されるバグあり
  - 直接 Input を使用する9箇所は個別の onChange パターン（parseInt/parseFloat/Number、null許容、範囲制限等）を持ち、FormTextField への完全置換は不適
  - `inputMode="decimal"` がモバイルで小数点付きテンキーを表示する標準仕様として利用可能

## Research Log

### inputMode 属性の整数/小数使い分け
- **Context**: 小数フィールドでモバイルテンキーに小数点キーを表示する方法
- **Sources Consulted**: HTML Living Standard - inputMode 属性
- **Findings**:
  - `inputMode="numeric"`: 0-9のテンキー表示（整数向け）
  - `inputMode="decimal"`: 0-9 + 小数点のテンキー表示（小数向け）
  - どちらも `type="text"` と組み合わせて使用
- **Implications**: 整数フィールドには `inputMode="numeric"`、小数フィールドには `inputMode="decimal"` を使い分ける

### 全角→半角変換の対象文字
- **Context**: 全角入力時に変換すべき文字の範囲
- **Sources Consulted**: 既存 FormTextField 実装、Unicode 仕様
- **Findings**:
  - 全角数字: `０-９`（U+FF10〜U+FF19）→ オフセット 0xFEE0 で半角化
  - 全角ピリオド: `．`（U+FF0E）→ 半角 `.`（U+002E）に変換
  - 全角マイナス: 本機能スコープ外（要件に含まれない）
- **Implications**: 小数対応時は全角ピリオドの変換を追加する必要がある

### 9箇所の onChange パターン多様性
- **Context**: 直接 Input 使用箇所を FormTextField に統一できるか検討
- **Findings**:
  - TanStack Form 使用: 6箇所（ProjectForm, CaseForm x2, ScenarioFormSheet, WorkloadCard, MonthlyHeadcountGrid）— ただし WorkloadCard は独自の handleValueChange
  - useState 使用: 3箇所（PeriodSelector, BulkInputDialog, IndirectWorkRatioMatrix）
  - null 許容: 2箇所（CaseForm durationMonths, totalManhour）
  - 範囲制限: 3箇所（WorkloadCard 0-99999999, BulkInputDialog >=0, IndirectWorkRatioMatrix 0-100）
  - onBlur 検証: 1箇所（WorkloadCard）
- **Implications**: FormTextField への完全置換は不可。ユーティリティ関数による変換ロジック共通化が最適

## Design Decisions

### Decision: ユーティリティ関数による変換ロジック共通化
- **Context**: 9箇所の全角→半角変換ロジックを効率的に適用する方法
- **Alternatives Considered**:
  1. Option A: 各箇所にインラインで変換ロジックをコピー
  2. Option B: ユーティリティ関数を抽出して各箇所で呼び出し
  3. Option C: FormTextField を拡張して全箇所を置換
- **Selected Approach**: Option B — ユーティリティ関数 `normalizeNumericInput` を `src/lib/` に配置
- **Rationale**: 各箇所の固有ロジック（範囲制限・null許容・onBlur等）を維持しつつ、変換ロジックのみを DRY に共通化できる。useState 管理の箇所にも適用可能
- **Trade-offs**: 新規ファイル1つ追加が必要だが、9箇所のロジック重複を排除
- **Follow-up**: FormTextField 内の既存変換ロジックもこのユーティリティに置き換えて一元化

### Decision: FormTextField の小数対応
- **Context**: ProjectForm の totalManhour で小数入力ができないバグの修正方針
- **Alternatives Considered**:
  1. `type` プロパティに `"decimal"` を追加
  2. `allowDecimal` boolean プロパティを追加
- **Selected Approach**: `type` に `"decimal"` を追加 → `"text" | "number" | "decimal"`
- **Rationale**: `type="number"` が「整数入力」、`type="decimal"` が「小数入力」という意味的な区別が明確。`inputMode` の使い分け（`numeric` vs `decimal`）とも自然に対応
- **Trade-offs**: type プロパティの値が増えるが、意味は直感的

## Risks & Mitigations
- **小数点の重複入力**: normalizeNumericInput で複数の小数点が入力される可能性 → 最初の小数点のみ保持するロジックを検討（ただし既存フィールドでは Number() や parseFloat() が後段で処理するため、変換段階では不要の可能性あり）
- **既存テストの破損**: FormTextField のテストが最小限（関数export確認のみ）→ ユーティリティ関数に対して充実したユニットテストを追加

## References
- HTML Living Standard - inputMode: https://html.spec.whatwg.org/multipage/interaction.html#input-modalities:-the-inputmode-attribute
- 既存実装: `apps/frontend/src/components/shared/FormTextField.tsx`
- ギャップ分析: `.kiro/specs/numeric-input-ime-support/gap-analysis.md`
