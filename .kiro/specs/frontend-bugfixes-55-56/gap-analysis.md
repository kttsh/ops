# ギャップ分析: frontend-bugfixes-55-56

## 1. 現状調査

### 対象ファイルと問題箇所

#### Issue #55: 浮動小数点精度エラー

| ファイル | 問題箇所 | 現状 |
|----------|----------|------|
| `apps/frontend/src/features/indirect-case-study/components/IndirectWorkRatioMatrix.tsx:53` | `item.ratio * 100` | DB値(0-1)を百分率に変換する際、IEEE 754精度エラーが発生（例: `0.07 * 100 = 7.000000000000001`） |
| `IndirectWorkRatioMatrix.tsx:141` | `value={localData[key] ?? 0}` | 上記の丸め誤差がそのままInput valueに反映される |
| `IndirectWorkRatioMatrix.tsx:167` | `getTotal(fy).toFixed(1)` | 合計行は`.toFixed(1)`で丸められるため顕在化しにくいが、内部精度は影響を受ける |
| `apps/frontend/src/features/indirect-case-study/components/CalculationResultTable.tsx:151` | `Math.round(capacity * (ratio?.ratio ?? 0))` | `Math.round`で整数化されるため顕在化しない。**比率のパーセント表示は行っていないため修正不要** |

#### Issue #56: チャートフォーカス枠

| ファイル | 問題箇所 | 現状 |
|----------|----------|------|
| `apps/frontend/src/features/workload/components/WorkloadChart.tsx:91` | `style={{ outline: "none" }}` | `ComposedChart`のSVGコンテナにのみ適用。内部の`<path>`・`<rect>`要素がフォーカスを受けるとブラウザデフォルトのoutlineが表示される |
| `apps/frontend/src/styles/globals.css` | Recharts関連スタイルなし | SVG内部要素のフォーカスoutlineを抑制するCSSが存在しない |
| `apps/frontend/src/features/case-study/components/WorkloadChart.tsx` | `AreaChart`使用、outline設定なし | 同様の問題が潜在的に存在する可能性あり（Issue #56の対象外だが留意点） |

### 既存パターン・ユーティリティ

- **数値丸めユーティリティ**: 専用関数なし。`.toFixed()`や`Math.round()`がインラインで使用されている
- **CSSスタイル管理**: `globals.css`に`@layer base`でグローバルスタイルを定義するパターンが確立済み

---

## 2. 要件とのギャップ

### Requirement 1: 浮動小数点精度エラー修正

| 受入条件 | 既存実装 | ギャップ |
|----------|----------|----------|
| AC1: 入力値が正確に表示される | `item.ratio * 100`がそのままstateに格納 | **Missing**: 丸め処理が必要 |
| AC2: `0.07 * 100`が`7`と表示 | 丸め処理なし | **Missing**: 変換時の精度補正 |
| AC3: 小数桁数を維持 | `.toFixed(1)`は合計行のみ | **Missing**: 個別セルの精度制御 |
| AC4: CalculationResultTableの同等精度 | `Math.round()`で整数化済み | ギャップなし（比率%表示なし） |
| AC5: 保存ロジックに影響なし | `ratioPercent / 100`で変換 | ギャップなし（表示側のみの修正） |

### Requirement 2: フォーカス枠除去

| 受入条件 | 既存実装 | ギャップ |
|----------|----------|----------|
| AC1: クリック時にoutline非表示 | `ComposedChart`にのみ`outline: none` | **Missing**: SVG子要素のoutline抑制 |
| AC2: Chrome/Edge対応 | 未対応 | **Missing**: クロスブラウザCSS |
| AC3: ツールチップ等への非影響 | − | 確認必要（リスク低） |
| AC4: 内部SVG要素への適用 | 未適用 | **Missing**: `.recharts-surface`以下のCSS |

### Requirement 3: 回帰防止

| 受入条件 | 既存実装 | ギャップ |
|----------|----------|----------|
| AC1-3: コンパイル・テスト・Lint通過 | 既存CI通過状態 | ギャップなし（修正後に確認） |

---

## 3. 実装アプローチ

### 推奨: Option A（既存コンポーネントの修正）

両Issue共に対象が明確で、変更範囲が小さいため新規コンポーネントの作成は不要。

#### Issue #55 の修正方針

**修正箇所**: `IndirectWorkRatioMatrix.tsx` の1箇所

- **Line 53**: `item.ratio * 100` → `Math.round(item.ratio * 10000) / 100`
  - `0.07 * 10000 = 700`（整数）→ `700 / 100 = 7`（正確）
  - 小数点第2位まで精度を保証（実用上十分）

**`CalculationResultTable.tsx`は修正不要**: 比率のパーセント表示は行っておらず、manhour計算は`Math.round()`で整数化されているため影響なし。

#### Issue #56 の修正方針

**修正箇所**: `globals.css` の1箇所

- Recharts SVG要素のフォーカスoutlineを抑制するCSSルールを`@layer base`内に追加
- `WorkloadChart.tsx`の既存`style={{ outline: "none" }}`は残置（防御的）

**`case-study/WorkloadChart.tsx`について**: Issue #56の対象外だが、同じCSS修正で自動的にカバーされる。

### Option B/C は不採用

- 新規ユーティリティ関数の作成は過剰（使用箇所が1箇所のみ）
- ハイブリッドアプローチの複雑性が不要

---

## 4. 複雑性とリスク

| 項目 | 評価 | 理由 |
|------|------|------|
| **工数** | **S**（1日以内） | 修正箇所が2ファイル・数行、既存パターンの延長 |
| **リスク** | **Low** | 表示ロジックの局所的修正、保存ロジック・データモデルへの影響なし |

---

## 5. 設計フェーズへの推奨事項

- **推奨アプローチ**: Option A（既存ファイルの最小修正）
- **Research Needed**: なし（技術的に明確）
- **留意点**: `case-study/WorkloadChart.tsx`も同じRechartsを使用しているため、CSS修正で自動的に恩恵を受ける
