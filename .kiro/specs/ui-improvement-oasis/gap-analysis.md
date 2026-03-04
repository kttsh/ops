# Gap Analysis: ui-improvement-oasis

## 概要

Oasis Light Design System への移行における、現行コードベースと要件の差分を分析する。

---

## 1. 現状調査

### 1.1 関連ファイル・モジュール

| カテゴリ | ファイル | 役割 |
|----------|---------|------|
| デザイントークン | `src/styles/globals.css` | CSS 変数（@theme）・カラー・角丸定義 |
| ボタン | `src/components/ui/button.tsx` | CVA ベース・6 variant・4 size |
| インプット | `src/components/ui/input.tsx` | `rounded-xl`・`bg-background` |
| セレクト | `src/components/ui/select.tsx` | Radix UI・`rounded-xl` |
| バッジ | `src/components/ui/badge.tsx` | CVA・5 variant・`rounded-full` |
| テーブル | `src/components/ui/table.tsx` | HTML テーブルラッパー |
| ダイアログ | `src/components/ui/dialog.tsx` | `rounded-2xl`・`bg-black/80` overlay |
| シート | `src/components/ui/sheet.tsx` | `bg-black/80` overlay |
| レイアウト | `src/components/layout/AppShell.tsx` | Sidebar + Main 構成 |
| ナビ | `src/components/layout/SidebarNav.tsx` | メニュー定義・アクティブ状態 |
| チャートカラー | `src/lib/chart-colors.ts` | 案件/間接/キャパの色パレット |
| Workload チャート | `src/features/workload/components/WorkloadChart.tsx` | ComposedChart・solid fill |
| Case Study チャート | `src/features/case-study/components/WorkloadChart.tsx` | AreaChart・gradient fill |

### 1.2 現行の設計パターン

- **カラー**: oklch 色空間、ニュートラル（グレー系）パレット。primary は暗灰色 `oklch(0.205 0 0)`
- **角丸**: `rounded-xl`（≈20px）がボタン・インプット・セレクトの標準
- **シャドウ**: `shadow-sm`/`shadow-md` を静的に適用
- **フォント**: Inter + システムフォント（Noto Sans JP なし）
- **レイアウト**: Flexbox ベース。グリッドレイアウト未使用
- **トランジション**: `transition-colors duration-200`/`transition-all duration-200` 混在
- **チャート**: Recharts 使用。Case Study のみグラデーション塗り。Workload は solid fill

---

## 2. 要件→既存資産マッピング

### Requirement 1: デザイントークン・カラーシステム

| 項目 | 現状 | 要件 | ギャップ |
|------|------|------|---------|
| 背景色 | `oklch(1 0 0)` (#FFFFFF) | #F8FAFC | **要変更** |
| カード色 | `oklch(1 0 0)` (#FFFFFF) | #FFFFFF | 一致 |
| Primary | `oklch(0.205 0 0)` (暗灰色) | Indigo #6366F1 | **要変更** |
| Accent | `oklch(0.97 0 0)` (灰色) | Emerald/Sky/Purple | **要追加** |
| テキスト色 | oklch ニュートラル | #1E293B/#475569/#94A3B8 | **要変更** |
| Semantic | oklch ベース | Oasis パレット | **要調整** |

**影響範囲**: `globals.css` のみ変更で全体に波及。ただし `bg-primary` を参照する全コンポーネントの見た目が変わるため、暗灰色→Indigo への変更は広範囲に影響。

**⚠️ Research Needed**: oklch → hex 変換の精度。Tailwind CSS v4 の @theme で hex 値をどう定義するか（oklch と hex の混在可能性）。

### Requirement 2: タイポグラフィシステム

| 項目 | 現状 | 要件 | ギャップ |
|------|------|------|---------|
| フォント | Inter のみ | Inter + Noto Sans JP | **要追加**（CDN/npm） |
| データ値サイズ | 標準 text-sm/base | 28–32px bold | **要変更**（個別対応） |
| ラベルサイズ | text-xs/sm | 12px | 近似（要確認） |
| ヘッダーサイズ | text-lg | 18–20px semibold | 近似 |

**影響範囲**: フォント追加は `globals.css` + パッケージ追加。データ値サイズは KPI 表示箇所（現在存在しないため新規 or 各 feature コンポーネント内で個別対応）。

### Requirement 3: カード・角丸・シャドウ

| 項目 | 現状 | 要件 | ギャップ |
|------|------|------|---------|
| カード角丸 | `rounded-xl`（20px）| 24px（`rounded-3xl`） | **要変更** |
| インプット角丸 | `rounded-xl`（20px）| 16px（`rounded-2xl`）| **要変更** |
| ボタン角丸 | `rounded-xl`（20px）| 8px（`rounded-lg`） | **要変更** |
| シャドウ | 静的 `shadow-sm` | ホバーのみ soft shadow | **要変更** |
| ダイアログ角丸 | `rounded-2xl` | 24px | 近似（要微調整） |

**影響範囲**: `button.tsx`、`input.tsx`、`select.tsx`、`dialog.tsx`、`sheet.tsx`、`table.tsx`、各 feature コンポーネント内のカード表現。

**注意**: `globals.css` の `--radius-*` 変数が基準値を定義しているが、多くのコンポーネントは直接 `rounded-xl` 等を使用しており、変数経由ではない。

### Requirement 4: Bento Grid レイアウト

| 項目 | 現状 | 要件 | ギャップ |
|------|------|------|---------|
| グリッドレイアウト | Flexbox のみ | CSS Grid（gap-6） | **Missing** |
| レスポンシブ列数 | N/A | 1/2/3-4 列 | **Missing** |

**影響範囲**: ダッシュボード画面（workload）のレイアウト変更。マスタ画面は既存のフル幅テーブルレイアウトを維持する可能性が高い。

### Requirement 5: サイドバー

| 項目 | 現状 | 要件 | ギャップ |
|------|------|------|---------|
| 折りたたみ幅 | `w-16`（64px） | 64px | ✅ 一致 |
| 展開幅 | `w-72`（288px） | 240px | **要変更** |
| 背景色 | `bg-sidebar`（oklch） | #FFFFFF | **要変更**（globals.css） |
| ボーダー色 | `border-border` | #F1F5F9 | **要変更**（globals.css） |
| アクティブ表示 | `bg-primary/10 text-primary` | Indigo ハイライト | primary 変更で自動対応 |
| トランジション | なし | 0.2s ease-in-out | **Missing** |

### Requirement 6: ボタン・フォーム要素

| 項目 | 現状 | 要件 | ギャップ |
|------|------|------|---------|
| Primary ボタン | 暗灰色 bg | Indigo #6366F1 | **primary 変更で対応** |
| Secondary ボタン | `bg-secondary`（灰色） | #F1F5F9 bg + #475569 text | **globals.css 変更** |
| Ghost ボタン | `hover:bg-accent` | hover: #F8FAFC | **globals.css 変更** |
| 入力背景 | `bg-background`（白） | #F8FAFC（Surface Sub） | **要変更** |
| フォーカスボーダー | `ring-ring`（灰色） | Indigo | **globals.css 変更** |
| ホバースケール | `hover:scale-[1.02]` | 同様 | ✅ 一致 |

### Requirement 7: データテーブル

| 項目 | 現状 | 要件 | ギャップ |
|------|------|------|---------|
| ヘッダー背景 | なし | #F8FAFC | **要追加** |
| ヘッダーフォント | `font-medium` | 12px uppercase tracking | **要変更** |
| 行区切り | `border-b` | #F1F5F9 ボーダー | **globals.css で対応** |
| 行ホバー | `hover:bg-muted/50` | #F8FAFC | **globals.css で対応** |
| セルパディング | `px-4 py-3` | 12px 16px | 近似（`py-3`=12px） |

### Requirement 8: チャート

| 項目 | 現状 | 要件 | ギャップ |
|------|------|------|---------|
| エリアフィル | solid fill（Workload）| グラデーション | **要変更** |
| Case Study | グラデーション済み | - | ✅ 一致 |
| チャートコンテナ | カード未統一 | rounded-3xl カード | **要変更** |
| グリッドライン色 | デフォルト | #F1F5F9 | **要変更** |
| ツールチップ | カスタム/null | blur + rounded-xl | **要変更** |

### Requirement 9: バッジ

| 項目 | 現状 | 要件 | ギャップ |
|------|------|------|---------|
| 角丸 | `rounded-full` | `rounded-full` | ✅ 一致 |
| 背景スタイル | variant 依存 | 10% 透過アクセント色 | **一部要変更** |
| フォントサイズ | `text-xs font-semibold` | 12px `font-medium` | **要微調整** |

### Requirement 10: トランジション

| 項目 | 現状 | 要件 | ギャップ |
|------|------|------|---------|
| 標準トランジション | `duration-200` 混在 | `0.2s ease-in-out` 統一 | **一部要統一** |
| オーバーレイ | `bg-black/80` | `backdrop-blur(4px)` | **要変更** |
| ダイアログシャドウ | `shadow-lg` | float shadow | **要変更** |

---

## 3. 実装アプローチ

### Option A: グローバルトークン変更のみ（最小変更）

globals.css の CSS 変数を Oasis Light パレットに書き換え、shadcn/ui コンポーネントのスタイルを変数参照経由で一括更新。

- **変更ファイル**: `globals.css`（1 ファイル）
- **カバー範囲**: カラーシステム、ボーダー色、背景色の大部分
- **カバーしない範囲**: 角丸変更、シャドウのホバーのみ化、テーブルヘッダー、チャートグラデーション、Noto Sans JP 追加、Bento Grid

**Trade-offs**:
- ✅ 最小工数、リスク低
- ❌ 要件の 40% 程度しかカバーできない

### Option B: コンポーネント個別更新（フル対応）

globals.css + 全 UI コンポーネント + レイアウト + feature コンポーネントを個別更新。

- **変更ファイル**: 15–25 ファイル
- **カバー範囲**: 全要件

**Trade-offs**:
- ✅ 全要件を完全実装
- ❌ 工数大、テスト範囲広い
- ❌ 既存機能の見た目が一度に大幅変更

### Option C: ハイブリッド（段階的適用）— 推奨

**Phase 1**: デザイントークン基盤（globals.css + フォント追加）
**Phase 2**: UI プリミティブ更新（button, input, select, badge, table, dialog, sheet）
**Phase 3**: レイアウト・ナビゲーション（AppShell, SidebarNav, Bento Grid）
**Phase 4**: フィーチャーコンポーネント（チャート、データテーブル共通コンポーネント）

- **変更ファイル**: Phase 毎に 3–8 ファイル
- **カバー範囲**: 全要件（段階的に）

**Trade-offs**:
- ✅ 段階的に検証可能
- ✅ 各フェーズで動作確認してから次へ
- ✅ カラー変更の影響を先に確認できる
- ❌ 中間状態でスタイルの不整合が一時的に発生

---

## 4. 工数・リスク評価

| 項目 | 評価 | 理由 |
|------|------|------|
| **工数** | **M（3–7 日）** | 既存コンポーネントの修正が中心。新規作成は少ない。ただし 15–25 ファイルの変更と視覚確認が必要 |
| **リスク** | **Low–Medium** | 既存パターン（shadcn/ui + Tailwind）の延長。技術的な不確実性は低いが、primary カラー変更の広範囲な影響とスタイル不整合リスクあり |

---

## 5. Research Needed（設計フェーズで調査）

1. **oklch ↔ hex 変換**: Tailwind CSS v4 の `@theme` で hex 値と oklch 値の混在が可能か、または全面的に hex に統一すべきか
2. **Noto Sans JP の導入方法**: Google Fonts CDN vs `@fontsource/noto-sans-jp` npm パッケージ。バンドルサイズへの影響
3. **Bento Grid の適用範囲**: Workload ダッシュボードのどの部分にグリッドを適用するか（現在のサイドパネル + チャート構成との整合性）
4. **チャートグラデーション**: Workload の ComposedChart で複数 Area に個別グラデーションを適用する Recharts の方法
5. **`--radius-*` 変数の活用**: コンポーネントが直接 `rounded-xl` を使用しているため、変数変更だけでは角丸が変わらない。変数参照に統一するか、直接書き換えるか

---

## 6. 設計フェーズへの推奨事項

1. **Option C（ハイブリッド段階的適用）** を推奨
2. Phase 1 でカラーシステムを先に確定し、primary 変更の影響を全体で確認する
3. 角丸変更は `--radius-*` 変数を更新するだけでなく、各コンポーネントの直接指定も書き換えが必要
4. `bg-background` が多くの場所で使われているため、背景色変更は globals.css の 1 行変更で済むが、`bg-background` と `bg-card` の差を意識する必要がある（背景 #F8FAFC、カード #FFFFFF）
5. テーブル・チャートの変更は共有コンポーネント（`DataTable.tsx`、`ChartFullscreenDialog.tsx`）と feature コンポーネントの両方に影響

