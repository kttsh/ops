# ギャップ分析: numeric-input-ime-support

## 1. 現状分析

### 1.1 既存パターン: FormTextField

`src/components/shared/FormTextField.tsx` に `type="number"` → `type="text"` + `inputMode="numeric"` 変換パターンが確立済み。

**実装ロジック:**
- 全角数字（`０-９`）→ 半角数字（`0-9`）変換: `replace(/[０-９]/g, ...)`
- 非数字文字の除去: `replace(/[^0-9]/g, "")`
- 空文字の場合 `0`、それ以外は `Number()` に変換

**既知の不具合:** 小数点（`.`）も `[^0-9]` により除去されるため、`step="0.1"` を指定しても小数値を入力できない。ProjectForm の `totalManhour` フィールドがこの影響を受けている。

### 1.2 全13箇所の分類

#### A. FormTextField 経由（4箇所） — 全角変換済み、`type="number"` の変更不要

| # | ファイル | フィールド | 型 | 状態 |
|---|---------|----------|-----|------|
| 1 | ProjectTypeForm.tsx:102 | displayOrder | 整数 | 対応済み |
| 2 | ProjectForm.tsx:205 | totalManhour | 小数 | 小数点入力不可バグあり |
| 3 | BusinessUnitForm.tsx:102 | displayOrder | 整数 | 対応済み |
| 4 | WorkTypeForm.tsx:102 | displayOrder | 整数 | 対応済み |

FormTextField 内部で既に `type="text"` + `inputMode="numeric"` に変換しているため、これらはIME互換性の問題はない。ただし #2 は小数点が除去されるバグがある。

#### B. 直接 Input 使用（9箇所） — 未対応、変更が必要

| # | ファイル | フィールド | 型 | onChange パターン |
|---|---------|----------|-----|-----------------|
| 1 | ProjectForm.tsx:278 | durationMonths | 整数 | `Number(val)` |
| 2 | CaseForm.tsx:290 | durationMonths | 整数 | `Number(val)`, null許容 |
| 3 | CaseForm.tsx:316 | totalManhour | 小数 | `Number(val)`, null許容 |
| 4 | PeriodSelector.tsx:100 | months | 整数 | 文字列保持→apply時parseInt |
| 5 | ScenarioFormSheet.tsx:158 | hoursPerPerson | 小数 | `Number(val)`, step=0.01 |
| 6 | WorkloadCard.tsx:249 | manhour | 整数 | `Number(val)`, onBlurで範囲検証 |
| 7 | BulkInputDialog.tsx:76 | headcount | 整数 | `parseInt`, 非負制限 |
| 8 | IndirectWorkRatioMatrix.tsx:135 | ratio | 小数 | `parseFloat`, 0-100範囲 |
| 9 | MonthlyHeadcountGrid.tsx:191 | headcount | 整数 | `parseInt`, 非負制限 |

**内訳:** 整数6箇所、小数3箇所

### 1.3 Issue記載との差異

Issue では「整数フィールド7箇所、小数対応フィールド2箇所」と記載されているが、実際の調査では**整数6箇所、小数3箇所**。Issue作成時からコードが変更された可能性、またはカウント方法の差異がある。

## 2. ギャップ分析

### 2.1 技術的ギャップ

| 要件 | 現状 | ギャップ |
|------|------|---------|
| IME互換性 | 9箇所が`type="number"`のまま | `type="text"` + `inputMode="numeric"` への変更が必要 |
| 全角→半角変換 | 9箇所に変換ロジックなし | 変換ロジックの適用が必要 |
| 整数入力制御 | 各箇所で個別実装 | 統一パターンの適用が必要 |
| 小数入力制御 | FormTextField が小数未対応 | 小数点を許容する変換ロジックが必要 |
| 後方互換性 | 各箇所で独自のonChange | 既存のバリデーション・範囲制限を維持する必要あり |

### 2.2 複雑性シグナル

- **PeriodSelector.tsx**: TanStack Form ではなく `useState` で値管理。FormTextField パターンが直接適用できない
- **WorkloadCard.tsx**: onBlur で範囲検証ロジックあり。onChange の変換に加えてonBlur処理の維持が必要
- **IndirectWorkRatioMatrix.tsx**: parseFloat + 0-100範囲制限。小数対応の変換ロジックが必要
- **null 許容フィールド**: CaseForm の durationMonths / totalManhour は空文字→null変換が必要（FormTextField は空文字→0 に変換するため非互換）

## 3. 実装アプローチ

### Option A: 各箇所で個別にインライン修正

**概要:** 9箇所それぞれで `type="text"` + `inputMode="numeric"` に変更し、全角→半角変換ロジックをインラインで追加。

**トレードオフ:**
- ✅ 各箇所の既存ロジック（範囲制限・null許容・onBlur等）を個別に維持しやすい
- ✅ 変更の影響範囲が局所的
- ❌ 全角→半角変換ロジックが9箇所に重複
- ❌ 将来のメンテナンスコスト増

### Option B: ユーティリティ関数を抽出して統一適用

**概要:** 全角→半角変換をユーティリティ関数として抽出し、各箇所で利用。FormTextField の小数対応も修正。

**候補ユーティリティ:**
- `normalizeNumericInput(value: string, options?: { allowDecimal?: boolean }): string` — 全角→半角変換 + 不正文字除去
- FormTextField に `allowDecimal` オプションを追加

**トレードオフ:**
- ✅ DRY原則に従い、変換ロジックが単一箇所
- ✅ FormTextField の小数バグも修正可能
- ✅ テストが容易（ユーティリティ単体テスト）
- ❌ 新規ユーティリティファイルの作成が必要
- ❌ 各箇所のonChangeハンドラは個別の後処理（範囲制限等）があるため、完全な統一は難しい

### Option C: FormTextField を拡張して対象箇所を置換

**概要:** FormTextField を拡張（小数対応・null許容等）し、直接 Input を使用している箇所を FormTextField に置き換え。

**トレードオフ:**
- ✅ コンポーネントレベルでの統一
- ✅ 将来の数値フィールド追加時も自動対応
- ❌ PeriodSelector（useState管理）等、TanStack Form 非使用箇所には適用不可
- ❌ FormTextField の責務が過度に拡大するリスク
- ❌ 各箇所固有のロジック（範囲制限・onBlur検証等）をFormTextField に吸収するのは複雑

## 4. 推奨アプローチと設計フェーズへの申し送り

### 推奨: Option B（ユーティリティ関数抽出）

**理由:**
- 全角→半角変換 + 文字除去は純粋関数として抽出可能で、テストも容易
- 各箇所の固有ロジック（範囲制限等）はそのまま維持し、変換部分のみを共通化
- FormTextField の小数対応バグも同時に修正可能
- PeriodSelector 等の非 TanStack Form コンポーネントにも適用可能

### 設計フェーズへの申し送り事項

1. **ユーティリティ関数の設計**: `normalizeNumericInput` の API 設計（整数/小数切り替え、全角ピリオド対応）
2. **FormTextField の小数対応**: `allowDecimal` プロパティ追加 or `type` 拡張の方針決定
3. **null 許容フィールドの扱い**: CaseForm の durationMonths / totalManhour は空文字→null が必要。FormTextField（空文字→0）との非互換に対応するか、直接 Input のまま変換ロジックのみ適用するか
4. **PeriodSelector の扱い**: TanStack Form 非使用のため FormTextField 置換は不可。ユーティリティ関数で対応

## 5. 工数・リスク評価

- **工数: S（1〜3日）** — 確立済みパターンの展開であり、新規アーキテクチャや外部連携は不要
- **リスク: Low** — 既知のパターン拡張、影響範囲は入力フィールドのonChangeハンドラに限定。ただし小数対応の変換ロジック設計には注意が必要
