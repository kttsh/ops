# Implementation Plan

- [ ] 1. Storybook 基盤セットアップとサンプル整理
- [ ] 1.1 MSW をインストールし、Storybook のネットワークモック基盤を構成する
  - `msw` と `msw-storybook-addon` を devDependencies に追加する
  - `npx msw init public/` で ServiceWorker ファイルを生成する
  - `.storybook/preview.ts` に MSW の `initialize()` と `mswLoader` を登録する
  - _Requirements: 10.1, 10.2_

- [ ] 1.2 preview.ts にグローバル CSS インポートと QueryClientProvider デコレータを追加する
  - Tailwind CSS v4 のグローバルスタイル（`../src/styles/globals.css`）をインポートする
  - ストーリーごとに新規 `QueryClient`（retry: false, staleTime: Infinity）を生成する `withQueryClient` デコレータを追加する
  - Controls の matchers 設定を維持する
  - _Requirements: 10.1, 10.3, 11.1, 12.1, 12.3_

- [ ] 1.3 サンプルストーリーとサンプルコンポーネントを削除する
  - `src/stories/` ディレクトリ配下の全ファイル（Button.stories.ts, Header.stories.ts, Page.stories.ts, Button.tsx, Header.tsx, Page.tsx, Configure.mdx, CSS ファイル, assets/）を削除する
  - Storybook が起動し、空の状態でエラーなく動作することを確認する
  - _Requirements: 3.1, 3.2_

- [ ] 2. コアUIコンポーネントのストーリー作成
- [ ] 2.1 (P) Button コンポーネントのストーリーを作成する
  - 全バリアント（default, destructive, outline, secondary, ghost, link）と全サイズ（default, sm, lg, icon）の組み合わせを個別ストーリーとして定義する
  - CSF3 形式、`title: 'UI/Button'`、`tags: ['autodocs']`、`argTypes` で variant と size の Controls を設定する
  - disabled 状態、asChild パターンのストーリーも含める
  - _Requirements: 1.2, 2.1, 2.2, 2.3, 2.4_

- [ ] 2.2 (P) Input コンポーネントのストーリーを作成する
  - デフォルト状態、placeholder 付き、disabled 状態、エラー状態（赤枠等のスタイルが確認できる状態）のストーリーを定義する
  - `title: 'UI/Input'`、`tags: ['autodocs']` で設定する
  - _Requirements: 1.3, 2.1, 2.2, 2.3, 2.4_

- [ ] 2.3 (P) Select コンポーネントのストーリーを作成する
  - 閉じた状態、開いた状態、選択済み状態、disabled 状態のストーリーを定義する
  - SelectTrigger, SelectContent, SelectItem 等のサブコンポーネントを組み合わせた完全な使用例を含める
  - `title: 'UI/Select'` で設定する
  - _Requirements: 1.4, 2.1, 2.2, 2.3, 2.4_

- [ ] 2.4 (P) AlertDialog コンポーネントのストーリーを作成する
  - ダイアログの開閉操作、アクション・キャンセルボタンの動作を確認できるストーリーを定義する
  - AlertDialogTrigger, AlertDialogContent, AlertDialogAction, AlertDialogCancel 等を組み合わせる
  - `title: 'UI/AlertDialog'` で設定する
  - _Requirements: 1.5, 2.1, 2.2, 2.3, 2.4_

- [ ] 2.5 (P) Sheet コンポーネントのストーリーを作成する
  - 各方向（top, right, bottom, left）からのスライドイン表示を個別ストーリーとして定義する
  - SheetTrigger, SheetContent, SheetHeader, SheetTitle 等を組み合わせる
  - `title: 'UI/Sheet'` で設定する
  - _Requirements: 1.6, 2.1, 2.2, 2.3, 2.4_

- [ ] 2.6 (P) Badge, Switch, Label, Separator, Table コンポーネントのストーリーを作成する
  - Badge: 全5バリアント（default, secondary, destructive, outline, success）を個別ストーリーとして定義する
  - Switch: オン・オフの切替操作と disabled 状態のストーリーを定義する
  - Label: デフォルト表示とフォーム要素との関連付け例のストーリーを定義する
  - Separator: 水平・垂直の両方向のストーリーを定義する
  - Table: ヘッダー・ボディ・フッターを含む基本テーブルレイアウトのストーリーを定義する
  - それぞれ `title: 'UI/[ComponentName]'`、`tags: ['autodocs']` で設定する
  - _Requirements: 1.1, 1.7, 1.8, 1.9, 1.10, 1.11, 2.1, 2.2, 2.3, 2.4_

- [ ] 3. 共有・レイアウトコンポーネントのストーリー作成
- [ ] 3.1 TanStack Router 用の Storybook デコレータユーティリティを作成する
  - `createMemoryHistory` + `createRootRoute` + `createRouter` + `RouterProvider` で構成される `withRouter` デコレータを定義する
  - 共有デコレータとして複数のストーリーファイルから参照可能にする
  - _Requirements: 10.1_

- [ ] 3.2 (P) DeleteConfirmDialog（共有）のストーリーを作成する
  - 開いた状態をデフォルトとし、確認・キャンセル操作を `fn()` で Actions パネルに表示する
  - entityLabel, entityName, isDeleting 等の props を Controls で操作可能にする
  - `title: 'Shared/DeleteConfirmDialog'` で設定する
  - _Requirements: 4.2, 2.1, 2.3_

- [ ] 3.3 DataTableToolbar（共有）のストーリーを作成する
  - Router デコレータを適用し、検索入力・無効データ表示切替・新規登録ボタンの各状態を確認できるストーリーを定義する
  - `title: 'Shared/DataTableToolbar'` で設定する
  - DebouncedSearchInput への feature 間依存を UI インベントリの共通化候補として記録する
  - 3.1 の Router デコレータに依存する
  - _Requirements: 4.1, 2.1, 2.3_

- [ ] 3.4 AppShell（レイアウト）のストーリーを作成する
  - Router デコレータを適用し、デスクトップサイドバーとモバイルハンバーガーメニューの表示を確認できるストーリーを定義する
  - children として placeholder コンテンツを渡す
  - `title: 'Layout/AppShell'` で設定する
  - 3.1 の Router デコレータに依存する
  - _Requirements: 4.3, 2.1, 2.3_

- [ ] 4. feature コンポーネントのモックデータ基盤を構築する
- [ ] 4.1 (P) business-units feature のモックデータと MSW ハンドラを作成する
  - BusinessUnit 型に準拠したモックデータ（3件以上）を `satisfies` 演算子で型安全に定義する
  - 一覧取得・単体取得の MSW ハンドラを API レスポンス規約（data/meta/links 形式）に準拠して定義する
  - `features/business-units/components/__mocks__/` に配置する
  - _Requirements: 10.2, 10.6_

- [ ] 4.2 (P) projects feature のモックデータと MSW ハンドラを作成する
  - Project 型に準拠したモックデータを定義する
  - BU 選択用・案件タイプ選択用のセレクトボックスデータを含む MSW ハンドラを定義する
  - `features/projects/components/__mocks__/` に配置する
  - _Requirements: 10.2, 10.6_

- [ ] 4.3 (P) case-study feature のモックデータと MSW ハンドラを作成する
  - ケーススタディ関連の型に準拠したモックデータを定義する
  - 標準工数マスタの取得ハンドラを含める
  - _Requirements: 10.2, 10.6_

- [ ] 4.4 (P) workload feature のモックデータを作成する
  - 月別時系列データ（MonthlyDataPoint）、チャートシリーズ設定（ChartSeriesConfig）のモックデータを定義する
  - BusinessUnit のセレクタ用モックデータを定義する
  - _Requirements: 10.2, 10.4, 10.6_

- [ ] 4.5 (P) indirect-case-study feature のモックデータを作成する
  - 月別人員グリッド、間接工数比率マトリクス、キャパシティシナリオ等の複雑なデータ構造のモックデータを定義する
  - 12ヶ月分 × 複数行のグリッドデータを生成する
  - _Requirements: 10.2, 10.6_

- [ ] 4.6 (P) project-types と work-types feature のモックデータを作成する
  - ProjectType, WorkType 型に準拠したモックデータを定義する
  - 少量（3件）と大量（50件）のデータセットを用意する
  - _Requirements: 10.2, 10.5, 10.6_

- [ ] 5. feature コンポーネントのストーリー作成（フォーム系）
- [ ] 5.1 (P) BusinessUnitForm のストーリーを作成する
  - 新規作成モード（空フォーム）と編集モード（初期値あり）のストーリーを定義する
  - onSubmit コールバックを `fn()` で Actions パネルに表示する
  - `title: 'Features/BusinessUnits/BusinessUnitForm'` で設定する
  - _Requirements: 5.1, 2.1, 2.3, 2.4_

- [ ] 5.2 (P) ProjectForm のストーリーを作成する
  - MSW ハンドラで BU 選択肢・案件タイプ選択肢のデータを提供する
  - 新規作成モードと編集モードのストーリーを定義する
  - `title: 'Features/Projects/ProjectForm'` で設定する
  - _Requirements: 5.2, 5.8, 2.1, 2.3, 2.4_

- [ ] 5.3 (P) CaseForm と CaseFormSheet のストーリーを作成する
  - MSW ハンドラで標準工数マスタのデータを提供する
  - CaseForm: 新規作成モードと編集モードのストーリーを定義する
  - CaseFormSheet: Sheet 内でのフォーム表示を確認するストーリーを定義する
  - `title: 'Features/CaseStudy/[ComponentName]'` で設定する
  - _Requirements: 5.3, 5.4, 5.8, 2.1, 2.3, 2.4_

- [ ] 5.4 (P) ProjectTypeForm と WorkTypeForm のストーリーを作成する
  - 各フォームの新規作成モードと編集モードのストーリーを定義する
  - `title: 'Features/ProjectTypes/ProjectTypeForm'`、`title: 'Features/WorkTypes/WorkTypeForm'` で設定する
  - _Requirements: 5.5, 5.6, 2.1, 2.3, 2.4_

- [ ] 5.5 (P) ScenarioFormSheet のストーリーを作成する
  - Sheet 内でのシナリオフォーム表示を確認するストーリーを定義する
  - `title: 'Features/IndirectCaseStudy/ScenarioFormSheet'` で設定する
  - _Requirements: 5.7, 2.1, 2.3, 2.4_

- [ ] 6. feature コンポーネントのストーリー作成（データテーブル系）
- [ ] 6.1 (P) business-units DataTable と DataTableToolbar のストーリーを作成する
  - 空データ・少量データ・大量データの3状態のストーリーを定義する
  - ツールバーの検索・フィルター操作状態のストーリーを定義する
  - `title: 'Features/BusinessUnits/[ComponentName]'` で設定する
  - _Requirements: 6.1, 6.5, 6.6, 2.1, 2.3, 2.4_

- [ ] 6.2 (P) project-types DataTable と work-types DataTable のストーリーを作成する
  - 各テーブルの空データ・少量データ・大量データの3状態を定義する
  - 各ツールバーコンポーネントのストーリーも含める
  - `title: 'Features/ProjectTypes/[ComponentName]'`、`title: 'Features/WorkTypes/[ComponentName]'` で設定する
  - _Requirements: 6.2, 6.3, 6.5, 6.6, 2.1, 2.3, 2.4_

- [ ] 6.3 (P) WorkloadDataTable のストーリーを作成する
  - 工数データのテーブル表示を確認するストーリーを定義する
  - 空データ・少量データ・大量データの3状態を含める
  - `title: 'Features/Workload/WorkloadDataTable'` で設定する
  - _Requirements: 6.4, 6.5, 2.1, 2.3, 2.4_

- [ ] 6.4 (P) CalculationResultTable のストーリーを作成する
  - 計算結果テーブルの表示を確認するストーリーを定義する
  - `title: 'Features/IndirectCaseStudy/CalculationResultTable'` で設定する
  - _Requirements: 6.7, 2.1, 2.3, 2.4_

- [ ] 7. feature コンポーネントのストーリー作成（チャート系）
- [ ] 7.1 (P) workload WorkloadChart のストーリーを作成する
  - 積み上げ面グラフとキャパシティラインのモックデータを使用したストーリーを定義する
  - ResponsiveContainer 用の固定高さ wrapper デコレータを追加する
  - `title: 'Features/Workload/WorkloadChart'` で設定する
  - _Requirements: 7.1, 7.4, 2.1, 2.3, 2.4_

- [ ] 7.2 (P) case-study WorkloadChart と StandardEffortPreview のストーリーを作成する
  - 工数チャートのモックデータを使用したストーリーを定義する
  - 標準工数パターンのプレビュー表示のストーリーを定義する
  - `title: 'Features/CaseStudy/[ComponentName]'` で設定する
  - _Requirements: 7.2, 7.3, 7.4, 2.1, 2.3, 2.4_

- [ ] 8. feature コンポーネントのストーリー作成（ダイアログ・パネル・フィードバック状態系）
- [ ] 8.1 (P) 各 feature の DeleteConfirmDialog と RestoreConfirmDialog のストーリーを作成する
  - business-units, projects, project-types, work-types の各 feature に存在する確認ダイアログのストーリーを定義する
  - 開いた状態をデフォルトとし、onConfirm/onOpenChange を `fn()` でモックする
  - `title: 'Features/[FeatureName]/[DialogName]'` で設定する
  - _Requirements: 8.1, 2.1, 2.3_

- [ ] 8.2 (P) indirect-case-study のダイアログ系ストーリーを作成する
  - BulkInputDialog: 一括入力ダイアログの表示を確認するストーリーを定義する
  - UnsavedChangesDialog: 未保存変更の警告ダイアログのストーリーを定義する
  - `title: 'Features/IndirectCaseStudy/[ComponentName]'` で設定する
  - _Requirements: 8.2, 8.3, 2.1, 2.3_

- [ ] 8.3 (P) workload SidePanel 系のストーリーを作成する
  - SidePanel: 展開・折りたたみの両状態のストーリーを定義する
  - SidePanelProjects, SidePanelIndirect, SidePanelSettings: 各タブパネルの内容を確認するストーリーを定義する
  - MSW ハンドラが必要なコンポーネントには適切なハンドラを設定する
  - `title: 'Features/Workload/[ComponentName]'` で設定する
  - _Requirements: 8.4, 8.5, 2.1, 2.3_

- [ ] 8.4 (P) workload セレクター・操作 UI 系のストーリーを作成する
  - BusinessUnitSelector: MSW ハンドラでBUデータを提供し、選択UIを確認するストーリーを定義する
  - PeriodSelector, ViewToggle, LegendPanel, ProfileManager: 各操作UIのストーリーを定義する
  - ProjectEditSheet: プロジェクト編集シートの表示を確認するストーリーを定義する
  - `title: 'Features/Workload/[ComponentName]'` で設定する
  - _Requirements: 8.6, 8.7, 8.8, 2.1, 2.3_

- [ ] 8.5 (P) case-study のサイドバー・セクション・カードのストーリーを作成する
  - CaseSidebar: サイドバーの表示を確認するストーリーを定義する
  - CaseStudySection: セクション表示のストーリーを定義する
  - WorkloadCard: カード表示のストーリーを定義する
  - `title: 'Features/CaseStudy/[ComponentName]'` で設定する
  - _Requirements: 8.9, 8.10, 2.1, 2.3_

- [ ] 8.6 (P) FeedbackStates のストーリーを作成する
  - SkeletonChart, SkeletonTable: ローディングスケルトンのストーリーを定義する
  - EmptyState, BuEmptyState, NoDataState, NoSearchResults: 各種空状態のストーリーを定義する
  - ErrorState: エラー状態とリトライボタンのストーリーを定義する
  - OverlaySpinner: オーバーレイスピナーのストーリーを定義する
  - `title: 'Features/Workload/FeedbackStates'` で設定する
  - _Requirements: 8.11, 2.1, 2.3_

- [ ] 9. feature コンポーネントのストーリー作成（間接工数管理系）
- [ ] 9.1 (P) MonthlyHeadcountGrid と IndirectWorkRatioMatrix のストーリーを作成する
  - 12ヶ月分 × 複数行のモックデータを使用してグリッド・マトリクス表示を確認するストーリーを定義する
  - `title: 'Features/IndirectCaseStudy/[ComponentName]'` で設定する
  - _Requirements: 9.1, 9.2, 2.1, 2.3_

- [ ] 9.2 (P) リスト系コンポーネントのストーリーを作成する
  - CapacityScenarioList, HeadcountPlanCaseList, IndirectWorkCaseList の空状態と複数アイテム状態のストーリーを定義する
  - `title: 'Features/IndirectCaseStudy/[ComponentName]'` で設定する
  - _Requirements: 9.3, 9.4, 9.5, 2.1, 2.3_

- [ ] 9.3 (P) ResultPanel と SettingsPanel のストーリーを作成する
  - 結果パネルと設定パネルの表示を確認するストーリーを定義する
  - `title: 'Features/IndirectCaseStudy/[ComponentName]'` で設定する
  - _Requirements: 9.6, 2.1, 2.3_

- [ ] 10. アクセシビリティ検証とドキュメント確認
- [ ] 10.1 全ストーリーの描画テストとアクセシビリティ検証を実行する
  - Storybook を起動し、全ストーリーがエラーなく描画されることを確認する
  - addon-a11y パネルで各ストーリーのアクセシビリティ違反を確認する
  - `pnpm --filter frontend test` で Vitest 経由の描画テストを実行する
  - 重大なアクセシビリティ違反があれば対応する
  - _Requirements: 11.1, 11.2, 12.1, 12.2, 12.3_

- [ ] 11. UI インベントリレポートを作成する
  - 全ストーリーを Storybook 上でビジュアル確認し、類似パターンの重複（DataTable x3, DeleteConfirmDialog x4 等）を記録する
  - スタイルの不整合（ボタンの使い方、間隔、色使いの差異）を記録する
  - 共通化候補のコンポーネント（DebouncedSearchInput の shared 化等）を記録する
  - 各コンポーネントの分類（コアUI / 共有 / feature）と依存関係の概要を記録する
  - リデザイン時の推奨優先順位（影響範囲の広いコンポーネントから順）を記録する
  - `.kiro/specs/design-system/ui-inventory.md` に出力する
  - _Requirements: 13.1, 13.2, 13.3_
