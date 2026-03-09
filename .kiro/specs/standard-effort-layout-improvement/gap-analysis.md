# ギャップ分析: standard-effort-layout-improvement

## 1. 現状調査

### 対象ファイルと構造

| ファイル | 役割 | 行数 |
|----------|------|------|
| `apps/frontend/src/features/standard-effort-masters/components/StandardEffortMasterForm.tsx` | 新規登録・編集フォーム | 222行 |
| `apps/frontend/src/features/standard-effort-masters/components/StandardEffortMasterDetail.tsx` | 詳細画面（読み取り専用 + 編集切替） | 130行 |
| `apps/frontend/src/features/standard-effort-masters/components/WeightDistributionChart.tsx` | エリアチャート表示 | 72行 |
| `apps/frontend/src/routes/projects/standard-efforts/new.tsx` | 新規登録ルート | 64行 |
| `apps/frontend/src/routes/projects/standard-efforts/$standardEffortId/index.tsx` | 詳細ルート | 198行 |
| `apps/frontend/src/features/standard-effort-masters/types/index.ts` | 型・定数・スキーマ | 106行 |

### 既存パターン・規約

- **カード**: `rounded-3xl border` が共通スタイル。`Detail` コンポーネントは `bg-white` 明示あり、`Form` コンポーネントの重みカードは背景色未指定
- **グリッド**: Tailwind の `grid-cols-*` を使用。フォームフィールドは `grid-cols-1 max-w-md`
- **テーブル**: ネイティブ `<table>` 要素を使用（TanStack Table 不使用）
- **チャート**: Recharts の `ResponsiveContainer` + `AreaChart`
- **定数**: `PROGRESS_RATES = [0, 5, 10, ..., 100]` （21要素）

## 2. 要件別ギャップ分析

### Requirement 1: ラベル表記の統一

| 項目 | 現状 | 要件 | ギャップ |
|------|------|------|----------|
| ラベル | `"事業部"` (Form:83行目) | `"ビジネスユニット"` | 文字列変更のみ |
| プレースホルダー | `"事業部を選択"` (Form:92行目) | `"ビジネスユニットを選択"` | 文字列変更のみ |
| 詳細画面ラベル | `"事業部"` (Detail:86行目) | 変更対象外（Issueに記載なし） | なし |

**ステータス**: 単純な文字列置換。影響範囲は `StandardEffortMasterForm.tsx` のみ。

### Requirement 2: フォームフィールドの横並びレイアウト

| 項目 | 現状 | 要件 | ギャップ |
|------|------|------|----------|
| BU + 案件タイプ配置 | `grid-cols-1 max-w-md` で縦並び (Form:72行目) | `grid-cols-2` で横並び | グリッド定義の変更 |

**ステータス**: `grid-cols-1` → `grid-cols-2` への変更。`max-w-md` の制約を外すか拡大する必要あり（2カラムに対して狭すぎる）。パターン名フィールドの配置も検討が必要。

### Requirement 3: カードの背景色修正

| 項目 | 現状 | 要件 | ギャップ |
|------|------|------|----------|
| Form 重みカード | `rounded-3xl border p-6`（bg未指定）(Form:155行目) | `bg-card` 追加 | クラス追加 |
| Detail 重みカード | `rounded-3xl border bg-white p-6` (Detail:92行目) | `bg-card` に統一 | `bg-white` → `bg-card` |
| Chart カード | `rounded-3xl border bg-white p-6` (Chart:24行目) | `bg-card` に統一 | `bg-white` → `bg-card` |

**ステータス**: 3箇所のクラス修正。`bg-card` はshadcn/uiのCSS変数を使用するため、テーマ対応も改善される。

### Requirement 4: カード配置の上下構成

| 項目 | 現状 | 要件 | ギャップ |
|------|------|------|----------|
| Form カード配置 | `grid-cols-1 lg:grid-cols-2` (Form:153行目) | `grid-cols-1` | ブレークポイント削除 |
| Detail カード配置 | `grid-cols-1 lg:grid-cols-2` (Detail:90行目) | `grid-cols-1` | ブレークポイント削除 |

**ステータス**: 2箇所で `lg:grid-cols-2` を削除して `grid-cols-1` に統一。

### Requirement 5: テーブル構造の横方向転置

| 項目 | 現状 | 要件 | ギャップ |
|------|------|------|----------|
| テーブル構造 | 行=進捗率（21行）、列=「進捗率」「重み」 | 列=進捗率（21列）、行=重み値（1行） | **構造の全面書き換え** |
| スクロール | 縦スクロール (`max-h-[480px] overflow-y-auto`) | 横スクロール不要 | スクロール制御の変更 |
| セル幅 | 各セル `px-3 py-1.5`、入力 `w-24 h-8` | 全21列が画面幅内に収まる | セル幅の大幅な圧縮が必要 |

**ステータス**: **最大の変更箇所**。テーブルHTML構造を完全に書き換える必要がある。
- Form内のテーブル（編集可能なInput付き）: Form:157-205行目
- Detail内のテーブル（読み取り専用）: Detail:94-122行目
- 21列 × 1行のテーブルに対し、セル幅を十分に詰める必要がある（`w-24` のInputは使用不可）
- 横スクロール不要の制約があるため、カード上下配置（全幅使用）が前提条件

### Requirement 6: グラフ表示の調整

| 項目 | 現状 | 要件 | ギャップ |
|------|------|------|----------|
| グラフ高さ | 固定 `h-[256px]` (Chart:25行目) | 横幅拡大に応じて調整 | 高さ値の調整 |

**ステータス**: カードが上下配置で全幅になるため、従来の半幅前提の `256px` を見直す。横幅拡大に伴い、高さを少し下げても視認性は維持される可能性あり。

**Research Needed**: 最適な高さの確定（Q8-2）。ユーザーテストまたはデザインレビューで判断。

### Requirement 7: 全画面での統一的なレイアウト

| 項目 | 現状 | 要件 | ギャップ |
|------|------|------|----------|
| Detail 表示モード | 独自テーブル + 独自カード配置 | Form と同一パターン | R4, R5 の適用で自動達成 |
| Edit モード | `StandardEffortMasterForm` を再利用 | 統一済み | ギャップなし |

**ステータス**: R4・R5 を詳細画面にも適用すれば達成。

## 3. 実装アプローチ

### Option A: 既存コンポーネントの直接修正（推奨）

**対象ファイル:**
- `StandardEffortMasterForm.tsx`: R1, R2, R3, R4, R5 の適用
- `StandardEffortMasterDetail.tsx`: R3, R4, R5 の適用
- `WeightDistributionChart.tsx`: R3, R6 の適用

**Trade-offs:**
- ✅ 新規ファイル不要。既存の責務分割を維持
- ✅ テーブル構造はコンポーネント内に閉じており、影響範囲が限定的
- ✅ 変更箇所が明確でレビューしやすい
- ❌ テーブル転置により `StandardEffortMasterForm.tsx` の diff が大きくなる

### Option B: 横方向テーブルを共通コンポーネントに抽出

**新規ファイル:**
- `WeightDistributionTable.tsx`（読み取り専用 + 編集可能の両モード対応）

**Trade-offs:**
- ✅ Form と Detail で重複するテーブルロジックを一元化
- ✅ テストしやすい
- ❌ 新規ファイル追加。Form の TanStack Form `field` バインディングを外部コンポーネントに渡す設計が必要
- ❌ 規約「`features/components/` 配下にフォルダを作成しない」を考慮すると、フラットなファイル追加に留まる

### Option C: ハイブリッド（非推奨）

テーブルのみ共通化し、他は直接修正。Option A の範囲で十分対応可能なため、複雑性に見合わない。

## 4. 複雑性・リスク評価

### 工数: **S**（1〜3日）
既存パターンの修正が中心。新規ロジックなし。テーブル転置が最大の作業だが、構造変更のみでビジネスロジックの変更は不要。

### リスク: **Low**
- 既知の技術（Tailwind CSS、ネイティブHTML table）のみ使用
- バックエンドへの影響なし
- 型定義・スキーマの変更なし
- フォームバリデーションロジックへの影響なし

### 主なリスクポイント
- テーブル21列の横幅収まり: カード上下配置（全幅）前提で計算すると、1セルあたり約 `4-5%` の幅。`text-xs` + 最小パディングで対応可能と見込む
- Input幅の圧縮（編集モード）: 現在 `w-24`（96px）→ `w-full` + 最小幅に変更が必要。数値入力なので3桁程度の幅で十分

## 5. 設計フェーズへの推奨事項

### 推奨アプローチ: Option A（既存コンポーネントの直接修正）

理由:
1. 変更は全てUIレイアウトに閉じており、ビジネスロジック・データモデルへの影響がゼロ
2. 3コンポーネントの修正で全要件をカバーでき、新規ファイル不要
3. 規約に従ったシンプルな構成を維持

### Research Items（設計フェーズで調査）
- **Q8-2**: グラフの最適高さ → 全幅での `h-[200px]` ～ `h-[256px]` 範囲で試行
- **Q14-1**: カード透過ブラウザ → `bg-card` 適用で解決するか確認
- 横方向テーブルの最小セル幅 → 画面幅 1280px 想定でのフィット確認
