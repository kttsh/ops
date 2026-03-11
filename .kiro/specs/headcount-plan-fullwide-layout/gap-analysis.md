# ギャップ分析: headcount-plan-fullwide-layout

## 1. 現状調査

### 主要ファイルと構成

| ファイル | 行数 | 役割 |
|---------|------|------|
| `routes/master/headcount-plans/index.lazy.tsx` | 134行 | ページレイアウト（2カラムグリッド） |
| `components/HeadcountPlanCaseList.tsx` | 244行 | ケースリスト（ラジオボタン形式、CRUD操作含む） |
| `components/MonthlyHeadcountGrid.tsx` | 234行 | 月次データ入力（1年度分、6列×2行グリッド） |
| `hooks/useHeadcountPlansPage.ts` | 93行 | ページ状態管理（単一年度） |
| `components/BulkInputDialog.tsx` | 216行 | 一括入力ダイアログ（均一入力＋線形補間） |
| `components/CaseFormSheet.tsx` | 175行 | ケース作成・編集シートフォーム |
| `components/BusinessUnitSingleSelector.tsx` | 48行 | BUチップセレクター（参考パターン） |
| `components/IndirectWorkCaseChips.tsx` | 66行 | 間接業務ケースチップ（参考パターン） |
| `api/headcount-plan-client.ts` | 109行 | API クライアント |
| `api/queries.ts` | 170行 | TanStack Query オプション |
| `types/headcount-plan.ts` | 96行 | 型定義・Zodスキーマ |

### 再利用可能な既存パターン

- **チップセレクターパターン**: `BusinessUnitSingleSelector` と `IndirectWorkCaseChips` に確立済み（`flex flex-wrap items-center gap-1.5`、`rounded-lg border px-3 py-1.5`、選択時 `border-primary bg-primary/10 text-primary`）
- **CaseFormSheet**: ケース作成・編集フォームはそのまま再利用可能
- **normalizeNumericInput**: IME対応数値入力ユーティリティは既存
- **UnsavedChangesDialog + useUnsavedChanges**: 未保存変更検知の共有パターンは確立済み
- **BulkInputDialog**: 年度選択機能は既に `fiscalYearOptions` プロップで対応済み
- **API / クエリ層**: `fetchMonthlyHeadcountPlans` は caseId + businessUnitCode で全データ取得（年度フィルタなし） → 全年度対応に適合

### 統合ポイント

- **月次データAPI**: 既にケース×BU単位で全データを返す → フロントエンドでの年度分類のみ必要
- **保存API**: `bulkUpdateMonthlyHeadcountPlans` は items 配列で一括保存 → 全年度対応に変更不要
- **ケースCRUD mutations**: 既存の create/update/delete/restore mutations はそのまま利用可能

## 2. 要件ギャップ分析

### Requirement 1: フルワイド1カラムレイアウト
| 技術的ニーズ | 現状 | ギャップ |
|------------|------|---------|
| 1カラムレイアウト | 2カラム `grid-cols-[1fr_2fr]` | **要変更**: グリッド削除、縦積みレイアウトに変更 |
| BU→ケース→テーブルの縦積み | BUは独立行、ケースは左パネル | **要変更**: ケースセレクターをBU行の下に配置 |

### Requirement 2: チップボタン方式ケースセレクター
| 技術的ニーズ | 現状 | ギャップ |
|------------|------|---------|
| チップボタンUI | ラジオボタンリスト（244行） | **新規作成**: `IndirectWorkCaseChips` パターンを拡張 |
| Primary★バッジ | `Badge variant="secondary"` で "Primary" テキスト | **要変更**: ★表示に変更 |
| 削除済み表示 `opacity-50` | `HeadcountPlanCaseList` 内で実装済み | **移植**: チップ形式に変換 |
| 復元操作 | ボタンで実装済み | **移植**: チップ内に統合 |
| `[+新規]` dashed border | 通常ボタン | **新規**: dashed border のチップ追加 |
| 削除済みスイッチ | Switch実装済み | **移植**: チップ行に統合 |
| CaseFormSheet呼び出し | 実装済み | **再利用**: そのまま |

### Requirement 3: 全年度月次データテーブル
| 技術的ニーズ | 現状 | ギャップ |
|------------|------|---------|
| 11行×12ヶ月テーブル | 1年度分の6列×2行グリッド | **新規作成**: `<table>` ベースのテーブル |
| 全年度データ管理 | `localData: Record<string, number>` で年度横断管理済み | **適合**: データ構造はそのまま利用可能 |
| sticky left年度列 | なし | **新規**: `sticky left-0` CSS |
| 当年度ハイライト | なし | **新規**: `bg-primary/5` 条件付きクラス |
| dirtyハイライト | なし | **新規**: セル単位の変更追跡 + `bg-amber-50` |
| IME対応数値入力 | `normalizeNumericInput` 利用済み | **再利用** |

### Requirement 4: ケースCRUD操作
| 技術的ニーズ | 現状 | ギャップ |
|------------|------|---------|
| ケース編集ボタン | `HeadcountPlanCaseList` 内 | **移植**: テーブルヘッダーに配置 |
| 削除確認ダイアログ | `AlertDialog` 実装済み | **移植**: 新コンポーネントに統合 |
| 作成後の自動選択 | なし | **新規**: mutation onSuccess で自動選択 |

### Requirement 5: 一括入力の年度選択対応
| 技術的ニーズ | 現状 | ギャップ |
|------------|------|---------|
| 年度選択UI | `BulkInputDialog` に年度ドロップダウン既存 | **適合**: 既に実装済み |
| 全年度テーブルとの連携 | 単一年度の `handleBulkSet` | **要変更**: 全年度のlocalDataに適用 |

### Requirement 6-7: 未保存変更検知・保存
| 技術的ニーズ | 現状 | ギャップ |
|------------|------|---------|
| useUnsavedChanges | 実装済み | **再利用** |
| 全年度一括保存 | `bulkUpdateMonthlyHeadcountPlans` は items 配列で対応 | **適合**: データ構造変更不要 |
| dirtyクリア | `setHeadcountDirty(false)` | **要変更**: セル単位の dirty 追跡のクリア |

## 3. 実装アプローチ選択肢

### Option A: 既存コンポーネント拡張
- `HeadcountPlanCaseList` をチップ形式に書き換え
- `MonthlyHeadcountGrid` をテーブル形式に書き換え

**トレードオフ**:
- ✅ ファイル数が増えない
- ❌ 244行と234行のコンポーネントの大幅書き換えは実質的に新規作成と同等
- ❌ 責務が異なる（リスト vs チップ、グリッド vs テーブル）のにファイル名が不一致

### Option B: 新規コンポーネント作成（推奨）
- `HeadcountPlanCaseChips.tsx` を新規作成
- `MonthlyHeadcountTable.tsx` を新規作成
- 旧コンポーネント（`HeadcountPlanCaseList`, `MonthlyHeadcountGrid`）を廃止

**トレードオフ**:
- ✅ UIパターンが根本的に異なる（リスト→チップ、グリッド→テーブル）ため、新規作成が自然
- ✅ 既存の `IndirectWorkCaseChips` パターンをベースに一貫性を保てる
- ✅ 旧コンポーネントは他画面で使用されていない → 安全に削除可能
- ❌ 旧コンポーネントからCRUDロジックの移植が必要

### Option C: ハイブリッド
- チップセレクターは新規作成、テーブルは `MonthlyHeadcountGrid` を改修

**トレードオフ**:
- ❌ テーブル化はUIが完全に異なるため中途半端な改修になりやすい

### 推奨: Option B（新規コンポーネント作成）

## 4. 複雑度・リスク評価

### 工数: **M（3〜7日）**
- 新規コンポーネント2つ + フック改修 + レイアウト変更
- 既存パターン（チップ、IME入力、一括入力、未保存検知）の組み合わせが中心
- API/バックエンド変更は不要

### リスク: **Low**
- 既存パターン（`IndirectWorkCaseChips`, `BusinessUnitSingleSelector`）をベースに構築
- API層・型定義の変更は不要
- 旧コンポーネントは当画面でのみ使用 → 廃止の影響範囲が限定的

## 5. 設計フェーズへの推奨事項

### 主要な設計決定
1. **全年度データの状態管理**: `useHeadcountPlansPage` で全年度分の `localData` を一元管理する方法
2. **セル単位のdirty追跡**: `Record<string, number>` の初期値との差分比較で実装するか、Set で変更済み yearMonth を追跡するか
3. **テーブルのスクロール設計**: 11行×13列のテーブルは横幅に余裕があるか、横スクロールが必要か

### リサーチ項目
- **sticky列のブラウザ互換性**: `position: sticky` + `left: 0` のテーブルセルでの動作確認
- **132セルの同時レンダリングパフォーマンス**: 11行×12ヶ月の `<input>` 要素のレンダリング負荷（仮想化の必要性判断）
