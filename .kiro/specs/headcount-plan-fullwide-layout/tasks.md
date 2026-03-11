# Implementation Plan

- [x] 1. useHeadcountPlansPage フックの全年度対応リファクタリング
- [x] 1.1 全年度データ管理と dirty 追跡の実装
  - 単一年度の `fiscalYear` state を廃止し、`fiscalYears` 配列（前2年〜後8年）を生成する関数を提供
  - API レスポンスから `originalData: Record<string, number>` を構築し、初期値スナップショットとして保持
  - `localData` をフック内部で一元管理し、`MonthlyHeadcountGrid` に委譲していたデータ管理を引き上げ
  - `isCellDirty(yearMonth)` 関数を提供: `localData[ym] !== originalData[ym]` で判定
  - `isDirty` を `originalData` との差分比較で算出（boolean フラグの手動管理を廃止）
  - `handleCellChange(yearMonth, value)` で個別セルの値を更新
  - _Requirements: 3.1, 3.5, 6.2_

- [x] 1.2 一括入力ハンドラーと保存ロジックの更新
  - `handleBulkSet(year, headcount)` と `handleBulkInterpolation(year, monthlyValues)` を `localData` に直接適用するよう更新
  - 保存時は `originalData` と `localData` の差分のみ API に送信
  - 保存成功時に `originalData` を `localData` のスナップショットで更新し、成功トーストを表示
  - 保存失敗時にエラートーストを表示し、`localData` を保持
  - `onDirtyChange` / `onLocalDataChange` コールバックを廃止
  - _Requirements: 5.2, 6.3, 7.1, 7.2, 7.3_

- [x] 2. HeadcountPlanCaseChips コンポーネントの新規作成
- [x] 2.1 (P) チップボタン方式のケースセレクター UI
  - `IndirectWorkCaseChips` と `BusinessUnitSingleSelector` のチップパターンを踏襲
  - 選択中のチップは `border-primary bg-primary/10 text-primary` で強調表示
  - Primary ケースに★バッジを表示（`IndirectWorkCaseChips` の「主」バッジと同パターン）
  - 削除済みケースは `opacity-50` で表示し、クリック無効
  - 新規作成ボタンは `border-dashed` スタイルの `+新規` チップとして表示
  - 「削除済みを含む」スイッチをチップ行に統合
  - ケースが未選択の場合はテーブルの代わりにプレースホルダを表示
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [x] 2.2 (P) ケース CRUD 操作の統合
  - 新規作成ボタンクリックで `CaseFormSheet` を開く（create モード）
  - 選択中ケースの編集ボタンで `CaseFormSheet` を開く（edit モード）
  - 削除操作は `AlertDialog` で確認後に実行
  - 削除済みケースの復元ボタン（`RotateCcw` アイコン）を表示
  - ケース作成の mutation `onSuccess` で新しいケースを自動選択
  - 既存の create/update/delete/restore mutations を再利用
  - _Requirements: 2.8, 4.1, 4.2, 4.3, 4.4_

- [x] 3. MonthlyHeadcountTable コンポーネントの新規作成
- [x] 3.1 (P) 全年度月次データテーブルの UI
  - `<table>` ベースで 13列（年度 + 4月〜3月）× 11行のテーブルを構築
  - ヘッダー行に「4月」〜「3月」の月名を表示
  - 年度列を `sticky left-0 z-10 bg-card` で固定表示
  - 当年度行を `bg-primary/5` でハイライト
  - 各セルに `<input type="text" inputMode="numeric">` + `normalizeNumericInput` で IME 対応数値入力を提供
  - dirty セルは `bg-amber-50` でハイライト（`isCellDirty` 関数を使用）
  - テーブルコンテナに `overflow-x-auto` でレスポンシブ対応
  - ヘッダー領域に「月次人員数」タイトル、「一括入力」ボタン、「ケース編集」ボタンを配置
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 3.2 (P) BulkInputDialog との連携
  - テーブルヘッダーの「一括入力」ボタンクリックで `BulkInputDialog` を開く
  - `BulkInputDialog` の既存 props（`fiscalYear`, `fiscalYearOptions`, `onApply`, `onApplyInterpolation`）をフックから受け渡す
  - 一括入力の適用は `useHeadcountPlansPage` の `handleBulkSet` / `handleBulkInterpolation` 経由
  - _Requirements: 5.1, 5.2, 5.3_

- [x] 4. ページレイアウト統合とクリーンアップ
- [x] 4.1 HeadcountPlansPage の 1 カラムレイアウト化
  - 2カラムグリッド（`grid-cols-[1fr_2fr]`）を廃止し、`flex flex-col` の縦積みレイアウトに変更
  - Header → BUSelector → HeadcountPlanCaseChips → MonthlyHeadcountTable の順に配置
  - `HeadcountPlanCaseList` のインポートを `HeadcountPlanCaseChips` に置き換え
  - `MonthlyHeadcountGrid` のインポートを `MonthlyHeadcountTable` に置き換え
  - `useHeadcountPlansPage` の新しいインターフェースに合わせて props を接続
  - `UnsavedChangesDialog` は既存のまま維持
  - ケース未選択時のプレースホルダテキストを「ケースを選択してください」に変更
  - _Requirements: 1.1, 1.2, 1.3, 6.1, 6.2_

- [x] 4.2 旧コンポーネントの廃止と index.ts の更新
  - `HeadcountPlanCaseList.tsx` を削除
  - `MonthlyHeadcountGrid.tsx` を削除
  - `indirect-case-study/index.ts` から旧コンポーネントのエクスポートを削除し、新コンポーネントのエクスポートを追加
  - `npx tsc -b` で型エラーがないことを確認
  - _Requirements: 1.1_

